import type { Client, CheckIn, Symptom, SymptomEntry, DeviceVisit, Practitioner } from '../types/database';
import { supabase } from './supabase';

// Supabase-backed store with localStorage cache.
// All read/write functions are async and hit the database first,
// falling back to localStorage if Supabase is not configured.

const STORAGE_KEYS = {
  practitioners: 'buddy_practitioners',
  clients: 'buddy_clients',
  checkIns: 'buddy_check_ins',
  symptoms: 'buddy_symptoms',
  symptomEntries: 'buddy_symptom_entries',
  deviceVisits: 'buddy_device_visits',
} as const;

// ── Helpers ──────────────────────────────────────────────

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uuid(): string {
  return crypto.randomUUID();
}

// ── Response Validation ──────────────────────────────────

/**
 * Safely handle Supabase errors with fallback to localStorage
 */
function handleSupabaseError(error: any, message: string): void {
  console.error(`${message}:`, error?.message || error);
}

/**
 * Validate that required fields exist in a database response
 */
function validateClientResponse(data: any): data is Client {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.full_name === 'string' &&
    typeof data.email === 'string' &&
    typeof data.practitioner_id === 'string' &&
    typeof data.login_code === 'string' &&
    typeof data.created_at === 'string'
  );
}


function isSupabaseConfigured(): boolean {
  // Check if both required Supabase env vars are configured
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!url && !!key && !url.includes('placeholder') && !key.includes('placeholder');
}

// ── Login codes ─────────────────────────────────────────

function generateLoginCode(): string {
  // Generate a 4-digit numeric code (1000-9999)
  const min = 1000;
  const max = 9999;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

async function generateUniqueLoginCode(retries = 0): Promise<string> {
  // Prevent infinite recursion with max retries
  if (retries > 10) {
    throw new Error('Failed to generate unique login code after 10 attempts. Too many clients exist.');
  }

  const code = generateLoginCode();
  const existing = await getClients();

  if (existing.some((c) => c.login_code === code)) {
    return generateUniqueLoginCode(retries + 1);
  }

  return code;
}

// ── Clients ──────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      writeLocal(STORAGE_KEYS.clients, data);
      return data as Client[];
    }
  }
  return readLocal<Client>(STORAGE_KEYS.clients);
}

export async function getClient(id: string): Promise<Client | undefined> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) {
      if (validateClientResponse(data)) {
        return data;
      } else {
        handleSupabaseError(null, 'Invalid client response from database');
      }
    } else if (error) {
      handleSupabaseError(error, 'Failed to fetch client from Supabase');
    }
  }
  return readLocal<Client>(STORAGE_KEYS.clients).find((c) => c.id === id);
}

export async function getClientByLoginCode(code: string): Promise<Client | undefined> {
  const normalized = code.trim();
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('login_code', normalized)
      .single();
    if (!error && data) return data as Client;
  }
  return readLocal<Client>(STORAGE_KEYS.clients).find(
    (c) => c.login_code === normalized,
  );
}

