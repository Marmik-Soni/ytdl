const express = require("express");
const path = require("node:path");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const errorHandler = require("./middleware/errorHandler");
const infoRoutes = require("./routes/info");
const downloadRoutes = require("./routes/download");

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
// Disable CSP because the frontend uses inline scripts/styles.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(config.isProduction ? "combined" : "dev"));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// NOTE: On Vercel serverless the in-memory store resets per cold start.
// For strict rate limiting in production, swap to an external store (Redis, etc.).
app.use(
  "/api/",
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  }),
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../public")));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});
app.use("/api/info", infoRoutes);
app.use("/api/download", downloadRoutes);

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
