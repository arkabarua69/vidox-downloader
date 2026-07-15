import { downloadYtDlp, runYtDlp, parseInfo, COOKIES_PATH, ensureCookies, getProxyArgs } from "./_lib/yt-dlp.js";
import { rateLimit, getClientIp } from "./_lib/rate-limit.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 5, 60000);
  if (!rl.allowed) {
    return res.status(429).json({ error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` });
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  let parsedUrl;
  try { parsedUrl = new URL(url.trim()); } catch { return res.status(400).json({ error: "Invalid URL" }); }
  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
  const allowed = ["youtube.com", "youtu.be", "youtube-nocookie.com"];
  if (!allowed.some((d) => host === d || host.endsWith("." + d))) {
    return res.status(400).json({ error: "Playlists are only supported for YouTube." });
  }

  try {
    await downloadYtDlp();
    ensureCookies();
    const proxyArgs = await getProxyArgs();

    const { stdout } = await runYtDlp([
      "--no-warnings", "--flat-playlist", "--dump-json",
      "--cookies", COOKIES_PATH, ...proxyArgs, url.trim()
    ], 55000);

    const lines = stdout.trim().split("\n").filter(Boolean);
    const videos = lines.map((line) => {
      try {
        const info = JSON.parse(line);
        return {
          id: info.id,
          title: info.title || "Untitled",
          thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || "",
          duration: info.duration || 0,
          duration_string: info.duration_string || "",
          uploader: info.uploader || info.channel || "",
          url: info.url || info.webpage_url || `https://www.youtube.com/watch?v=${info.id}`,
        };
      } catch { return null; }
    }).filter(Boolean);

    if (videos.length === 0) {
      return res.status(404).json({ error: "No videos found in this playlist." });
    }

    const playlistTitle = videos[0]?.uploader ? `${videos[0].uploader} Playlist` : "YouTube Playlist";

    return res.json({
      title: playlistTitle,
      count: videos.length,
      videos,
    });
  } catch (e) {
    const msg = (e.message || "").toLowerCase();
    if (msg.includes("login") || msg.includes("sign in") || msg.includes("private"))
      return res.status(401).json({ error: "This playlist is private. Add cookies in Settings.", needsAuth: true });
    if (msg.includes("not a valid") || msg.includes("is not"))
      return res.status(400).json({ error: "This doesn't appear to be a playlist. Try a YouTube playlist URL." });
    return res.status(500).json({ error: "Failed to fetch playlist. Try a different link." });
  }
}
