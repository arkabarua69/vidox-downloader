import { rateLimit, getClientIp } from "./_lib/rate-limit.js";
import { searchVideos, getTrendingVideos, getRelatedVideos } from "./_lib/youtube-api.js";
import { getCached, setCache } from "./_lib/cache.js";
const { default: ytdl } = await import("@distube/ytdl-core");

const PRENIV_API = "https://prenivapi.vercel.app/api/youtube?url=";

async function fetchViaPrenivApi(videoUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${PRENIV_API}${encodeURIComponent(videoUrl)}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36",
      },
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`PrenivApi returned ${response.status}`);
    const data = await response.json();
    if (!data.status) throw new Error("PrenivApi returned status false");
    return data.data;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function fetchYouTubeMetadata(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY || "";
  if (!apiKey) return null;
  try {
    const params = new URLSearchParams({ part: "snippet,contentDetails,statistics", id: videoId, key: apiKey });
    const data = await fetchJson(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    if (!data.items || data.items.length === 0) return null;
    const item = data.items[0];
    const snippet = item.snippet || {};
    const stats = item.statistics || {};
    const details = item.contentDetails || {};
    const duration = parseISO8601Duration(details.duration);
    let channelThumbnail = "";
    try {
      const chParams = new URLSearchParams({ part: "snippet", id: snippet.channelId || "", key: apiKey });
      const chData = await fetchJson(`https://www.googleapis.com/youtube/v3/channels?${chParams}`);
      if (chData.items && chData.items[0]) channelThumbnail = chData.items[0].snippet?.thumbnails?.default?.url || "";
    } catch {}
    return {
      title: snippet.title || "",
      uploader: snippet.channelTitle || "",
      channelId: snippet.channelId || "",
      channelThumbnail,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      upload_date: (snippet.publishedAt || "").replace(/-/g, "").slice(0, 8),
      view_count: parseInt(stats.viewCount || "0"),
      description: (snippet.description || "").substring(0, 2000),
      duration: parseISO8601DurationRaw(details.duration),
      duration_string: duration,
    };
  } catch (e) {
    return null;
  }
}

function parseISO8601Duration(iso) {
  if (!iso) return "0:00";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "0:00";
  const h = parseInt(m[1] || "0"), min = parseInt(m[2] || "0"), s = parseInt(m[3] || "0");
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

function parseISO8601DurationRaw(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] || "0") * 3600 + parseInt(m[2] || "0") * 60 + parseInt(m[3] || "0");
}

function extractIdFromUrl(url) {
  try {
    const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    const pathMatch = url.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (pathMatch) return pathMatch[1];
    const shortPath = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortPath) return shortPath[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
    return "unknown";
  } catch { return "unknown"; }
}

async function fetchRelatedWithCache(videoId, title, channelId) {
  const relatedCacheKey = `related:${videoId}`;
  let related = getCached(relatedCacheKey);
  if (related) return related;
  try {
    related = await getRelatedVideos(videoId, title || "", channelId || "", 12);
    if (related && related.length > 0) setCache(relatedCacheKey, related, 2 * 60 * 60 * 1000);
    return related || [];
  } catch { return []; }
}

function buildResult(videoId, prenivData, ytMeta) {
  const videoFormats = prenivData.downloads?.video || [];
  const audioFormats = prenivData.downloads?.audio || [];
  const bestVideo = videoFormats[0];

  return {
    id: videoId,
    title: prenivData.title || ytMeta?.title || "Untitled",
    thumbnail: prenivData.thumbnail || ytMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    duration: ytMeta?.duration || 0,
    duration_string: ytMeta?.duration_string || "",
    uploader: prenivData.author || ytMeta?.uploader || "Unknown",
    channelId: ytMeta?.channelId || "",
    channelThumbnail: ytMeta?.channelThumbnail || "",
    upload_date: ytMeta?.upload_date || "",
    view_count: ytMeta?.view_count || 0,
    description: ytMeta?.description || "",
    source: "preniv",
    hlsUrl: "",
    streamUrl: bestVideo?.url || "",
    audioUrl: audioFormats[0]?.url || "",
    relatedVideos: [],
    formats: [
      ...videoFormats.map((f, i) => ({
        formatId: `preniv_video_${i}`,
        ext: f.format || "mp4",
        resolution: f.quality || "auto",
        fps: null,
        vcodec: "h264",
        acodec: "aac",
        filesize: 0,
        formatNote: "video_with_audio",
        qualityLabel: f.quality || "auto",
        tbr: 0,
        directUrl: f.url,
      })),
      ...audioFormats.map((f, i) => ({
        formatId: `preniv_audio_${i}`,
        ext: f.format || "mp3",
        resolution: "audio only",
        fps: null,
        vcodec: "none",
        acodec: "mp3",
        filesize: 0,
        formatNote: "audio",
        qualityLabel: f.quality || "128kbps",
        tbr: 0,
        directUrl: f.url,
      })),
    ],
  };
}

