-- ============================================================================
-- Migración de Seguridad: Habilitación de RLS y Políticas de Aislamiento
-- Fecha: 2026-09-29
-- Descripción:
--   1. Habilita Row Level Security en las 6 tablas críticas identificadas:
--      - public.nodoquant_leads
--      - public.funnel_events
--      - public.trades
--      - public.strategies
--      - public.strategy_reports
--      - public.analytics_results
--   2. Define políticas restrictivas de ownership (auth.uid() = user_id) para
--      strategies, strategy_reports y trades.
--   3. Define política de ownership indirecta basada en EXISTS para analytics_results.
--   4. Mantiene nodoquant_leads y funnel_events con RLS activo y SIN políticas públicas
--      (el backend opera exclusivamente vía service_role que bypasea RLS).
-- ============================================================================

-- ============================================================================
-- 1. strategies
-- ============================================================================
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own strategies" ON public.strategies;
CREATE POLICY "Users can view own strategies"
    ON public.strategies FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own strategies" ON public.strategies;
CREATE POLICY "Users can insert own strategies"
    ON public.strategies FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own strategies" ON public.strategies;
CREATE POLICY "Users can update own strategies"
    ON public.strategies FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own strategies" ON public.strategies;
CREATE POLICY "Users can delete own strategies"
    ON public.strategies FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ============================================================================
-- 2. strategy_reports
-- ============================================================================
ALTER TABLE public.strategy_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own strategy reports" ON public.strategy_reports;
CREATE POLICY "Users can view own strategy reports"
    ON public.strategy_reports FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own strategy reports" ON public.strategy_reports;
CREATE POLICY "Users can insert own strategy reports"
    ON public.strategy_reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own strategy reports" ON public.strategy_reports;
CREATE POLICY "Users can update own strategy reports"
    ON public.strategy_reports FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own strategy reports" ON public.strategy_reports;
CREATE POLICY "Users can delete own strategy reports"
    ON public.strategy_reports FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ============================================================================
-- 3. trades
-- ============================================================================
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
CREATE POLICY "Users can view own trades"
    ON public.trades FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
CREATE POLICY "Users can insert own trades"
    ON public.trades FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
CREATE POLICY "Users can update own trades"
    ON public.trades FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trades" ON public.trades;
CREATE POLICY "Users can delete own trades"
    ON public.trades FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ============================================================================
-- 4. analytics_results
-- Relación indirecta con usuario vía strategy_reports (report_id)
-- ============================================================================
ALTER TABLE public.analytics_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analytics results" ON public.analytics_results;
CREATE POLICY "Users can view own analytics results"
    ON public.analytics_results FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.strategy_reports sr
            WHERE sr.report_id = analytics_results.report_id
              AND sr.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own analytics results" ON public.analytics_results;
CREATE POLICY "Users can insert own analytics results"
    ON public.analytics_results FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.strategy_reports sr
            WHERE sr.report_id = analytics_results.report_id
              AND sr.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own analytics results" ON public.analytics_results;
CREATE POLICY "Users can delete own analytics results"
    ON public.analytics_results FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.strategy_reports sr
            WHERE sr.report_id = analytics_results.report_id
              AND sr.user_id = auth.uid()
        )
    );


-- ============================================================================
-- 5. nodoquant_leads
-- Acceso exclusivo backend vía service_role. Sin policies para anon/authenticated.
-- ============================================================================
ALTER TABLE public.nodoquant_leads ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 6. funnel_events
-- Acceso exclusivo backend vía service_role (/api/track). Sin policies para anon/authenticated.
-- ============================================================================
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
