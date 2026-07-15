import { useState } from "react";
import { ArrowDownToLine, Check, Loader2, Clock, X } from "lucide-react";
import type { VideoInfo, Summary } from "../utils/types";
import { formatNumber, formatDate } from "../utils/format";
import YouTubePlayer from "./YouTubePlayer";

const VIDEO_QUALITY_OPTIONS = [
  { id: "sd", label: "SD", sub: "360p" },
  { id: "hd", label: "HD", sub: "720p" },
  { id: "high", label: "High", sub: "1080p" },
  { id: "best", label: "Best", sub: "Max" },
];

const AUDIO_QUALITY_OPTIONS = [
  { id: "sd", label: "SD", sub: "128kbps" },
  { id: "hd", label: "HD", sub: "192kbps" },
  { id: "high", label: "High", sub: "256kbps" },
  { id: "best", label: "Best", sub: "320kbps" },
];

interface Props {
  video: VideoInfo;
  summary: Summary | null;
  onDownload: (formatId: string, mode: "video" | "audio") => void;
  downloading: boolean;
  downloaded: boolean;
  downloadProgress: number;
  relatedVideos?: { id: string; title: string; channel: string; views: string; time: string; duration: string; thumbnail: string }[];
  onWatchVideo?: (videoId: string) => void;
  watchLater?: { id: string; title: string; channel: string; thumbnail: string; duration: string; url: string }[];
  onToggleWatchLater?: (item: { id: string; title: string; channel: string; thumbnail: string; duration: string; url: string }) => void;
}