function buildResultFromYtdl(videoId, ytdlInfo, ytMeta) {
  const allFormats = ytdlInfo.formats || [];

  const combined = allFormats
    .filter((f) => f.url && f.qualityLabel && f.audioBitrate)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  const adaptiveVideo = allFormats
    .filter((f) => f.url && f.qualityLabel && !f.audioBitrate)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  const adaptiveAudio = allFormats
    .filter((f) => f.url && f.audioBitrate)
    .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

  const details = ytdlInfo.videoDetails || {};

  return {
    id: videoId,
    title: details.title || ytMeta?.title || "Untitled",
    thumbnail: details.thumbnail?.thumbnails?.[0]?.url || details.thumbnails?.[0]?.url || ytMeta?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    duration: details.lengthSeconds ? parseInt(details.lengthSeconds) : (ytMeta?.duration || 0),
    duration_string: ytMeta?.duration_string || "",
    uploader: details.author?.name || ytMeta?.uploader || "Unknown",
    channelId: details.author?.id || ytMeta?.channelId || "",
    channelThumbnail: ytMeta?.channelThumbnail || "",
    upload_date: ytMeta?.upload_date || "",
    view_count: details.viewCount ? parseInt(details.viewCount) : (ytMeta?.view_count || 0),
    description: ytMeta?.description || "",
    source: "ytdl",
    hlsUrl: "",
    streamUrl: combined[0]?.url || "",
    audioUrl: adaptiveAudio[0]?.url || "",
    relatedVideos: [],
    formats: [
      ...combined.map((f) => ({
        formatId: `ytdl_video_${f.itag}`,
        ext: f.container || "mp4",
        resolution: f.qualityLabel || "auto",
        fps: f.fps || null,
        vcodec: f.videoCodec || "h264",
        acodec: f.audioCodec || "aac",
        filesize: f.contentLength || f.content_length || 0,
        formatNote: "video_with_audio",
        qualityLabel: f.qualityLabel || "auto",
        tbr: f.averageBitrate || f.bitrate || 0,
        directUrl: f.url,
      })),
      ...adaptiveVideo.map((f) => ({
        formatId: `ytdl_avideo_${f.itag}`,
        ext: f.container || "mp4",
        resolution: f.qualityLabel || "auto",
        fps: f.fps || null,
        vcodec: f.videoCodec || "h264",
        acodec: "none",
        filesize: f.contentLength || f.content_length || 0,
        formatNote: "video_only",
        qualityLabel: f.qualityLabel || "auto",
        tbr: f.averageBitrate || f.bitrate || 0,
        directUrl: f.url,
      })),
      ...adaptiveAudio.map((f) => ({
        formatId: `ytdl_audio_${f.itag}`,
        ext: f.container || "m4a",
        resolution: "audio only",
        fps: null,
        vcodec: "none",
        acodec: f.audioCodec || "aac",
        filesize: f.contentLength || f.content_length || 0,
        formatNote: "audio",
        qualityLabel: f.audioBitrate ? `${f.audioBitrate}kbps` : "128kbps",
        tbr: f.averageBitrate || f.bitrate || 0,
        directUrl: f.url,
      })),
    ],
  };
}

