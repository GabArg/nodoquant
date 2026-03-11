ALTER TABLE strategies
ADD COLUMN slug TEXT UNIQUE;

CREATE INDEX strategies_slug_idx ON strategies(slug);

-- Backfill existing strategies with a generated slug (using name, asset, timeframe, and a part of the UUID to ensure uniqueness)
UPDATE strategies
SET slug = lower(regexp_replace(
    name || COALESCE('-' || asset, '') || COALESCE('-' || timeframe, '') || '-' || substring(id::text from 1 for 6),
    '[^a-zA-Z0-9]+', '-', 'g'
))
WHERE slug IS NULL;
