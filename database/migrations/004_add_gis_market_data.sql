-- Forward migration: extends the existing location/onboarding schema with
-- reusable GIS market facts. Existing village arrays remain for current chat
-- compatibility; they can be retired only after application queries migrate.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    location geography(Point, 4326) NOT NULL,
    village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_name VARCHAR(150) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (business_id, product_name, unit)
);

CREATE TABLE IF NOT EXISTS market_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location geography(Point, 4326) NOT NULL,
    observation_type VARCHAR(100) NOT NULL,
    value NUMERIC(14, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    source_label VARCHAR(150) NOT NULL,
    observed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    location geography(Point, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS distribution_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    channel_type VARCHAR(100) NOT NULL,
    location geography(Point, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS businesses_location_idx ON businesses USING GIST(location);
CREATE INDEX IF NOT EXISTS businesses_village_id_idx ON businesses(village_id);
CREATE INDEX IF NOT EXISTS businesses_business_type_idx ON businesses(business_type);
CREATE INDEX IF NOT EXISTS business_products_business_id_idx ON business_products(business_id);
CREATE INDEX IF NOT EXISTS market_observations_location_idx ON market_observations USING GIST(location);
CREATE INDEX IF NOT EXISTS market_observations_type_observed_at_idx ON market_observations(observation_type, observed_at DESC);
CREATE INDEX IF NOT EXISTS local_risks_location_idx ON local_risks USING GIST(location);
CREATE INDEX IF NOT EXISTS local_risks_risk_type_idx ON local_risks(risk_type);
CREATE INDEX IF NOT EXISTS distribution_channels_location_idx ON distribution_channels USING GIST(location);
CREATE INDEX IF NOT EXISTS distribution_channels_channel_type_idx ON distribution_channels(channel_type);

COMMENT ON COLUMN villages.shared_popular_businesses IS
  'Legacy compatibility data used by the current chat service. Retain until chat reads GIS market-data tables.';
COMMENT ON COLUMN villages.nearby_village_ids IS
  'Legacy denormalized proximity cache. Current chat uses live PostGIS ST_DWithin queries instead.';
