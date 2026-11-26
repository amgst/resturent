import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/app.js";

// Vercel serverless function: every /api/* request is routed here (see vercel.json).
// The app is built once per warm instance and reused.
const appPromise = createApp().then(({ app }) => app);

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  return app(req as any, res as any);
}
