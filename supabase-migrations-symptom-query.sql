-- Symptom Query Tables for the Query Feature

-- Store red flag detection guidelines
create table if not exists red_flag_guidelines (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  profession text not null check (profession in ('physiotherapy', 'biokineticist', 'chiropractic')),
  severity smallint not null check (severity between 1 and 10),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Store user symptom queries for learning and feedback
create table if not exists symptom_queries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  query_text text not null,
  red_flag_detected boolean not null default false,
  is_legitimate_flag boolean, -- null = no feedback yet, true/false = user feedback
  confidence_score smallint check (confidence_score between 0 and 100),
  created_at timestamptz not null default now(),
  feedback_at timestamptz
);

-- Create index for faster queries
create index if not exists idx_symptom_queries_client on symptom_queries(client_id);
create index if not exists idx_red_flag_guidelines_keyword on red_flag_guidelines(keyword);
