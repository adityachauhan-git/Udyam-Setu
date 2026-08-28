import { getCurrentUser, loginUser, registerUser } from "./auth.service.js";

export async function register(req, res) {
  const data = await registerUser(req.body);
  res.status(201).json({ success: true, message: "Registration successful", data });
}

export async function login(req, res) {
  const data = await loginUser(req.body);
  res.json({ success: true, message: "Login successful", data });
}

export async function getMe(req, res) {
  const user = await getCurrentUser(req.user.id);
  res.json({ success: true, message: "Current user retrieved", data: { user } });
}