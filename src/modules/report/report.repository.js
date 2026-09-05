import { pool } from "../../common/config/db.js";

export function createReportRepository(database = pool) {
  async function findVillageLocation(villageId) {
    const result = await database.query(
      `SELECT villages.id, villages.name AS village, districts.name AS district,
              states.name AS state, ST_Y(villages.location::geometry) AS latitude,
              ST_X(villages.location::geometry) AS longitude
       FROM villages
       JOIN districts ON districts.id = villages.district_id
       JOIN states ON states.id = districts.state_id
       WHERE villages.id = $1 AND villages.location IS NOT NULL`,
      [villageId],
    );
    return result.rows[0] ?? null;
  }

  async function findNearbyMarketData(villageId, businessCategory, radiusMeters) {
    const origin = `WITH origin AS (
      SELECT location FROM villages WHERE id = $1 AND location IS NOT NULL
    )`;

    const [marketResult, competitorResult, pricingResult, riskResult, channelResult] = await Promise.all([
      database.query(
        `${origin}
         SELECT observation_type, value, unit, source_label, observed_at,
                ROUND((ST_Distance(origin.location, market_observations.location) / 1000)::numeric, 2) AS distance_km
         FROM origin
         JOIN market_observations ON ST_DWithin(origin.location, market_observations.location, $2)
         ORDER BY observed_at DESC, distance_km`,
        [villageId, radiusMeters],
      ),
      database.query(
        `${origin}
         SELECT businesses.id, businesses.name, businesses.business_type,
                ROUND((ST_Distance(origin.location, businesses.location) / 1000)::numeric, 2) AS distance_km
         FROM origin
         JOIN businesses ON ST_DWithin(origin.location, businesses.location, $2)
         WHERE LOWER(businesses.business_type) LIKE '%' || LOWER($3) || '%'
         ORDER BY distance_km, businesses.name`,
        [villageId, radiusMeters, businessCategory],
      ),
      database.query(
        `${origin}
         SELECT businesses.id AS business_id, businesses.name AS business_name,
                businesses.business_type, business_products.product_name,
                business_products.unit, business_products.price,
                ROUND((ST_Distance(origin.location, businesses.location) / 1000)::numeric, 2) AS distance_km
         FROM origin
         JOIN businesses ON ST_DWithin(origin.location, businesses.location, $2)
         JOIN business_products ON business_products.business_id = businesses.id
         WHERE LOWER(businesses.business_type) LIKE '%' || LOWER($3) || '%'
         ORDER BY distance_km, businesses.name, business_products.product_name`,
        [villageId, radiusMeters, businessCategory],
      ),
      database.query(
        `${origin}
         SELECT risk_type, description, severity,
                ROUND((ST_Distance(origin.location, local_risks.location) / 1000)::numeric, 2) AS distance_km
         FROM origin
         JOIN local_risks ON ST_DWithin(origin.location, local_risks.location, $2)
         ORDER BY distance_km, risk_type`,
        [villageId, radiusMeters],
      ),
      database.query(
        `${origin}
         SELECT name, channel_type,
                ROUND((ST_Distance(origin.location, distribution_channels.location) / 1000)::numeric, 2) AS distance_km
         FROM origin
         JOIN distribution_channels ON ST_DWithin(origin.location, distribution_channels.location, $2)
         ORDER BY distance_km, name`,
        [villageId, radiusMeters],
      ),
    ]);

    return {
      market: marketResult.rows,
      competitors: competitorResult.rows,
      pricing: pricingResult.rows,
      threats: riskResult.rows,
      distributionChannels: channelResult.rows,
    };
  }

  return { findVillageLocation, findNearbyMarketData };
}

const repository = createReportRepository();

export const findVillageLocation = repository.findVillageLocation;
export const findNearbyMarketData = repository.findNearbyMarketData;
