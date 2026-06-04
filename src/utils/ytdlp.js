const path = require("node:path");
const fs = require("node:fs");

/**
 * Resolve the yt-dlp binary path.
 *
 * On Vercel (or any deployment that bundles the binary at the project root),
 * the bundled copy is preferred. Falls back to whatever is on PATH.
 */
function getPath() {
  const bundled = path.join(__dirname, "../../yt-dlp");
  if (fs.existsSync(bundled)) return bundled;
  return "yt-dlp";
}

module.exports = { getPath };
