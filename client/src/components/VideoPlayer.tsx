import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Hls from "hls.js";

interface Props {
  src: string;
  poster?: string;
  title?: string;
  uploader?: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export interface VideoPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  getVideo: () => HTMLVideoElement | null;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(
  { src, poster, title, uploader, onEnded, autoPlay = false },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState(false);

  useImperativeHandle(ref, () => ({
    play: async () => {
      const v = videoRef.current;
      if (v) try { await v.play(); } catch {}
    },
    pause: () => {
      const v = videoRef.current;
      if (v) v.pause();
    },
    getVideo: () => videoRef.current,
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(false);

    if (src.includes(".m3u8") || src.includes("manifest")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          startFragPrefetch: true,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError(true);
            hls.destroy();
          }
        });
        return () => { hls.destroy(); hlsRef.current = null; };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", () => {
          if (autoPlay) video.play().catch(() => {});
        });
      }
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        if (autoPlay) video.play().catch(() => {});
      });
    }
  }, [src, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => onEnded?.();
    video.addEventListener("ended", handler);
    return () => video.removeEventListener("ended", handler);
  }, [onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !("mediaSession" in navigator)) return;

    const onPlay = () => {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || "Vidox",
        artist: uploader || "",
        artwork: poster ? [{ src: poster, sizes: "512x512", type: "image/jpeg" }] : [],
      });

      navigator.mediaSession.setActionHandler("play", () => { video.play().catch(() => {}); });
      navigator.mediaSession.setActionHandler("pause", () => { video.pause(); });
      navigator.mediaSession.setActionHandler("seekbackward", (d) => {
        video.currentTime = Math.max(0, video.currentTime - (d.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler("seekforward", (d) => {
        video.currentTime = Math.min(video.duration, video.currentTime + (d.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };

    video.addEventListener("play", onPlay);
    return () => {
      video.removeEventListener("play", onPlay);
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
      } catch {}
    };
  }, [title, uploader, poster]);

  if (error) {
    return (
      <div className="w-full aspect-video rounded-xl bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium mb-2" style={{ color: "#f1f1f1" }}>Unable to play video</p>
          <p className="text-xs" style={{ color: "#aaa" }}>Try downloading instead</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="w-full aspect-video rounded-xl bg-black"
      controls
      playsInline
      preload="auto"
      poster={poster}
      style={{ touchAction: "manipulation" }}
    />
  );
});

export default VideoPlayer;
