const config = require("../config");

/**
 * Global Express error handler.
 *
 * In development: returns the full error message + stack trace.
 * In production:  returns a generic message to avoid leaking internals.
 */
function errorHandler(err, _req, res, _next) {
  console.error("[ERROR]", err.message);

  const status = err.status || 500;
  const body = {
    error: config.isProduction ? "Internal server error." : err.message,
  };

  if (!config.isProduction) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

module.exports = errorHandler;
