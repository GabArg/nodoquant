CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX strategies_user_idx ON strategies(user_id);

ALTER TABLE trade_analysis
ADD COLUMN strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
ADD COLUMN dataset_name TEXT NOT NULL DEFAULT 'Dataset';
