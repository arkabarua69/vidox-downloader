import { downloadYtDlp, runYtDlp, COOKIES_PATH, ensureCookies, getProxyArgs } from "../_lib/yt-dlp.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await downloadYtDlp();
    ensureCookies();
    const proxyArgs = await getProxyArgs();

    // Test cookies against a known YouTube video
    const { stdout, stderr } = await runYtDlp([
      "--no-warnings", "--no-playlist",
      "--cookies", COOKIES_PATH,
      "--dump-json", "--no-download",
      ...proxyArgs,
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ], 30000);

    const info = JSON.parse(stdout);
    const cookiesValid = !!(info.title && info.id);

    return res.json({
      status: "ok",
      cookiesValid,
      videoTitle: info.title || null,
      message: cookiesValid ? "Cookies are valid and working" : "Cookies may be expired",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const msg = (e.message || "").toLowerCase();
    const isAuthError = msg.includes("login") || msg.includes("sign in") || msg.includes("cookies") || msg.includes("bot");

    return res.json({
      status: isAuthError ? "expired" : "error",
      cookiesValid: false,
      message: isAuthError ? "Cookies have expired and need to be refreshed" : "Health check failed",
      error: e.message,
      timestamp: new Date().toISOString(),
    });
  }
}
