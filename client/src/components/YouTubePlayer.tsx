import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, RotateCcw } from "lucide-react";

interface Props {
  videoId: string;
  title: string;
  streamUrl?: string;
  thumbnail?: string;
}

export default function YouTubePlayer({ videoId, title, streamUrl, thumbnail }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wasPlayingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsHoverRef = useRef(false);

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const blobUrlRef = useRef<string | null>(null);

  const getMediaSrc = useCallback(() => {
    if (!streamUrl) return "";
    return streamUrl;
  }, [streamUrl]);

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        releaseWakeLock();
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {}
  }

  function releaseWakeLock() {
    if (wakeLockRef.current) {
      try { wakeLockRef.current.release(); } catch {}
      wakeLockRef.current = null;
    }
  }

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (playing && !controlsHoverRef.current && !seeking) {
        setShowControls(false);
      }
    }, 4000);
  }, [playing, seeking]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (!streamUrl) return;
    const vid = videoRef.current;
    if (!vid) return;

    setReady(false);
    setError(false);
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    setBuffered(0);
    setShowControls(true);

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    let cancelled = false;

    const onCanPlay = () => {
      if (cancelled) return;
      setReady(true);
      vid.play().then(() => {
        if (!cancelled) {
          setPlaying(true);
          wasPlayingRef.current = true;
          requestWakeLock();
          scheduleHide();
        }
      }).catch(() => {});
    };

    const onError = () => {
      if (cancelled) return;
      setReady(true);
      setError(true);
    };

    const proxySrc = getMediaSrc();
    if (!proxySrc) return;

    const onLoadedData = () => {
      if (cancelled) return;
      setReady(true);
      vid.play().then(() => {
        if (!cancelled) {
          setPlaying(true);
          wasPlayingRef.current = true;
          requestWakeLock();
          scheduleHide();
        }
      }).catch(() => {});
    };

    vid.addEventListener("canplay", onCanPlay, { once: true });
    vid.addEventListener("loadeddata", onLoadedData, { once: true });
    vid.addEventListener("error", onError);

    vid.src = proxySrc;
    vid.load();

    return () => {
      cancelled = true;
      vid.removeEventListener("canplay", onCanPlay);
      vid.removeEventListener("loadeddata", onLoadedData);
      vid.removeEventListener("play", onPlayError);
      vid.removeEventListener("error", onError);
      vid.pause();
      vid.src = "";
      wasPlayingRef.current = false;
      releaseWakeLock();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [videoId, getMediaSrc]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        wasPlayingRef.current = !videoRef.current?.paused;
      } else {
        requestWakeLock();
        const vid = videoRef.current;
        if (vid && vid.paused && !vid.ended && wasPlayingRef.current) {
          vid.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "Vidox",
      artwork: thumbnail ? [{ src: thumbnail, sizes: "480x360", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", () => { videoRef.current?.play(); });
    navigator.mediaSession.setActionHandler("pause", () => { videoRef.current?.pause(); });
    navigator.mediaSession.setActionHandler("seekbackward", () => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); });
    navigator.mediaSession.setActionHandler("seekforward", () => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10); });
    navigator.mediaSession.setActionHandler("stop", () => {
      const vid = videoRef.current;
      if (vid) { vid.pause(); vid.currentTime = 0; }
    });
  }, [title, thumbnail]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onBufferProgress = () => {
      if (vid.buffered.length > 0) {
        setBuffered(vid.buffered.end(vid.buffered.length - 1));
      }
    };

    vid.addEventListener("progress", onBufferProgress);
    return () => vid.removeEventListener("progress", onBufferProgress);
  }, [videoId]);

  useEffect(() => {
    if (!playing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const vid = videoRef.current;
      if (!vid) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (vid.paused) vid.play().catch(() => {});
          else vid.pause();
          showControlsTemporarily();
          break;
        case "ArrowLeft":
          e.preventDefault();
          vid.currentTime = Math.max(0, vid.currentTime - 10);
          showControlsTemporarily();
          break;
        case "ArrowRight":
          e.preventDefault();
          vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10);
          showControlsTemporarily();
          break;
        case "ArrowUp":
          e.preventDefault();
          vid.volume = Math.min(1, vid.volume + 0.1);
          setVolume(Math.round(vid.volume * 100));
          if (vid.muted) { vid.muted = false; setMuted(false); }
          showControlsTemporarily();
          break;
        case "ArrowDown":
          e.preventDefault();
          vid.volume = Math.max(0, vid.volume - 0.1);
          setVolume(Math.round(vid.volume * 100));
          showControlsTemporarily();
          break;
        case "f":
          e.preventDefault();
          if (document.fullscreenElement) document.exitFullscreen();
          else containerRef.current?.requestFullscreen();
          break;
        case "m":
          e.preventDefault();
          vid.muted = !vid.muted;
          setMuted(vid.muted);
          showControlsTemporarily();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [playing, showControlsTemporarily]);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => {
        setPlaying(true);
        wasPlayingRef.current = true;
        requestWakeLock();
      }).catch(() => {});
    } else {
      vid.pause();
      setPlaying(false);
      wasPlayingRef.current = false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  }, []);

  const changeVolume = useCallback((val: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = val / 100;
    setVolume(val);
    if (val === 0) { vid.muted = true; setMuted(true); }
    else if (vid.muted) { vid.muted = false; setMuted(false); }
  }, []);

  const skipBack = useCallback(() => {
    const vid = videoRef.current;
    if (vid) vid.currentTime = Math.max(0, vid.currentTime - 10);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const skipForward = useCallback(() => {
    const vid = videoRef.current;
    if (vid) vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const vid = videoRef.current;
    if (!vid || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX: number;
    if ("touches" in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
    } else {
      clientX = e.clientX;
    }
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    vid.currentTime = pct * duration;
  }, [duration]);

  const handleContainerClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("[data-controls]")) return;
    togglePlay();
    showControlsTemporarily();
  }, [togglePlay, showControlsTemporarily]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }, []);

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  if (!streamUrl) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-white/20 border-t-[#e63946] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group"
      style={{ touchAction: "manipulation" }}
      onClick={handleContainerClick}
      onMouseMove={showControlsTemporarily}
      onMouseEnter={() => { controlsHoverRef.current = true; setShowControls(true); }}
      onMouseLeave={() => { controlsHoverRef.current = false; if (playing) scheduleHide(); }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        preload="auto"
        poster={thumbnail}
        onTimeUpdate={() => {
          const vid = videoRef.current;
          if (vid) { setCurrent(vid.currentTime); setDuration(vid.duration || 0); }
        }}
        onPlay={() => { setPlaying(true); wasPlayingRef.current = true; scheduleHide(); }}
        onPause={() => { if (!videoRef.current?.ended) { setPlaying(false); setShowControls(true); } }}
        onEnded={() => { setPlaying(false); wasPlayingRef.current = false; setShowControls(true); }}
        onLoadedMetadata={() => {
          const vid = videoRef.current;
          if (vid) { setDuration(vid.duration); vid.volume = volume / 100; }
        }}
      />

      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="w-12 h-12 border-3 border-white/20 border-t-[#e63946] rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="text-center">
            <p className="text-white/70 text-sm mb-2">Failed to load video</p>
            <p className="text-white/40 text-xs">Try a different format or quality</p>
          </div>
        </div>
      )}

      {ready && !playing && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 pb-3 px-3 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        data-controls
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => { controlsHoverRef.current = true; }}
        onMouseLeave={() => { controlsHoverRef.current = false; }}
      >
        <div
          className="w-full h-2 sm:h-2.5 rounded-full cursor-pointer mb-3 relative group/seek"
          style={{ background: "rgba(255,255,255,0.2)" }}
          onClick={(e) => { e.stopPropagation(); seekTo(e); setSeeking(false); }}
          onTouchStart={(e) => { e.stopPropagation(); setSeeking(true); }}
          onTouchMove={(e) => { e.stopPropagation(); seekTo(e); }}
          onTouchEnd={(e) => { e.stopPropagation(); seekTo(e); setSeeking(false); }}
        >
          <div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ width: `${bufferProgress}%`, background: "rgba(255,255,255,0.25)" }}
          />
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-75"
            style={{ width: `${progress}%`, background: "#e63946" }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#e63946] shadow-md scale-0 group-hover/seek:scale-100 transition-transform" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); showControlsTemporarily(); }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            {playing ? <Pause className="w-5 h-5 text-white fill-white" /> : <Play className="w-5 h-5 text-white fill-white" />}
          </button>

          <button onClick={(e) => { e.stopPropagation(); skipBack(); }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors hidden sm:block" title="Back 10s">
            <RotateCcw className="w-4 h-4 text-white" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); skipForward(); }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors hidden sm:block" title="Forward 10s">
            <SkipForward className="w-4 h-4 text-white" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            {muted || volume === 0 ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
          <input type="range" min="0" max="100" value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="w-16 sm:w-20 h-1 accent-[#e63946] cursor-pointer hidden sm:block" />

          <span className="text-[11px] text-white/80 font-medium tabular-nums ml-1">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] text-white/50 truncate max-w-[80px] sm:max-w-[160px] hidden sm:block">{title}</span>
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent pt-3 pb-8 px-3 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        data-controls
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/90 font-medium truncate">{title}</span>
        </div>
      </div>
    </div>
  );
}
