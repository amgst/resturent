import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Android app loads the running server (web + API) from CAP_SERVER_URL.
 * This keeps every `/api/...` call working unchanged, and server updates
 * reach the app without reinstalling.
 *
 * Examples (set before `npx cap sync android`):
 *   Emulator on this PC:   http://10.0.2.2:5000   (default)
 *   Phone on same Wi-Fi:   http://192.168.1.50:5000  (your PC's local IP)
 *   Live server:           https://your-domain.com
 */
const serverUrl = process.env.CAP_SERVER_URL || "http://10.0.2.2:5000";

const config: CapacitorConfig = {
  appId: "com.restaurantpos.app",
  appName: "Restaurant POS",
  // Built web files; bundled as a fallback, the live server is used at runtime.
  webDir: "dist/public",
  server: {
    url: serverUrl,
    // Plain http is only allowed for local testing addresses.
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;
