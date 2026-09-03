import { getOnboarding, saveOnboarding } from "./onboarding.service.js";
import { logger } from "../../common/utils/logger.js";

export async function getMyOnboarding(req, res) {
  logger.info("controller.onboarding.getMe", { requestId: req.requestId, userId: req.user.id });
  const profile = await getOnboarding(req.user.id);
  logger.debug("controller.onboarding.getMe.response", { requestId: req.requestId, userId: req.user.id, complete: profile.is_complete });
  res.json({ success: true, data: { profile } });
}

export async function updateMyOnboarding(req, res) {
  logger.info("controller.onboarding.updateMe", { requestId: req.requestId, userId: req.user.id, fields: Object.keys(req.body ?? {}), isComplete: req.body?.isComplete === true });
  const profile = await saveOnboarding(req.user.id, req.body);
  logger.info("service.onboarding.update.completed", { requestId: req.requestId, userId: req.user.id, complete: profile.is_complete });
  res.json({ success: true, message: profile.is_complete ? "Onboarding completed" : "Onboarding progress saved", data: { profile } });
}