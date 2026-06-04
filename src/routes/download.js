const { spawn } = require("node:child_process");
const express = require("express");
const ytdlp = require("../utils/ytdlp");
const validateUrl = require("../middleware/validateUrl");

const router = express.Router();

/** Maps file extensions to proper MIME types. */
const CONTENT_TYPES = {
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
};

// ─── GET /api/download?url=...&format=...&ext=...&type=...&title=... ────────
// Streams the download directly to the client via yt-dlp stdout.

router.get("/", validateUrl, (req, res) => {
  const formatId = req.query.format || "bestvideo+bestaudio";
  const ext = req.query.ext || "mp4";
  const isAudio = req.query.type === "audio";
  const quality = req.query.quality || "192";
  const filename = (req.query.title || "download").replace(/[^a-z0-9_\-\s]/gi, "_").slice(0, 80);

  res.setHeader("Content-Disposition", `attachment; filename="${filename}.${ext}"`);
  res.setHeader("Content-Type", CONTENT_TYPES[ext] || "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const args = isAudio
    ? buildAudioArgs(ext, quality, req.sanitizedUrl)
    : buildVideoArgs(formatId, ext, req.sanitizedUrl);

  const proc = spawn(ytdlp.getPath(), args);

  proc.stdout.pipe(res);

  proc.stderr.on("data", (chunk) => {
    console.error("[yt-dlp]", chunk.toString());
  });

  proc.on("error", (err) => {
    console.error("[spawn error]", err.message);
    if (!res.headersSent) {
      res.status(500).end("Download failed.");
    }
  });

  proc.on("close", (code) => {
    if (code !== 0 && !res.writableEnded) res.end();
  });

  // Kill the yt-dlp process if the client disconnects mid-download
  req.on("close", () => {
    if (!proc.killed) proc.kill("SIGTERM");
  });
});

// ─── Argument builders ──────────────────────────────────────────────────────

function buildAudioArgs(ext, quality, url) {
  return [
    "-f",
    "bestaudio",
    "--extract-audio",
    "--audio-format",
    ext,
    ...(ext === "mp3" ? ["--audio-quality", quality] : []),
    "--no-playlist",
    "--no-warnings",
    "-o",
    "-",
    url,
  ];
}

function buildVideoArgs(formatId, ext, url) {
  // For merge formats (e.g. "137+bestaudio"), fall back to a flexible selector
  // so yt-dlp can pick the best available combination.
  const fmtId = formatId.includes("+")
    ? "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
    : formatId;

  return [
    "-f",
    fmtId,
    "--no-playlist",
    "--no-warnings",
    "--merge-output-format",
    ext,
    "-o",
    "-",
    url,
  ];
}

module.exports = router;
