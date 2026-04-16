-- Contact requests table for professionals to receive client notifications

create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  practitioner_id text not null,
  symptom_description text not null,
  symptom_score smallint not null,
  is_read boolean not null default false,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_requests_practitioner on contact_requests(practitioner_id);
create index if not exists idx_contact_requests_client on contact_requests(client_id);
create index if not exists idx_contact_requests_is_read on contact_requests(is_read);
