-- Migration: Enable RLS and add owner-only policies for strategies
-- Created: 2026-03-11

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to manage their own strategies (all operations)
CREATE POLICY "Users manage their own strategies"
ON strategies
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
