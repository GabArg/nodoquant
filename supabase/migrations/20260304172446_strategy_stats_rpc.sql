-- RPC function to return strategies with aggregated analysis counts
-- This avoids N+1 queries when rendering the Strategy Lab card grid.

CREATE OR REPLACE FUNCTION get_strategies_with_stats(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    analysis_count BIGINT,
    last_analysis_at TIMESTAMPTZ,
    avg_profit_factor NUMERIC
)
LANGUAGE sql STABLE
AS $$
    SELECT
        s.id,
        s.user_id,
        s.name,
        s.description,
        s.created_at,
        COUNT(ta.id) AS analysis_count,
        MAX(ta.created_at) AS last_analysis_at,
        AVG(ta.profit_factor) AS avg_profit_factor
    FROM strategies s
    LEFT JOIN trade_analysis ta ON ta.strategy_id = s.id
    WHERE s.user_id = p_user_id
    GROUP BY s.id, s.user_id, s.name, s.description, s.created_at
    ORDER BY s.created_at DESC;
$$;
