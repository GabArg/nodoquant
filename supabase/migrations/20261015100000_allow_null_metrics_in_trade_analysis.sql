-- Migration: allow null metrics in trade_analysis for undefined profit_factor and max_drawdown
-- Created for Fase 2B.2 Incremento 2
-- NOTE: Do NOT execute without explicit user authorization.

ALTER TABLE IF EXISTS public.trade_analysis 
  ALTER COLUMN profit_factor DROP NOT NULL,
  ALTER COLUMN max_drawdown DROP NOT NULL;

COMMENT ON COLUMN public.trade_analysis.profit_factor IS 'Profit factor (gross profit / gross loss). NULL when zero losses (100% win rate) or undefined.';
COMMENT ON COLUMN public.trade_analysis.max_drawdown IS 'Peak-to-trough percentage drawdown. NULL when initial capital is unknown or unspecified.';
