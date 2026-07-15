import { Search, Download, X, Loader2, Clipboard, ClipboardCheck } from "lucide-react";

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
}

const PLATFORMS = [
  { name: "YouTube", color: "#ff4444" },
  { name: "TikTok", color: "#25f4ee" },
  { name: "Instagram", color: "#e1306c" },
  { name: "X / Twitter", color: "#1da1f2" },
  { name: "Facebook", color: "#1877f2" },
  { name: "Reddit", color: "#ff4500" },
  { name: "Twitch", color: "#9146ff" },
  { name: "Vimeo", color: "#1ab7ea" },
  { name: "SoundCloud", color: "#ff5500" },
  { name: "Pinterest", color: "#e60023" },
];

export default function SearchBar({ url, setUrl, onSearch, loading, loadingPlaylist, pasted, onPaste, onClear, downloadProgress }: Props) {
  const isLoading = loading || loadingPlaylist;

  return (
    <section className="pt-4 sm:pt-6 pb-8 px-4 text-center">
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-2 leading-tight">
        <span className="text-text-primary">Download </span>
        <span className="gradient-text">Any Video</span>
        <span className="text-text-primary"> From</span>
        <br />
        <span className="gradient-text">Social Media</span>
      </h1>
      <p className="text-lg sm:text-xl font-medium mb-2">
        <span className="gradient-text">Mac GunJon</span>
      </p>
      <p className="text-sm sm:text-base max-w-lg mx-auto mb-6" style={{ color: "#8b8b9e" }}>
        YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, Twitch &amp; 1000+ sites.
      </p>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 max-w-xl mx-auto">
        {PLATFORMS.map((p) => (
          <span key={p.name} className="rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: p.color,
              boxShadow: `0 0 12px ${p.color}22, inset 0 0 12px ${p.color}08`,
            }}>
            {p.name}
          </span>
        ))}
        <span className="rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#5a5a6e" }}>
          + 1000 more
        </span>
      </div>

      <div className="max-w-2xl mx-auto relative">
        <div className="rounded-2xl p-1.5 glow-red transition-all focus-within:glow-red" style={{ background: "#1a1a22", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center rounded-xl" style={{ background: "#12121a" }}>
            <Search className="w-5 h-5 ml-4 shrink-0" style={{ color: "#5a5a6e" }} />
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
              placeholder="Paste any social media URL here..."
              className="flex-1 bg-transparent border-none outline-none text-text-primary px-4 py-4 text-sm sm:text-base"
              style={{ color: "#f1f1f1" }} />
            {url && (
              <button onClick={onClear} className="p-2 transition-colors" style={{ color: "#5a5a6e" }}>
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={onPaste} className="p-2 transition-colors hover:text-accent-light" style={{ color: "#5a5a6e" }} title="Paste from clipboard">
              {pasted ? <ClipboardCheck className="w-4 h-4 text-success" /> : <Clipboard className="w-4 h-4" />}
            </button>
            <button onClick={onSearch} disabled={!url.trim() || isLoading}
              className="bg-gradient-to-r from-accent to-accent-light text-white px-5 sm:px-7 py-3 rounded-xl font-semibold text-sm sm:text-base hover:from-accent-light hover:to-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 m-1">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Grab</span>
            </button>
          </div>
        </div>
        {downloadProgress > 0 && (
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500 ease-out" style={{ width: `${downloadProgress}%` }} />
          </div>
        )}
        {loading && (
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full" style={{ width: "60%", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        )}
      </div>
    </section>
  );
}
