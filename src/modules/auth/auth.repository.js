import { pool } from "../../common/config/db.js";

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT users.id, users.name, users.email, users.password_hash,
            users.created_at, users.updated_at, users.village_id,
            villages.name AS village, districts.name AS district, states.name AS state,
            ST_Y(villages.location::geometry) AS latitude,
            ST_X(villages.location::geometry) AS longitude
     FROM users
     LEFT JOIN villages ON villages.id = users.village_id
     LEFT JOIN districts ON districts.id = villages.district_id
     LEFT JOIN states ON states.id = districts.state_id
     WHERE users.email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT users.id, users.name, users.email, users.created_at, users.updated_at,
            users.village_id, villages.name AS village, districts.name AS district,
            states.name AS state, ST_Y(villages.location::geometry) AS latitude,
            ST_X(villages.location::geometry) AS longitude
     FROM users
     LEFT JOIN villages ON villages.id = users.village_id
     LEFT JOIN districts ON districts.id = villages.district_id
     LEFT JOIN states ON states.id = districts.state_id
     WHERE users.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createUser({ name, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, email, passwordHash],
  );
  return findUserById(result.rows[0].id);
}