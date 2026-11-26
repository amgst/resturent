import type { IncomingMessage, ServerResponse } from "http";

// Vercel serverless function: every /api/* request is routed here (see vercel.json).
// The app is built once per warm instance and reused.
// It's loaded with a dynamic import so a startup problem (e.g. a missing
// Firebase credentials) is reported as a clear JSON error instead of crashing the function.
const appPromise = import("../server/app.js").then(({ createApp }) => createApp()).then(({ app }) => app);
// Mark as handled here; the error is reported per request below.
appPromise.catch(() => {});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  let app;
  try {
    app = await appPromise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Server failed to start:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: `Server failed to start: ${message}` }));
    return;
  }
  return app(req as any, res as any);
}
