import type { Client, CheckIn, Symptom, SymptomEntry, DeviceVisit } from '../types/database';

// Local storage-based store for development / offline use.
// In production this will be replaced by Supabase queries.

const STORAGE_KEYS = {
  clients: 'buddy_clients',
  checkIns: 'buddy_check_ins',
  symptoms: 'buddy_symptoms',
  symptomEntries: 'buddy_symptom_entries',
  deviceVisits: 'buddy_device_visits',
} as const;

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uuid(): string {
  return crypto.randomUUID();
}

// ── Login codes ─────────────────────────────────────────

function generateLoginCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure uniqueness
  const existing = getClients().map((c) => c.login_code);
  if (existing.includes(code)) return generateLoginCode();
  return code;
}

// ── Clients ──────────────────────────────────────────────

export function getClients(): Client[] {
  return read<Client>(STORAGE_KEYS.clients);
}

export function getClient(id: string): Client | undefined {
  return getClients().find((c) => c.id === id);
}

export function getClientByLoginCode(code: string): Client | undefined {
  return getClients().find((c) => c.login_code === code.toUpperCase());
}

export function createClient(data: Omit<Client, 'id' | 'created_at' | 'login_code' | 'tracking_end_date'> & { tracking_end_date_override?: string | null; custom_login_code?: string }): Client {
  const clients = getClients();
  let trackingEndDate: string | null = null;
  if (data.tracking_end_date_override) {
    trackingEndDate = new Date(data.tracking_end_date_override).toISOString();
  } else if (data.tracking_duration_weeks) {
    const end = new Date();
    end.setDate(end.getDate() + data.tracking_duration_weeks * 7);
    trackingEndDate = end.toISOString();
  }
  const { tracking_end_date_override, custom_login_code, ...rest } = data;
  const client: Client = {
    ...rest,
    id: uuid(),
    created_at: new Date().toISOString(),
    login_code: custom_login_code || generateLoginCode(),
    tracking_end_date: trackingEndDate,
  };
  clients.push(client);
  write(STORAGE_KEYS.clients, clients);
  return client;
}

export function isTrackingComplete(client: Client): boolean {
  if (!client.tracking_end_date) return false;
  return new Date() >= new Date(client.tracking_end_date);
}

export function updateClient(id: string, data: Partial<Client>): Client | undefined {
  const clients = getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  clients[idx] = { ...clients[idx], ...data };
  write(STORAGE_KEYS.clients, clients);
  return clients[idx];
}

export function deleteClient(id: string): void {
  const clients = getClients().filter((c) => c.id !== id);
  write(STORAGE_KEYS.clients, clients);
  // Also clean up related data
  const checkIns = read<CheckIn>(STORAGE_KEYS.checkIns).filter((c) => c.client_id !== id);
  write(STORAGE_KEYS.checkIns, checkIns);
  const symptoms = read<Symptom>(STORAGE_KEYS.symptoms).filter((s) => s.client_id !== id);
  write(STORAGE_KEYS.symptoms, symptoms);
}

// ── Symptoms ─────────────────────────────────────────────

export function getSymptoms(clientId: string): Symptom[] {
  return read<Symptom>(STORAGE_KEYS.symptoms).filter((s) => s.client_id === clientId);
}

export function createSymptom(data: Omit<Symptom, 'id' | 'created_at'>): Symptom {
  const all = read<Symptom>(STORAGE_KEYS.symptoms);
  const symptom: Symptom = {
    ...data,
    id: uuid(),
    created_at: new Date().toISOString(),
  };
  all.push(symptom);
  write(STORAGE_KEYS.symptoms, all);
  return symptom;
}

export function toggleSymptomActive(id: string): void {
  const all = read<Symptom>(STORAGE_KEYS.symptoms);
  const idx = all.findIndex((s) => s.id === id);
  if (idx !== -1) {
    all[idx].active = !all[idx].active;
    write(STORAGE_KEYS.symptoms, all);
  }
}

// ── Check-ins ────────────────────────────────────────────

