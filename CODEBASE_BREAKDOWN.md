# Buddy - Symptom Tracker Software - Complete Breakdown

## Executive Summary

**Buddy** is a web-based symptom tracking and reporting system designed for healthcare practitioners (physiotherapists, sports medicine specialists, etc.) to monitor patient/client progress between appointments. It enables clients to perform daily check-ins and generates automated follow-up reports with clinical recommendations.

**Key Purpose**: Bridge the gap between appointments by capturing daily symptom data, pain levels, sleep quality, stress levels, and detecting red-flag symptoms that require immediate referral.

---

## 1. Technology Stack

### Frontend
- **React 19.2.4** - UI framework
- **React Router 7.13.2** - Client-side routing
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Vite 6.4.1** - Build tool and dev server
- **Lucide React 1.0.1** - Icon library

### Backend
- **Supabase 2.100.0** - PostgreSQL database + authentication
- **LocalStorage** - Fallback persistent client-side storage

### Deployment
- **Railway** - Cloud hosting
- **Node 18+** - Runtime

---

## 2. Project Structure

```
yves/
├── src/
│   ├── App.tsx                    # Main routing setup
│   ├── main.tsx                   # React entry point
│   ├── pages/                     # Route pages
│   │   ├── PortalSelectPage.tsx   # Home - choose client or admin
│   │   ├── ClientLoginPage.tsx    # Client login with code
│   │   ├── PractitionerLoginPage.tsx  # Admin/practitioner login
│   │   ├── CheckInPage.tsx        # Main daily check-in form
│   │   ├── QueryPage.tsx          # Symptom red-flag query tool
│   │   ├── TimelinePage.tsx       # View past check-ins timeline
│   │   ├── ClientProgressPage.tsx # Client progress view
│   │   ├── ReportPage.tsx         # Client-facing report
│   │   ├── AdminDashboardPage.tsx # Practitioner dashboard
│   │   ├── AdminClientsPage.tsx   # Manage clients
│   │   ├── AdminClientDetailPage.tsx  # Client detail view
│   │   ├── ChangePasswordPage.tsx # Password reset
│   ├── components/                # Reusable UI components
│   │   ├── ClientLayout.tsx       # Client portal wrapper
│   │   ├── AdminLayout.tsx        # Admin portal wrapper
│   │   ├── Layout.tsx             # Base layout
│   │   ├── PainSlider.tsx         # 0-10 pain slider
│   │   ├── RatingSelector.tsx     # 1-5 rating buttons
│   │   ├── SymptomChangeSelector.tsx  # Symptom change selector
│   │   ├── MiniChart.tsx          # Lightweight chart component
│   │   ├── ContactRequestsPanel.tsx   # Red flag alerts
│   ├── hooks/                     # React hooks
│   │   ├── useClient.ts           # Client session management
│   │   ├── usePractitioner.ts     # Practitioner session management
│   ├── lib/                       # Utility/business logic
│   │   ├── store.ts               # Supabase + localStorage data layer
│   │   ├── supabase.ts            # Supabase initialization
│   │   ├── symptomAnalysis.ts     # Red-flag detection engine
│   │   ├── email.ts               # Email webhook integration
│   │   ├── utils.ts               # Date, color, formatting utilities
│   │   ├── initPractitioners.ts   # Seed default practitioners
│   ├── types/
│   │   ├── database.ts            # TypeScript interfaces for DB schema
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── eslint.config.js              # Linting config
```

---

## 3. Core Data Model / Database Schema

### Tables & Interfaces

#### **Practitioners**
```typescript
interface Practitioner {
  id: string;                 // UUID
  name: string;               // e.g., "Dr. Sarah Johnson"
  login_code: string;         // 4-digit numeric code (uppercase stored)
  password_hash: string;      // Client-side hashed password
  created_at: string;         // ISO timestamp
  updated_at: string;         // ISO timestamp
}
```

#### **Clients**
```typescript
interface Client {
  id: string;                         // UUID
  full_name: string;                  // e.g., "John Smith"
  email: string;                      // Contact email
  practitioner_id: string;            // FK to Practitioners
  created_at: string;                 // ISO timestamp
  next_appointment: string | null;    // ISO date
  primary_complaint: string;          // e.g., "Lower back pain"
  notes: string | null;               // Practitioner notes
  login_code: string;                 // 4-digit numeric code
  tracking_duration_weeks: number | null;  // How long to track
  tracking_end_date: string | null;        // ISO date when tracking stops
}
```

