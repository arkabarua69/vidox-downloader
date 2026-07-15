import { useState } from "react";
import { Play, Clock, Eye, User, X, Film, Music, ArrowDownToLine, Check, Loader2, Sparkles } from "lucide-react";
import type { VideoInfo, Summary } from "../utils/types";
import { formatNumber, formatDate } from "../utils/format";

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
  downloading: boolean;
  downloaded: boolean;
  downloadProgress: number;
  downloadUrl: string;
  onDownload: (formatId: string, mode: "video" | "audio") => void;
}

export default function VideoCard({ video, summary, downloading, downloaded, downloadProgress, onDownload }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState<"video" | "audio">("video");
  const [selectedQuality, setSelectedQuality] = useState("best");

  const qualityOptions = mode === "video" ? VIDEO_QUALITY_OPTIONS : AUDIO_QUALITY_OPTIONS;
  const qualityLabel = qualityOptions.find((o) => o.id === selectedQuality)?.label || "Best";

  return (
    <div className="max-w-3xl mx-auto px-4 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.06)" }}>
        {!showPreview ? (
          <div className="relative aspect-video bg-black cursor-pointer group" onClick={() => setShowPreview(true)}>
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-white font-semibold text-base sm:text-xl leading-snug line-clamp-2 drop-shadow-lg">{video.title}</h2>
            </div>
            {video.duration_string && (
              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Clock className="w-3 h-3" /> {video.duration_string}
              </div>
            )}
            <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md font-medium">Preview</div>
          </div>
        ) : (
          <div className="relative aspect-video bg-black">
            <iframe src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`} className="w-full h-full"
              allow="autoplay; encrypted-media" allowFullScreen title="Video preview" />
            <button onClick={() => setShowPreview(false)}
              className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-black/90 transition-colors">
              <X className="w-3 h-3" /> Close Preview
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm mb-4" style={{ color: "#8b8b9e" }}>
            {video.uploader && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {video.uploader}</span>}
            {video.view_count > 0 && <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {formatNumber(video.view_count)} views</span>}
            {video.upload_date && <span>{formatDate(video.upload_date)}</span>}
          </div>

          {summary && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-accent-light" />
                <span className="text-xs font-semibold text-accent-light uppercase tracking-wider">AI Summary</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#8b8b9e" }}>{summary.summary}</p>
              {summary.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {summary.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(230,57,70,0.1)", color: "#ff6b6b" }}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button onClick={() => { setMode("video"); setSelectedQuality("best"); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === "video" ? "bg-[#e63946]/15 text-[#ff6b6b] border border-[#e63946]/30" : ""}`}
              style={mode !== "video" ? { background: "#12121a", border: "1px solid rgba(255,255,255,0.06)", color: "#8b8b9e" } : undefined}>
              <Film className="w-4 h-4" /> Video
            </button>
            <button onClick={() => { setMode("audio"); setSelectedQuality("best"); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === "audio" ? "bg-[#e63946]/15 text-[#ff6b6b] border border-[#e63946]/30" : ""}`}
              style={mode !== "audio" ? { background: "#12121a", border: "1px solid rgba(255,255,255,0.06)", color: "#8b8b9e" } : undefined}>
              <Music className="w-4 h-4" /> Audio
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-5">
            {qualityOptions.map((opt) => {
              const sel = selectedQuality === opt.id;
              return (
                <button key={opt.id} onClick={() => setSelectedQuality(opt.id)}
                  className={`rounded-xl px-2 py-3 text-center text-sm transition-all ${sel ? "bg-[#e63946]/15 border border-[#e63946]/40 text-[#ff6b6b]" : ""}`}
                  style={!sel ? { background: "#12121a", border: "1px solid rgba(255,255,255,0.06)", color: "#8b8b9e" } : undefined}>
                  <div className="font-semibold text-base">{opt.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#5a5a6e" }}>{opt.sub}</div>
                </button>
              );
            })}
          </div>

          <div className="relative">
            {downloaded ? (
              <div className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2.5 bg-green-500/15 text-green-400 border border-green-500/30">
                <Check className="w-5 h-5" /> Download Complete!
              </div>
            ) : (
              <button
                onClick={() => onDownload(selectedQuality, mode)}
                disabled={downloading}
                className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2.5 transition-all bg-gradient-to-r from-[#e63946] to-[#ff6b6b] text-white hover:from-[#ff6b6b] hover:to-[#e63946] disabled:opacity-50 disabled:cursor-not-allowed">
                {downloading ? <><Loader2 className="w-5 h-5 animate-spin" /> {downloadProgress}%</> :
                 <><ArrowDownToLine className="w-5 h-5" /> Download {qualityLabel}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
