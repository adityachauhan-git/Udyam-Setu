import { randomUUID } from "node:crypto";

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const configuredLevel = levels[process.env.LOG_LEVEL] ?? levels.info;

function write(level, message, metadata = {}) {
  if (levels[level] > configuredLevel) return;

  const details = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : "";
  console[level === "debug" ? "log" : level](`[${level}] ${message}${details}`);
}

export const logger = {
  error: (message, metadata) => write("error", message, metadata),
  warn: (message, metadata) => write("warn", message, metadata),
  info: (message, metadata) => write("info", message, metadata),
  debug: (message, metadata) => write("debug", message, metadata),
};

export function requestLogger(req, res, next) {
  const requestId = req.headers["x-request-id"] || randomUUID();
  const startedAt = Date.now();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  logger.info("request.received", {
    requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.on("finish", () => {
    logger.info("response.sent", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}
