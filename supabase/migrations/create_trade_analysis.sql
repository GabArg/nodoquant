-- Migration: create trade_analysis table
-- Created: 2026-03-04

create table if not exists trade_analysis (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  trades_count     int         not null,
  winrate          numeric     not null,
  profit_factor    numeric     not null,
  max_drawdown     numeric     not null,
  metrics_json     jsonb,
  user_email       text,
  -- Analytics fields
  file_name        text,
  date_range_start timestamptz,
  date_range_end   timestamptz,
  sum_profit       numeric
);

-- Index for querying by date and email
create index if not exists trade_analysis_created_at_idx on trade_analysis (created_at desc);
create index if not exists trade_analysis_user_email_idx on trade_analysis (user_email)
  where user_email is not null;
