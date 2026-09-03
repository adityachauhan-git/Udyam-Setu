import { getCurrentUser, loginUser, registerUser } from "./auth.service.js";
import { logger } from "../../common/utils/logger.js";

export async function register(req, res) {
  logger.info("controller.auth.register", { requestId: req.requestId, fields: Object.keys(req.body ?? {}).filter((field) => field !== "password") });
  const data = await registerUser(req.body);
  logger.info("service.auth.register.completed", { requestId: req.requestId, userId: data.user?.id });
  res.status(201).json({ success: true, message: "Registration successful", data });
}

export async function login(req, res) {
  logger.info("controller.auth.login", { requestId: req.requestId, emailProvided: Boolean(req.body?.email), passwordProvided: Boolean(req.body?.password) });
  const data = await loginUser(req.body);
  logger.info("service.auth.login.completed", { requestId: req.requestId, userId: data.user?.id });
  res.json({ success: true, message: "Login successful", data });
}

export async function getMe(req, res) {
  logger.info("controller.auth.getMe", { requestId: req.requestId, userId: req.user.id });
  const user = await getCurrentUser(req.user.id);
  logger.debug("controller.auth.getMe.response", { requestId: req.requestId, userId: user.id, hasLocation: Boolean(user.village) });
  res.json({ success: true, message: "Current user retrieved", data: { user } });
}