#### **CheckIn**
```typescript
interface CheckIn {
  id: string;
  client_id: string;                  // FK to Clients
  created_at: string;                 // ISO timestamp
  overall_feeling: 1 | 2 | 3 | 4 | 5; // 1=Terrible, 5=Great
  symptom_change: 'much_better' | 'slightly_better' | 'same' | 
                  'slightly_worse' | 'much_worse';
  pain_level: number;                 // 0-10 slider
  sleep_quality: 1 | 2 | 3 | 4 | 5;   // 1=Terrible, 5=Great
  stress_level: 1 | 2 | 3 | 4 | 5;    // 1=Very Low, 5=Very High
  medication_taken: boolean;
  notes: string;                      // Open-ended client feedback
  flagged: boolean;                   // Auto-set by red-flag analysis
}
```

#### **Symptoms** (tracked per client)
```typescript
interface Symptom {
  id: string;
  client_id: string;          // FK to Clients
  name: string;               // e.g., "Lower back pain"
  body_area: string;          // e.g., "Lower back"
  created_at: string;
  active: boolean;            // Include in check-ins?
}
```

#### **SymptomEntry** (per check-in severity rating)
```typescript
interface SymptomEntry {
  id: string;
  check_in_id: string;        // FK to CheckIn
  symptom_id: string;         // FK to Symptoms
  severity: number;           // 0-10
  notes: string;              // Optional notes per symptom
}
```

#### **DeviceVisit** (analytics)
```typescript
interface DeviceVisit {
  id: string;
  client_id: string | null;
  device_type: 'iphone' | 'ipad' | 'mac' | 'android' | 'windows' | 'other';
  user_agent: string;
  screen_width: number;
  screen_height: number;
  visited_at: string;         // ISO timestamp
  page: string;               // Which page visited
}
```

#### **FollowUpReport** (generated reports)
```typescript
interface FollowUpReport {
  id: string;
  client_id: string;
  generated_at: string;       // ISO timestamp
  period_start: string;       // First check-in date
  period_end: string;         // Last check-in date
  total_check_ins: number;
  compliance_rate: number;    // 0-100%
  summary: ReportSummary;
}

interface ReportSummary {
  overall_trend: 'improving' | 'stable' | 'declining' | 'mixed';
  avg_pain_level: number;
  pain_trend: number[];       // Daily pain levels
  avg_sleep_quality: number;
  avg_stress_level: number;
  symptom_changes: {
    symptom_name: string;
    start_severity: number;
    end_severity: number;
    trend: 'improving' | 'stable' | 'worsening';
  }[];
  flags: string[];                       // Issues identified
  client_notes_highlights: string[];     // Key client notes
  recommendation_for_practitioner: string;
}
```

---

## 4. Authentication & Login Flow

### Two-Portal Architecture

#### **Client Login Flow**
1. Client visits `/app/login`
2. Selects their practitioner from a dropdown (populated from `getPractitioners()`)
3. Enters 4-digit login code
4. System calls `getClientByLoginCode(code)` → searches `Clients` table
5. If found, `loginClient(clientId)` → stores in `sessionStorage`
6. Redirected to `/app/checkin`

**Code Snippet** (src/pages/ClientLoginPage.tsx):
```typescript
async function handleSubmit(e: React.FormEvent) {
  const trimmed = code.trim();
  if (!trimmed) {
    setError('Please enter your login code.');
    return;
  }
  setLoading(true);
  const client = await getClientByLoginCode(trimmed);
  setLoading(false);
  if (!client) {
    setError('Code not recognised. Please check and try again.');
    return;
  }
  loginClient(client.id);
  trackDeviceVisit(client.id, 'login');
  navigate('/app/checkin');
}
```

#### **Practitioner Login Flow**
1. Practitioner visits `/admin/login`
2. Enters practitioner code (alphanumeric)
3. System calls `getPractitionerByLoginCode(code)` → searches `Practitioners` table
4. If found, `loginPractitioner(practitionerId)` → stores in `sessionStorage`
5. Redirected to `/admin`

