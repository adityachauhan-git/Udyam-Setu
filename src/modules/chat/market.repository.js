import { pool } from "../../common/config/db.js";

export async function findNearbyMarketData(villageId) {
  const origin = `
    WITH origin AS (
      SELECT location
      FROM villages
      WHERE id = $1 AND location IS NOT NULL
    )`;

  const [businessesResult, observationsResult, risksResult, channelsResult] = await Promise.all([
    pool.query(
      `${origin}
       SELECT businesses.id, businesses.name, businesses.business_type,
              business_products.product_name, business_products.unit,
              business_products.price
       FROM origin
       JOIN businesses ON ST_DWithin(origin.location, businesses.location, 10000)
       LEFT JOIN business_products ON business_products.business_id = businesses.id
       ORDER BY businesses.name, business_products.product_name`,
      [villageId],
    ),
    pool.query(
      `${origin}
       SELECT observation_type, value, unit, source_label, observed_at
       FROM origin
       JOIN market_observations ON ST_DWithin(origin.location, market_observations.location, 10000)
       ORDER BY observed_at DESC, observation_type`,
      [villageId],
    ),
    pool.query(
      `${origin}
       SELECT risk_type, description, severity
       FROM origin
       JOIN local_risks ON ST_DWithin(origin.location, local_risks.location, 10000)
       ORDER BY severity DESC, risk_type`,
      [villageId],
    ),
    pool.query(
      `${origin}
       SELECT name, channel_type
       FROM origin
       JOIN distribution_channels ON ST_DWithin(origin.location, distribution_channels.location, 10000)
       ORDER BY name`,
      [villageId],
    ),
  ]);

  return {
    businesses: businessesResult.rows,
    observations: observationsResult.rows,
    risks: risksResult.rows,
    channels: channelsResult.rows,
  };
}
