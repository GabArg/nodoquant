-- Migration for Trade Data Model and Analytics
-- Pivot Phase 1

-- Trade Imports
create table if not exists trade_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  status text default 'pending',
  original_filename text,
  trade_count int,
  source_format text
);

-- Trades
create table if not exists trades (
  trade_id uuid primary key default gen_random_uuid(),
  import_id uuid references trade_imports(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  
  -- Core fields
  symbol text,
  direction text,
  entry_price numeric,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  position_size numeric,
  entry_time timestamptz,
  exit_time timestamptz,
  profit_loss numeric,
  
  -- Derived fields
  risk_reward numeric,
  duration_minutes numeric,
  weekday text,
  hour_of_day int,
  session text
);

-- Strategy Reports
create table if not exists strategy_reports (
  report_id uuid primary key default gen_random_uuid(),
  import_id uuid references trade_imports(id) on delete cascade, -- Link to the analysis source
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  
  -- Core Metrics
  strategy_score numeric,
  expectancy_r numeric,
  win_rate numeric,
  profit_factor numeric,
  max_drawdown numeric,
  total_trades int,
  average_r numeric
);

-- Analytics Results (Breakdowns)
create table if not exists analytics_results (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references strategy_reports(report_id) on delete cascade,
  created_at timestamptz default now(),
  
  dimension_type text not null, -- e.g., 'symbol', 'session', 'weekday'
  dimension_value text not null,
  
  win_rate numeric,
  expectancy_r numeric,
  trade_count int,
  profit_factor numeric
);

-- Indexes for performance
create index if not exists trades_import_id_idx on trades(import_id);
create index if not exists trades_user_id_idx on trades(user_id);
create index if not exists strategy_reports_user_id_idx on strategy_reports(user_id);
create index if not exists analytics_results_report_id_idx on analytics_results(report_id);
