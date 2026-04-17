-- Buddy App – Supabase schema
-- Run this in the Supabase SQL Editor to create the required tables.

-- ── Practitioners ──────────────────────────────────────
create table if not exists practitioners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  login_code text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Clients ─────────────────────────────────────────────
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null default '',
  practitioner_id text not null default 'default',
  created_at timestamptz not null default now(),
  next_appointment timestamptz,
  primary_complaint text not null default '',
  notes text,
  login_code text not null unique,
  tracking_duration_weeks int,
  tracking_end_date timestamptz
);

-- ── Symptoms ────────────────────────────────────────────
create table if not exists symptoms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  body_area text not null default '',
  created_at timestamptz not null default now(),
  active boolean not null default true
);

-- ── Check-ins ───────────────────────────────────────────
create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  overall_feeling smallint not null check (overall_feeling between 1 and 5),
  symptom_change text not null check (symptom_change in ('much_better','slightly_better','same','slightly_worse','much_worse')),
  pain_level smallint not null check (pain_level between 0 and 10),
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  stress_level smallint not null check (stress_level between 1 and 5),
  medication_taken boolean not null default false,
  notes text not null default '',
  flagged boolean not null default false
);

-- ── Symptom Entries (per check-in) ──────────────────────
create table if not exists symptom_entries (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references check_ins(id) on delete cascade,
  symptom_id uuid not null references symptoms(id) on delete cascade,
  severity smallint not null check (severity between 0 and 10),
  notes text not null default ''
);

-- ── Device Visits ───────────────────────────────────────
create table if not exists device_visits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  device_type text not null default 'other',
  user_agent text not null default '',
  screen_width int not null default 0,
  screen_height int not null default 0,
  visited_at timestamptz not null default now(),
  page text not null default ''
);

-- ── Contact Requests (symptom red flags) ────────────────
create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  practitioner_id uuid not null references practitioners(id) on delete cascade,
  symptom_description text not null,
  symptom_score smallint not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Symptom Queries (for red flag tracking) ─────────────
create table if not exists symptom_queries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  symptom_description text not null,
  red_flag_detected boolean not null,
  confidence_score smallint not null,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────
-- Enable RLS but allow anon access (the app uses anon key)
alter table practitioners enable row level security;
alter table clients enable row level security;
alter table symptoms enable row level security;
alter table check_ins enable row level security;
alter table symptom_entries enable row level security;
alter table device_visits enable row level security;
alter table contact_requests enable row level security;
alter table symptom_queries enable row level security;

-- Allow full access via anon key (single-practitioner app)
create policy "Allow all for anon" on practitioners for all using (true) with check (true);
create policy "Allow all for anon" on clients for all using (true) with check (true);
create policy "Allow all for anon" on symptoms for all using (true) with check (true);
create policy "Allow all for anon" on check_ins for all using (true) with check (true);
create policy "Allow all for anon" on symptom_entries for all using (true) with check (true);
create policy "Allow all for anon" on device_visits for all using (true) with check (true);
create policy "Allow all for anon" on contact_requests for all using (true) with check (true);
create policy "Allow all for anon" on symptom_queries for all using (true) with check (true);
