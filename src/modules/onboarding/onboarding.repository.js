import { pool } from "../../common/config/db.js";

const profileColumns = `
  age_group, village_id, preferred_language, land_access, land_area, land_unit,
  land_irrigated, land_type, capital_range, electricity_available,
  internet_available, water_available, storage_available, transport_available,
  equipment_available, skills, interests, goals, desired_monthly_income_range,
  is_complete, created_at, updated_at`;

const joinedProfileColumns = `
  onboarding_profiles.age_group, onboarding_profiles.village_id,
  onboarding_profiles.preferred_language, onboarding_profiles.land_access,
  onboarding_profiles.land_area, onboarding_profiles.land_unit,
  onboarding_profiles.land_irrigated, onboarding_profiles.land_type,
  onboarding_profiles.capital_range, onboarding_profiles.electricity_available,
  onboarding_profiles.internet_available, onboarding_profiles.water_available,
  onboarding_profiles.storage_available, onboarding_profiles.transport_available,
  onboarding_profiles.equipment_available, onboarding_profiles.skills,
  onboarding_profiles.interests, onboarding_profiles.goals,
  onboarding_profiles.desired_monthly_income_range,
  onboarding_profiles.is_complete, onboarding_profiles.created_at,
  onboarding_profiles.updated_at`;

export async function findOnboardingByUserId(userId) {
  const result = await pool.query(
    `SELECT onboarding_profiles.id, onboarding_profiles.user_id, ${joinedProfileColumns},
        districts.state_id, villages.district_id
     FROM onboarding_profiles
     LEFT JOIN villages ON villages.id = onboarding_profiles.village_id
     LEFT JOIN districts ON districts.id = villages.district_id
     WHERE onboarding_profiles.user_id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function upsertOnboardingProfile(userId, profile) {
  const values = [
    userId, profile.ageGroup, profile.villageId, profile.preferredLanguage,
    profile.landAccess, profile.landArea, profile.landUnit, profile.landIrrigated,
    profile.landType, profile.capitalRange, profile.electricityAvailable,
    profile.internetAvailable, profile.waterAvailable, profile.storageAvailable,
    profile.transportAvailable, profile.equipmentAvailable, profile.skills,
    profile.interests, profile.goals, profile.desiredMonthlyIncomeRange,
    profile.isComplete,
  ];
  const result = await pool.query(
    `INSERT INTO onboarding_profiles (
       user_id, age_group, village_id, preferred_language, land_access, land_area,
       land_unit, land_irrigated, land_type, capital_range, electricity_available,
       internet_available, water_available, storage_available, transport_available,
       equipment_available, skills, interests, goals, desired_monthly_income_range,
       is_complete
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
     ON CONFLICT (user_id) DO UPDATE SET
       age_group = EXCLUDED.age_group, village_id = EXCLUDED.village_id,
       preferred_language = EXCLUDED.preferred_language, land_access = EXCLUDED.land_access,
       land_area = EXCLUDED.land_area, land_unit = EXCLUDED.land_unit,
       land_irrigated = EXCLUDED.land_irrigated, land_type = EXCLUDED.land_type,
       capital_range = EXCLUDED.capital_range, electricity_available = EXCLUDED.electricity_available,
       internet_available = EXCLUDED.internet_available, water_available = EXCLUDED.water_available,
       storage_available = EXCLUDED.storage_available, transport_available = EXCLUDED.transport_available,
       equipment_available = EXCLUDED.equipment_available, skills = EXCLUDED.skills,
       interests = EXCLUDED.interests, goals = EXCLUDED.goals,
       desired_monthly_income_range = EXCLUDED.desired_monthly_income_range,
       is_complete = EXCLUDED.is_complete
    RETURNING id, user_id, ${profileColumns}`,
    values,
  );
  return result.rows[0];
}

export async function markOnboardingComplete(userId) {
  await pool.query("UPDATE users SET onboarding_completed = TRUE WHERE id = $1", [userId]);
}