const USER_FRIENDLY: Record<string, string> = {
  "Unsupported URL": "This URL is not supported. Try YouTube, TikTok, Instagram, Twitter, or Facebook links.",
  "Video unavailable": "This video is unavailable or has been removed.",
  "Private video": "This video is private. Add cookies in Settings to access it.",
  "Sign in": "This video requires authentication. Add your cookies in Settings.",
  "login": "This video requires login. Add cookies in Settings to continue.",
  "HTTP Error 403": "Access denied. The video may be restricted in your region.",
  "HTTP Error 404": "Video not found. Check the URL and try again.",
  "HTTP Error 429": "Too many requests. Wait a moment and try again.",
  "Rate limit": "Too many requests. Please wait and try again.",
  "ETIMEDOUT": "Connection timed out. Check your internet and try again.",
  "ECONNREFUSED": "Connection refused. Try again in a few moments.",
  "network": "Network error. Check your internet connection.",
  "Failed to fetch": "Connection failed. Check your internet and try again.",
  "timeout": "Request timed out. Try again.",
};

export function sanitizeError(raw: string): string {
  if (!raw) return "Something went wrong. Please try again.";

  for (const [key, msg] of Object.entries(USER_FRIENDLY)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) return msg;
  }

  if (raw.length > 120) return "Something went wrong. Please try again.";
  if (raw.includes("yt-dlp") || raw.includes("yt_dlp") || raw.includes("ERROR:")) {
    return "Failed to process this video. Try a different link or add cookies in Settings.";
  }
  if (raw.includes("cookie") || raw.includes("Cookie")) {
    return "Authentication needed. Add cookies in Settings.";
  }
  return raw;
}
