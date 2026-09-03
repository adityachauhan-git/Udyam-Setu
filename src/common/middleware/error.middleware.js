import { logger } from "../utils/logger.js";

export function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 ? "Something went wrong" : error.message;

  if (statusCode >= 500) {
    logger.error("request.failed", { requestId: req.requestId, method: req.method, path: req.originalUrl, statusCode, error: error.message, stack: error.stack });
  } else {
    logger.warn("request.rejected", { requestId: req.requestId, method: req.method, path: req.originalUrl, statusCode, error: error.message });
  }

  if (statusCode === 503) {
    res.status(statusCode).json({ success: false, error: error.message });
    return;
  }

  res.status(statusCode).json({ success: false, message });
}