const config = require("../config");

/**
 * Express middleware — validates and sanitizes YouTube URLs.
 *
 * Rejects anything that isn't from an allowed YouTube hostname with a 400.
 * On success, attaches `req.sanitizedUrl` for downstream handlers.
 */
function validateUrl(req, res, next) {
  const raw = req.query.url || "";

  try {
    const url = new URL(raw);

    if (!config.allowedHosts.includes(url.hostname)) {
      return res.status(400).json({ error: "Only YouTube URLs are allowed." });
    }

    req.sanitizedUrl = url.toString();
    return next();
  } catch {
    return res.status(400).json({ error: "Invalid or missing YouTube URL." });
  }
}

module.exports = validateUrl;
