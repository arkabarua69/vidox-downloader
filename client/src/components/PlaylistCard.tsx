import { Film, Check, ArrowDownToLine, Loader2 } from "lucide-react";
import type { PlaylistInfo } from "../utils/types";

interface Props {
  playlist: PlaylistInfo;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onDownload: () => void;
  onCancel: () => void;
  downloading: boolean;
  downloadProgress: number;
}

export default function PlaylistCard({ playlist, selected, onToggle, onToggleAll, onDownload, onCancel, downloading, downloadProgress }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="p-4 sm:p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <Film className="w-4 h-4 text-accent-light" /> Playlist
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#5a5a6e" }}>{playlist.count} videos · {selected.size} selected</p>
            </div>
            <button onClick={onToggleAll} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.06)", color: "#8b8b9e" }}>
              {selected.size === playlist.videos.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-text-primary"
              style={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.06)", color: "#8b8b9e" }}>
              Cancel
            </button>
            <button onClick={onDownload} disabled={downloading || selected.size === 0}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-accent to-accent-light text-white hover:from-accent-light hover:to-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> {downloadProgress}%</> :
               <><ArrowDownToLine className="w-4 h-4" /> Download {selected.size} Videos</>}
            </button>
          </div>
          {downloading && downloadProgress > 0 && (
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500" style={{ width: `${downloadProgress}%` }} />
            </div>
          )}
        </div>
        <div className="max-h-[50vh] overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {playlist.videos.map((video, i) => (
            <div key={video.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${selected.has(video.id) ? "bg-accent/5" : "hover:bg-white/2"}`}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <button onClick={() => onToggle(video.id)}
                className={`w-5 h-5 rounded shrink-0 flex items-center justify-center transition-all ${selected.has(video.id) ? "bg-accent text-white" : "border"}`}
                style={!selected.has(video.id) ? { borderColor: "rgba(255,255,255,0.15)" } : undefined}>
                {selected.has(video.id) && <Check className="w-3 h-3" />}
              </button>
              <span className="text-xs w-5 text-right shrink-0" style={{ color: "#5a5a6e" }}>{i + 1}</span>
              <img src={video.thumbnail} alt="" className="w-16 h-9 rounded object-cover shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary line-clamp-1">{video.title}</p>
                <p className="text-[11px]" style={{ color: "#5a5a6e" }}>{video.uploader} {video.duration_string ? `· ${video.duration_string}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
