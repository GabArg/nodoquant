-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

-- RLS: Only allow inserts from authenticated users (or anon with restrictions if needed)
-- For a simple tracker, we might allow any authenticated service or anon to insert
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to insert analytics" 
ON public.analytics_events 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view analytics" 
ON public.analytics_events 
FOR SELECT 
TO authenticated 
USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email IN (SELECT email FROM auth.users WHERE is_super_admin = true) -- Add your admin check logic here
    OR auth.jwt() ->> 'email' LIKE '%@nodoquant.com' -- Simple admin check for now
));