**Code Snippet** (src/pages/PractitionerLoginPage.tsx):
```typescript
async function handleSubmit(e: React.FormEvent) {
  if (!code.trim()) {
    setError('Please enter your practitioner code');
    return;
  }
  setAuthenticating(true);
  const selected = practitioners.find((p) => p.login_code === code);
  setAuthenticating(false);
  if (!selected) {
    setError('Invalid practitioner code');
    return;
  }
  loginPractitioner(selected.id);
  navigate('/admin');
}
```

### Session Management
- **Client Session**: `sessionStorage.buddy_active_client_id`
- **Practitioner Session**: `sessionStorage.buddy_practitioner_id`
- **Logout**: Remove key from sessionStorage

---

## 5. Core Features

### 5.1 Client Portal (`/app`)

#### **Daily Check-In** (`/app/checkin`)
**Multi-step form wizard** with 9 steps:
1. **Greeting** - Welcome message
2. **Overall Feeling** - 5-point emoji scale
3. **Symptom Change** - much_better to much_worse
4. **Pain Level** - 0-10 slider
5. **Symptoms** - Rate each tracked symptom (0-10 sliders)
6. **Sleep & Stress** - 5-point scales for both
7. **Medication** - Yes/No toggle
8. **Notes** - Open-ended feedback
9. **Done** - Confirmation

**Key Logic**:
- Prevents duplicate check-ins on same day (checks `created_at`)
- Auto-flags if pain ≥8 or symptom_change='much_worse'
- Red-flag detection runs on notes content
- Tracks device info (device type, screen resolution)

**Code Example** (src/lib/store.ts):
```typescript
export async function createCheckIn(
  data: Omit<CheckIn, 'id' | 'created_at' | 'flagged'>
): Promise<CheckIn> {
  const flagged = analyzeNotesForRedFlags(data.notes, data.pain_level, data.symptom_change);
  const checkIn: CheckIn = {
    ...data,
    id: uuid(),
    created_at: new Date().toISOString(),
    flagged,
  };
  // Insert to Supabase or localStorage
}
```

#### **Progress Page** (`/app/progress`)
- Shows client progress across multiple metrics
- Charts for pain/sleep/stress trends
- Compliance rating visualization

#### **Timeline View** (`/app/timeline`)
- Chronological list of all check-ins
- Expandable for details (notes, medication, etc.)
- Color-coded by symptom change

#### **Reports** (`/app/progress`)
- Auto-generated from check-in data
- Shows overall trend (improving/stable/declining)
- Pain trajectory chart
- Sleep & stress averages
- Symptom changes (start → end severity)
- Flagged items
- Client notes highlights
- Practitioner recommendations

---

### 5.2 Practitioner/Admin Portal (`/admin`)

#### **Dashboard** (`/admin`)
- **Quick Stats**: Total clients, checked in today, flagged today, total check-ins
- **Client Overview**: Cards showing each client's status
- **Red-Flag Notifications**: `ContactRequestsPanel` alerts on high-severity symptoms
- **Device Analytics**: Breakdown by device type (iPhone, Android, Mac, Windows, etc.)

**Code Example** (src/pages/AdminDashboardPage.tsx):
```typescript
const totalClients = rows.length;
const checkedInToday = rows.filter((r) => r.done).length;
const flaggedToday = rows.filter((r) => r.checkIns.length > 0 && r.checkIns[0].flagged).length;
const totalCheckIns = rows.reduce((sum, r) => sum + r.checkIns.length, 0);
```

#### **Clients Management** (`/admin/clients`)
**Create Client Form**:
- Name, email, primary complaint
- Optional symptoms (comma-separated)
- Custom login code or auto-generate 4-digit code
- Tracking end date (auto-calculates `tracking_duration_weeks`)
- Send welcome email via webhook

**Client List**:
- Shows login code for each
- Number of check-ins
- Last check-in date
- Status (Awaiting/Done today)
- Delete button with confirmation

