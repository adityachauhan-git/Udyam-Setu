import { logger } from "../../common/utils/logger.js";
import { generateFeasibilityReport } from "./report.service.js";

export async function createFeasibilityReport(req, res) {
  logger.info("controller.report.feasibility", { requestId: req.requestId, userId: req.user.id });
  const data = await generateFeasibilityReport({ userId: req.user.id, businessCategory: req.body?.businessCategory });
  logger.info("service.report.feasibility.completed", { requestId: req.requestId, userId: req.user.id, provider: data.provider, fallbackUsed: data.fallbackUsed });
  res.json({ success: true, data });
}
