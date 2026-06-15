import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the Vite build (`dist/`) into a native Android shell.
 *
 * Build flow:
 *   1. `npm run build`        — emit dist/ with VITE_API_BASE_URL baked in
 *   2. `npm run cap:sync`     — copy dist/ into android/app/src/main/assets
 *   3. `npm run cap:open`     — open the project in Android Studio
 *   4. Android Studio → Build → Generate Signed App Bundle → .aab
 *
 * The bundled WebView serves the SPA from https://localhost (Android default
 * `androidScheme`), and the SPA calls back to the Vercel-hosted /api/* for
 * Gemini / Toss / quota. CORS on the Express server allows that origin.
 */
const config: CapacitorConfig = {
  appId: "com.jey.docere",
  appName: "Verbum Vitae",
  webDir: "dist",

  // Use https scheme so localStorage, getUserMedia (camera), Web Share API,
  // and Web Crypto are all treated as a secure context inside the WebView.
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // toggle off before a public release
  },

  // The Webview's window.location.origin will be `https://localhost`. The
  // Express CORS allow-list explicitly includes this so /api/* calls work.
  server: {
    androidScheme: "https",
    // Uncomment to live-reload from a dev machine while debugging on device:
    // url: "http://<your-laptop-LAN-ip>:3000",
    // cleartext: true,
  },
};

export default config;