**Code Example** (src/pages/AdminClientsPage.tsx):
```typescript
const client = await createClient({
  full_name: newClient.full_name.trim(),
  email: newClient.email.trim(),
  practitioner_id: selectedPractitioner,
  primary_complaint: newClient.primary_complaint,
  tracking_duration_weeks: weeks,
});

// Create symptoms if provided
if (newClient.symptoms.trim()) {
  const parts = newClient.symptoms.split(',');
  for (const s of parts) {
    await createSymptom({
      client_id: client.id,
      name: s.trim(),
      body_area: '',
      active: true,
    });
  }
}
```

#### **Client Detail Page** (`/admin/clients/:clientId`)
**Displays**:
- Client info (name, email, complaint, appointment)
- **Compliance Rating** with breakdown:
  - Frequency (35%): check-ins vs total days
  - Engagement (30%): notes written + answer diversity
  - Variability (20%): std dev of pain/sleep/stress (detects fake uniform answers)
  - Recency (15%): days since last check-in
- **Pain Trend Chart**: Historical pain levels
- **Symptom Trends**: Individual symptom trajectories
- **Check-in Timeline**: Expandable history with details
- **Generate Report** button → full follow-up report

**Compliance Calculation** (src/lib/store.ts):
```typescript
export function calculateComplianceRating(client: Client, checkIns: CheckIn[]): ComplianceRating {
  // Frequency: uniqueDays / totalDays
  const freqScore = Math.round(freqRatio * 100);
  
  // Engagement: notes ratio (60%) + answer diversity (40%)
  const notesRatio = sortedCheckIns.filter(c => c.notes?.length > 10).length / sorted.length;
  const uniqueFeelings = new Set(sorted.map(c => c.overall_feeling)).size;
  
  // Variability: standard deviation of responses
  const painStd = stdDev(painValues);
  const varScore = Math.round(Math.min(1, avgStd / 1.5) * 100);
  
  // Recency: days since last check-in
  const daysSinceLast = daysBetween(today, lastCheckIn.created_at);
  
  // Weighted total: 35% + 30% + 20% + 15% = 100%
  const total = freqScore * 0.35 + engScore * 0.30 + varScore * 0.20 + recScore * 0.15;
  
  return { score: total, grade, color, breakdown };
}
```

---

### 5.3 Red-Flag Detection System

**Two-Layer Detection**:

#### **Layer 1: Hard Keywords** (Immediate Referral)
- "broken", "fracture", "dislocated", "can't bear weight"
- "stroke", "face drooping", "slurred speech"
- "loss of consciousness", "seizure"
- "chest pain", "can't breathe"
- "worst headache of my life"
- Returns `true` immediately if found

#### **Layer 2: Scoring System** (Keyword Groups + Amplifiers)
Groups scored 6-7 points:
- `neuro_tingling`: pins and needles, tingling (6 pts)
- `neuro_numbness`: numbness, no feeling (7 pts)
- `neuro_weakness`: weakness, progressive (7 pts)
- `radiating_pain`: shooting/burning pain down limbs (7 pts)
- `fever`: fever, high temperature (6 pts)
- `night_pain`: wakes at night (7 pts)
- `hot_red_joint`: joint hot/red/swollen (7 pts)
- `neck_locked`: can't turn head (7 pts)

**Amplifiers** (bonus points):
- `severity`: "severe", "extreme", "worst" (+2 pts)
- `sudden`: "sudden", "acute" (+2 pts)
- `progression`: "worsening", "spreading" (+1 pt)
- `bilateral`: "both sides", "both arms" (+2 pts)

**Cluster bonus**: 3+ matched groups get +1 pt

**Numeric Overrides**:
- pain_level ≥ 8 → force score to 8
- symptom_change = 'much_worse' → force score to 8

**Final Decision**: score ≥ 6 = red flag = **Refer**

