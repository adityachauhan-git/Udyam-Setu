import { getOnboarding } from "../onboarding/onboarding.service.js";
import { getRecommendedQuestions, sendChatMessage } from "./chat.service.js";

export async function sendMessage(req, res) {
  const { message, history = [] } = req.body ?? {};

  const data = await sendChatMessage({
    message,
    history,
    userId: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Chat response generated",
    data,
  });
}

export async function getSuggestions(req, res) {
  const profile = await getOnboarding(req.user.id);
  const questions = await getRecommendedQuestions(profile);

  res.status(200).json({
    success: true,
    message: "Recommended questions generated",
    data: { questions },
  });
}
