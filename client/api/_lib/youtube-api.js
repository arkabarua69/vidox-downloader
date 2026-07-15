import https from "https";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.kavin.rocks",
  "https://api.piped.yt",
  "https://watchapi.whatever.social",
  "https://piped-api.lunar.icu",
  "https://pipedapi.in.projectsegfau.lt",
];

function fetchJson(url, options = {}) {
  const timeout = options.timeout || 10000;
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: options.headers || {},
      timeout,
    };
    const req = https.get(reqOptions, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          if (data.error) reject(new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error)));
          else resolve(data);
        } catch (e) {
          reject(new Error("Failed to parse JSON response"));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function getApiKey() {
  return process.env.YOUTUBE_API_KEY || process.env.youtube_api_key || "";
}

function formatDuration(secs) {
  if (!secs || secs === 0) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(n) {
  if (!n) return "";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B views";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M views";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K views";
  return n + " views";
}

function formatPublishedAt(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWk = Math.floor(diffDay / 7);
  const diffMon = Math.floor(diffDay / 30);
  const diffYr = Math.floor(diffDay / 365);
  if (diffYr > 0) return `${diffYr} year${diffYr > 1 ? "s" : ""} ago`;
  if (diffMon > 0) return `${diffMon} month${diffMon > 1 ? "s" : ""} ago`;
  if (diffWk > 0) return `${diffWk} week${diffWk > 1 ? "s" : ""} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  return "Just now";
}

function formatPublishedISO(iso) {
  if (!iso) return "";
  try { return iso.replace(/-/g, "").slice(0, 8); } catch { return ""; }
}

function extractPipedVideoId(url) {
  if (!url) return "";
  const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "";
}

function normalizePipedResult(item) {
  const videoId = extractPipedVideoId(item.url) || "";
  return {
    id: videoId,
    title: item.title || "",
    channel: item.uploaderName || "",
    channelThumbnail: item.uploaderAvatar || "",
    views: formatViews(item.views),
    time: formatPublishedAt(item.uploaded),
    duration: formatDuration(item.duration),
    thumbnail: item.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    description: (item.shortDescription || "").substring(0, 200),
    type: "video",
  };
}

async function pipedSearch(query, maxResults = 20) {
  const params = new URLSearchParams({ q: query, filter: "videos" });
  for (const base of PIPED_INSTANCES) {
    try {
      const data = await fetchJson(`${base}/search?${params}`);
      const items = (data.items || []).filter((i) => i.type === "stream" || i.url?.includes("/watch")).slice(0, maxResults);
      if (items.length > 0) return items.map(normalizePipedResult);
    } catch {}
  }
  return [];
}

async function pipedRelated(videoId, maxResults = 20) {
  for (const base of PIPED_INSTANCES) {
    try {
      const data = await fetchJson(`${base}/streams/${videoId}`);
      const items = (data.relatedStreams || []).filter((i) => i.type === "stream").slice(0, maxResults);
      if (items.length > 0) return items.map(normalizePipedResult);
    } catch {}
  }
  return [];
}

async function fetchChannelAvatars(channelIds, apiKey) {
  const unique = [...new Set(channelIds.filter(Boolean))];
  if (unique.length === 0) return {};
  const params = new URLSearchParams({ part: "snippet", id: unique.join(","), key: apiKey });
  const data = await fetchJson(`${YOUTUBE_API_BASE}/channels?${params}`);
  const map = {};
  for (const ch of data.items || []) {
    map[ch.id] = ch.snippet?.thumbnails?.default?.url || ch.snippet?.thumbnails?.medium?.url || "";
  }
  return map;
}

async function ytApiSearch(query, maxResults = 20) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No YouTube API key");

  const params = new URLSearchParams({ part: "snippet", q: query, type: "video", maxResults: String(maxResults), order: "relevance", key: apiKey });
  const data = await fetchJson(`${YOUTUBE_API_BASE}/search?${params}`);
  if (!data.items || data.items.length === 0) return [];

  const videoIds = data.items.map((i) => i.id.videoId).join(",");
  const statsParams = new URLSearchParams({ part: "contentDetails,statistics", id: videoIds, key: apiKey });
  const statsData = await fetchJson(`${YOUTUBE_API_BASE}/videos?${statsParams}`);
  const statsMap = {};
  for (const item of statsData.items || []) {
    statsMap[item.id] = { duration: parseISO8601Duration(item.contentDetails?.duration), viewCount: item.statistics?.viewCount };
  }

  const channelIds = data.items.map((i) => i.snippet?.channelId);
  const avatarMap = await fetchChannelAvatars(channelIds, apiKey);

  return data.items.map((item) => {
    const id = item.id.videoId;
    const stats = statsMap[id] || {};
    const channelId = item.snippet?.channelId || "";
    return {
      id,
      title: item.snippet?.title || "",
      channel: item.snippet?.channelTitle || "",
      channelId,
      channelThumbnail: avatarMap[channelId] || "",
      views: stats.viewCount ? formatViews(Number(stats.viewCount)) : "",
      time: formatPublishedAtItem(item.snippet?.publishedAt),
      duration: stats.duration || "",
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
      description: (item.snippet?.description || "").substring(0, 200),
      type: "video",
    };
  });
}

export async function searchVideos(query, maxResults = 20) {
  try {
    const results = await pipedSearch(query, maxResults);
    if (results.length > 0) return results;
  } catch (e) {
    console.error("PIPED_SEARCH_FALLBACK:", e.message);
  }

  try {
    return await ytApiSearch(query, maxResults);
  } catch (e) {
    console.error("YT_API_SEARCH_ERROR:", e.message);
    throw e;
  }
}

export async function getTrendingVideos(regionCode = "US", maxResults = 20) {
  for (const base of PIPED_INSTANCES) {
    try {
      const data = await fetchJson(`${base}/trending?region=${regionCode}`);
      const items = (Array.isArray(data) ? data : data.items || []).filter((i) => (i.type === "stream" || i.url?.includes("/watch")) && i.duration > 0);
      if (items.length > 0) return items.slice(0, maxResults).map(normalizePipedResult);
    } catch {}
  }

  const apiKey = getApiKey();
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured");

  const params = new URLSearchParams({ part: "snippet,contentDetails,statistics", chart: "mostPopular", regionCode, maxResults: String(maxResults), key: apiKey });
  const data = await fetchJson(`${YOUTUBE_API_BASE}/videos?${params}`);

  const channelIds = (data.items || []).map((i) => i.snippet?.channelId);
  const avatarMap = await fetchChannelAvatars(channelIds, apiKey);

  return (data.items || []).map((item) => {
    const views = item.statistics?.viewCount ? formatViews(Number(item.statistics.viewCount)) : "";
    const channelId = item.snippet?.channelId || "";
    return {
      id: item.id,
      title: item.snippet?.title || "",
      channel: item.snippet?.channelTitle || "",
      channelId,
      channelThumbnail: avatarMap[channelId] || "",
      views,
      time: formatPublishedAtItem(item.snippet?.publishedAt),
      duration: parseISO8601Duration(item.contentDetails?.duration) || "",
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
      description: (item.snippet?.description || "").substring(0, 200),
      type: "video",
    };
  });
}

function parseISO8601Duration(iso) {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPublishedAtItem(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWk = Math.floor(diffDay / 7);
  const diffMon = Math.floor(diffDay / 30);
  const diffYr = Math.floor(diffDay / 365);
  if (diffYr > 0) return `${diffYr} year${diffYr > 1 ? "s" : ""} ago`;
  if (diffMon > 0) return `${diffMon} month${diffMon > 1 ? "s" : ""} ago`;
  if (diffWk > 0) return `${diffWk} week${diffWk > 1 ? "s" : ""} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  return "Just now";
}

export async function getRelatedVideos(videoId, title, channelId, maxResults = 12) {
  try {
    const results = await pipedRelated(videoId, maxResults);
    if (results.length > 0) return results;
  } catch {}

  try {
    const keywords = title.replace(/[|\-–—:]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 3).join(" ");
    const query = keywords || title;
    const results = await pipedSearch(query, maxResults + 5);
    const filtered = results.filter((r) => r.id !== videoId);
    if (filtered.length > 0) return filtered.slice(0, maxResults);
  } catch {}

  const apiKey = getApiKey();
  if (!apiKey) return [];

  try {
    const keywords = title.replace(/[|\-–—:]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 3).join(" ");
    const query = keywords || title;

    const params = new URLSearchParams({ part: "snippet", q: query, type: "video", maxResults: String(Math.min(maxResults + 5, 25)), order: "relevance", key: apiKey });
    const data = await fetchJson(`${YOUTUBE_API_BASE}/search?${params}`);
    let items = (data.items || []).filter((i) => i.id.videoId !== videoId);

    if (items.length < maxResults && channelId) {
      try {
        const chParams = new URLSearchParams({ part: "snippet", q: query, type: "video", maxResults: String(maxResults - items.length + 3), order: "date", key: apiKey, channelId });
        const chData = await fetchJson(`${YOUTUBE_API_BASE}/search?${chParams}`);
        const existing = new Set(items.map((i) => i.id.videoId));
        for (const chItem of chData.items || []) {
          if (chItem.id.videoId !== videoId && !existing.has(chItem.id.videoId)) items.push(chItem);
        }
      } catch {}
    }

    items = items.slice(0, maxResults);
    if (items.length === 0) return [];

    const videoIds = items.map((i) => i.id.videoId).join(",");
    const statsParams = new URLSearchParams({ part: "contentDetails,statistics", id: videoIds, key: apiKey });
    const statsData = await fetchJson(`${YOUTUBE_API_BASE}/videos?${statsParams}`);
    const statsMap = {};
    for (const item of statsData.items || []) {
      statsMap[item.id] = { duration: parseISO8601Duration(item.contentDetails?.duration), viewCount: item.statistics?.viewCount };
    }

    const channelIds = items.map((i) => i.snippet?.channelId);
    const avatarMap = await fetchChannelAvatars(channelIds, apiKey);

    return items.map((item) => {
      const id = item.id.videoId;
      const stats = statsMap[id] || {};
      const chId = item.snippet?.channelId || "";
      return {
        id,
        title: item.snippet?.title || "",
        channel: item.snippet?.channelTitle || "",
        channelThumbnail: avatarMap[chId] || "",
        views: stats.viewCount ? formatViews(Number(stats.viewCount)) : "",
        time: formatPublishedAtItem(item.snippet?.publishedAt),
        duration: stats.duration || "",
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
      };
    });
  } catch (e) {
    console.error("RELATED_VIDEOS_ERROR:", e.message);
    return [];
  }
}