export async function createClient(
  data: Omit<Client, 'id' | 'created_at' | 'login_code' | 'tracking_end_date'> & {
    tracking_end_date_override?: string | null;
    custom_login_code?: string;
  },
): Promise<Client> {
  let trackingEndDate: string | null = null;
  if (data.tracking_end_date_override) {
    trackingEndDate = new Date(data.tracking_end_date_override).toISOString();
  } else if (data.tracking_duration_weeks) {
    const end = new Date();
    end.setDate(end.getDate() + data.tracking_duration_weeks * 7);
    trackingEndDate = end.toISOString();
  }

  const { tracking_end_date_override, custom_login_code, ...rest } = data;
  const loginCode = custom_login_code || (await generateUniqueLoginCode());

  const client: Client = {
    ...rest,
    id: uuid(),
    created_at: new Date().toISOString(),
    login_code: loginCode,
    tracking_end_date: trackingEndDate,
  };

  if (isSupabaseConfigured()) {
    const { data: inserted, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();
    if (error) {
      console.error('Supabase insert error:', error.message);
      throw new Error(error.message.includes('duplicate')
        ? 'This login code is already in use. Please choose a different one.'
        : `Failed to save client: ${error.message}`);
    }
    // Also cache locally
    const local = readLocal<Client>(STORAGE_KEYS.clients);
    local.push(inserted as Client);
    writeLocal(STORAGE_KEYS.clients, local);
    return inserted as Client;
  }

  // Fallback to localStorage only (no Supabase configured)
  const clients = readLocal<Client>(STORAGE_KEYS.clients);
  clients.push(client);
  writeLocal(STORAGE_KEYS.clients, clients);
  return client;
}

export function isTrackingComplete(client: Client): boolean {
  if (!client.tracking_end_date) return false;
  return new Date() >= new Date(client.tracking_end_date);
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client | undefined> {
  if (isSupabaseConfigured()) {
    const { data: updated, error } = await supabase
      .from('clients')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (!error && updated) {
      // Sync local cache
      const local = readLocal<Client>(STORAGE_KEYS.clients);
      const idx = local.findIndex((c) => c.id === id);
      if (idx !== -1) { local[idx] = updated as Client; writeLocal(STORAGE_KEYS.clients, local); }
      return updated as Client;
    }
  }

  const clients = readLocal<Client>(STORAGE_KEYS.clients);
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  clients[idx] = { ...clients[idx], ...data };
  writeLocal(STORAGE_KEYS.clients, clients);
  return clients[idx];
}

export async function deleteClient(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('clients').delete().eq('id', id);
  }
  const clients = readLocal<Client>(STORAGE_KEYS.clients).filter((c) => c.id !== id);
  writeLocal(STORAGE_KEYS.clients, clients);
  const checkIns = readLocal<CheckIn>(STORAGE_KEYS.checkIns).filter((c) => c.client_id !== id);
  writeLocal(STORAGE_KEYS.checkIns, checkIns);
  const symptoms = readLocal<Symptom>(STORAGE_KEYS.symptoms).filter((s) => s.client_id !== id);
  writeLocal(STORAGE_KEYS.symptoms, symptoms);
}

// ── Symptoms ─────────────────────────────────────────────

export async function getSymptoms(clientId: string): Promise<Symptom[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('symptoms')
      .select('*')
      .eq('client_id', clientId);
    if (!error && data) return data as Symptom[];
  }
  return readLocal<Symptom>(STORAGE_KEYS.symptoms).filter((s) => s.client_id === clientId);
}

export async function createSymptom(data: Omit<Symptom, 'id' | 'created_at'>): Promise<Symptom> {
  const symptom: Symptom = {
    ...data,
    id: uuid(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { data: inserted, error } = await supabase
      .from('symptoms')
      .insert(symptom)
      .select()
      .single();
    if (!error && inserted) return inserted as Symptom;
  }

  const all = readLocal<Symptom>(STORAGE_KEYS.symptoms);
  all.push(symptom);
  writeLocal(STORAGE_KEYS.symptoms, all);
  return symptom;
}

export async function toggleSymptomActive(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { data: current } = await supabase.from('symptoms').select('active').eq('id', id).single();
    if (current) {
      await supabase.from('symptoms').update({ active: !current.active }).eq('id', id);
      return;
    }
  }
  const all = readLocal<Symptom>(STORAGE_KEYS.symptoms);
  const idx = all.findIndex((s) => s.id === id);
  if (idx !== -1) {
    all[idx].active = !all[idx].active;
    writeLocal(STORAGE_KEYS.symptoms, all);
  }
}

// ── Check-ins ────────────────────────────────────────────

export async function getCheckIns(clientId: string): Promise<CheckIn[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as CheckIn[];
  }
  return readLocal<CheckIn>(STORAGE_KEYS.checkIns)
    .filter((c) => c.client_id === clientId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getCheckIn(id: string): Promise<CheckIn | undefined> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) return data as CheckIn;
  }
  return readLocal<CheckIn>(STORAGE_KEYS.checkIns).find((c) => c.id === id);
}

export async function hasCheckedInToday(clientId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const checkIns = await getCheckIns(clientId);
  return checkIns.some((c) => c.created_at.slice(0, 10) === today);
}

export async function createCheckIn(data: Omit<CheckIn, 'id' | 'created_at' | 'flagged'>): Promise<CheckIn> {
  const flagged =
    data.pain_level >= 8 ||
    data.symptom_change === 'much_worse' ||
    data.overall_feeling <= 1;
  const checkIn: CheckIn = {
    ...data,
    id: uuid(),
    created_at: new Date().toISOString(),
    flagged,
  };

  if (isSupabaseConfigured()) {
    const { data: inserted, error } = await supabase
      .from('check_ins')
      .insert(checkIn)
      .select()
      .single();
    if (!error && inserted) return inserted as CheckIn;
  }

  const all = readLocal<CheckIn>(STORAGE_KEYS.checkIns);
  all.push(checkIn);
  writeLocal(STORAGE_KEYS.checkIns, all);
  return checkIn;
}