export default function WatchPage({ video, summary, onDownload, downloading, downloaded, downloadProgress, relatedVideos = [], onWatchVideo, watchLater = [], onToggleWatchLater }: Props) {
  const [mode, setMode] = useState<"video" | "audio">("video");
  const [selectedQuality, setSelectedQuality] = useState("best");
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);

  const isWatchLater = watchLater.some((w) => w.id === video.id);

  const title = video.title || "";
  const channel = video.uploader || "";
  const views = video.view_count > 0 ? formatNumber(video.view_count) : "";
  const date = video.upload_date ? formatDate(video.upload_date) : "";
  const channelImg = video.channelThumbnail || "";

  return (
    <div className="w-full max-w-[1800px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          <div className="w-full mb-4">
            <YouTubePlayer videoId={video.id} title={title} streamUrl={video.streamUrl} thumbnail={video.thumbnail} />
          </div>

          <div className="px-1">
            <h1 className="text-lg sm:text-xl font-bold leading-snug mb-3" style={{ color: "#f1f1f1" }}>{title}</h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                {channelImg ? (
                  <img src={channelImg} alt={channel} className="w-10 h-10 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: "#e63946", color: "white" }}>
                    {channel?.[0] || "C"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f1f1f1" }}>{channel}</p>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#aaa" }}>
                    {views && <span>{views} views</span>}
                    {views && date && <span>&bull;</span>}
                    {date && <span>{date}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDownloadPanel(!showDownloadPanel)}
                className="ml-auto px-5 py-2 rounded-full text-sm font-semibold transition-colors hover:bg-[#ff6b6b]"
                style={{ background: "#e63946", color: "white" }}>
                <ArrowDownToLine className="w-4 h-4 inline mr-1.5" />Download
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => onToggleWatchLater?.({
                id: video.id, title: video.title, channel: video.uploader || "Unknown",
                thumbnail: video.thumbnail || "", duration: video.duration_string || "", url: ""
              })}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                style={{ background: isWatchLater ? "rgba(62,166,255,0.15)" : "#272727", color: isWatchLater ? "#3ea6ff" : "#f1f1f1", border: isWatchLater ? "1px solid rgba(62,166,255,0.3)" : "1px solid rgba(255,255,255,0.1)" }}>
                <Clock className="w-4 h-4" /> {isWatchLater ? "Saved" : "Watch Later"}
              </button>
            </div>

            {summary && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#272727" }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#e63946" }}>AI Summary</span>
                <p className="text-sm leading-relaxed mt-2" style={{ color: "#ddd" }}>{summary.summary}</p>
                {summary.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {summary.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(230,57,70,0.15)", color: "#ff6b6b" }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showDownloadPanel && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#272727" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold" style={{ color: "#f1f1f1" }}>Download</h3>
                  <button onClick={() => setShowDownloadPanel(false)} className="p-1 rounded-full hover:bg-white/10" style={{ color: "#aaa" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  <button onClick={() => setMode("video")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === "video" ? "bg-[#e63946]/15 text-[#ff6b6b] border border-[#e63946]/30" : ""}`}
                    style={mode !== "video" ? { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", color: "#aaa" } : undefined}>
                    Video
                  </button>
                  <button onClick={() => setMode("audio")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === "audio" ? "bg-[#e63946]/15 text-[#ff6b6b] border border-[#e63946]/30" : ""}`}
                    style={mode !== "audio" ? { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", color: "#aaa" } : undefined}>
                    Audio
                  </button>
                </div>

                {mode === "video" ? (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {VIDEO_QUALITY_OPTIONS.map((opt) => {
                      const sel = selectedQuality === opt.id;
                      return (
                        <button key={opt.id} onClick={() => setSelectedQuality(opt.id)}
                          className={`rounded-xl px-2 py-3 text-center text-sm transition-all ${sel ? "bg-[#e63946]/15 border border-[#e63946]/40 text-[#ff6b6b]" : ""}`}
                          style={!sel ? { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", color: "#aaa" } : undefined}>
                          <div className="font-semibold text-base">{opt.label}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: "#717171" }}>{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {AUDIO_QUALITY_OPTIONS.map((opt) => {
                      const sel = selectedQuality === opt.id;
                      return (
                        <button key={opt.id} onClick={() => setSelectedQuality(opt.id)}
                          className={`rounded-xl px-2 py-3 text-center text-sm transition-all ${sel ? "bg-[#e63946]/15 border border-[#e63946]/40 text-[#ff6b6b]" : ""}`}
                          style={!sel ? { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", color: "#aaa" } : undefined}>
                          <div className="font-semibold text-base">{opt.label}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: "#717171" }}>{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {downloaded ? (
                  <div className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-green-500/15 text-green-400 border border-green-500/30">
                    <Check className="w-4 h-4" /> Download Complete!
                  </div>
                ) : (
                  <button onClick={() => onDownload(selectedQuality, mode)} disabled={downloading}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#e63946] to-[#ff6b6b] text-white hover:from-[#ff6b6b] hover:to-[#e63946] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> {downloadProgress}%</> : <><ArrowDownToLine className="w-4 h-4" /> Download {mode === "video" ? VIDEO_QUALITY_OPTIONS.find((o) => o.id === selectedQuality)?.label || "Best" : AUDIO_QUALITY_OPTIONS.find((o) => o.id === selectedQuality)?.label || "MP3"}</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedVideos.length > 0 && (
          <div className="w-full lg:w-[400px] shrink-0">
            <h3 className="text-sm font-semibold mb-3 px-1" style={{ color: "#f1f1f1" }}>Related Videos</h3>
            <div className="flex flex-col gap-2">
              {relatedVideos.map((rv) => (
                <div key={rv.id} className="flex gap-3 cursor-pointer rounded-lg p-1 hover:bg-white/5 transition-colors"
                  onClick={() => onWatchVideo?.(rv.id)}>
                  <div className="relative w-[168px] h-[94px] rounded-lg overflow-hidden shrink-0 bg-[#1a1a1a]">
                    <img src={rv.thumbnail} alt={rv.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-medium">
                      {rv.duration}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <h4 className="text-sm font-medium leading-snug line-clamp-2 mb-1" style={{ color: "#f1f1f1" }}>{rv.title}</h4>
                    <p className="text-xs" style={{ color: "#aaa" }}>{rv.channel}</p>
                    <p className="text-xs" style={{ color: "#aaa" }}>{rv.views} &bull; {rv.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
