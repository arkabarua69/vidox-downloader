import { downloadYtDlp, runYtDlp, COOKIES_PATH, ensureCookies, getProxyArgs, EMBEDDED_COOKIES } from "../_lib/yt-dlp.js";
import fs from "fs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Only allow POST with a secret key for security
  const { secret } = req.method === "POST" ? (req.body || {}) : (req.query || {});
  if (secret !== process.env.COOKIE_REFRESH_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await downloadYtDlp();
    ensureCookies();
    const proxyArgs = await getProxyArgs();

    // Test current cookies
    let cookiesValid = false;
    try {
      const { stdout } = await runYtDlp([
        "--no-warnings", "--no-playlist",
        "--cookies", COOKIES_PATH,
        "--dump-json", "--no-download",
        ...proxyArgs,
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      ], 30000);
      const info = JSON.parse(stdout);
      cookiesValid = !!(info.title && info.id);
    } catch {
      cookiesValid = false;
    }

    if (cookiesValid) {
      return res.json({
        status: "healthy",
        message: "Cookies are still valid",
        timestamp: new Date().toISOString(),
      });
    }

    // Cookies expired — return status so user knows to update
    return res.json({
      status: "expired",
      message: "Cookies have expired. Please update EMBEDDED_COOKIES in api/_lib/yt-dlp.js and redeploy.",
      action: "UPDATE_COOKIES",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: e.message,
      timestamp: new Date().toISOString(),
    });
  }
}