// ── Symptom Entries (per check-in) ───────────────────────

export async function getSymptomEntries(checkInId: string): Promise<SymptomEntry[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('symptom_entries')
      .select('*')
      .eq('check_in_id', checkInId);
    if (!error && data) return data as SymptomEntry[];
  }
  return readLocal<SymptomEntry>(STORAGE_KEYS.symptomEntries).filter(
    (e) => e.check_in_id === checkInId,
  );
}

export async function getSymptomEntriesBySymptom(symptomId: string): Promise<SymptomEntry[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('symptom_entries')
      .select('*')
      .eq('symptom_id', symptomId);
    if (!error && data) return data as SymptomEntry[];
  }
  return readLocal<SymptomEntry>(STORAGE_KEYS.symptomEntries).filter(
    (e) => e.symptom_id === symptomId,
  );
}

export async function createSymptomEntry(data: Omit<SymptomEntry, 'id'>): Promise<SymptomEntry> {
  const entry: SymptomEntry = { ...data, id: uuid() };

  if (isSupabaseConfigured()) {
    const { data: inserted, error } = await supabase
      .from('symptom_entries')
      .insert(entry)
      .select()
      .single();
    if (!error && inserted) return inserted as SymptomEntry;
  }

  const all = readLocal<SymptomEntry>(STORAGE_KEYS.symptomEntries);
  all.push(entry);
  writeLocal(STORAGE_KEYS.symptomEntries, all);
  return entry;
}

// ── Report generation ────────────────────────────────────

