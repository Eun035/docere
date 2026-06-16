// Vercel serverless entry point for POST /api/payment/confirm
// Re-uses the Express app defined in ../../server.ts.
import app from "../../server.js";

export default app;

export const config = {
  api: {
    bodyParser: false,
  },
};
