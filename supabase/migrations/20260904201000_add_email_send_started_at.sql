alter table public.trade_analysis
add column if not exists email_send_started_at timestamptz;