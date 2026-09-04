-- ============================================================================
-- UdyamSetyu Full Database Setup for Neon / Postgres
-- This file contains the complete schema and seed data needed for the app.
-- Run this as a single migration in Neon or any Postgres-compatible database.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- STATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DISTRICTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (state_id, name)
);

CREATE INDEX IF NOT EXISTS districts_state_id_idx ON districts(state_id);

-- ============================================================================
-- VILLAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    location geography(Point, 4326),
    nearby_village_ids UUID[] DEFAULT '{}',
    shared_popular_businesses TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (district_id, name)
);

CREATE INDEX IF NOT EXISTS villages_district_id_idx ON villages(district_id);
CREATE INDEX IF NOT EXISTS villages_location_idx ON villages USING GIST(location);
CREATE INDEX IF NOT EXISTS villages_nearby_ids_idx ON villages USING GIN(nearby_village_ids);
CREATE INDEX IF NOT EXISTS villages_businesses_idx ON villages USING GIN(shared_popular_businesses);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    village_id UUID REFERENCES villages(id),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS village_id UUID REFERENCES villages(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- SEED DATA: INITIAL STATES, DISTRICTS, VILLAGES
-- ============================================================================

INSERT INTO states (id, name) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Maharashtra'),
    ('10000000-0000-0000-0000-000000000002', 'Karnataka'),
    ('10000000-0000-0000-0000-000000000003', 'Uttarakhand')
ON CONFLICT (id) DO NOTHING;

INSERT INTO districts (id, state_id, name) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Pune'),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Nashik'),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Bengaluru Rural'),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Mysuru'),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Dehradun')
ON CONFLICT (id) DO NOTHING;

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
    ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000005', 'Vasantpur', ST_SetSRID(ST_MakePoint(78.0200, 30.1500), 4326)::geography)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ONBOARDING
-- ============================================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS onboarding_profiles (
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
    CONSTRAINT onboarding_capital_range_check CHECK (capital_range IS NULL OR capital_range IN ('0-25k', '25k-1L', '1-5L', '5L+', 'INR 0-25k', 'INR 25k-1L', 'INR 1-5L', 'INR 5L+', '₹0-25k', '₹25k-1L', '₹1-5L', '₹5L+')),
    CONSTRAINT onboarding_income_range_check CHECK (desired_monthly_income_range IS NULL OR desired_monthly_income_range IN ('5k-10k', '10k-25k', '25k-50k', '50k+', 'INR 5k-10k', 'INR 10k-25k', 'INR 25k-50k', 'INR 50k+', '₹5k-10k', '₹10k-25k', '₹25k-50k', '₹50k+'))
);

CREATE INDEX IF NOT EXISTS onboarding_profiles_village_id_idx ON onboarding_profiles(village_id);
CREATE INDEX IF NOT EXISTS onboarding_profiles_skills_idx ON onboarding_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS onboarding_profiles_interests_idx ON onboarding_profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS onboarding_profiles_goals_idx ON onboarding_profiles USING GIN(goals);

CREATE OR REPLACE FUNCTION update_onboarding_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS onboarding_profiles_updated_at ON onboarding_profiles;
CREATE TRIGGER onboarding_profiles_updated_at
    BEFORE UPDATE ON onboarding_profiles
    FOR EACH ROW EXECUTE FUNCTION update_onboarding_profiles_updated_at();

-- ============================================================================
-- NEARBY VILLAGE / BUSINESS CLUSTERING
-- ============================================================================

UPDATE villages v1
SET nearby_village_ids = ARRAY(
    SELECT v2.id
    FROM villages v2
    WHERE v1.id != v2.id
      AND v1.district_id = v2.district_id
      AND ST_DWithin(v1.location::geography, v2.location::geography, 10000)
    ORDER BY ST_Distance(v1.location::geography, v2.location::geography) ASC
)
WHERE nearby_village_ids = '{}';

UPDATE villages
SET shared_popular_businesses = ARRAY[
    'grocery_store',
    'fertilizer_shop',
    'seed_supplier',
    'pesticide_dealer',
    'tractor_service',
    'agri_tools_shop',
    'tea_stall',
    'cooperative_store'
]
WHERE district_id = '20000000-0000-0000-0000-000000000001'
AND shared_popular_businesses = '{}';

UPDATE villages
SET shared_popular_businesses = ARRAY[
    'dairy_collection',
    'fertilizer_shop',
    'tractor_service',
    'tea_stall',
    'grocery_store',
    'seed_supplier',
    'agri_tools_shop',
    'cooperative_store',
    'water_pump_repair'
]
WHERE district_id = '20000000-0000-0000-0000-000000000002'
AND shared_popular_businesses = '{}';

UPDATE villages
SET shared_popular_businesses = ARRAY[
    'fertilizer_shop',
    'seed_supplier',
    'tractor_service',
    'grocery_store',
    'mobile_repair',
    'digital_kiosk',
    'veterinary_clinic',
    'transport_service',
    'water_pump_repair'
]
WHERE district_id = '20000000-0000-0000-0000-000000000003'
AND shared_popular_businesses = '{}';

UPDATE villages
SET shared_popular_businesses = ARRAY[
    'pesticide_dealer',
    'seed_supplier',
    'fertilizer_shop',
    'tractor_service',
    'cooperative_store',
    'tea_stall',
    'agri_tools_shop',
    'transport_service',
    'dairy_collection'
]
WHERE district_id = '20000000-0000-0000-0000-000000000004'
AND shared_popular_businesses = '{}';

UPDATE villages
SET shared_popular_businesses = ARRAY[
    'fruit_vegetable_market',
    'apple_warehouse',
    'honey_cooperative',
    'food_processing_unit',
    'tea_stall',
    'grocery_store',
    'fertilizer_shop',
    'tractor_rental',
    'dairy_cooperative',
    'organic_farming_input',
    'mobile_repair',
    'digital_kiosk',
    'veterinary_clinic',
    'transport_service',
    'agritourism_services'
]
WHERE district_id = '20000000-0000-0000-0000-000000000005'
AND shared_popular_businesses = '{}';

UPDATE villages
SET shared_popular_businesses = ARRAY[
    'grocery_store',
    'fertilizer_shop',
    'seed_supplier',
    'tractor_service',
    'cooperative_store'
]
WHERE shared_popular_businesses = '{}';

-- ============================================================================
-- OPTIONAL: VALIDATION QUERIES
-- ============================================================================

-- SELECT COUNT(*) AS total_states FROM states;
-- SELECT COUNT(*) AS total_districts FROM districts;
-- SELECT COUNT(*) AS total_villages FROM villages;
-- SELECT name, nearby_village_ids, shared_popular_businesses FROM villages WHERE district_id = '20000000-0000-0000-0000-000000000005';
-- SELECT v.name, ST_Distance(v.location::geography, h.location::geography) / 1000 AS distance_km
-- FROM villages v
-- JOIN villages h ON h.name = 'Hinjewadi'
-- WHERE v.id != h.id
-- AND ST_DWithin(v.location::geography, h.location::geography, 10000)
-- ORDER BY distance_km;
