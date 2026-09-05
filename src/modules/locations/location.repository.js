import { pool } from "../../common/config/db.js";

export async function findStates() {
  const result = await pool.query("SELECT id, name FROM states ORDER BY name");
  return result.rows;
}

export async function findDistrictsByStateId(stateId) {
  const result = await pool.query(
    "SELECT id, name FROM districts WHERE state_id = $1 ORDER BY name",
    [stateId],
  );
  return result.rows;
}

export async function findVillagesByDistrictId(districtId) {
  const result = await pool.query(
    "SELECT id, name FROM villages WHERE district_id = $1 ORDER BY name",
    [districtId],
  );
  return result.rows;
}

export function createLocationRepository(database = pool) {
  async function findCompetitionMapByUserId(userId, businessCategory, radiusMeters) {
    const result = await database.query(
      `WITH selected_village AS (
       SELECT villages.id, villages.name AS village, districts.name AS district,
              states.name AS state, villages.location
       FROM onboarding_profiles
       JOIN villages ON villages.id = onboarding_profiles.village_id
       JOIN districts ON districts.id = villages.district_id
       JOIN states ON states.id = districts.state_id
       WHERE onboarding_profiles.user_id = $1 AND villages.location IS NOT NULL
     )
     SELECT selected_village.id AS village_id, selected_village.village,
            selected_village.district, selected_village.state,
            ST_Y(selected_village.location::geometry) AS village_latitude,
            ST_X(selected_village.location::geometry) AS village_longitude,
            businesses.id, businesses.name, businesses.business_type,
            ST_Y(businesses.location::geometry) AS latitude,
            ST_X(businesses.location::geometry) AS longitude,
            ROUND((ST_Distance(selected_village.location, businesses.location) / 1000)::numeric, 2) AS distance_km
     FROM selected_village
     LEFT JOIN businesses
       ON ST_DWithin(selected_village.location, businesses.location, $3)
      AND ($2::text IS NULL OR LOWER(businesses.business_type) LIKE '%' || LOWER($2) || '%')
       ORDER BY distance_km, businesses.name`,
      [userId, businessCategory, radiusMeters],
    );

    if (result.rows.length === 0) return null;

    const [firstRow] = result.rows;
    return {
      village: {
        id: firstRow.village_id,
        name: firstRow.village,
        district: firstRow.district,
        state: firstRow.state,
        latitude: firstRow.village_latitude,
        longitude: firstRow.village_longitude,
      },
      businesses: result.rows
        .filter((row) => row.id !== null)
        .map(({ id, name, business_type, latitude, longitude, distance_km }) => ({
          id,
          name,
          business_type,
          latitude,
          longitude,
          distance_km,
        })),
    };
  }

  return { findCompetitionMapByUserId };
}

const repository = createLocationRepository();
export const findCompetitionMapByUserId = repository.findCompetitionMapByUserId;