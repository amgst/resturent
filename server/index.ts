import express from "express";
import path from "path";
import { createApp } from "./app.js";
import { setupVite, serveStatic, log } from "./vite.js";

(async () => {
  const { app, server } = await createApp();

  app.use("/assets", express.static(path.resolve(import.meta.dirname, "..", "attached_assets")));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions: any = {
    port,
    host: "0.0.0.0",
  };

  // reusePort is not supported on Windows
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();
