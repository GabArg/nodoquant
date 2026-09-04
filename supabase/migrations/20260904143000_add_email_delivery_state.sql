alter table public.trade_analysis
add column if not exists email_send_status text default 'pending',
add column if not exists email_send_attempts integer default 0,
add column if not exists email_sent_at timestamptz,
add column if not exists email_last_error text;