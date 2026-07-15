const STORAGE_KEY = "vidox_history";
const MAX_ITEMS = 50;

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  uploader: string;
  platform: string;
  quality: string;
  mode: "video" | "audio";
  date: string;
  timestamp: number;
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("tiktok.com") || u.includes("vm.tiktok.com")) return "TikTok";
  if (u.includes("instagram.com")) return "Instagram";
  if (u.includes("twitter.com") || u.includes("x.com")) return "X / Twitter";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "Facebook";
  if (u.includes("reddit.com") || u.includes("redd.it")) return "Reddit";
  if (u.includes("twitch.tv")) return "Twitch";
  if (u.includes("vimeo.com")) return "Vimeo";
  if (u.includes("soundcloud.com")) return "SoundCloud";
  if (u.includes("pinterest.com")) return "Pinterest";
  if (u.includes("dailymotion.com")) return "Dailymotion";
  return "Other";
}

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: Omit<HistoryItem, "timestamp" | "platform">): HistoryItem[] {
  const history = getHistory();
  const existing = history.findIndex((h) => h.url === item.url && h.quality === item.quality && h.mode === item.mode);
  if (existing !== -1) history.splice(existing, 1);

  const entry: HistoryItem = { ...item, platform: detectPlatform(item.url), timestamp: Date.now() };
  history.unshift(entry);
  if (history.length > MAX_ITEMS) history.length = MAX_ITEMS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function removeFromHistory(id: string): HistoryItem[] {
  const history = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
