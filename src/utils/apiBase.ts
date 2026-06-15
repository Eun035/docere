/**
 * When the SPA runs in a browser hosted on the same origin as the Express
 * server (Vite dev or Vercel prod), relative URLs work fine and `API_BASE`
 * is empty.
 *
 * When the SPA is bundled into a Capacitor native shell, `window.location.origin`
 * becomes `https://localhost` (Android) or `capacitor://localhost` (iOS) — there
 * is no backend on that origin. Set `VITE_API_BASE_URL` at build time to the
 * deployed Vercel URL so requests are routed correctly.
 */
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
export const API_BASE: string = String(RAW_BASE).replace(/\/+$/, "");

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) path = "/" + path;
  return API_BASE ? `${API_BASE}${path}` : path;
}