**Code** (src/lib/store.ts):
```typescript
function analyzeNotesForRedFlags(notes: string, painLevel: number, symptomChange: string): boolean {
  const text = notes.toLowerCase();
  
  // Hard override phrases
  const hardOverrides = [
    'broken', 'fracture', 'dislocated', 'can\'t bear weight',
    'stroke', 'slurred speech', 'sudden vision loss',
    // ... 20+ more
  ];
  
  for (const phrase of hardOverrides) {
    if (text.includes(phrase)) return true;
  }
  
  // Keyword group scoring
  let score = 0;
  const keywordGroups: Record<string, { keywords: string[]; score: number }> = {
    'neuro_tingling': {
      keywords: ['pins and needles', 'tingling', 'prickling'],
      score: 6
    },
    'neuro_numbness': {
      keywords: ['numbness', 'numb', 'no feeling'],
      score: 7
    },
    // ... more groups
  };
  
  for (const [group, { keywords, score: groupScore }] of Object.entries(keywordGroups)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += groupScore;
        break;
      }
    }
  }
  
  // Amplifiers
  if (text.includes('severe')) score += 2;
  if (text.includes('sudden')) score += 2;
  
  // Cap and thresholds
  score = Math.min(score, 10);
  if (painLevel >= 8) score = Math.max(score, 8);
  if (symptomChange === 'much_worse') score = Math.max(score, 8);
  
  return score >= 6;
}
```

#### **Symptom Query Tool** (planned/future)
A dedicated page where clients can describe symptoms → get red-flag assessment + recommended action.

---

### 5.4 Report Generation

**Auto-generated for each client**. Calculates:

1. **Overall Trend**:
   - Map each symptom_change to score: much_better=+2, slightly_better=+1, same=0, slightly_worse=-1, much_worse=-2
   - Average score determines trend:
     - avg > 0.5 = improving
     - avg < -0.5 = declining
     - Mixed pattern = mixed
     - Otherwise = stable

2. **Averages**:
   - avg_pain_level = mean of all pain levels
   - avg_sleep_quality = mean of sleep ratings
   - avg_stress_level = mean of stress ratings

3. **Pain Trend**: Array of daily pain levels for charting

4. **Symptom Changes** (per tracked symptom):
   - start_severity = first entry
   - end_severity = last entry
   - trend = improving/stable/worsening based on difference

5. **Flags** (auto-identified):
   - "X high-severity days flagged" (if any check-in flagged=true)
   - "Average pain level is high (≥7/10)"
   - "Consistently poor sleep quality reported" (avg ≤ 2)
   - "Elevated stress levels" (avg ≥ 4)
   - "Worsening trend in last 3 check-ins"

6. **Compliance Rate**:
   - Check-ins / total days since client created
   - Capped at 100%

7. **Recommendation**:
   - "Client is trending positively. Current management approach appears effective. Consider progressing treatment."
   - Or "Client symptoms are worsening. Review current treatment plan..."
   - Or "Mixed response pattern observed. Further investigation into aggravating and easing factors recommended."
   - Or "Stable presentation. Continue current management and monitor."

**Code** (src/lib/store.ts):
```typescript
export async function generateReport(clientId: string) {
  const client = await getClient(clientId);
  const checkIns = await getCheckIns(clientId);
  const symptoms = await getSymptoms(clientId);
  
  if (!client || checkIns.length === 0) return null;
  
  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // Calculate averages
  const avgPain = sorted.reduce((sum, c) => sum + c.pain_level, 0) / sorted.length;
  const avgSleep = sorted.reduce((sum, c) => sum + c.sleep_quality, 0) / sorted.length;
  const avgStress = sorted.reduce((sum, c) => sum + c.stress_level, 0) / sorted.length;
  
  // Determine trend
  const changeScores = sorted.map(c => {
    const map = { much_better: 2, slightly_better: 1, same: 0, slightly_worse: -1, much_worse: -2 };
    return map[c.symptom_change] ?? 0;
  });
  const avgChange = changeScores.reduce((a, b) => a + b, 0) / changeScores.length;
  let overallTrend = 'stable';
  if (avgChange > 0.5) overallTrend = 'improving';
  else if (avgChange < -0.5) overallTrend = 'declining';
  
  // ... generate flags, recommendation, etc.
  
  return { id, client_id, generated_at, period_start, period_end, total_check_ins, compliance_rate, summary };
}
```

---

### 5.5 Email Integration

**Webhook-Based Welcome Emails**:
- When creating a client, optionally send welcome email with login code
- Uses **Make.com** or **Zapier** webhook
- Sends: `client_name`, `client_email`, `login_code`, `app_url`
- Webhook URL stored in localStorage as `buddy_webhook_url`