export async function generateReport(clientId: string) {
  const client = await getClient(clientId);
  const checkIns = await getCheckIns(clientId);
  const symptoms = await getSymptoms(clientId);

  if (!client || checkIns.length === 0) return null;

  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const periodStart = sorted[0].created_at;
  const periodEnd = sorted[sorted.length - 1].created_at;

  const avgPain =
    sorted.reduce((sum, c) => sum + c.pain_level, 0) / sorted.length;
  const avgSleep =
    sorted.reduce((sum, c) => sum + c.sleep_quality, 0) / sorted.length;
  const avgStress =
    sorted.reduce((sum, c) => sum + c.stress_level, 0) / sorted.length;

  const painTrend = sorted.map((c) => c.pain_level);

  const changeScores = sorted.map((c) => {
    const map: Record<string, number> = {
      much_better: 2,
      slightly_better: 1,
      same: 0,
      slightly_worse: -1,
      much_worse: -2,
    };
    return map[c.symptom_change] ?? 0;
  });
  const avgChange = changeScores.reduce((a, b) => a + b, 0) / changeScores.length;
  let overallTrend: 'improving' | 'stable' | 'declining' | 'mixed' = 'stable';
  if (avgChange > 0.5) overallTrend = 'improving';
  else if (avgChange < -0.5) overallTrend = 'declining';
  else if (Math.abs(avgChange) <= 0.5 && changeScores.some((s) => Math.abs(s) >= 2))
    overallTrend = 'mixed';

  const symptomChanges = await Promise.all(
    symptoms
      .filter((s) => s.active)
      .map(async (symptom) => {
        const entries = await getSymptomEntriesBySymptom(symptom.id);
        const sortedEntries = [];
        for (const e of entries) {
          const ci = await getCheckIn(e.check_in_id);
          sortedEntries.push({ ...e, ciDate: ci?.created_at ?? '' });
        }
        sortedEntries.sort(
          (a, b) => new Date(a.ciDate).getTime() - new Date(b.ciDate).getTime(),
        );
        const start = sortedEntries[0]?.severity ?? 0;
        const end = sortedEntries[sortedEntries.length - 1]?.severity ?? 0;
        let trend: 'improving' | 'stable' | 'worsening' = 'stable';
        if (end < start - 1) trend = 'improving';
        else if (end > start + 1) trend = 'worsening';
        return {
          symptom_name: symptom.name,
          start_severity: start,
          end_severity: end,
          trend,
        };
      }),
  );

  const flags: string[] = [];
  const flaggedDays = sorted.filter((c) => c.flagged);
  if (flaggedDays.length > 0)
    flags.push(`${flaggedDays.length} high-severity day(s) flagged during this period`);
  if (avgPain >= 7) flags.push('Average pain level is high (≥7/10)');
  if (avgSleep <= 2) flags.push('Consistently poor sleep quality reported');
  if (avgStress >= 4) flags.push('Elevated stress levels throughout the period');

  const recentWorse = sorted
    .slice(-3)
    .filter((c) => c.symptom_change === 'much_worse' || c.symptom_change === 'slightly_worse');
  if (recentWorse.length >= 2)
    flags.push('Worsening trend in the last 3 check-ins');

  const notesHighlights = sorted
    .filter((c) => c.notes && c.notes.trim().length > 0)
    .slice(-5)
    .map((c) => c.notes);

  const daySpan = Math.max(
    1,
    Math.ceil(
      (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );
  const complianceRate = Math.min(100, Math.round((sorted.length / daySpan) * 100));

  let recommendation = '';
  if (overallTrend === 'improving')
    recommendation = 'Client is trending positively. Current management approach appears effective. Consider progressing treatment.';
  else if (overallTrend === 'declining')
    recommendation = 'Client symptoms are worsening. Review current treatment plan and consider alternative interventions.';
  else if (overallTrend === 'mixed')
    recommendation = 'Mixed response pattern observed. Further investigation into aggravating and easing factors recommended.';
  else
    recommendation = 'Stable presentation between appointments. Continue current management and monitor.';

  return {
    id: uuid(),
    client_id: clientId,
    generated_at: new Date().toISOString(),
    period_start: periodStart,
    period_end: periodEnd,
    total_check_ins: sorted.length,
    compliance_rate: complianceRate,
    summary: {
      overall_trend: overallTrend,
      avg_pain_level: Math.round(avgPain * 10) / 10,
      pain_trend: painTrend,
      avg_sleep_quality: Math.round(avgSleep * 10) / 10,
      avg_stress_level: Math.round(avgStress * 10) / 10,
      symptom_changes: symptomChanges,
      flags,
      client_notes_highlights: notesHighlights,
      recommendation_for_practitioner: recommendation,
    },
  };
}

// ── Device Tracking ─────────────────────────────────

function detectDeviceType(): DeviceVisit['device_type'] {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ipad';
  if (/iPhone/.test(ua)) return 'iphone';
  if (/Macintosh/.test(ua)) return 'mac';
  if (/Android/.test(ua) && /Mobile/.test(ua)) return 'android';
  if (/Windows/.test(ua)) return 'windows';
  return 'other';
}

export async function trackDeviceVisit(clientId: string | null, page: string): Promise<DeviceVisit> {
  const visit: DeviceVisit = {
    id: uuid(),
    client_id: clientId,
    device_type: detectDeviceType(),
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    visited_at: new Date().toISOString(),
    page,
  };

  if (isSupabaseConfigured()) {
    await supabase.from('device_visits').insert(visit);
  }

  const all = readLocal<DeviceVisit>(STORAGE_KEYS.deviceVisits);
  all.push(visit);
  writeLocal(STORAGE_KEYS.deviceVisits, all);
  return visit;
}

export function getDeviceVisits(): DeviceVisit[] {
  return readLocal<DeviceVisit>(STORAGE_KEYS.deviceVisits);
}

export function getDeviceAnalytics() {
  const visits = getDeviceVisits();
  const total = visits.length;

  const byDevice: Record<string, number> = {};
  const byPage: Record<string, number> = {};

  for (const v of visits) {
    byDevice[v.device_type] = (byDevice[v.device_type] || 0) + 1;
    byPage[v.page] = (byPage[v.page] || 0) + 1;
  }

  const deviceBreakdown = Object.entries(byDevice)
    .map(([device, count]) => ({
      device: device as DeviceVisit['device_type'],
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const pageBreakdown = Object.entries(byPage)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count);

  return { total, deviceBreakdown, pageBreakdown };
}

// ── Compliance Rating ────────────────────────────────────

export interface ComplianceRating {
  score: number; // 0-100
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'No Data';
  color: string;
  breakdown: {
    frequency: { score: number; label: string; detail: string };
    engagement: { score: number; label: string; detail: string };
    variability: { score: number; label: string; detail: string };
    recency: { score: number; label: string; detail: string };
  };
}

export function calculateComplianceRating(client: Client, checkIns: CheckIn[]): ComplianceRating {
  if (checkIns.length === 0) {
    return {
      score: 0,
      grade: 'No Data',
      color: '#94a3b8',
      breakdown: {
        frequency: { score: 0, label: 'Frequency', detail: 'No check-ins yet' },
        engagement: { score: 0, label: 'Engagement', detail: 'No data to evaluate' },
        variability: { score: 0, label: 'Variability', detail: 'No data to evaluate' },
        recency: { score: 0, label: 'Recency', detail: 'No check-ins yet' },
      },
    };
  }

  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  // 1. FREQUENCY (35%) — how often they check in relative to days since start
  const startDate = new Date(client.created_at);
  const now = new Date();
  const totalDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const uniqueDays = new Set(sorted.map((c) => c.created_at.slice(0, 10))).size;
  const freqRatio = Math.min(1, uniqueDays / totalDays);
  const freqScore = Math.round(freqRatio * 100);
  let freqDetail = '';
  if (freqRatio >= 0.8) freqDetail = `Checked in ${uniqueDays} of ${totalDays} days — very consistent`;
  else if (freqRatio >= 0.5) freqDetail = `Checked in ${uniqueDays} of ${totalDays} days — moderate consistency`;
  else freqDetail = `Only ${uniqueDays} of ${totalDays} days — needs encouragement`;

  // 2. ENGAGEMENT (30%) — are they writing notes, not just clicking through?
  const withNotes = sorted.filter((c) => c.notes && c.notes.trim().length > 10).length;
  const notesRatio = withNotes / sorted.length;
  // Check for variation in answers (not always picking the same values)
  const uniqueFeelings = new Set(sorted.map((c) => c.overall_feeling)).size;
  const uniqueChanges = new Set(sorted.map((c) => c.symptom_change)).size;
  const answerDiversity = Math.min(1, (uniqueFeelings + uniqueChanges) / 6); // max 5+5=10 options
  const engScore = Math.round(((notesRatio * 0.6) + (answerDiversity * 0.4)) * 100);
  let engDetail = '';
  if (notesRatio >= 0.5) engDetail = `${withNotes} of ${sorted.length} check-ins include detailed notes`;
  else if (notesRatio >= 0.2) engDetail = `Some notes provided — could be more detailed`;
  else engDetail = `Rarely writes notes — may be rushing through check-ins`;

  // 3. VARIABILITY (20%) — are responses suspiciously identical? (suggests generic answers)
  const painValues = sorted.map((c) => c.pain_level);
  const sleepValues = sorted.map((c) => c.sleep_quality);
  const stressValues = sorted.map((c) => c.stress_level);

  function stdDev(arr: number[]): number {
    if (arr.length <= 1) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length);
  }

  const painStd = stdDev(painValues);
  const sleepStd = stdDev(sleepValues);
  const stressStd = stdDev(stressValues);
  // If all answers are identical (std=0), score is 0. Some variation is healthy.
  const avgStd = (painStd + sleepStd * 2 + stressStd * 2) / 5; // scale sleep/stress (1-5) vs pain (0-10)
  const varScore = Math.round(Math.min(1, avgStd / 1.5) * 100); // 1.5+ std dev = full marks
  let varDetail = '';
  if (varScore >= 70) varDetail = 'Answers show natural day-to-day variation — appears genuine';
  else if (varScore >= 30) varDetail = 'Some variation in responses — mostly authentic';
  else varDetail = 'Responses are very uniform — may be giving generic answers';

  // 4. RECENCY (15%) — are they still active?
  const lastCheckIn = sorted[sorted.length - 1];
  const daysSinceLast = Math.max(0, Math.ceil((now.getTime() - new Date(lastCheckIn.created_at).getTime()) / (1000 * 60 * 60 * 24)));
  let recScore = 100;
  if (daysSinceLast <= 1) recScore = 100;
  else if (daysSinceLast <= 3) recScore = 80;
  else if (daysSinceLast <= 7) recScore = 50;
  else if (daysSinceLast <= 14) recScore = 20;
  else recScore = 0;
  let recDetail = '';
  if (daysSinceLast === 0) recDetail = 'Checked in today';
  else if (daysSinceLast === 1) recDetail = 'Last check-in was yesterday';
  else recDetail = `Last check-in was ${daysSinceLast} days ago`;

  // Weighted total
  const total = Math.round(
    freqScore * 0.35 +
    engScore * 0.30 +
    varScore * 0.20 +
    recScore * 0.15
  );

  let grade: ComplianceRating['grade'];
  let color: string;
  if (total >= 80) { grade = 'Excellent'; color = '#10b981'; }
  else if (total >= 60) { grade = 'Good'; color = '#6366f1'; }
  else if (total >= 40) { grade = 'Fair'; color = '#f59e0b'; }
  else { grade = 'Poor'; color = '#ef4444'; }

  return {
    score: total,
    grade,
    color,
    breakdown: {
      frequency: { score: freqScore, label: 'Frequency', detail: freqDetail },
      engagement: { score: engScore, label: 'Engagement', detail: engDetail },
      variability: { score: varScore, label: 'Variability', detail: varDetail },
      recency: { score: recScore, label: 'Recency', detail: recDetail },
    },
  };
}

// ── Practitioners ───────────────────────────────────────────

export async function getPractitioners(): Promise<Practitioner[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('practitioners')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      writeLocal(STORAGE_KEYS.practitioners, data);
      return data as Practitioner[];
    }
  }
  return readLocal<Practitioner>(STORAGE_KEYS.practitioners);
}

export async function getPractitioner(id: string): Promise<Practitioner | undefined> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('practitioners')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) return data as Practitioner;
  }
  return readLocal<Practitioner>(STORAGE_KEYS.practitioners).find((p) => p.id === id);
}

