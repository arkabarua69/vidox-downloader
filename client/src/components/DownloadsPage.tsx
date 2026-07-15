import { Search, Download, X, Loader2, Clipboard, ClipboardCheck } from "lucide-react";
import type { VideoInfo, PlaylistInfo, Summary } from "../utils/types";
import ErrorBanner from "./ErrorBanner";
import LoadingSkeleton from "./LoadingSkeleton";
import PlaylistLoading from "./PlaylistLoading";
import PlaylistCard from "./PlaylistCard";
import VideoCard from "./VideoCard";

interface Props {
  url: string;
  setUrl: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  loadingPlaylist: boolean;
  pasted: boolean;
  onPaste: () => void;
  onClear: () => void;
  downloadProgress: number;
  error: string;
  videoInfo: VideoInfo | null;
  summary: Summary | null;
  playlist: PlaylistInfo | null;
  selectedVideos: Set<string>;
  onToggleVideo: (id: string) => void;
  onToggleAll: () => void;
  onPlaylistDownload: () => void;
  onCancel: () => void;
  downloading: boolean;
  downloaded: boolean;
  downloadUrl: string;
  onDownload: (formatId: string, mode: "video" | "audio") => void;
}

const PLATFORMS = [
  { name: "YouTube", color: "#ff0000" },
  { name: "TikTok", color: "#00f2ea" },
  { name: "Instagram", color: "#e1306c" },
  { name: "X / Twitter", color: "#1da1f2" },
  { name: "Facebook", color: "#1877f2" },
  { name: "Reddit", color: "#ff4500" },
  { name: "Twitch", color: "#9146ff" },
  { name: "Vimeo", color: "#1ab7ea" },
  { name: "SoundCloud", color: "#ff5500" },
  { name: "Pinterest", color: "#e60023" },
];

export default function DownloadsPage({
  url, setUrl, onSearch, loading, loadingPlaylist, pasted, onPaste, onClear,
  downloadProgress, error, videoInfo, summary, playlist, selectedVideos,
  onToggleVideo, onToggleAll, onPlaylistDownload, onCancel,
  downloading, downloaded, downloadUrl, onDownload,
}: Props) {
  const isLoading = loading || loadingPlaylist;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center py-8 sm:py-12">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-2 leading-tight">
          <span style={{ color: "#f1f1f1" }}>Download </span>
          <span style={{ color: "#e63946" }}>Any Video </span>
          <span style={{ color: "#f1f1f1" }}>From</span>
          <br />
          <span style={{ color: "#e63946" }}>Social Media</span>
        </h1>

        <p className="text-base sm:text-lg font-semibold mt-3" style={{ color: "#e63946" }}>Mac GunJon</p>
        <p className="text-sm sm:text-base mt-2" style={{ color: "#aaa" }}>
          YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, Twitch &<br className="hidden sm:block" /> 1000+ sites.
        </p>

        <div className="flex flex-wrap gap-2 mt-5 justify-center max-w-2xl mx-auto">
          {PLATFORMS.map((p) => (
            <span key={p.name} className="text-xs px-3 py-1.5 rounded-full font-medium border"
              style={{ color: p.color, borderColor: p.color + "40", background: p.color + "10" }}>
              {p.name}
            </span>
          ))}
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#717171", border: "1px solid rgba(255,255,255,0.1)" }}>
            + 1000 more
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        <div className="rounded-xl overflow-hidden flex items-center" style={{ background: "#272727", border: "1px solid #303030" }}>
          <div className="flex-1 flex items-center">
            <Search className="w-5 h-5 ml-4 shrink-0" style={{ color: "#aaa" }} />
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
              placeholder="Paste any social media URL here..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-3.5 text-sm"
              style={{ color: "#f1f1f1" }} />
            {url && (
              <button onClick={onClear} className="p-2 hover:bg-white/10 rounded-full transition-colors" style={{ color: "#aaa" }}>
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={onPaste} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-1" style={{ color: "#aaa" }} title="Paste">
              {pasted ? <ClipboardCheck className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={onSearch} disabled={!url.trim() || isLoading}
            className="px-6 py-3.5 flex items-center gap-2 transition-colors font-semibold disabled:opacity-40"
            style={{ background: "#e63946", color: "white" }}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span className="hidden sm:inline">Grab</span>
          </button>
        </div>

        {downloadProgress > 0 && (
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full bg-gradient-to-r from-[#e63946] to-[#ff6b6b] rounded-full transition-all duration-500" style={{ width: `${downloadProgress}%` }} />
          </div>
        )}
      </div>

      <ErrorBanner error={error} />

      {loading && <LoadingSkeleton />}
      {loadingPlaylist && <PlaylistLoading />}

      {playlist && !loadingPlaylist && (
        <PlaylistCard playlist={playlist} selected={selectedVideos} onToggle={onToggleVideo}
          onToggleAll={onToggleAll} onDownload={onPlaylistDownload}
          onCancel={onCancel} downloading={downloading} downloadProgress={downloadProgress} />
      )}

      {videoInfo && !loading && (
        <VideoCard video={videoInfo} summary={summary} downloading={downloading}
          downloaded={downloaded} downloadProgress={downloadProgress} downloadUrl={downloadUrl} onDownload={onDownload} />
      )}
    </div>
  );
}
