const config = {
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  isProduction: process.env.NODE_ENV === "production",

  /** Domains accepted by the URL validator. */
  allowedHosts: [
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "music.youtube.com",
    "m.youtube.com",
  ],

  ytdlp: {
    /** execFile timeout in ms. */
    timeout: Number.parseInt(process.env.YTDLP_TIMEOUT, 10) || 30_000,
    /** Max stdout buffer for --dump-json (5 MB). */
    maxBuffer: 5 * 1024 * 1024,
  },

  rateLimit: {
    /** Sliding window in ms (default: 15 min). */
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    /** Max requests per window (default: 50). */
    max: Number.parseInt(process.env.RATE_LIMIT_MAX, 10) || 50,
  },
};

module.exports = config;