export async function getPractitionerByLoginCode(code: string): Promise<Practitioner | undefined> {
  const upper = code.toUpperCase();
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('practitioners')
      .select('*')
      .eq('login_code', upper)
      .single();
    if (!error && data) return data as Practitioner;
  }
  return readLocal<Practitioner>(STORAGE_KEYS.practitioners).find(
    (p) => p.login_code === upper,
  );
}

// Simple password hash for client-side use (NOT production-grade)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function createPractitioner(
  name: string,
  initialPassword: string,
  customLoginCode?: string,
): Promise<Practitioner> {
  const loginCode = customLoginCode || (await generateUniqueLoginCode());
  const passwordHash = hashPassword(initialPassword);

  const practitioner: Practitioner = {
    id: uuid(),
    name,
    login_code: loginCode,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { data: inserted, error } = await supabase
      .from('practitioners')
      .insert(practitioner)
      .select()
      .single();
    if (error) {
      console.error('Supabase insert error:', error.message);
      throw new Error(`Failed to create practitioner: ${error.message}`);
    }
    const local = readLocal<Practitioner>(STORAGE_KEYS.practitioners);
    local.push(inserted as Practitioner);
    writeLocal(STORAGE_KEYS.practitioners, local);
    return inserted as Practitioner;
  }

  const practitioners = readLocal<Practitioner>(STORAGE_KEYS.practitioners);
  practitioners.push(practitioner);
  writeLocal(STORAGE_KEYS.practitioners, practitioners);
  return practitioner;
}

