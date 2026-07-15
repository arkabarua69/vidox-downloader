const PREFS_KEY = "vidox_prefs";

export interface Preferences {
  defaultFormat: "mp4" | "mp3" | "webm";
  defaultResolution: "1080p" | "720p" | "480p" | "auto";
  autoStart: boolean;
  fileNaming: "title" | "title_date" | "title_quality";
}

const DEFAULT_PREFS: Preferences = {
  defaultFormat: "mp4",
  defaultResolution: "720p",
  autoStart: false,
  fileNaming: "title",
};

export function getPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Preferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
