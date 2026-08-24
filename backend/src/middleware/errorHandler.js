/**
 * Global Express error handler.
 * Always returns JSON — never an empty body or HTML page.
 */
export function errorHandler(err, req, res, _next) {
  // Don't log 4xx — those are client errors, not bugs
  if (!err.status || err.status >= 500) {
    console.error(`[error] ${req.method} ${req.path} →`, err.message);
  }

  const status = err.status || err.statusCode || 500;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: Object.values(err.errors).map((e) => e.message).join(", "),
    });
  }

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ error: `${field} already exists.` });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired. Please log in again." });
  }

  // Multer file-size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large." });
  }

  res.status(status).json({
    error: err.message || "Internal server error.",
  });
}

/**
 * 404 handler — must be registered BEFORE errorHandler, AFTER all routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
}
