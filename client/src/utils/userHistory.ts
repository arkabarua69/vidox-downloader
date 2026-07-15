const BASE_KEY = "vidox_user_watch";
const MAX_HISTORY = 50;

export interface WatchedVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  watchedAt: number;
}

function getKey(userId: string) {
  return `${BASE_KEY}_${userId}`;
}

export function getWatchHistory(userId: string): WatchedVideo[] {
  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addToWatchHistory(userId: string, video: { id: string; title: string; channel: string; thumbnail: string }) {
  const history = getWatchHistory(userId);
  const filtered = history.filter((v) => v.id !== video.id);
  filtered.unshift({ ...video, watchedAt: Date.now() });
  if (filtered.length > MAX_HISTORY) filtered.length = MAX_HISTORY;
  localStorage.setItem(getKey(userId), JSON.stringify(filtered));
}

export function getWatchKeywords(userId: string): string[] {
  const history = getWatchHistory(userId);
  const stopWords = new Set(["the", "a", "an", "is", "it", "to", "of", "and", "in", "on", "for", "with", "my", "me", "i", "you", "we", "at", "by", "or", "be", "this", "that", "are", "was", "from", "has", "have", "had", "but", "not", "all", "can", "will", "do", "did", "its", "no", "so", "if", "how", "what", "why", "when", "who", "which", "than", "them", "then", "there", "their", "about", "more", "some", "any", "just", "like", "get", "got", "your", "out", "up", "official", "video", "mv", "audio", "live", "full", "song", "2024", "2025", "2026"]);

  const wordCount: Record<string, number> = {};

  for (const v of history.slice(0, 20)) {
    const words = v.title.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
    for (const w of words) {
      if (w.length < 3 || stopWords.has(w)) continue;
      wordCount[w] = (wordCount[w] || 0) + 1;
    }
  }

  const sorted = Object.entries(wordCount).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 6).map(([w]) => w);
}

export function getRecentChannels(userId: string): string[] {
  const history = getWatchHistory(userId);
  const channels: Record<string, number> = {};
  for (const v of history.slice(0, 15)) {
    if (v.channel) channels[v.channel] = (channels[v.channel] || 0) + 1;
  }
  return Object.entries(channels).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
}

export function clearWatchHistory(userId: string) {
  localStorage.removeItem(getKey(userId));
}
