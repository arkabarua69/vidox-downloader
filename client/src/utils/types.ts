export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  duration_string: string;
  uploader: string;
  channelId?: string;
  channelThumbnail?: string;
  upload_date: string;
  view_count: number;
  description: string;
  hlsUrl?: string;
  streamUrl?: string;
  audioUrl?: string;
  relatedVideos?: { id: string; title: string; channel: string; views: string; time: string; duration: string; thumbnail: string }[];
  formats: Format[];
}

export interface Format {
  formatId: string;
  ext: string;
  resolution: string;
  fps: number;
  vcodec: string;
  acodec: string;
  filesize: number;
  formatNote: string;
  qualityLabel: string;
  tbr: number;
  directUrl?: string;
}

export interface PlaylistVideo {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
  duration_string: string;
  uploader: string;
}

export interface PlaylistInfo {
  title: string;
  count: number;
  videos: PlaylistVideo[];
}

export interface Summary {
  summary: string;
  tags: string[];
  category: string;
}

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

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      getDownloadsPath: () => Promise<string>;
      openDownloads: () => Promise<void>;
    };
  }
}

export const isElectron = typeof window !== "undefined" && !!window.electronAPI;
