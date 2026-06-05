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

// Trust the first proxy (Vercel's proxy)
app.set("trust proxy", 1);

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

app.get("/api/debug-ytdlp", (_req, res) => {
  const { execSync } = require("node:child_process");
  try {
    const which = execSync(
      "which yt-dlp || find /usr -name yt-dlp 2>/dev/null || echo 'not found'",
      {
        encoding: "utf8",
      },
    );
    const version = execSync("yt-dlp --version 2>/dev/null || echo 'not runnable'", {
      encoding: "utf8",
    });
    res.json({ which: which.trim(), version: version.trim() });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../public")));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/api/debug-cookies", (_req, res) => {
  const b64 = process.env.YOUTUBE_COOKIES_B64;
  if (!b64) return res.json({ error: "No cookies env var set" });

  const decoded = Buffer.from(b64, "base64").toString("utf8");
  const lines = decoded.split("\n").filter((l) => l && !l.startsWith("#"));

  res.json({
    envVarLength: b64.length,
    decodedLength: decoded.length,
    cookieCount: lines.length,
    firstLine: `${lines[0]?.slice(0, 50)}...`,
    hasYoutubeDomain: decoded.includes(".youtube.com"),
  });
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
