-- Create subscriptions table for Lemon Squeezy
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    lemonsqueezy_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'inactive',
    plan TEXT NOT NULL DEFAULT 'free',
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access"
    ON public.subscriptions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Make sure user_profiles has a plan column (may already exist)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- Insert free subscription rows for existing users who don't have one
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT id, 'free', 'inactive' FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = auth.users.id)
ON CONFLICT DO NOTHING;