**Code** (src/lib/email.ts):
```typescript
export async function sendWelcomeEmail(params: {
  client_name: string;
  client_email: string;
  login_code: string;
  app_url: string;
}): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return { success: false, error: 'Email webhook not configured' };
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    return { success: response.ok };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}
```

---

## 6. Data Persistence Layer

### Hybrid Storage Strategy: Supabase + LocalStorage

**Key Principle**: Try Supabase first, fall back to localStorage for offline compatibility.

**Supabase Configuration**:
```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://teehpkaxgqnzwqtmxfhe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1...' // Public anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Storage Keys**:
```typescript
const STORAGE_KEYS = {
  practitioners: 'buddy_practitioners',
  clients: 'buddy_clients',
  checkIns: 'buddy_check_ins',
  symptoms: 'buddy_symptoms',
  symptomEntries: 'buddy_symptom_entries',
  deviceVisits: 'buddy_device_visits',
};
```

**Read Pattern** (src/lib/store.ts):
```typescript
export async function getClients(): Promise<Client[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      writeLocal(STORAGE_KEYS.clients, data);  // Cache locally
      return data as Client[];
    }
  }
  return readLocal<Client>(STORAGE_KEYS.clients);  // Fallback to cache
}
```

**Write Pattern**:
```typescript
export async function createClient(data: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
  const client: Client = {
    ...data,
    id: uuid(),
    created_at: new Date().toISOString(),
  };
  
  if (isSupabaseConfigured()) {
    const { data: inserted, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();
    if (!error && inserted) {
      // Also cache locally
      const local = readLocal<Client>(STORAGE_KEYS.clients);
      local.push(inserted as Client);
      writeLocal(STORAGE_KEYS.clients, local);
      return inserted as Client;
    }
  }
  
  // Fallback: localStorage only
  const clients = readLocal<Client>(STORAGE_KEYS.clients);
  clients.push(client);
  writeLocal(STORAGE_KEYS.clients, clients);
  return client;
}
```

**Login Code Generation**:
```typescript
function generateLoginCode(): string {
  const min = 1000;
  const max = 9999;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

async function generateUniqueLoginCode(): Promise<string> {
  const code = generateLoginCode();
  const existing = await getClients();
  if (existing.some((c) => c.login_code === code)) {
    return generateUniqueLoginCode();  // Retry if duplicate
  }
  return code;
}
```

---

## 7. Key Components & UI Elements

### Core Components

#### **PainSlider** (0-10)
```typescript
// src/components/PainSlider.tsx
export interface Props {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}
// Renders horizontal slider with number output
```

#### **RatingSelector** (1-5 buttons)
```typescript
// src/components/RatingSelector.tsx
export interface Props {
  label: string;
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  labels: [string, string, string, string, string];
}
// 5 emoji buttons: "Terrible" → "Great"
```

#### **SymptomChangeSelector**
```typescript
// src/components/SymptomChangeSelector.tsx
// 5 options: much_better → much_worse with descriptions
```

#### **MiniChart**
```typescript
// src/components/MiniChart.tsx
// Simple line chart for pain/sleep/stress trends
export interface Props {
  data: number[];
  label: string;
}
```

#### **ContactRequestsPanel**
```typescript
// src/components/ContactRequestsPanel.tsx
// Shows flagged symptoms/red-flag alerts to practitioner
```

---

## 8. Routing Architecture

### App Routes (src/App.tsx)

```typescript
<BrowserRouter>
  <Routes>
    {/* Portal Selection */}
    <Route path="/" element={<PortalSelectPage />} />
    
    {/* Client Login */}
    <Route path="/app/login" element={<ClientLoginPage />} />
    
    {/* Practitioner Login */}
    <Route path="/admin/login" element={<PractitionerLoginPage />} />
    
    {/* Client Portal (protected by ClientLayout) */}
    <Route path="/app" element={<ClientLayout />}>
      <Route index element={<Navigate to="/app/checkin" replace />} />
      <Route path="checkin" element={<CheckInPage />} />
      <Route path="query" element={<QueryPage />} />
      <Route path="timeline" element={<TimelinePage />} />
      <Route path="progress" element={<ClientProgressPage />} />
    </Route>
    
    {/* Admin Portal (protected by AdminLayout) */}
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboardPage />} />
      <Route path="clients" element={<AdminClientsPage />} />
      <Route path="clients/:clientId" element={<AdminClientDetailPage />} />
      <Route path="change-password" element={<ChangePasswordPage />} />
    </Route>
    
    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

---

## 9. Session & Authentication Hooks

### useClient (src/hooks/useClient.ts)
```typescript
export function useActiveClient(): Client | null {
  const [client, setClient] = useState<Client | null>(null);
  
  useEffect(() => {
    const id = sessionStorage.getItem('buddy_active_client_id');
    if (id) {
      getClient(id).then((c) => setClient(c ?? null));
    }
  }, []);
  
  return client;
}

export function loginClient(clientId: string) {
  sessionStorage.setItem('buddy_active_client_id', clientId);
}

export function logoutClient() {
  sessionStorage.removeItem('buddy_active_client_id');
}

export function getLoggedInClientId(): string | null {
  return sessionStorage.getItem('buddy_active_client_id');
}
```

### usePractitioner (src/hooks/usePractitioner.ts)
```typescript
export function useActivePractitioner(): Practitioner | null {
  const [practitioner, setP] = useState<Practitioner | null>(null);
  
  useEffect(() => {
    const id = sessionStorage.getItem('buddy_practitioner_id');
    if (id) {
      getPractitioner(id).then((p) => setP(p ?? null));
    }
  }, []);
  
  return practitioner;
}

export function loginPractitioner(practitionerId: string) {
  sessionStorage.setItem('buddy_practitioner_id', practitionerId);
}

export function logoutPractitioner() {
  sessionStorage.removeItem('buddy_practitioner_id');
}

export function getLoggedInPractitionerId(): string | null {
  return sessionStorage.getItem('buddy_practitioner_id');
}
```

---

## 10. Utilities & Helpers

### Date/Time Formatting (src/lib/utils.ts)
```typescript
export function formatDate(dateString: string): string {
  // Format ISO date to "Jan 15, 2024"
}

export function timeAgo(dateString: string): string {
  // Returns "2 hours ago", "3 days ago", etc.
}

export function feelingEmoji(feeling: 1 | 2 | 3 | 4 | 5): string {
  // 1 = 😞, 2 = 😟, 3 = 😐, 4 = 🙂, 5 = 😄
}

export function painColor(level: number): string {
  // 0-3 = green, 4-6 = yellow, 7-8 = orange, 9-10 = red
}

export function changeLabel(change: string): string {
  // much_better → "Much Better", etc.
}

export function changeColor(change: string): string {
  // much_better = green, same = gray, much_worse = red
}

export function trendLabel(trend: string): string {
  // improving → "↑ Improving", declining → "↓ Declining"
}

export function trendColor(trend: string): string {
  // improving = green, declining = red, mixed = orange
}
```

---

## 11. Environment Variables

**.env** file (example):
```
VITE_SUPABASE_URL=https://teehpkaxgqnzwqtmxfhe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=8080
```

If not set, defaults to public Supabase project included in source (for demo/testing).

---

## 12. Deployment

### Railway Deployment
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "start": "serve dist -s -l tcp://0.0.0.0:$PORT"
  }
}
```

1. TypeScript compiles to JS
2. Vite bundles frontend assets → `dist/`
3. Static server (`serve`) hosts from `dist/` on `PORT` (default 8080)

### Build Process
```bash
npm run build  # Runs TypeScript compiler + Vite bundler
npm start      # Serves static dist folder
```

---

## 13. Key Features Summary

| Feature | Client Facing | Practitioner Facing | Implementation |
|---------|---------------|------------------|-----------------|
| Daily Check-in | ✅ | - | Multi-step form with 9 steps |
| Symptom Tracking | ✅ | ✅ (Setup) | SymptomEntry per check-in |
| Red-Flag Detection | - | ✅ | analyzeNotesForRedFlags() + Symptom DB |
| Auto-Flagging | ✅ (See flags) | ✅ (Admin panel) | pain ≥8 or much_worse or keyword match |
| Progress View | ✅ | ✅ | Charts + trend analysis |
| Compliance Rating | - | ✅ | calculateComplianceRating() with 4 metrics |
| Follow-Up Reports | ✅ | ✅ | generateReport() with full summary |
| Device Analytics | - | ✅ | trackDeviceVisit() + getDeviceAnalytics() |
| Email Notifications | - | ✅ (Setup) | Webhook to Make.com/Zapier |
| Client Management | - | ✅ | Full CRUD on Clients table |
| Timeline View | ✅ | ✅ | Expandable check-in history |
| Pain Trend Chart | ✅ | ✅ | MiniChart component |

---

## 14. Recent Commits (Feature Context)

1. **"fix: add loading state to prevent auth redirect loop on practitioner login"** (HEAD)
   - Prevents race condition on practitioner login
   - Added `loading` state during authentication

2. **"Remove password field from practitioner portal"**
   - Practitioner login now code-only (removed password)

3. **"Improve red flag detection system to catch serious injury keywords"**
   - Enhanced SYMPTOM_DATABASE with more injury patterns
   - Added hard override phrases for fractures, dislocations

4. **"Filter dashboards by practitioner"**
   - Each practitioner now sees only their own clients
   - Uses `practitioner_id` FK on Clients table

5. **"Fix TypeScript compilation errors"**
   - Type system enforcements

---

## 15. Key Code Patterns

### Async Data Loading Pattern
```typescript
useEffect(() => {
  (async () => {
    const data = await fetchData();
    setData(data);
    setLoading(false);
  })();
}, [dependencies]);
```

### Conditional Rendering
```typescript
if (loading) return <div>Loading...</div>;
if (!data) return <div>Not found</div>;
return <div>{/* render data */}</div>;
```

### Form State Pattern
```typescript
const [form, setForm] = useState({
  field1: defaultValue,
  field2: defaultValue,
});

