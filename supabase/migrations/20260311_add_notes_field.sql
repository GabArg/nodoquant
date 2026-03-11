-- Add notes column to trade_analysis
alter table if exists public.trade_analysis 
add column if not exists notes text;

-- (An index on created_at already exists as trade_analysis_created_at_idx, 
-- but ensuring it's there just in case)
create index if not exists trade_analysis_created_at_idx on public.trade_analysis (created_at desc);
