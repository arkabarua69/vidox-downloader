import { useState, useEffect } from "react";
import { Play, Download, Sparkles } from "lucide-react";
import { youtubeSearch, youtubeTrending } from "../utils/api";
import type { SearchResult } from "../utils/api";
import { getWatchKeywords, getWatchHistory } from "../utils/userHistory";
import type { GoogleUser } from "../hooks/useGoogleAuth";

interface Props {
  onUrlSubmit: (url: string) => void;
  onWatchVideo: (videoId: string) => void;
  user: GoogleUser | null;
}

const CATEGORIES = [
  { label: "All", query: "trending" },
  { label: "Trending", query: "trending videos" },
  { label: "Music", query: "music hits 2026" },
  { label: "Gaming", query: "gaming highlights" },
  { label: "News", query: "latest news today" },
  { label: "Sports", query: "sports highlights" },
  { label: "Movies", query: "movie trailers 2026" },
  { label: "Tech", query: "technology reviews" },
  { label: "Education", query: "educational videos" },
  { label: "Comedy", query: "funny videos" },
  { label: "Cooking", query: "cooking recipes" },
];

function VideoThumbnail({ video, onWatch, onDownload }: { video: SearchResult; onWatch: () => void; onDownload: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="group cursor-pointer" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative aspect-video rounded-xl overflow-hidden mb-3" onClick={onWatch}>
        <img
          src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`; }}
        />
        <div className={`absolute inset-0 bg-black/20 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`} />
        {video.duration && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {video.duration}
          </div>
        )}
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#e63946]"
          style={{ color: "white" }}
          title="Download this video"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-3" onClick={onWatch}>
        {video.channelThumbnail ? (
          <img src={video.channelThumbnail} alt={video.channel} className="w-9 h-9 rounded-full shrink-0 mt-0.5 object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: `hsl(${(video.channel || "").charCodeAt(0) * 7 % 360}, 60%, 40%)` }}>
            {(video.channel || "?")[0]}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-medium leading-snug line-clamp-2 mb-1" style={{ color: "#f1f1f1" }}>
            {video.title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "#aaa" }}>
            {video.channel}
          </p>
          <p className="text-xs" style={{ color: "#aaa" }}>
            {video.views}{video.views ? "" : ""}{video.time ? ` • ${video.time}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function YouTubeHome({ onUrlSubmit, onWatchVideo, user }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [forYouVideos, setForYouVideos] = useState<SearchResult[]>([]);
  const [forYouLoading, setForYouLoading] = useState(false);
  const [recentlyWatched, setRecentlyWatched] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!user?.sub) {
      setForYouVideos([]);
      setRecentlyWatched([]);
      return;
    }

    const history = getWatchHistory(user.sub);
    const mapped: SearchResult[] = history.slice(0, 8).map((v) => ({
      id: v.id,
      title: v.title,
      channel: v.channel,
      thumbnail: v.thumbnail,
      views: "",
      time: new Date(v.watchedAt).toLocaleDateString(),
      duration: "",
      description: "",
      type: "video" as const,
    }));
    setRecentlyWatched(mapped.slice(0, 8));

    const keywords = getWatchKeywords(user.sub);
    if (keywords.length === 0) {
      setForYouVideos([]);
      return;
    }

    const query = keywords.slice(0, 4).join(" ");
    setForYouLoading(true);
    youtubeSearch(query)
      .then((data) => {
        const watchedIds = new Set(history.map((v) => v.id));
        setForYouVideos(data.results.filter((r) => r.type !== "channel" && r.type !== "playlist" && !watchedIds.has(r.id)).slice(0, 4));
      })
      .catch(() => setForYouVideos([]))
      .finally(() => setForYouLoading(false));
  }, [user?.sub]);

  useEffect(() => {
    const cat = CATEGORIES.find((c) => c.label === activeCategory);
    setLoading(true);

    const fetchFn = activeCategory === "All"
      ? youtubeTrending()
      : youtubeSearch(cat?.query || "trending");

    fetchFn
      .then((data) => {
        setVideos(data.results.filter((r) => r.type !== "channel" && r.type !== "playlist"));
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto pb-4 mb-4 px-1 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                background: isActive ? "#f1f1f1" : "#272727",
                color: isActive ? "#0f0f0f" : "#f1f1f1",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {user && recentlyWatched.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 px-1" style={{ color: "#f1f1f1" }}>Continue Watching</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-4 sm:overflow-x-visible sm:pb-0" style={{ scrollbarWidth: "none" }}>
            {recentlyWatched.map((v) => (
              <div key={v.id} className="shrink-0 w-[200px] sm:w-auto cursor-pointer" onClick={() => onWatchVideo(v.id)}>
                <div className="relative aspect-video rounded-lg overflow-hidden mb-1.5 bg-[#1a1a1a]">
                  <img src={v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <h4 className="text-xs font-medium leading-snug line-clamp-2" style={{ color: "#f1f1f1" }}>{v.title}</h4>
                <p className="text-[10px] mt-0.5" style={{ color: "#aaa" }}>{v.channel}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {user && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles className="w-4 h-4" style={{ color: "#e63946" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#f1f1f1" }}>For You</h2>
          </div>
          {forYouLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video rounded-xl mb-3" style={{ background: "#272727" }} />
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full" style={{ background: "#272727" }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded" style={{ background: "#272727" }} />
                      <div className="h-3 w-1/2 rounded" style={{ background: "#272727" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : forYouVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {forYouVideos.map((video) => (
                <VideoThumbnail
                  key={video.id}
                  video={video}
                  onWatch={() => onWatchVideo(video.id)}
                  onDownload={() => onUrlSubmit(`https://www.youtube.com/watch?v=${video.id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs px-1" style={{ color: "#717171" }}>Watch some videos and we'll recommend more for you</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-xl mb-3" style={{ background: "#272727" }} />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full" style={{ background: "#272727" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded" style={{ background: "#272727" }} />
                  <div className="h-3 w-1/2 rounded" style={{ background: "#272727" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoThumbnail
              key={video.id}
              video={video}
              onWatch={() => onWatchVideo(video.id)}
              onDownload={() => onUrlSubmit(`https://www.youtube.com/watch?v=${video.id}`)}
            />
          ))}
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2" style={{ color: "#aaa" }}>No videos found</p>
          <p className="text-sm" style={{ color: "#717171" }}>Try a different category</p>
        </div>
      )}
    </div>
  );
}