function handleChange(field: string, value: any) {
  setForm({ ...form, [field]: value });
}
```

### Error Handling
```typescript
try {
  const result = await operation();
  setSuccess(true);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

---

## 16. Security Notes

⚠️ **Current Implementation**:
- ✅ Code-based login (no passwords for clients)
- ✅ Supabase RLS can enforce row-level security
- ⚠️ Simple client-side password hash for practitioner login (NOT production-grade)
- ⚠️ Credentials stored in localStorage (vulnerable to XSS)
- ⚠️ No HTTPS enforcement in app code (rely on hosting)
- ⚠️ Public anon Supabase key in source

**Recommendations for Production**:
1. Use proper OAuth/JWT for practitioner auth
2. Implement server-side session tokens
3. Enable Supabase RLS policies
4. Move sensitive keys to server-side environment
5. Add HTTPS enforcement
6. Implement proper password hashing (bcrypt/argon2)

---

## 17. Future Enhancement Ideas

Based on current code structure:

1. **SMS Notifications**: Replace email with SMS codes
2. **Practitioner Notes**: Richer notes editor with templates
3. **Appointment Scheduling**: Integrated calendar
4. **Medication Tracking**: Detailed medication logging
5. **Insurance Integration**: Billing/coding support
6. **Multi-language Support**: i18n setup
7. **Dark Mode**: Theme switching
8. **Mobile App**: React Native wrapper
9. **Video Consultations**: Telemedicine integration
10. **Advanced Analytics**: Outcome tracking, ROI

---

## Summary for Rebuilding

**To rebuild this application**, you need:

1. **Frontend Framework**: React 19 with TypeScript
2. **Routing**: React Router 7
3. **Database**: PostgreSQL (Supabase) with tables: practitioners, clients, check_ins, symptoms, symptom_entries, device_visits, contact_requests
4. **Authentication**: Code-based login (4-digit numeric for clients, alphanumeric for practitioners)
5. **Core Logic**: Red-flag symptom analysis + compliance rating calculation
6. **Reporting**: Auto-generated clinical reports with trend analysis
7. **UI**: Mobile-first responsive design with progress indicators
8. **Integrations**: Email webhook support (Make.com/Zapier)
9. **Analytics**: Device tracking + usage metrics

All core business logic is in `src/lib/store.ts` (1000+ lines) and `src/lib/symptomAnalysis.ts` (570 lines). UI components are modular and reusable.

---

**Created**: 2026-04-19  
**Branch**: claude/code-review-documentation-RrhPp  
**App Version**: 0.0.0 (Currently in development)
