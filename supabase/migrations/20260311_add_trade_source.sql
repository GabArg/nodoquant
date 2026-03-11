-- Migration: Add market_type and source columns to trades and trade_imports tables
-- Broker Import System — Phase 3

-- Add market_type to trades (forex/crypto/futures/stocks/indices/unknown)
alter table trades
    add column if not exists market_type text default 'unknown',
    add column if not exists source text default 'csv',
    add column if not exists commission numeric default 0,
    add column if not exists swap numeric default 0,
    add column if not exists external_trade_id text;

-- Add source to trade_imports (csv / mt4 / mt5 / binance-spot / binance-futures)
alter table trade_imports
    add column if not exists source text default 'csv';

-- Add index on source for filtering by import method
create index if not exists trades_source_idx on trades(source);
create index if not exists trades_market_type_idx on trades(market_type);
create index if not exists trade_imports_source_idx on trade_imports(source);

-- Update source_format on existing trade_imports rows (backfill as 'csv')
update trade_imports set source = 'csv' where source is null;
