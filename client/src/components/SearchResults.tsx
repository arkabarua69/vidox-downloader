import { Play, Download } from "lucide-react";
import { useState } from "react";
import type { SearchResult } from "../utils/api";

interface Props {
  results: SearchResult[];
  query: string;
  loading: boolean;
  onWatch: (videoId: string) => void;
  onDownload: (url: string) => void;
}

export default function SearchResults({ results, query, loading, onWatch, onDownload }: Props) {
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="mb-6">
          <p className="text-sm" style={{ color: "#aaa" }}>
            Searching for <span className="font-medium" style={{ color: "#f1f1f1" }}>"{query}"</span>...
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 p-3 rounded-xl" style={{ background: "#272727" }}>
              <div className="w-full sm:w-[360px] aspect-video rounded-xl shrink-0 animate-pulse" style={{ background: "#303030" }} />
              <div className="flex-1 p-2 space-y-3">
                <div className="h-5 w-3/4 rounded animate-pulse" style={{ background: "#303030" }} />
                <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: "#303030" }} />
                <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: "#303030" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-sm" style={{ color: "#aaa" }}>
          {results.length > 0 ? `${results.length} results for` : "No results for"} <span className="font-medium" style={{ color: "#f1f1f1" }}>"{query}"</span>
        </p>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2" style={{ color: "#aaa" }}>No results found</p>
          <p className="text-sm" style={{ color: "#717171" }}>Try different keywords or paste a URL directly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.filter((r) => r.type !== "channel").map((result) => (
            <SearchResultItem key={result.id} result={result} onWatch={() => onWatch(result.id)}
              onDownload={() => onDownload(`https://www.youtube.com/watch?v=${result.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultItem({ result, onWatch, onDownload }: { result: SearchResult; onWatch: () => void; onDownload: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative w-full sm:w-[360px] aspect-video rounded-xl overflow-hidden shrink-0" onClick={onWatch}>
        <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${result.id}/hqdefault.jpg`; }} />
        <div className={`absolute inset-0 bg-black/20 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`} />
        {result.duration && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {result.duration}
          </div>
        )}
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0" onClick={onWatch}>
        <h3 className="text-lg font-medium leading-snug line-clamp-2 mb-1" style={{ color: "#f1f1f1" }}>{result.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          {result.channelThumbnail ? (
            <img src={result.channelThumbnail} alt={result.channel} className="w-6 h-6 rounded-full shrink-0 object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full shrink-0" style={{ background: `hsl(${(result.channel || "").charCodeAt(0) * 7 % 360}, 60%, 40%)` }} />
          )}
          <span className="text-sm" style={{ color: "#aaa" }}>{result.channel}</span>
        </div>
        <p className="text-sm mb-2" style={{ color: "#aaa" }}>
          {result.views}{result.views ? " views" : ""}{result.time ? ` • ${result.time}` : ""}
        </p>
        {result.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#717171" }}>{result.description}</p>
        )}
      </div>
      <div className="flex sm:flex-col items-center gap-2 shrink-0 self-start">
        <button onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
          style={{ color: "#aaa" }} title="Download">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
