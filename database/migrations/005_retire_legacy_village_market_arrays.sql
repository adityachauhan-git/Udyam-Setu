-- Apply only after the backend uses GIS market-data tables from migration 004.
-- The current backend no longer reads these denormalized village arrays.

DROP INDEX IF EXISTS villages_nearby_ids_idx;
DROP INDEX IF EXISTS villages_businesses_idx;

ALTER TABLE villages
  DROP COLUMN IF EXISTS nearby_village_ids,
  DROP COLUMN IF EXISTS shared_popular_businesses;
