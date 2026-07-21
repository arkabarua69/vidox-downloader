import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import YouTubeHeader from "./components/YouTubeHeader";
import Sidebar, { SidebarOverlay } from "./components/Sidebar";
import MobileTabBar from "./components/MobileTabBar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Features from "./components/Features";
import PwaInstallBanner from "./components/PwaInstallBanner";
import SocialBar from "./components/SocialBar";
import { useAuth } from "./hooks/useAuth";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { getHistory, addToHistory, removeFromHistory, clearHistory } from "./utils/history";
import { getPrefs, savePrefs } from "./utils/prefs";
import { fetchVideoInfo, fetchPlaylist, fetchSummary, downloadVideo, downloadPlaylist, youtubeSearch } from "./utils/api";
import type { VideoInfo, PlaylistInfo, Summary, HistoryItem } from "./utils/types";
import type { Preferences } from "./utils/prefs";
import type { SearchResult } from "./utils/api";

const YouTubeHome = lazy(() => import("./components/YouTubeHome"));
const WatchPage = lazy(() => import("./components/WatchPage"));
const SearchResults = lazy(() => import("./components/SearchResults"));
const HistoryPage = lazy(() => import("./components/HistoryPage"));
const WatchLaterPage = lazy(() => import("./components/WatchLaterPage"));
const DownloadsPage = lazy(() => import("./components/DownloadsPage"));
const AccountPage = lazy(() => import("./components/AccountPage"));
const SettingsModal = lazy(() => import("./components/SettingsModal"));
const HistoryPanel = lazy(() => import("./components/HistoryPanel"));

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-10 h-10 border-3 border-white/20 border-t-[#e63946] rounded-full animate-spin" />
  </div>
);

