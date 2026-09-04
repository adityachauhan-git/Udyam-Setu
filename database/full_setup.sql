-- Udyam Setu: canonical clean setup for an empty PostgreSQL/PostGIS database.
-- It represents the schema after the legacy base, onboarding, village-cluster,
-- and GIS market-data migrations. Optional GIS demonstration data is in
-- seed/gis_market_data.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (state_id, name)
);

CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    location geography(Point, 4326),
    nearby_village_ids UUID[] DEFAULT '{}',
    shared_popular_businesses TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (district_id, name)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    village_id UUID REFERENCES villages(id),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE onboarding_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age_group VARCHAR(30),
    village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    preferred_language VARCHAR(30),
    land_access BOOLEAN,
    land_area NUMERIC(12, 2),
    land_unit VARCHAR(20),
    land_irrigated BOOLEAN,
    land_type VARCHAR(30),
    capital_range VARCHAR(20),
    electricity_available BOOLEAN,
    internet_available BOOLEAN,
    water_available BOOLEAN,
    storage_available BOOLEAN,
    transport_available BOOLEAN,
    equipment_available BOOLEAN,
    skills TEXT[] NOT NULL DEFAULT '{}',
    interests TEXT[] NOT NULL DEFAULT '{}',
    goals TEXT[] NOT NULL DEFAULT '{}',
    desired_monthly_income_range VARCHAR(20),
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT onboarding_land_area_check CHECK (land_area IS NULL OR land_area > 0),
    CONSTRAINT onboarding_land_unit_check CHECK (land_unit IS NULL OR land_unit IN ('acre', 'hectare', 'bigha')),
    CONSTRAINT onboarding_land_type_check CHECK (land_type IS NULL OR land_type IN ('agricultural', 'residential', 'other')),
    CONSTRAINT onboarding_capital_range_check CHECK (capital_range IS NULL OR capital_range IN ('0-25k', '25k-1L', '1-5L', '5L+')),
    CONSTRAINT onboarding_income_range_check CHECK (desired_monthly_income_range IS NULL OR desired_monthly_income_range IN ('5k-10k', '10k-25k', '25k-50k', '50k+'))
);

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    location geography(Point, 4326) NOT NULL,
    village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_name VARCHAR(150) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (business_id, product_name, unit)
);

