import { History, Trash2, Play } from "lucide-react";
import type { HistoryItem } from "../utils/history";

interface Props {
  history: HistoryItem[];
  onClear: () => void;
  onWatch: (videoId: string) => void;
  onRemove: (id: string) => void;
}

export default function HistoryPage({ history, onClear, onWatch, onRemove }: Props) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6" style={{ color: "#f1f1f1" }} />
          <h1 className="text-2xl font-bold" style={{ color: "#f1f1f1" }}>History</h1>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: "#272727", color: "#aaa" }}>{history.length}</span>
        </div>
        {history.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm hover:bg-white/10 transition-colors" style={{ color: "#aaa" }}>
            <Trash2 className="w-4 h-4" /> Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20">
          <History className="w-16 h-16 mx-auto mb-4" style={{ color: "#717171" }} />
          <p className="text-lg font-medium mb-2" style={{ color: "#aaa" }}>No history yet</p>
          <p className="text-sm" style={{ color: "#717171" }}>Videos you watch will appear here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {history.map((item) => (
            <div key={item.id} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => {
                const match = item.url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (match) onWatch(match[1]);
              }}>
              <div className="relative w-[200px] sm:w-[240px] h-[112px] sm:h-[134px] rounded-lg overflow-hidden shrink-0 bg-[#272727]">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-10 h-10" style={{ color: "#717171" }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-12 h-12 rounded-full bg-[#e63946]/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className="text-sm font-medium leading-snug line-clamp-2 mb-1" style={{ color: "#f1f1f1" }}>{item.title}</h3>
                <p className="text-xs" style={{ color: "#aaa" }}>{item.uploader}</p>
                <p className="text-xs" style={{ color: "#aaa" }}>{item.quality} &bull; {item.mode}</p>
                <p className="text-xs" style={{ color: "#717171" }}>{item.date}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all self-start shrink-0"
                style={{ color: "#aaa" }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