function getWatchLaterItems() {
  try {
    const raw = localStorage.getItem("vidox_watch_later");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveWatchLaterItems(items: any[]) {
  localStorage.setItem("vidox_watch_later", JSON.stringify(items));
}

function pathToPage(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname === "/history") return "history";
  if (pathname === "/watch-later") return "watch-later";
  if (pathname === "/downloads") return "downloads";
  if (pathname === "/account") return "account";
  if (pathname.startsWith("/watch/")) return "watch";
  if (pathname === "/search") return "search";
  return "home";
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = pathToPage(location.pathname);

  const [url, setUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pasted, setPasted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(getHistory());
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [watchLater, setWatchLater] = useState(getWatchLaterItems());
  const [prefs, setPrefs] = useState<Preferences>(getPrefs());

  const { user, ready: googleReady, login: googleLogin, logout: googleLogout, getInitials } = useGoogleAuth();
  const { authenticated } = useAuth();
  const { showInstall, setShowInstall, install: pwaInstall } = usePwaInstall();

  const onNavigate = useCallback((page: string) => {
    const routes: Record<string, string> = {
      home: "/", history: "/history", "watch-later": "/watch-later",
      downloads: "/downloads", account: "/account", search: "/search",
    };
    navigate(routes[page] || "/");
    setSidebarOpen(false);
  }, [navigate]);

  const onPaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setPasted(true);
      setTimeout(() => setPasted(false), 2000);
    } catch {}
  }, []);

  const handleUrlSubmit = useCallback(async (submittedUrl: string) => {
    setUrl(submittedUrl);
    setError("");
    setLoading(true);
    setVideoInfo(null);
    setSummary(null);
    setPlaylist(null);

    try {
      if (submittedUrl.includes("youtube.com") || submittedUrl.includes("youtu.be")) {
        const info = await fetchVideoInfo(submittedUrl);
        setVideoInfo(info);
        navigate("/downloads");
        fetchSummary(info).then(setSummary).catch(() => {});

        if (info.id) {
          try {
            const { addToWatchHistory } = await import("./utils/userHistory");
            if (user?.sub) {
              addToWatchHistory(user.sub, {
                id: info.id, title: info.title,
                channel: info.uploader, thumbnail: info.thumbnail,
              });
            }
          } catch {}
        }
      } else {
        const pl = await fetchPlaylist(submittedUrl);
        setPlaylist(pl);
        navigate("/downloads");
        setSelectedVideos(new Set(pl.videos.map((v) => v.id)));
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch video info");
    } finally {
      setLoading(false);
    }
  }, [user?.sub, navigate]);

  const onWatchVideo = useCallback(async (videoId: string) => {
    navigate(`/watch/${videoId}`);
    setVideoInfo(null);
    setSummary(null);
    setLoading(true);
    try {
      const info = await fetchVideoInfo(`https://www.youtube.com/watch?v=${videoId}`);
      setVideoInfo(info);
      fetchSummary(info).then(setSummary).catch(() => {});

      if (user?.sub) {
        try {
          const { addToWatchHistory } = await import("./utils/userHistory");
          addToWatchHistory(user.sub, {
            id: videoId, title: info.title,
            channel: info.uploader, thumbnail: info.thumbnail,
          });
        } catch {}
      }
    } catch (e: any) {
      setError(e.message || "Failed to load video");
    } finally {
      setLoading(false);
    }
  }, [user?.sub, navigate]);

  const onYouTubeSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    try {
      const data = await youtubeSearch(searchQuery);
      setSearchResults(data.results);
    } catch (e: any) {
      setError(e.message || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, navigate]);

  useEffect(() => {
    if (currentPage === "search") {
      const params = new URLSearchParams(location.search);
      const q = params.get("q");
      if (q && q !== searchQuery) {
        setSearchQuery(q);
        setSearchLoading(true);
        youtubeSearch(q)
          .then((data) => setSearchResults(data.results))
          .catch(() => setSearchResults([]))
          .finally(() => setSearchLoading(false));
      }
    }
  }, [location.pathname, location.search, currentPage]);

  useEffect(() => {
    if (currentPage === "watch") {
      const videoId = location.pathname.split("/watch/")[1];
      if (videoId && (!videoInfo || videoInfo.id !== videoId)) {
        setLoading(true);
        setVideoInfo(null);
        setSummary(null);
        fetchVideoInfo(`https://www.youtube.com/watch?v=${videoId}`)
          .then((info) => {
            setVideoInfo(info);
            fetchSummary(info).then(setSummary).catch(() => {});
            if (user?.sub) {
              import("./utils/userHistory").then(({ addToWatchHistory }) => {
                addToWatchHistory(user.sub, {
                  id: videoId, title: info.title,
                  channel: info.uploader, thumbnail: info.thumbnail,
                });
              }).catch(() => {});
            }
          })
          .catch((e) => setError(e.message || "Failed to load video"))
          .finally(() => setLoading(false));
      }
    }
  }, [location.pathname, currentPage, user?.sub]);

  const onDownload = useCallback(async (formatId: string, mode: "video" | "audio") => {
    if (!url && videoInfo) {
      setUrl(`https://www.youtube.com/watch?v=${videoInfo.id}`);
    }
    const downloadUrlStr = url || (videoInfo ? `https://www.youtube.com/watch?v=${videoInfo.id}` : "");
    if (!downloadUrlStr) return;

    setDownloading(true);
    setDownloaded(false);
    setDownloadProgress(0);

    try {
      if (videoInfo?.formats && videoInfo.formats.length > 0) {
        let chosenFormat = null;
        if (formatId && formatId.startsWith("preniv_")) {
          chosenFormat = videoInfo.formats.find((f) => f.formatId === formatId);
        }
        if (!chosenFormat && mode === "audio") {
          chosenFormat = videoInfo.formats.find((f) => f.formatNote === "audio" && f.directUrl);
        }
        if (!chosenFormat) {
          chosenFormat = videoInfo.formats.find((f) => f.directUrl && f.formatNote !== "audio");
        }
        if (!chosenFormat) {
          chosenFormat = videoInfo.formats.find((f) => f.directUrl);
        }
        if (chosenFormat?.directUrl) {
          const progressInterval = setInterval(() => {
            setDownloadProgress((prev) => {
              if (prev >= 90) return prev;
              return prev + Math.random() * 15;
            });
          }, 500);

          await new Promise<void>((resolve) => {
            setTimeout(() => { clearInterval(progressInterval); setDownloadProgress(100); resolve(); }, 2000);
          });

          setDownloadUrl(chosenFormat.directUrl);
          setDownloaded(true);

          const newHistory = addToHistory({
            id: videoInfo.id || "unknown",
            url: downloadUrlStr,
            title: videoInfo.title || "Unknown Video",
            thumbnail: videoInfo.thumbnail || "",
            uploader: videoInfo.uploader || "",
            quality: chosenFormat.qualityLabel || chosenFormat.formatId,
            mode,
            date: new Date().toLocaleDateString(),
          });
          setHistory(newHistory);

          const a = document.createElement("a");
          a.href = chosenFormat.directUrl;
          a.download = (videoInfo.title || "download") + "." + (chosenFormat.ext || "mp4");
          a.click();
          return;
        }
      }

      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      const result = await downloadVideo(downloadUrlStr, formatId, mode);
      clearInterval(progressInterval);
      setDownloadProgress(100);
      setDownloadUrl(result.downloadUrl);
      setDownloaded(true);

      const newHistory = addToHistory({
        id: videoInfo?.id || "unknown",
        url: downloadUrlStr,
        title: videoInfo?.title || "Unknown Video",
        thumbnail: videoInfo?.thumbnail || "",
        uploader: videoInfo?.uploader || "",
        quality: mode === "audio" ? formatId : formatId || "best",
        mode,
        date: new Date().toLocaleDateString(),
      });
      setHistory(newHistory);

      if (result.downloadUrl) {
        const a = document.createElement("a");
        a.href = result.downloadUrl;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e: any) {
      setError(e.message || "Download failed");
      setDownloadProgress(0);
    } finally {
      setDownloading(false);
    }
  }, [url, videoInfo]);

  const onPlaylistDownload = useCallback(async () => {
    if (!playlist || selectedVideos.size === 0) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const selectedUrls = playlist.videos
        .filter((v) => selectedVideos.has(v.id))
        .map((v) => v.url);
      const result = await downloadPlaylist(selectedUrls, prefs.defaultFormat);
      setDownloadProgress(100);

      for (const r of result.results) {
        if (r.downloadUrl) {
          const a = document.createElement("a");
          a.href = r.downloadUrl;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } catch (e: any) {
      setError(e.message || "Playlist download failed");
    } finally {
      setDownloading(false);
    }
  }, [playlist, selectedVideos, prefs.defaultFormat]);

  const onToggleWatchLater = useCallback((item: { id: string; title: string; channel: string; thumbnail: string; duration: string; url: string }) => {
    setWatchLater((prev: any[]) => {
      const exists = prev.some((w: any) => w.id === item.id);
      const next = exists ? prev.filter((w: any) => w.id !== item.id) : [...prev, item];
      saveWatchLaterItems(next);
      return next;
    });
  }, []);

  const isYoutubeLayout = currentPage !== "downloads";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f0f0f" }}>
      {isYoutubeLayout ? (
        <>
          <YouTubeHeader
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogoClick={() => onNavigate("home")}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={onYouTubeSearch}
            loading={searchLoading}
            onClear={() => setSearchQuery("")}
            downloadProgress={downloadProgress}
            user={user}
            userInitials={getInitials()}
            onLogin={googleLogin}
            onLogout={googleLogout}
          />

          <Sidebar
            collapsed={sidebarCollapsed}
            onNavigate={onNavigate}
            currentPage={currentPage}
            onInstall={pwaInstall}
            canInstall={showInstall}
            onShowSettings={() => setShowSettings(true)}
          />

          <SidebarOverlay
            show={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNavigate={onNavigate}
            currentPage={currentPage}
            onInstall={pwaInstall}
            canInstall={showInstall}
            onShowSettings={() => setShowSettings(true)}
          />

          <main className="flex-1 pt-[56px] md:pl-[240px] px-4 sm:px-6 py-6 pb-20 md:pb-6">
            {showInstall && (
              <PwaInstallBanner
                onInstall={pwaInstall}
                onDismiss={() => setShowInstall(false)}
              />
            )}

            <Suspense fallback={<Spinner />}>
              {currentPage === "home" && (
                <YouTubeHome
                  onUrlSubmit={handleUrlSubmit}
                  onWatchVideo={onWatchVideo}
                  user={user}
                />
              )}

              {currentPage === "watch" && videoInfo && (
                <WatchPage
                  video={videoInfo}
                  summary={summary}
                  onDownload={onDownload}
                  downloading={downloading}
                  downloaded={downloaded}
                  downloadProgress={downloadProgress}
                  relatedVideos={videoInfo.relatedVideos || []}
                  onWatchVideo={onWatchVideo}
                  watchLater={watchLater}
                  onToggleWatchLater={onToggleWatchLater}
                />
              )}

              {currentPage === "watch" && !videoInfo && loading && (
                <Spinner />
              )}

              {currentPage === "search" && (
                <SearchResults
                  results={searchResults}
                  query={searchQuery}
                  loading={searchLoading}
                  onWatch={onWatchVideo}
                  onDownload={(u) => handleUrlSubmit(u)}
                />
              )}

              {currentPage === "history" && (
                <HistoryPage
                  history={history}
                  onClear={() => { clearHistory(); setHistory([]); }}
                  onWatch={onWatchVideo}
                  onRemove={(id) => setHistory(removeFromHistory(id))}
                />
              )}

              {currentPage === "watch-later" && (
                <WatchLaterPage
                  items={watchLater}
                  onWatch={onWatchVideo}
                  onRemove={(id) => {
                    const next = watchLater.filter((w: any) => w.id !== id);
                    setWatchLater(next);
                    saveWatchLaterItems(next);
                  }}
                />
              )}

              {currentPage === "account" && (
                <AccountPage
                  onNavigate={onNavigate}
                  onShowSettings={() => setShowSettings(true)}
                  onInstall={pwaInstall}
                  canInstall={showInstall}
                  googleUser={user}
                  googleReady={googleReady}
                  onGoogleLogin={googleLogin}
                  onGoogleLogout={googleLogout}
                  history={history}
                  watchLater={watchLater}
                  onWatchVideo={onWatchVideo}
                />
              )}
            </Suspense>

            <SocialBar />
          </main>

          <MobileTabBar
            currentPage={currentPage}
            onNavigate={onNavigate}
            historyCount={history.length}
            googleUser={user}
          />
        </>
      ) : (
        <>
          <Header
            onSettings={() => setShowSettings(true)}
            onHistory={() => setShowHistory(true)}
            historyCount={history.length}
          />

          <main className="flex-1">
            <Suspense fallback={<Spinner />}>
              <DownloadsPage
                url={url}
                setUrl={setUrl}
                onSearch={() => handleUrlSubmit(url)}
                loading={loading}
                loadingPlaylist={loadingPlaylist}
                pasted={pasted}
                onPaste={onPaste}
                onClear={() => { setUrl(""); setVideoInfo(null); setPlaylist(null); setError(""); }}
                downloadProgress={downloadProgress}
                error={error}
                videoInfo={videoInfo}
                summary={summary}
                playlist={playlist}
                selectedVideos={selectedVideos}
                onToggleVideo={(id) => {
                  const next = new Set(selectedVideos);
                  next.has(id) ? next.delete(id) : next.add(id);
                  setSelectedVideos(next);
                }}
                onToggleAll={() => {
                  if (!playlist) return;
                  setSelectedVideos(
                    selectedVideos.size === playlist.videos.length
                      ? new Set()
                      : new Set(playlist.videos.map((v) => v.id))
                  );
                }}
                onPlaylistDownload={onPlaylistDownload}
                onCancel={() => { setPlaylist(null); setSelectedVideos(new Set()); }}
                downloading={downloading}
                downloaded={downloaded}
                downloadUrl={downloadUrl}
                onDownload={onDownload}
              />
            </Suspense>
            <Features />
          </main>

          <Footer />

          {showHistory && (
            <Suspense fallback={null}>
              <HistoryPanel
                history={history}
                setHistory={setHistory}
                onClose={() => setShowHistory(false)}
                onReDownload={(u) => {
                  setUrl(u);
                  setShowHistory(false);
                  handleUrlSubmit(u);
                }}
              />
            </Suspense>
          )}

          <MobileTabBar
            currentPage={currentPage}
            onNavigate={onNavigate}
            historyCount={history.length}
            googleUser={user}
          />
        </>
      )}

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal
            onClose={() => setShowSettings(false)}
            prefs={prefs}
            onSavePrefs={(p) => { setPrefs(p); savePrefs(p); }}
            onClearHistory={() => { clearHistory(); setHistory([]); }}
            googleUser={user}
            googleReady={googleReady}
            onGoogleLogin={googleLogin}
            onGoogleLogout={googleLogout}
          />
        </Suspense>
      )}
    </div>
  );
}
