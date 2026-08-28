import { getOnboarding, saveOnboarding } from "./onboarding.service.js";

export async function getMyOnboarding(req, res) {
  const profile = await getOnboarding(req.user.id);
  res.json({ success: true, data: { profile } });
}

export async function updateMyOnboarding(req, res) {
  const profile = await saveOnboarding(req.user.id, req.body);
  res.json({ success: true, message: profile.is_complete ? "Onboarding completed" : "Onboarding progress saved", data: { profile } });
}