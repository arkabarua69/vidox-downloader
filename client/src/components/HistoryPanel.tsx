import { History, Trash2, X, Clipboard, ExternalLink } from "lucide-react";
import { clearHistory, removeFromHistory, type HistoryItem } from "../utils/history";

interface Props {
  history: HistoryItem[];
  setHistory: (h: HistoryItem[]) => void;
  onClose: () => void;
  onReDownload: (url: string) => void;
}

export default function HistoryPanel({ history, setHistory, onClose, onReDownload }: Props) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: "#0a0a0f" }}>
      <div className="border-b px-4 py-3 flex items-center justify-between shrink-0" style={{ background: "#111115", borderColor: "rgba(255,255,255,0.06)" }}>
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <History className="w-4 h-4 text-accent-light" /> Download History
          <span className="text-xs font-normal" style={{ color: "#5a5a6e" }}>({history.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button onClick={() => { clearHistory(); setHistory([]); }} className="text-xs transition-colors flex items-center gap-1 hover:text-accent-light" style={{ color: "#5a5a6e" }}>
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "#5a5a6e" }}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-20">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <History className="w-8 h-8" style={{ color: "#5a5a6e" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#8b8b9e" }}>No downloads yet</p>
            <p className="text-xs mt-1" style={{ color: "#5a5a6e" }}>Your download history will appear here</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold">Start Downloading</button>
          </div>
        ) : (
          <div>
            {history.map((item) => (
              <div key={item.id + item.timestamp} className="px-4 py-3 flex gap-3 transition-colors hover:bg-white/2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <img src={item.thumbnail} alt="" className="w-24 h-14 rounded-lg object-cover shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium line-clamp-1">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#5a5a6e" }}>{item.uploader || item.platform} · {item.quality}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#5a5a6e" }}>{item.date}</p>
                </div>
                <div className="flex flex-col items-end justify-between shrink-0">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${item.mode === "audio" ? "bg-amber-500/15 text-amber-400" : "bg-accent/15 text-accent-light"}`}>{item.mode}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => navigator.clipboard.writeText(item.url)} className="p-1 transition-colors hover:text-text-primary" style={{ color: "#5a5a6e" }} title="Copy URL">
                      <Clipboard className="w-3 h-3" />
                    </button>
                    <button onClick={() => onReDownload(item.url)} className="p-1 transition-colors hover:text-accent-light" style={{ color: "#5a5a6e" }} title="Re-download">
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button onClick={() => setHistory(removeFromHistory(item.id))} className="p-1 transition-colors hover:text-red-400" style={{ color: "#5a5a6e" }} title="Remove">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
