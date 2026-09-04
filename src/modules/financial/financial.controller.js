import { logger } from "../../common/utils/logger.js";
import { calculateFinancialEligibility } from "./financial.service.js";

export function checkSchemeEligibility(req, res) {
  logger.info("controller.financial.schemeEligibility", { requestId: req.requestId, userId: req.user.id });
  const calculation = calculateFinancialEligibility(req.body);
  logger.debug("controller.financial.schemeEligibility.response", {
    requestId: req.requestId,
    userId: req.user.id,
    eligible: calculation.eligible,
  });
  res.json({ success: true, data: calculation });
}