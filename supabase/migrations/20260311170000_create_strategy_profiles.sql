-- Migration: Create public_strategy_profiles table for advanced growth system
-- Created: 2026-03-11

CREATE TYPE strategy_visibility AS ENUM ('public', 'private', 'unlisted');

CREATE TABLE IF NOT EXISTS public_strategy_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES trade_analysis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    slug TEXT UNIQUE NOT NULL,
    
    strategy_name TEXT NOT NULL,
    description TEXT,
    visibility strategy_visibility DEFAULT 'public',
    
    -- Snapshot data for high-performance listing
    market TEXT NOT NULL,
    symbol TEXT NOT NULL,
    score INTEGER NOT NULL,
    tier TEXT NOT NULL, -- Elite, Strong Edge, Moderate Edge, Weak Edge
    
    win_rate NUMERIC NOT NULL,
    profit_factor NUMERIC NOT NULL,
    expectancy NUMERIC NOT NULL,
    max_drawdown NUMERIC NOT NULL,
    trades_count INTEGER NOT NULL,
    
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one profile per report
    UNIQUE(report_id)
);

-- Enable RLS
ALTER TABLE public_strategy_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public_strategy_profiles FOR SELECT 
USING (visibility = 'public' OR visibility = 'unlisted' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles" 
ON public_strategy_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" 
ON public_strategy_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" 
ON public_strategy_profiles FOR DELETE 
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategy_profiles_slug ON public_strategy_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_strategy_profiles_market ON public_strategy_profiles(market);
CREATE INDEX IF NOT EXISTS idx_strategy_profiles_score ON public_strategy_profiles(score);
CREATE INDEX IF NOT EXISTS idx_strategy_profiles_published_at ON public_strategy_profiles(published_at);
CREATE INDEX IF NOT EXISTS idx_strategy_profiles_visibility ON public_strategy_profiles(visibility);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_strategy_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_strategy_profiles_updated_at
BEFORE UPDATE ON public_strategy_profiles
FOR EACH ROW
EXECUTE FUNCTION update_strategy_profiles_updated_at();