async function handleVideoRequest(videoId, res) {
  const cacheKey = `info:${videoId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    if (!cached.relatedVideos || cached.relatedVideos.length === 0) {
      const related = await fetchRelatedWithCache(videoId, cached.title, cached.channelId);
      cached.relatedVideos = related;
      setCache(cacheKey, cached, 30 * 60 * 1000);
    }
    res.setHeader("X-Cache", "HIT");
    return res.json(cached);
  }

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const ytMetaPromise = fetchYouTubeMetadata(videoId).catch(() => null);

  const prenivPromise = fetchViaPrenivApi(ytUrl).catch((e) => {
    console.error("PRENIV_API_ERROR:", e.message);
    return null;
  });

  let ytdlInfoPromise = null;
  try {
    const origCwd = process.cwd();
    process.chdir("/tmp");
    ytdlInfoPromise = Promise.race([
      ytdl.getInfo(videoId).finally(() => process.chdir(origCwd)),
      new Promise((_, reject) => setTimeout(() => { process.chdir(origCwd); reject(new Error("ytdl timeout")); }, 12000)),
    ]).catch((e) => { process.chdir(origCwd); console.error("YTDLCORE_ERROR:", e.message); return null; });
  } catch (e) {
    ytdlInfoPromise = Promise.resolve(null);
  }

  const [prenivData, ytdlInfo, ytMeta] = await Promise.all([prenivPromise, ytdlInfoPromise, ytMetaPromise]);

  let result = null;
  let source = null;

  const ytdlResult = ytdlInfo && ytdlInfo.formats && ytdlInfo.formats.length > 0
    ? buildResultFromYtdl(videoId, ytdlInfo, ytMeta) : null;

  if (prenivData) {
    result = buildResult(videoId, prenivData, ytMeta);
    source = "preniv";
  } else if (ytdlResult?.streamUrl) {
    result = ytdlResult;
    source = "ytdl";
  } else if (ytMeta) {
    result = { id: videoId, ...ytMeta, source: "yt-api-only", hlsUrl: "", streamUrl: "", audioUrl: "", relatedVideos: [], formats: [] };
    source = "yt-api-only";
  }

  if (!result) return res.status(500).json({ error: "Failed to fetch video info." });

  const related = await fetchRelatedWithCache(videoId, result.title, ytMeta?.channelId || "");
  result.relatedVideos = related;

  setCache(cacheKey, result, 30 * 60 * 1000);
  res.setHeader("X-Cache", "MISS");
  res.setHeader("X-Source", source);
  return res.json(result);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, 30, 60000);
    res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
    if (!rl.allowed) {
      return res.status(429).json({ error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` });
    }

    if (req.method === "POST") {
      const { url: videoUrl } = req.body || {};
      if (!videoUrl) return res.status(400).json({ error: "URL is required in body" });
      const videoId = extractIdFromUrl(videoUrl.trim());
      if (videoId === "unknown") return res.status(400).json({ error: "Could not extract video ID from URL" });
      return handleVideoRequest(videoId, res);
    }

    const { url, action } = req.query;

    if (action === "search" || action === "trending") {
      if (action === "search") {
        if (!url || !url.trim()) return res.status(400).json({ error: "Search query required (use url param)" });
        const cacheKey = `yt:search:${url.trim()}`;
        const cached = getCached(cacheKey);
        if (cached) { res.setHeader("X-Cache", "HIT"); return res.json(cached); }
        try {
          const results = await searchVideos(url.trim());
          const response = { results };
          setCache(cacheKey, response, 30 * 60 * 1000);
          res.setHeader("X-Cache", "MISS");
          return res.json(response);
        } catch (e) {
          return res.json({ results: [] });
        }
      }
      if (action === "trending") {
        const cacheKey = "yt:trending";
        const cached = getCached(cacheKey);
        if (cached) { res.setHeader("X-Cache", "HIT"); return res.json(cached); }
        try {
          const results = await getTrendingVideos();
          const response = { results };
          setCache(cacheKey, response, 60 * 60 * 1000);
          res.setHeader("X-Cache", "MISS");
          return res.json(response);
        } catch (e) {
          return res.json({ results: [] });
        }
      }
    }

    if (!url) return res.status(400).json({ error: "URL is required" });
    const videoId = extractIdFromUrl(url.trim());
    if (videoId === "unknown") return res.status(400).json({ error: "Could not extract video ID from URL" });
    return handleVideoRequest(videoId, res);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Something went wrong." });
  }
}