export async function updatePractitionerPassword(id: string, newPassword: string): Promise<Practitioner | undefined> {
  const passwordHash = hashPassword(newPassword);
  const updated_at = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const { data: updated, error } = await supabase
      .from('practitioners')
      .update({ password_hash: passwordHash, updated_at })
      .eq('id', id)
      .select()
      .single();
    if (!error && updated) {
      const local = readLocal<Practitioner>(STORAGE_KEYS.practitioners);
      const idx = local.findIndex((p) => p.id === id);
      if (idx !== -1) {
        local[idx] = updated as Practitioner;
        writeLocal(STORAGE_KEYS.practitioners, local);
      }
      return updated as Practitioner;
    }
  }

  const practitioners = readLocal<Practitioner>(STORAGE_KEYS.practitioners);
  const idx = practitioners.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  practitioners[idx] = {
    ...practitioners[idx],
    password_hash: passwordHash,
    updated_at,
  };
  writeLocal(STORAGE_KEYS.practitioners, practitioners);
  return practitioners[idx];
}

export function validatePractitionerPassword(practitioner: Practitioner, password: string): boolean {
  return verifyPassword(password, practitioner.password_hash);
}

// ── Seed data (no-op in production) ──────────────────────

export async function seedDefaultClients() {
  // No seeding needed — all real client data lives in Supabase
  // and persists across deploys.
}