export function getCheckIns(clientId: string): CheckIn[] {
  return read<CheckIn>(STORAGE_KEYS.checkIns)
    .filter((c) => c.client_id === clientId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getCheckIn(id: string): CheckIn | undefined {
  return read<CheckIn>(STORAGE_KEYS.checkIns).find((c) => c.id === id);
}

export function hasCheckedInToday(clientId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return getCheckIns(clientId).some((c) => c.created_at.slice(0, 10) === today);
}

export function createCheckIn(data: Omit<CheckIn, 'id' | 'created_at' | 'flagged'>): CheckIn {
  const all = read<CheckIn>(STORAGE_KEYS.checkIns);
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
  all.push(checkIn);
  write(STORAGE_KEYS.checkIns, all);
  return checkIn;
}

// ── Symptom Entries (per check-in) ───────────────────────

export function getSymptomEntries(checkInId: string): SymptomEntry[] {
  return read<SymptomEntry>(STORAGE_KEYS.symptomEntries).filter(
    (e) => e.check_in_id === checkInId,
  );
}

export function getSymptomEntriesBySymptom(symptomId: string): SymptomEntry[] {
  return read<SymptomEntry>(STORAGE_KEYS.symptomEntries).filter(
    (e) => e.symptom_id === symptomId,
  );
}

export function createSymptomEntry(data: Omit<SymptomEntry, 'id'>): SymptomEntry {
  const all = read<SymptomEntry>(STORAGE_KEYS.symptomEntries);
  const entry: SymptomEntry = { ...data, id: uuid() };
  all.push(entry);
  write(STORAGE_KEYS.symptomEntries, all);
  return entry;
}

// ── Report generation ────────────────────────────────────

export function generateReport(clientId: string) {
  const client = getClient(clientId);
  const checkIns = getCheckIns(clientId);
  const symptoms = getSymptoms(clientId);

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

  // Determine overall trend from symptom_change values
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

  // Symptom-level changes
  const symptomChanges = symptoms
    .filter((s) => s.active)
    .map((symptom) => {
      const entries = getSymptomEntriesBySymptom(symptom.id).sort(
        (a, b) =>
          new Date(
            getCheckIn(a.check_in_id)?.created_at ?? '',
          ).getTime() -
          new Date(
            getCheckIn(b.check_in_id)?.created_at ?? '',
          ).getTime(),
      );
      const start = entries[0]?.severity ?? 0;
      const end = entries[entries.length - 1]?.severity ?? 0;
      let trend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (end < start - 1) trend = 'improving';
      else if (end > start + 1) trend = 'worsening';
      return {
        symptom_name: symptom.name,
        start_severity: start,
        end_severity: end,
        trend,
      };
    });

  // Flags
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

  // Client notes highlights
  const notesHighlights = sorted
    .filter((c) => c.notes && c.notes.trim().length > 0)
    .slice(-5)
    .map((c) => c.notes);

  // Days between start and end
  const daySpan = Math.max(
    1,
    Math.ceil(
      (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );
  const complianceRate = Math.min(100, Math.round((sorted.length / daySpan) * 100));

  // Recommendation
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

export function trackDeviceVisit(clientId: string | null, page: string): DeviceVisit {
  const all = read<DeviceVisit>(STORAGE_KEYS.deviceVisits);
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
  all.push(visit);
  write(STORAGE_KEYS.deviceVisits, all);
  return visit;
}

export function getDeviceVisits(): DeviceVisit[] {
  return read<DeviceVisit>(STORAGE_KEYS.deviceVisits);
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

// ── Seed data ───────────────────────────────────────────

export function seedDefaultClients() {
  const existing = getClients();
  if (existing.some((c) => c.login_code === '7874')) return;
  createClient({
    full_name: 'Bruce Wayne',
    email: '',
    practitioner_id: 'demo-practitioner',
    next_appointment: null,
    primary_complaint: '',
    notes: null,
    tracking_duration_weeks: null,
    custom_login_code: '7874',
  });
}
