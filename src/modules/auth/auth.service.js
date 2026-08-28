import bcrypt from "bcryptjs";
import { AppError } from "../../common/errors/AppError.js";
import { generateToken } from "../../common/utils/jwt.js";
import { createUser, findUserByEmail, findUserById } from "./auth.repository.js";

function publicUser(user) {
  const { password_hash: passwordHash, ...safeUser } = user;
  return safeUser;
}

function requireFields(fields) {
  if (fields.some((field) => typeof field !== "string" || !field.trim())) {
    throw new AppError("Required fields are missing", 400);
  }
}

export async function registerUser({ name, email, password }) {
  requireFields([name, email, password]);
  const normalizedEmail = email.trim().toLowerCase();

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  if (await findUserByEmail(normalizedEmail)) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let user;
  try {
    user = await createUser({ name: name.trim(), email: normalizedEmail, passwordHash });
  } catch (error) {
    if (error.code === "23505") {
      throw new AppError("Email is already registered", 409);
    }
    throw error;
  }

  return { user: publicUser(user), token: generateToken({ id: user.id }) };
}

export async function loginUser({ email, password }) {
  requireFields([email, password]);
  const user = await findUserByEmail(email.trim().toLowerCase());
  const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new AppError("Invalid credentials", 401);
  }
  return { user: publicUser(user), token: generateToken({ id: user.id }) };
}

export async function getCurrentUser(id) {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return publicUser(user);
}