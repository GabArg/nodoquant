-- Migration: create nodoquant_leads table
-- Created: 2026-03-03

create table if not exists nodoquant_leads (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  name         text        not null,
  contact      text        not null,
  market       text        not null,
  strategy_text text       not null,
  link         text,
  ip           text,
  user_agent   text
);

-- Optional: enable Row Level Security
-- alter table nodoquant_leads enable row level security;
-- (Access via service role key bypasses RLS)

-- Optional index for querying by date
create index if not exists nodoquant_leads_created_at_idx on nodoquant_leads (created_at desc);
