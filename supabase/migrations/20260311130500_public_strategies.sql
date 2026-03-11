-- Migration: Create public_strategies table for SEO-driven library
-- Created: 2026-03-11

CREATE TABLE IF NOT EXISTS public_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES trade_analysis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    slug TEXT UNIQUE NOT NULL,
    
    strategy_name TEXT NOT NULL,
    description TEXT,
    
    market TEXT NOT NULL, -- Forex, Crypto, Futures, Stocks
    symbol TEXT NOT NULL, -- e.g. EURUSD, BTCUSDT
    
    score INTEGER NOT NULL,
    win_rate NUMERIC NOT NULL,
    profit_factor NUMERIC NOT NULL,
    trades INTEGER NOT NULL,
    
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public_strategies ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public strategies are viewable by everyone" 
ON public_strategies FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own public strategies" 
ON public_strategies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own public strategies" 
ON public_strategies FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own public strategies" 
ON public_strategies FOR DELETE 
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_strategies_slug ON public_strategies(slug);
CREATE INDEX IF NOT EXISTS idx_public_strategies_market ON public_strategies(market);
CREATE INDEX IF NOT EXISTS idx_public_strategies_score ON public_strategies(score);
CREATE INDEX IF NOT EXISTS idx_public_strategies_published_at ON public_strategies(published_at);
