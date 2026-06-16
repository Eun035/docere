// Vercel serverless entry point for POST /api/analyze
// Re-uses the Express app defined in ../server.ts (the route handler matches /api/analyze).
import app from "../server.js";

export default app;

export const config = {
  api: {
    bodyParser: false, // Express handles its own body parsing
  },
};
