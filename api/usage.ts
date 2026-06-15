// Vercel serverless entry point for GET /api/usage
// Re-uses the Express app defined in ../server.ts (the route handler matches /api/usage).
import app from "../server";

export default app;

export const config = {
  api: {
    bodyParser: false,
  },
};
