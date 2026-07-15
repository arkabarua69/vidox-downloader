import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const getMediaSrc = useCallback(() => {
    if (!streamUrl) return "";
    if (streamUrl.includes("/api/stream?url=") || streamUrl.startsWith(window.location.origin)) return streamUrl;
    return `/api/stream?url=${encodeURIComponent(streamUrl)}`;
  }, [streamUrl]);

  function startSilentAudio() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      if (!silentAudioRef.current) {
        const audio = new Audio();
        audio.loop = true;
        audio.muted = false;
        audio.volume = 0.001;
        const src = ctx.createMediaElementSource(audio);
        const gain = ctx.createGain();
        gain.gain.value = 0.001;
        src.connect(gain);
        gain.connect(ctx.destination);
        silentAudioRef.current = audio;
        audio.play().catch(() => {});
      } else {
        silentAudioRef.current.play().catch(() => {});
      }

      if (ctx.state === "suspended") ctx.resume();
    } catch {}
  }

  function stopSilentAudio() {
    try {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
        silentAudioRef.current.src = "";
        silentAudioRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch {}
  }

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

  async function resumeIfPaused() {
    const vid = videoRef.current;
    if (!vid || vid.ended) return;
    if (vid.paused && wasPlayingRef.current) {
      try {
        if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
        await vid.play();
      } catch {}
    }
  }

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !getMediaSrc()) return;

    vid.src = getMediaSrc();
    vid.load();
    setReady(false);
    setError(false);
    setCurrent(0);
    setDuration(0);
    setPlaying(false);

    const onCanPlay = () => {
      setReady(true);
      vid.play().then(() => {
        setPlaying(true);
        wasPlayingRef.current = true;
        requestWakeLock();
        startSilentAudio();
      }).catch(() => {});
    };

    const onError = () => setError(true);

    vid.addEventListener("canplay", onCanPlay, { once: true });
    vid.addEventListener("error", onError);

    return () => {
      vid.removeEventListener("canplay", onCanPlay);
      vid.removeEventListener("error", onError);
      vid.pause();
      vid.src = "";
      wasPlayingRef.current = false;
      releaseWakeLock();
      stopSilentAudio();
    };
  }, [videoId, getMediaSrc]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        wasPlayingRef.current = !videoRef.current?.paused;
        if (audioCtxRef.current?.state === "running") {
          audioCtxRef.current.suspend().catch(() => {});
        }
        if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        keepAliveRef.current = setInterval(() => {
          const v = videoRef.current;
          if (v && v.paused && !v.ended && v.currentTime > 0) {
            if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
            v.play().catch(() => {});
          }
        }, 3000);
      } else {
        if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
        requestWakeLock();
        resumeIfPaused();
      }
    };

    const handlePageHide = () => {
      wasPlayingRef.current = !videoRef.current?.paused;
    };

    const handlePageShow = () => {
      resumeIfPaused();
      requestWakeLock();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("pagehide", handlePageHide);
    document.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("pageshow", handlePageShow);
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const updateMediaSession = () => {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: "Vidox",
        artwork: thumbnail ? [{ src: thumbnail, sizes: "480x360", type: "image/jpeg" }] : [],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        const vid = videoRef.current;
        if (vid) {
          vid.play().then(() => {
            setPlaying(true);
            wasPlayingRef.current = true;
            requestWakeLock();
            startSilentAudio();
          }).catch(() => {});
        }
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        const vid = videoRef.current;
        if (vid) {
          vid.pause();
          setPlaying(false);
          wasPlayingRef.current = false;
        }
      });

      navigator.mediaSession.setActionHandler("seekbackward", () => {
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      });

      navigator.mediaSession.setActionHandler("seekforward", () => {
        if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
      });

      navigator.mediaSession.setActionHandler("stop", () => {
        const vid = videoRef.current;
        if (vid) {
          vid.pause();
          vid.currentTime = 0;
          setPlaying(false);
          wasPlayingRef.current = false;
        }
      });
    };

    updateMediaSession();

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
  }, [title, thumbnail]);

  useEffect(() => {
    const handlePlay = () => {
      wasPlayingRef.current = true;
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    };
    const handlePause = () => {
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    };

    const vid = videoRef.current;
    if (vid) {
      vid.addEventListener("play", handlePlay);
      vid.addEventListener("pause", handlePause);
      return () => {
        vid.removeEventListener("play", handlePlay);
        vid.removeEventListener("pause", handlePause);
      };
    }
  }, [videoId]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
      stopSilentAudio();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (playing) {
      vid.pause();
      setPlaying(false);
      wasPlayingRef.current = false;
    } else {
      vid.play().then(() => {
        setPlaying(true);
        wasPlayingRef.current = true;
        requestWakeLock();
        startSilentAudio();
      }).catch(() => {});
    }
    showControlsTemporarily();
  }, [playing, showControlsTemporarily]);

  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  const changeVolume = useCallback((val: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = val / 100;
    setVolume(val);
    if (val === 0) { vid.muted = true; setMuted(true); }
    else if (muted) { vid.muted = false; setMuted(false); }
  }, [muted]);

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
    showControlsTemporarily();
  }, [duration, showControlsTemporarily]);

  const handleContainerClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("[data-controls]")) return;
    togglePlay();
  }, [togglePlay]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }, []);

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const showControls = controlsVisible || playing === false;

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
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black"
      style={{ touchAction: "manipulation" }}
      onClick={handleContainerClick}
      onTouchEnd={showControlsTemporarily}
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
        onPlay={() => { setPlaying(true); wasPlayingRef.current = true; }}
        onPause={() => {
          if (!videoRef.current?.ended) setPlaying(false);
        }}
        onEnded={() => { setPlaying(false); wasPlayingRef.current = false; }}
        onLoadedMetadata={() => {
          const vid = videoRef.current;
          if (vid) { setDuration(vid.duration); vid.volume = volume / 100; }
        }}
      />

      {(!ready || !streamUrl) && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
          <div className="w-12 h-12 border-3 border-white/20 border-t-[#e63946] rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
          <div className="text-center">
            <p className="text-white/70 text-sm mb-2">Failed to load video</p>
            <button onClick={() => { setError(false); const vid = videoRef.current; if (vid) { vid.src = getMediaSrc(); vid.load(); } }} className="text-[#e63946] text-sm font-medium hover:underline">Retry</button>
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
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-2 px-3 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        data-controls
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div
          className="w-full h-1.5 rounded-full cursor-pointer mb-3 relative"
          style={{ background: "rgba(255,255,255,0.2)" }}
          onClick={(e) => { e.stopPropagation(); seekTo(e); }}
          onTouchEnd={(e) => { e.stopPropagation(); seekTo(e); }}
        >
          <div className="h-full rounded-full relative" style={{ width: `${progress}%`, background: "#e63946" }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#e63946] shadow-md" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            {playing ? <Pause className="w-5 h-5 text-white fill-white" /> : <Play className="w-5 h-5 text-white fill-white" />}
          </button>

          <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            {muted || volume === 0 ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
          <input type="range" min="0" max="100" value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="w-16 sm:w-20 h-1 accent-[#e63946] cursor-pointer hidden sm:block" />

          <span className="text-[11px] text-white/80 font-medium tabular-nums">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] text-white/50 truncate max-w-[100px] sm:max-w-[120px] hidden sm:block">{title}</span>
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
