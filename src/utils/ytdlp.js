const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

/**
 * Resolve the yt-dlp binary path.
 *
 * On Linux (Render), hardcodes the pip-installed path so plugins are
 * auto-discovered. On Windows, falls back to bundled .exe or PATH.
 */
function getPath() {
  if (process.platform !== "win32") {
    const candidates = [
      "/opt/render/project/src/.venv/bin/yt-dlp",
      "/root/.local/bin/yt-dlp",
      "/usr/local/bin/yt-dlp",
      "/usr/bin/yt-dlp",
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    // Fall back to bundled binary
    const bundled = path.join(__dirname, "../../yt-dlp");
    if (fs.existsSync(bundled)) return bundled;
    return "yt-dlp";
  }
  const exe = path.join(__dirname, "../../yt-dlp.exe");
  if (fs.existsSync(exe)) return exe;
  return "yt-dlp.exe";
}

function getCookiesArgs() {
  const b64 = process.env.YOUTUBE_COOKIES_B64;
  if (!b64) return [];

  const cookiesPath = path.join(os.tmpdir(), "yt-cookies.txt");
  if (!fs.existsSync(cookiesPath)) {
    fs.writeFileSync(cookiesPath, Buffer.from(b64, "base64").toString("utf8"));
  }
  return ["--cookies", cookiesPath];
}

module.exports = { getPath, getCookiesArgs };
