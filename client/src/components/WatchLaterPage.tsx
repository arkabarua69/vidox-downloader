import { Clock, Play, Trash2 } from "lucide-react";

interface WatchLaterItem {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  url: string;
}

interface Props {
  items: WatchLaterItem[];
  onWatch: (videoId: string) => void;
  onRemove: (id: string) => void;
}

export default function WatchLaterPage({ items, onWatch, onRemove }: Props) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6" style={{ color: "#f1f1f1" }} />
        <h1 className="text-2xl font-bold" style={{ color: "#f1f1f1" }}>Watch Later</h1>
        <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: "#272727", color: "#aaa" }}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-16 h-16 mx-auto mb-4" style={{ color: "#717171" }} />
          <p className="text-lg font-medium mb-2" style={{ color: "#aaa" }}>No videos saved</p>
          <p className="text-sm" style={{ color: "#717171" }}>Save videos to watch later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group cursor-pointer rounded-xl overflow-hidden" style={{ background: "#272727" }}
              onClick={() => onWatch(item.id)}>
              <div className="relative aspect-video">
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                  {item.duration}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-12 h-12 rounded-full bg-[#e63946]/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#e63946]"
                  style={{ color: "white" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium line-clamp-2 mb-1" style={{ color: "#f1f1f1" }}>{item.title}</h3>
                <p className="text-xs" style={{ color: "#aaa" }}>{item.channel}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
