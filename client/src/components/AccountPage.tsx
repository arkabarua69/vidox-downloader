import { Home, Download, Settings, Smartphone, LogIn, LogOut, User, Clock, ChevronRight } from "lucide-react";
import type { GoogleUser } from "../hooks/useGoogleAuth";
import type { HistoryItem } from "../utils/history";

interface Props {
  onNavigate: (page: string) => void;
  onShowSettings: () => void;
  onInstall?: () => void;
  canInstall?: boolean;
  googleUser: GoogleUser | null;
  googleReady: boolean;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
  history: HistoryItem[];
  watchLater: { id: string; title: string; channel: string; thumbnail: string; duration: string; url: string }[];
  onWatchVideo: (id: string) => void;
}

export default function AccountPage({ onNavigate, onShowSettings, onInstall, canInstall, googleUser, googleReady, onGoogleLogin, onGoogleLogout, history, watchLater, onWatchVideo }: Props) {
  const recentHistory = history.slice(0, 10);

  return (
    <div className="min-h-[calc(100vh-112px)] pb-24">
      <div className="flex flex-col items-center py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {googleUser ? (
          <>
            {googleUser.picture ? (
              <img src={googleUser.picture} alt="" className="w-20 h-20 rounded-full mb-3" style={{ border: "3px solid #3ea6ff" }} referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3" style={{ background: "#e63946", color: "white" }}>
                {googleUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )}
            <p className="text-lg font-semibold" style={{ color: "#f1f1f1" }}>{googleUser.name}</p>
            <p className="text-sm mt-0.5" style={{ color: "#aaa" }}>{googleUser.email}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={onGoogleLogout}
                className="px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa" }}>
                <LogOut className="w-4 h-4" /> Switch
              </button>
              <button onClick={onGoogleLogout}
                className="px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
                style={{ background: "rgba(62,166,255,0.15)", border: "1px solid rgba(62,166,255,0.3)", color: "#3ea6ff" }}>
                <LogOut className="w-4 h-4" /> Google Account
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <User className="w-10 h-10" style={{ color: "#aaa" }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: "#f1f1f1" }}>Sign in</p>
            <p className="text-sm mt-0.5" style={{ color: "#aaa" }}>Access your private videos</p>
            <button onClick={onGoogleLogin} disabled={!googleReady}
              className="mt-4 px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
              style={{ background: "rgba(62,166,255,0.15)", border: "1px solid rgba(62,166,255,0.3)", color: "#3ea6ff" }}>
              <LogIn className="w-4 h-4" /> Sign in with Google
            </button>
            <div id="google-signin-container" className="mt-3" />
          </>
        )}
      </div>

      {recentHistory.length > 0 && (
        <div className="py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between px-4 mb-3">
            <p className="text-sm font-semibold" style={{ color: "#f1f1f1" }}>History</p>
            <button onClick={() => onNavigate("history")} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#3ea6ff" }}>
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
            {recentHistory.map((item) => (
              <button key={item.id} onClick={() => onWatchVideo(item.id)}
                className="shrink-0 w-[140px] flex flex-col gap-1.5 text-left" style={{ scrollSnapAlign: "start" }}>
                <div className="w-full aspect-video rounded-lg overflow-hidden relative" style={{ background: "#1a1a1a" }}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6" style={{ color: "#555" }} /></div>
                  )}
                </div>
                <p className="text-xs font-medium line-clamp-2" style={{ color: "#f1f1f1" }}>{item.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="py-4">
        <p className="text-sm font-semibold px-4 mb-3" style={{ color: "#f1f1f1" }}>Playlists</p>

        <button onClick={() => onNavigate("watch-later")}
          className="w-full flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Clock className="w-5 h-5" style={{ color: "#f1f1f1" }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium" style={{ color: "#f1f1f1" }}>Watch Later</p>
            <p className="text-xs" style={{ color: "#aaa" }}>{watchLater.length} videos</p>
          </div>
          <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#aaa" }} />
        </button>

        <button onClick={() => onNavigate("downloads")}
          className="w-full flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Download className="w-5 h-5" style={{ color: "#f1f1f1" }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium" style={{ color: "#f1f1f1" }}>Other Downloads</p>
            <p className="text-xs" style={{ color: "#aaa" }}>Download videos</p>
          </div>
          <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#aaa" }} />
        </button>
      </div>

      <div className="py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {canInstall && onInstall && (
          <button onClick={onInstall}
            className="w-full flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(62,166,255,0.1)" }}>
              <Smartphone className="w-5 h-5" style={{ color: "#3ea6ff" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#3ea6ff" }}>Install App</p>
          </button>
        )}

        <button onClick={onShowSettings}
          className="w-full flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Settings className="w-5 h-5" style={{ color: "#f1f1f1" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "#f1f1f1" }}>Settings</p>
        </button>
      </div>

      <div className="px-4 pt-6 pb-4 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-center gap-4 mb-3">
          <button className="text-xs" style={{ color: "#aaa" }}>Privacy Policy</button>
          <button className="text-xs" style={{ color: "#aaa" }}>Terms of Service</button>
        </div>
        <p className="text-xs" style={{ color: "#717171" }}>Vidox Downloader &copy; 2026. All rights reserved.</p>
        <p className="text-xs mt-1" style={{ color: "#555" }}>Powered by <span style={{ color: "#e63946" }}>Mac GunJon</span></p>
      </div>
    </div>
  );
}
