/**
 * Vercel serverless entry point.
 *
 * This thin wrapper re-exports the Express app so Vercel's @vercel/node
 * builder can pick it up as a serverless function. All logic lives in src/.
 */
const app = require("../src/app");

module.exports = app;
