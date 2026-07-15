import { downloadYtDlp, runYtDlp, COOKIES_PATH, ensureCookies, getProxyArgs } from "./_lib/yt-dlp.js";
import { rateLimit, getClientIp } from "./_lib/rate-limit.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 3, 60000);
  if (!rl.allowed) {
    return res.status(429).json({ error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` });
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch { body = {}; }
  }

  const { urls, quality } = body;
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: "No videos selected." });
  }
  if (urls.length > 50) {
    return res.status(400).json({ error: "Maximum 50 videos per batch." });
  }

  try {
    await downloadYtDlp();
    ensureCookies();
    const proxyArgs = await getProxyArgs();

    const results = [];
    const errors = [];

    for (const videoUrl of urls) {
      try {
        let args = [
          "--no-warnings", "--no-playlist",
          "--cookies", COOKIES_PATH,
          "--no-check-certificates", "--geo-bypass",
          "--get-url", ...proxyArgs,
        ];
        if (quality === "audio") args.push("-f", "bestaudio", "-x", "--audio-format", "mp3");
        else args.push("-f", "best[ext=mp4]/best");
        args.push(videoUrl);

        const { stdout } = await runYtDlp(args, 30000);
        const lines = stdout.trim().split("\n").filter((l) => l.startsWith("http"));
        if (lines.length > 0) {
          results.push({ url: videoUrl, downloadUrl: lines[0] });
        } else {
          errors.push({ url: videoUrl, error: "No download link found" });
        }
      } catch (e) {
        errors.push({ url: videoUrl, error: "Failed" });
      }
    }

    return res.json({ results, errors, total: urls.length, success: results.length, failed: errors.length });
  } catch (e) {
    return res.status(500).json({ error: "Failed to process playlist download." });
  }
}
