-- Add category column to strategies table for leaderboard filtering
ALTER TABLE strategies
ADD COLUMN category TEXT DEFAULT 'forex'
CHECK (category IN ('forex', 'crypto', 'indices', 'commodities', 'stocks', 'other'));
