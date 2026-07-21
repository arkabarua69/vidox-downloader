import { downloadYtDlp, runYtDlp, COOKIES_PATH, ensureCookies, getProxyArgs, getServerCookies } from "./_lib/yt-dlp.js";
import { rateLimit, getClientIp } from "./_lib/rate-limit.js";
import { getDirectStreamUrl, extractVideoId } from "./_lib/innertube.js";
import { getCached, setCache } from "./_lib/cache.js";
import fs from "fs";

function parseNetscapeCookies(raw) {
  if (!raw) return null;
  return raw.split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const parts = l.split("\t");
      if (parts.length >= 7) return `${parts[5]}=${parts[6]}`;
      return null;
    })
    .filter(Boolean)
    .join("; ");
}

function writeUserCookies(raw) {
  try {
    fs.writeFileSync("/tmp/user_cookies.txt", raw, "utf-8");
    return "/tmp/user_cookies.txt";
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Cookies");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 15, 60000);
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  if (!rl.allowed) {
    return res.status(429).json({ error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` });
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch { body = {}; }
  }
  const { url, formatId, quality } = body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  let parsedUrl;
  try { parsedUrl = new URL(url.trim()); } catch { return res.status(400).json({ error: "Invalid URL" }); }
  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
  const allowed = ["youtube.com", "youtu.be", "youtube-nocookie.com", "tiktok.com", "vm.tiktok.com", "instagram.com", "twitter.com", "x.com", "facebook.com", "fb.watch", "reddit.com", "redd.it", "twitch.tv", "vimeo.com", "soundcloud.com", "pinterest.com", "dailymotion.com", "streamable.com", "bandcamp.com", "tumblr.com", "bluesky.app", "threads.net"];
  if (!allowed.some((d) => host === d || host.endsWith("." + d))) {
    return res.status(400).json({ error: "Unsupported URL." });
  }

  const cleanUrl = url.trim();
  const isYouTube = host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com";

  await downloadYtDlp();

  let userCookieRaw = null;
  const userCookiesHeader = req.headers["x-user-cookies"];
  if (userCookiesHeader) {
    try {
      const decoded = Buffer.from(userCookiesHeader, "base64").toString("utf-8");
      if (decoded.includes("youtube.com") && decoded.includes("\t")) {
        userCookieRaw = decoded;
      } else {
        userCookieRaw = userCookiesHeader;
      }
    } catch {}
  }

  const PRENIV_API = "https://prenivapi.vercel.app/api/youtube?url=";
  if (isYouTube) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(PRENIV_API + encodeURIComponent(cleanUrl), {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36" },
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.status && data.data) {
          const videoFormats = data.data.downloads?.video || [];
          const audioFormats = data.data.downloads?.audio || [];
          let chosenUrl = null;
          if (quality === "audio" && audioFormats.length > 0) {
            chosenUrl = audioFormats[0].url;
          } else if (videoFormats.length > 0) {
            chosenUrl = videoFormats[0].url;
          }
          if (chosenUrl) {
            const result = { downloadUrl: chosenUrl, fileName: "download.mp4", source: "preniv" };
            const cacheKey = "stream:" + cleanUrl + ":" + (formatId || quality || "best");
            setCache(cacheKey, result, 30 * 60 * 1000);
            return res.json(result);
          }
        }
      }
    } catch {}
  }

  if (isYouTube) {
    let cookieHeader = null;
    if (userCookieRaw) {
      cookieHeader = parseNetscapeCookies(userCookieRaw);
    } else {
      try {
        const raw = getServerCookies();
        if (raw) cookieHeader = parseNetscapeCookies(raw);
      } catch {}
    }

    try {
      const cacheKey = `stream:${url.trim()}:${formatId || quality || "best"}`;
      const cached = getCached(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }

      const videoId = extractVideoId(cleanUrl);
      if (videoId) {
        const stream = await getDirectStreamUrl(videoId, cookieHeader);
        let chosen = null;

        if (formatId && formatId.startsWith("combined_")) {
          const itag = parseInt(formatId.replace("combined_", ""));
          chosen = stream.formats.all.find((f) => f.itag === itag && f.type === "combined");
        } else if (formatId && formatId.startsWith("video_")) {
          const itag = parseInt(formatId.replace("video_", ""));
          chosen = stream.formats.all.find((f) => f.itag === itag && f.type === "adaptive");
        } else if (formatId && formatId.startsWith("audio_")) {
          const itag = parseInt(formatId.replace("audio_", ""));
          chosen = stream.formats.all.find((f) => f.itag === itag && f.type === "adaptive");
        } else if (quality === "audio") {
          chosen = stream.formats.bestAudio;
        } else {
          chosen = stream.formats.bestCombined;
        }

        if (chosen && chosen.url) {
          const result = { downloadUrl: chosen.url, fileName: "download.mp4", source: "innertube" };
          setCache(cacheKey, result, 30 * 60 * 1000);
          res.setHeader("X-Cache", "MISS");
          return res.json(result);
        }
      }
    } catch {}
  }

  let ytDlpCookiePath = COOKIES_PATH;
  if (userCookieRaw) {
    const userPath = writeUserCookies(userCookieRaw);
    if (userPath) ytDlpCookiePath = userPath;
  }

  function getArgs(fmt, useCookies = false) {
    let args = [
      "--no-warnings", "--no-playlist",
      "--no-check-certificates",
      "--geo-bypass",
      "--get-url",
    ];
    if (useCookies) args.push("--cookies", ytDlpCookiePath);
    if (fmt === "audio") args.push("-f", "bestaudio[ext=m4a]/bestaudio");
    else if (fmt === "best") args.push("-f", "best[ext=mp4]/best");
    else if (fmt === "720") args.push("-f", "best[height<=720][ext=mp4]/best[height<=720]");
    else if (fmt) args.push("-f", `${fmt}[acodec!=none]/${fmt}/best`);
    else args.push("-f", "best[height<=720][ext=mp4]/best[height<=720]");
    args.push(cleanUrl);
    return args;
  }

  const formats = formatId ? [formatId, `${formatId}[acodec!=none]`, "best", null] : [quality, "best", null];
  let downloadUrl = null;

  ensureCookies();
  for (const fmt of formats) {
    if (downloadUrl) break;
    try {
      const { stdout } = await runYtDlp(getArgs(fmt, true), 25000);
      const lines = stdout.trim().split("\n").filter((l) => l.startsWith("http"));
      if (lines.length > 0) downloadUrl = lines[0];
    } catch { continue; }
  }

  if (!downloadUrl) {
    for (const fmt of formats) {
      if (downloadUrl) break;
      try {
        const { stdout } = await runYtDlp(getArgs(fmt, false), 25000);
        const lines = stdout.trim().split("\n").filter((l) => l.startsWith("http"));
        if (lines.length > 0) downloadUrl = lines[0];
      } catch { continue; }
    }
  }

  if (!downloadUrl) {
    try {
      const proxyArgs = await getProxyArgs();
      for (const fmt of formats) {
        if (downloadUrl) break;
        try {
          const { stdout } = await runYtDlp([...getArgs(fmt, false), ...proxyArgs], 25000);
          const lines = stdout.trim().split("\n").filter((l) => l.startsWith("http"));
          if (lines.length > 0) downloadUrl = lines[0];
        } catch { continue; }
      }
    } catch {}
  }

  if (!downloadUrl) {
    try {
      const proxyArgs = await getProxyArgs();
      ensureCookies();
      for (const fmt of formats) {
        if (downloadUrl) break;
        try {
          const { stdout } = await runYtDlp([...getArgs(fmt, true), ...proxyArgs], 25000);
          const lines = stdout.trim().split("\n").filter((l) => l.startsWith("http"));
          if (lines.length > 0) downloadUrl = lines[0];
        } catch { continue; }
      }
    } catch {}
  }

  if (downloadUrl) {
    const result = { downloadUrl, fileName: "download.mp4" };
    res.setHeader("X-Cache", "MISS");
    return res.json(result);
  }

  return res.status(500).json({ error: "Could not get download link." });
}
