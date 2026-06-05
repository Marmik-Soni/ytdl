const path = require("node:path");
const fs = require("node:fs");

const os = require("node:os");

/**
 * Resolve the yt-dlp binary path.
 *
 * On Vercel (or any deployment that bundles the binary at the project root),
 * the bundled copy is preferred. Falls back to whatever is on PATH.
 */
function getPath() {
  const isWindows = process.platform === "win32";

  if (isWindows) {
    const exe = path.join(__dirname, "../../yt-dlp.exe");
    if (fs.existsSync(exe)) return exe;
    return "yt-dlp.exe";
  }

  const bundled = path.join(__dirname, "../../yt-dlp");
  if (fs.existsSync(bundled)) return bundled;
  return "yt-dlp";
}

function getCookiesArgs() {
  const b64 = process.env.YOUTUBE_COOKIES_B64;
  if (!b64) return [];

  const cookiesPath = path.join(os.tmpdir(), "yt-cookies.txt");
  if (!fs.existsSync(cookiesPath)) {
    fs.writeFileSync(cookiesPath, Buffer.from(b64, "base64").toString("utf8"));
  }
  const pluginsDir = path.join(__dirname, "../../yt-dlp-plugins");

  return [
    "--cookies", cookiesPath,
    "--plugin-dirs", pluginsDir,
  ];
}

module.exports = { getPath, getCookiesArgs };
