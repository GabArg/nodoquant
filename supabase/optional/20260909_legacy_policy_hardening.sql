-- OPTIONAL POST-DEPLOYMENT HARDENING; not required for the public beta.
-- Review against the live schema before running manually.
-- Performs no data updates/deletes and preserves all historical tables/rows.

-- Historical migrations declared permissive policies without a TO role. If
-- those exact policies are present in production, scope them to service_role.
DROP POLICY IF EXISTS "Service role full access" ON public.subscriptions;
CREATE POLICY "Service role full access"
    ON public.subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DO $$
BEGIN
    IF to_regclass('public.user_plans') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Service role full access on plans" ON public.user_plans';
        EXECUTE 'CREATE POLICY "Service role full access on plans" ON public.user_plans FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;

    IF to_regclass('public.user_subscriptions') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions';
        EXECUTE 'CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;
END;
$$;

-- user_profiles.plan is legacy display metadata, never an authorization source.
CREATE OR REPLACE FUNCTION public.prevent_client_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.role() <> 'service_role' AND NEW.plan IS DISTINCT FROM OLD.plan THEN
        RAISE EXCEPTION 'plan cannot be changed by clients';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_client_plan_change ON public.user_profiles;
CREATE TRIGGER prevent_client_plan_change
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_client_plan_change();

COMMENT ON TABLE public.subscriptions IS
    'Historical payment-provider data; not the canonical entitlement model.';
COMMENT ON COLUMN public.user_profiles.plan IS
    'Legacy display metadata only. Never use for authorization.';
