import { getOnboarding } from "../onboarding/onboarding.service.js";
import { getRecommendedQuestions, sendChatMessage } from "./chat.service.js";
import { logger } from "../../common/utils/logger.js";

export async function sendMessage(req, res) {
  const { message, history = [] } = req.body ?? {};
  logger.info("controller.chat.send", { requestId: req.requestId, userId: req.user.id, messageLength: typeof message === "string" ? message.length : 0, historyLength: Array.isArray(history) ? history.length : 0 });
  const profile = await getOnboarding(req.user.id);

  const data = await sendChatMessage({
    message,
    history,
    userId: req.user?.id,
    profile,
  });

  logger.info("service.chat.send.completed", { requestId: req.requestId, userId: req.user.id, provider: data.provider, model: data.model, fallbackUsed: data.fallbackUsed === true, replyLength: data.reply?.length || 0 });

  res.status(200).json({
    success: true,
    message: "Chat response generated",
    data,
  });
}

export async function getSuggestions(req, res) {
  logger.info("controller.chat.recommendations", { requestId: req.requestId, userId: req.user.id });
  const profile = await getOnboarding(req.user.id);
  const questions = await getRecommendedQuestions(profile);
  logger.debug("service.chat.recommendations.completed", { requestId: req.requestId, userId: req.user.id, count: questions.length });

  res.status(200).json({
    success: true,
    message: "Recommended questions generated",
    data: { questions },
  });
}
