import { sanitizeError } from "./errors";
import type { VideoInfo, PlaylistInfo, Summary, Format } from "./types";

const USER_COOKIES_KEY = "vidox_user_cookies";

export function getUserCookies(): string | null {
  try {
    return localStorage.getItem(USER_COOKIES_KEY);
  } catch { return null; }
}

export function setUserCookies(cookies: string) {
  localStorage.setItem(USER_COOKIES_KEY, cookies);
}

export function clearUserCookies() {
  localStorage.removeItem(USER_COOKIES_KEY);
}

function getCookieHeader(): string | undefined {
  const raw = getUserCookies();
  if (!raw) return undefined;
  try {
    return btoa(raw);
  } catch { return undefined; }
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const cookieB64 = getCookieHeader();
  if (cookieB64) h["X-User-Cookies"] = cookieB64;
  return h;
}

// Client-side cache for GET requests (reduces repeat fetches)
const clientCache = new Map<string, { data: any; expires: number }>();

function getCached<T>(key: string): T | null {
  const item = clientCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    clientCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setClientCache(key: string, data: any, ttlMs: number) {
  if (clientCache.size > 100) {
    const oldest = clientCache.keys().next().value;
    clientCache.delete(oldest);
  }
  clientCache.set(key, { data, expires: Date.now() + ttlMs });
}

// Pending request deduplication - prevents duplicate in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

async function deduplicatedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) return pending as T;

  const promise = fetcher().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

export interface SearchResult {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  channelThumbnail?: string;
  views: string;
  time: string;
  duration: string;
  thumbnail: string;
  description: string;
  type?: "video" | "channel" | "playlist";
  subscriberCount?: string;
  videoCount?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  continuationToken?: string;
}

export interface YouTubePlaylist {
  title: string;
  channel: string;
  count: number;
  videos: {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
    duration: string;
    duration_string: string;
    uploader: string;
  }[];
}

export interface YouTubeChannel {
  id: string;
  name: string;
  subscriberCount: string;
  avatar: string;
  videos: SearchResult[];
}

export async function youtubeSearch(query: string): Promise<SearchResponse> {
  const cacheKey = `search:${query}`;
  const cached = getCached<SearchResponse>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch(cacheKey, async () => {
    const res = await fetchWithTimeout(`/api/info?action=search&url=${encodeURIComponent(query)}`, {
      headers: authHeaders(),
    }, 20000);
    const data = await res.json();
    if (!res.ok) throw new Error(sanitizeError(data.error || "Search failed"));
    setClientCache(cacheKey, data, 5 * 60 * 1000);
    return data;
  });
}

export async function youtubeTrending(): Promise<SearchResponse> {
  const cacheKey = "trending";
  const cached = getCached<SearchResponse>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch(cacheKey, async () => {
    const res = await fetchWithTimeout(`/api/info?action=trending`, {
      headers: authHeaders(),
    }, 20000);
    const data = await res.json();
    if (!res.ok) throw new Error(sanitizeError(data.error || "Failed to load trending"));
    setClientCache(cacheKey, data, 10 * 60 * 1000);
    return data;
  });
}

export async function youtubePlaylist(playlistId: string): Promise<YouTubePlaylist> {
  const cacheKey = `playlist:${playlistId}`;
  const cached = getCached<YouTubePlaylist>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch(cacheKey, async () => {
    const res = await fetchWithTimeout(`/api/youtube?action=playlist&id=${encodeURIComponent(playlistId)}`, {
      headers: authHeaders(),
    }, 30000);
    const data = await res.json();
    if (!res.ok) throw new Error(sanitizeError(data.error || "Failed to fetch playlist"));
    setClientCache(cacheKey, data, 5 * 60 * 1000);
    return data;
  });
}

export async function youtubeChannel(channelId: string): Promise<YouTubeChannel> {
  const res = await fetchWithTimeout(`/api/youtube?action=channel&id=${encodeURIComponent(channelId)}`, {
    headers: authHeaders(),
  }, 20000);
  const data = await res.json();
  if (!res.ok) throw new Error(sanitizeError(data.error || "Failed to fetch channel"));
  return data;
}

export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const res = await fetchWithTimeout("/api/info", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url }),
  }, 25000);
  const data = await res.json();
  if (!res.ok) {
    if (data.needsAuth) throw { message: data.error || "Authentication required.", needsAuth: true };
    throw new Error(sanitizeError(data.error || "Failed to fetch video info"));
  }
  return data;
}

export async function fetchPlaylist(url: string): Promise<PlaylistInfo> {
  const res = await fetchWithTimeout(`/api/playlist?url=${encodeURIComponent(url)}`, {
    headers: authHeaders(),
  }, 60000);
  const data = await res.json();
  if (!res.ok) {
    if (data.needsAuth) throw { message: data.error || "Authentication required.", needsAuth: true };
    throw new Error(sanitizeError(data.error || "Failed to fetch playlist"));
  }
  return data;
}

export async function fetchSummary(video: VideoInfo): Promise<Summary | null> {
  try {
    const res = await fetchWithTimeout("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: video.title, uploader: video.uploader, description: video.description,
        duration: video.duration, view_count: video.view_count, upload_date: video.upload_date,
      }),
    }, 10000);
    const data = await res.json();
    return data.summary ? data : null;
  } catch { return null; }
}

export async function downloadVideo(url: string, formatId: string, mode: "video" | "audio"): Promise<{ downloadUrl: string }> {
  const body: any = { url };
  if (mode === "audio") body.quality = "audio";
  else if (formatId) body.formatId = formatId;
  else body.quality = "best";

  const res = await fetchWithTimeout("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  }, 30000);
  const data = await res.json();
  if (!res.ok) {
    if (data.needsAuth) throw { message: data.error || "Authentication required.", needsAuth: true };
    throw new Error(sanitizeError(data.error || "Download failed"));
  }
  return data;
}

export async function downloadPlaylist(urls: string[], quality: string): Promise<{ results: { url: string; downloadUrl: string }[]; errors: any[]; success: number }> {
  const res = await fetchWithTimeout("/api/playlist-download", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ urls, quality }),
  }, 120000);
  const data = await res.json();
  if (!res.ok) throw new Error(sanitizeError(data.error || "Playlist download failed"));
  return data;
}

export async function checkAuthStatus(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout("/api/auth/status", {}, 5000);
    const data = await res.json();
    return data.authenticated;
  } catch { return false; }
}

export async function saveCookies(cookies: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch("/api/auth/cookies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cookies }),
  });
  return res.json();
}

export async function deleteCookies(): Promise<void> {
  await fetch("/api/auth/cookies", { method: "DELETE" });
}

export function sortFormats(formats: Format[]): Format[] {
  return [...formats]
    .filter((f) => f.vcodec !== "none" && f.resolution !== "audio only")
    .sort((a, b) => {
      const ra = parseInt(a.resolution) || 0;
      const rb = parseInt(b.resolution) || 0;
      if (rb !== ra) return rb - ra;
      return (b.fps || 0) - (a.fps || 0);
    });
}
