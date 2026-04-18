export interface Practitioner {
  id: string;
  full_name: string;
  name?: string;
  login_code: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  practitioner_id: string;
  created_at: string;
  next_appointment: string | null;
  primary_complaint: string;
  notes: string | null;
  login_code: string;
  tracking_duration_weeks: number | null;
  tracking_end_date: string | null;
}

export interface CheckIn {
  id: string;
  client_id: string;
  created_at: string;
  overall_feeling: 1 | 2 | 3 | 4 | 5;
  symptom_change: 'much_better' | 'slightly_better' | 'same' | 'slightly_worse' | 'much_worse';
  pain_level: number; // 0-10
  sleep_quality: 1 | 2 | 3 | 4 | 5;
  stress_level: 1 | 2 | 3 | 4 | 5;
  medication_taken: boolean;
  notes: string;
  flagged: boolean;
}

export interface Symptom {
  id: string;
  client_id: string;
  name: string;
  body_area: string;
  created_at: string;
  active: boolean;
}

export interface SymptomEntry {
  id: string;
  check_in_id: string;
  symptom_id: string;
  severity: number; // 0-10
  notes: string;
}

export interface DeviceVisit {
  id: string;
  client_id: string | null;
  device_type: 'iphone' | 'ipad' | 'mac' | 'android' | 'windows' | 'other';
  user_agent: string;
  screen_width: number;
  screen_height: number;
  visited_at: string;
  page: string;
}

export interface FollowUpReport {
  id: string;
  client_id: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  total_check_ins: number;
  compliance_rate: number;
  summary: ReportSummary;
}

export interface ReportSummary {
  overall_trend: 'improving' | 'stable' | 'declining' | 'mixed';
  avg_pain_level: number;
  pain_trend: number[]; // daily pain levels
  avg_sleep_quality: number;
  avg_stress_level: number;
  symptom_changes: {
    symptom_name: string;
    start_severity: number;
    end_severity: number;
    trend: 'improving' | 'stable' | 'worsening';
  }[];
  flags: string[];
  client_notes_highlights: string[];
  recommendation_for_practitioner: string;
}
