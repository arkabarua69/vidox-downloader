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
  const res = await fetch(`/api/info?action=search&url=${encodeURIComponent(query)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(sanitizeError(data.error || "Search failed"));
  return data;
}

export async function youtubeTrending(): Promise<SearchResponse> {
  const res = await fetch(`/api/info?action=trending`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(sanitizeError(data.error || "Failed to load trending"));
  return data;
}

export async function youtubePlaylist(playlistId: string): Promise<YouTubePlaylist> {
  const res = await fetch(`/api/youtube?action=playlist&id=${encodeURIComponent(playlistId)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(sanitizeError(data.error || "Failed to fetch playlist"));
  return data;
}

export async function youtubeChannel(channelId: string): Promise<YouTubeChannel> {
  const res = await fetch(`/api/youtube?action=channel&id=${encodeURIComponent(channelId)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(sanitizeError(data.error || "Failed to fetch channel"));
  return data;
}

export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const res = await fetch("/api/info", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.needsAuth) throw { message: data.error || "Authentication required.", needsAuth: true };
    throw new Error(sanitizeError(data.error || "Failed to fetch video info"));
  }
  return data;
}

export async function fetchPlaylist(url: string): Promise<PlaylistInfo> {
  const res = await fetch(`/api/playlist?url=${encodeURIComponent(url)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.needsAuth) throw { message: data.error || "Authentication required.", needsAuth: true };
    throw new Error(sanitizeError(data.error || "Failed to fetch playlist"));
  }
  return data;
}

export async function fetchSummary(video: VideoInfo): Promise<Summary | null> {
  try {
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: video.title, uploader: video.uploader, description: video.description,
        duration: video.duration, view_count: video.view_count, upload_date: video.upload_date,
      }),
    });
    const data = await res.json();
    return data.summary ? data : null;
  } catch { return null; }
}

export async function downloadVideo(url: string, formatId: string, mode: "video" | "audio"): Promise<{ downloadUrl: string }> {
  const body: any = { url };
  if (mode === "audio") body.quality = "audio";
  else if (formatId) body.formatId = formatId;
  else body.quality = "best";

  const res = await fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.needsAuth) throw { message: data.error || "Authentication required.", needsAuth: true };
    throw new Error(sanitizeError(data.error || "Download failed"));
  }
  return data;
}

export async function downloadPlaylist(urls: string[], quality: string): Promise<{ results: { url: string; downloadUrl: string }[]; errors: any[]; success: number }> {
  const res = await fetch("/api/playlist-download", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ urls, quality }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(sanitizeError(data.error || "Playlist download failed"));
  return data;
}

export async function checkAuthStatus(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/status");
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
