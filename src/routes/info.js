const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const express = require("express");
const ytdlp = require("../utils/ytdlp");
const config = require("../config");
const validateUrl = require("../middleware/validateUrl");

const execFileAsync = promisify(execFile);
const router = express.Router();

// ─── GET /api/info?url=<youtube-url> ────────────────────────────────────────
// Returns video title, thumbnail, duration, channel, and available formats.

router.get("/", validateUrl, async (_req, res) => {
  try {
    const { stdout } = await execFileAsync(
      ytdlp.getPath(),
      [
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--quiet",
        "--no-check-formats",
        "--extractor-args",
        "youtube:player_client=android,tv_embedded,mweb,web",
        "--cache-dir",
        "/tmp/ytdlp-cache",
        "--remote-components",
        "ejs:npm",
        ...ytdlp.getCookiesArgs(),
        _req.sanitizedUrl,
      ],
      { timeout: config.ytdlp.timeout, maxBuffer: config.ytdlp.maxBuffer },
    );

    const data = JSON.parse(stdout);
    const formats = buildFormatList(data);

    res.json({
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      channel: data.uploader,
      formats,
    });
  } catch (err) {
    console.error("[yt-dlp info]", err.message);
    res.status(500).json({
      error: "Could not fetch video info. Ensure the URL is valid and the video is public.",
    });
  }
});

// ─── Format list builder ────────────────────────────────────────────────────

function buildFormatList(data) {
  const seen = new Set();
  const formats = [];
  const rawFormats = data.formats || [];

  // Video + Audio (MP4) — pre-muxed, widest compatibility
  const videoWithAudio = rawFormats
    .filter(
      (f) => f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none" && f.ext === "mp4",
    )
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const f of videoWithAudio) {
    const label = `${f.height}p MP4`;
    if (seen.has(label)) continue;
    seen.add(label);
    formats.push({
      id: f.format_id,
      label,
      type: "video",
      ext: "mp4",
      height: f.height,
      filesize: f.filesize || f.filesize_approx || null,
    });
  }

  // Video-only — merged with best audio via ffmpeg
  const videoOnly = rawFormats
    .filter(
      (f) =>
        f.vcodec &&
        f.vcodec !== "none" &&
        (f.acodec === "none" || !f.acodec) &&
        ["mp4", "webm"].includes(f.ext),
    )
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const f of videoOnly) {
    const label = `${f.height}p ${f.ext.toUpperCase()} (best audio merged)`;
    if (seen.has(label)) continue;
    seen.add(label);
    formats.push({
      id: `${f.format_id}+bestaudio`,
      label,
      type: "video",
      ext: f.ext,
      height: f.height,
      filesize: null,
      merge: true,
    });
  }

  // Audio-only presets
  const audioPresets = [
    { quality: "320", label: "MP3 320kbps", ext: "mp3" },
    { quality: "192", label: "MP3 192kbps", ext: "mp3" },
    { quality: "128", label: "MP3 128kbps", ext: "mp3" },
    { quality: "0", label: "M4A best quality", ext: "m4a" },
  ];

  for (const preset of audioPresets) {
    formats.push({
      id: `audio-${preset.quality}-${preset.ext}`,
      label: preset.label,
      type: "audio",
      ext: preset.ext,
      quality: preset.quality,
      filesize: null,
    });
  }

  return formats.filter((f) => f.height !== 0 || f.type === "audio");
}

module.exports = router;
