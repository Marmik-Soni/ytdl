const app = require("./app");
const config = require("./config");

const server = app.listen(config.port, () => {
  console.log(`✅ ytdl running on http://localhost:${config.port}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`\n⏹  ${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log("👋 Server closed.");
    process.exit(0);
  });

  // Force-kill if shutdown takes too long
  setTimeout(() => {
    console.error("⚠  Forced shutdown after timeout.");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
