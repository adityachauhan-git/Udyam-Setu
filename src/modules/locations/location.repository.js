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