CREATE TABLE market_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location geography(Point, 4326) NOT NULL,
    observation_type VARCHAR(100) NOT NULL,
    value NUMERIC(14, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    source_label VARCHAR(150) NOT NULL,
    observed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE local_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    location geography(Point, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE distribution_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    channel_type VARCHAR(100) NOT NULL,
    location geography(Point, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX districts_state_id_idx ON districts(state_id);
CREATE INDEX villages_district_id_idx ON villages(district_id);
CREATE INDEX villages_location_idx ON villages USING GIST(location);
CREATE INDEX villages_nearby_ids_idx ON villages USING GIN(nearby_village_ids);
CREATE INDEX villages_businesses_idx ON villages USING GIN(shared_popular_businesses);
CREATE INDEX onboarding_profiles_village_id_idx ON onboarding_profiles(village_id);
CREATE INDEX onboarding_profiles_skills_idx ON onboarding_profiles USING GIN(skills);
CREATE INDEX onboarding_profiles_interests_idx ON onboarding_profiles USING GIN(interests);
CREATE INDEX onboarding_profiles_goals_idx ON onboarding_profiles USING GIN(goals);
CREATE INDEX businesses_location_idx ON businesses USING GIST(location);
CREATE INDEX businesses_village_id_idx ON businesses(village_id);
CREATE INDEX businesses_business_type_idx ON businesses(business_type);
CREATE INDEX business_products_business_id_idx ON business_products(business_id);
CREATE INDEX market_observations_location_idx ON market_observations USING GIST(location);
CREATE INDEX market_observations_type_observed_at_idx ON market_observations(observation_type, observed_at DESC);
CREATE INDEX local_risks_location_idx ON local_risks USING GIST(location);
CREATE INDEX local_risks_risk_type_idx ON local_risks(risk_type);
CREATE INDEX distribution_channels_location_idx ON distribution_channels USING GIST(location);
CREATE INDEX distribution_channels_channel_type_idx ON distribution_channels(channel_type);

CREATE OR REPLACE FUNCTION update_onboarding_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER onboarding_profiles_updated_at
    BEFORE UPDATE ON onboarding_profiles
    FOR EACH ROW EXECUTE FUNCTION update_onboarding_profiles_updated_at();

COMMENT ON COLUMN villages.shared_popular_businesses IS
  'Legacy compatibility data used by the current chat service. Retain until chat reads GIS market-data tables.';
COMMENT ON COLUMN villages.nearby_village_ids IS
  'Legacy denormalized proximity cache. Current chat uses live PostGIS ST_DWithin queries instead.';

INSERT INTO states (id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Maharashtra'),
  ('10000000-0000-0000-0000-000000000002', 'Karnataka'),
  ('10000000-0000-0000-0000-000000000003', 'Uttarakhand');

INSERT INTO districts (id, state_id, name) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pune'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Nashik'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Bengaluru Rural'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Mysuru'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Dehradun');

INSERT INTO villages (id, district_id, name, location) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Hinjewadi', ST_SetSRID(ST_MakePoint(73.7389, 18.5912), 4326)::geography),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Lonavala', ST_SetSRID(ST_MakePoint(73.4072, 18.7546), 4326)::geography),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Sinnar', ST_SetSRID(ST_MakePoint(74.0001, 19.8456), 4326)::geography),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'Devanahalli', ST_SetSRID(ST_MakePoint(77.7099, 13.2477), 4326)::geography),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', 'Nanjangud', ST_SetSRID(ST_MakePoint(76.6836, 12.1175), 4326)::geography),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'Talegaon Dabhade', ST_SetSRID(ST_MakePoint(73.7250, 18.6150), 4326)::geography),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', 'Alandi', ST_SetSRID(ST_MakePoint(73.8012, 18.5801), 4326)::geography),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', 'Pirangut', ST_SetSRID(ST_MakePoint(73.7600, 18.5450), 4326)::geography),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'Niphad', ST_SetSRID(ST_MakePoint(74.0200, 19.9100), 4326)::geography),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', 'Lasalgaon', ST_SetSRID(ST_MakePoint(74.1100, 19.8250), 4326)::geography),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000003', 'Siddapura', ST_SetSRID(ST_MakePoint(77.7300, 13.2600), 4326)::geography),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000003', 'Hoskote', ST_SetSRID(ST_MakePoint(77.8100, 13.1900), 4326)::geography),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000004', 'Gundlupet', ST_SetSRID(ST_MakePoint(76.7300, 12.0800), 4326)::geography),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000004', 'Tirumakudal Narsipur', ST_SetSRID(ST_MakePoint(76.5900, 12.2100), 4326)::geography),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000005', 'Clement Town', ST_SetSRID(ST_MakePoint(78.1500, 30.2600), 4326)::geography),
  ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000005', 'Doiwala', ST_SetSRID(ST_MakePoint(78.2100, 30.1800), 4326)::geography),
  ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000005', 'Dakpathar', ST_SetSRID(ST_MakePoint(78.0800, 30.3200), 4326)::geography),
  ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000005', 'Herbertpur', ST_SetSRID(ST_MakePoint(78.0500, 30.2800), 4326)::geography),
  ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000005', 'Saharanpur Road', ST_SetSRID(ST_MakePoint(78.1800, 30.3500), 4326)::geography),
  ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000005', 'Vasantpur', ST_SetSRID(ST_MakePoint(78.0200, 30.1500), 4326)::geography);

UPDATE villages v1
SET nearby_village_ids = ARRAY(
  SELECT v2.id FROM villages v2
  WHERE v1.id != v2.id
    AND v1.district_id = v2.district_id
    AND ST_DWithin(v1.location::geography, v2.location::geography, 10000)
  ORDER BY ST_Distance(v1.location::geography, v2.location::geography)
);

UPDATE villages
SET shared_popular_businesses = ARRAY['grocery_store', 'fertilizer_shop', 'seed_supplier', 'tractor_service', 'cooperative_store'];
