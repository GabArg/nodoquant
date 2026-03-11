-- Public reports: allow sharing strategy analyses via unique public links

ALTER TABLE trade_analysis
ADD COLUMN public_id TEXT UNIQUE;

ALTER TABLE trade_analysis
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

ALTER TABLE trade_analysis
ADD COLUMN show_strategy_name BOOLEAN DEFAULT FALSE;

ALTER TABLE trade_analysis
ADD COLUMN show_dataset_name BOOLEAN DEFAULT FALSE;

CREATE INDEX trade_analysis_public_id_idx ON trade_analysis(public_id)
WHERE public_id IS NOT NULL;
