export function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 ? "Something went wrong" : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  if (statusCode === 503) {
    res.status(statusCode).json({ success: false, error: error.message });
    return;
  }

  res.status(statusCode).json({ success: false, message });
}