-- Run 001_initial_schema.sql first, then run this migration.
-- This migration preserves existing users and creates one onboarding row per user.

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
    CONSTRAINT onboarding_capital_range_check CHECK (capital_range IS NULL OR capital_range IN ('0-25k', '25k-1L', '1-5L', '5L+')),
    CONSTRAINT onboarding_income_range_check CHECK (desired_monthly_income_range IS NULL OR desired_monthly_income_range IN ('5k-10k', '10k-25k', '25k-50k', '50k+'))
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
