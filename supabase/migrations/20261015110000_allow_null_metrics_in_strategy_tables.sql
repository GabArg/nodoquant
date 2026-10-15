-- Migration: allow null metrics in public_strategies and public_strategy_profiles
-- Created for Fase 2B.2 Cierre Incremento 2
-- NOTE: Do NOT execute without explicit user authorization.

ALTER TABLE IF EXISTS public.public_strategies 
  ALTER COLUMN profit_factor DROP NOT NULL;

ALTER TABLE IF EXISTS public.public_strategy_profiles 
  ALTER COLUMN profit_factor DROP NOT NULL,
  ALTER COLUMN max_drawdown DROP NOT NULL;

COMMENT ON COLUMN public.public_strategies.profit_factor IS 'Profit factor (gross profit / gross loss). NULL when zero losses (100% win rate) or undefined.';
COMMENT ON COLUMN public.public_strategy_profiles.profit_factor IS 'Profit factor. NULL when zero losses (100% win rate) or undefined.';
COMMENT ON COLUMN public.public_strategy_profiles.max_drawdown IS 'Peak-to-trough percentage drawdown. NULL when initial capital is unknown or unspecified.';
