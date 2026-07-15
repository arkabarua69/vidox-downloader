import { useState, useRef, useEffect } from "react";
import { Menu, Search, Play, X, Loader2, LogOut, User } from "lucide-react";
import type { GoogleUser } from "../hooks/useGoogleAuth";

interface Props {
  onToggleSidebar: () => void;
  onLogoClick: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  onClear: () => void;
  downloadProgress: number;
  user: GoogleUser | null;
  userInitials: string;
  onLogin: () => void;
  onLogout: () => void;
}

export default function YouTubeHeader({
  onToggleSidebar, onLogoClick, searchQuery, setSearchQuery, onSearch, loading,
  onClear, downloadProgress, user, userInitials, onLogin, onLogout,
}: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[56px] flex items-center px-2 sm:px-4 gap-2 sm:gap-4" style={{ background: "#0f0f0f" }}>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button onClick={onToggleSidebar} className="hidden md:block p-2 rounded-full hover:bg-white/10 transition-colors" style={{ color: "#f1f1f1" }}>
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={onLogoClick} className="flex items-center gap-1 no-underline bg-transparent border-none cursor-pointer">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#e63946] to-[#ff6b6b] flex items-center justify-center shrink-0">
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-white" />
          </div>
          <span className="text-base sm:text-lg font-bold" style={{ color: "#f1f1f1" }}>Vidox</span>
        </button>
      </div>

      <div className="flex-1 max-w-[640px] mx-auto min-w-0">
        <div className="flex items-center">
          <div className="flex-1 flex items-center rounded-l-full overflow-hidden"
            style={{
              background: "#121212",
              border: searchFocused ? "1px solid #3ea6ff" : "1px solid #303030",
              borderRight: "none",
            }}>
            {searchFocused && (
              <Search className="w-4 h-4 ml-3 sm:ml-4 shrink-0" style={{ color: "#f1f1f1" }} />
            )}
            {!searchFocused && searchQuery && (
              <Search className="w-4 h-4 ml-3 sm:ml-4 shrink-0" style={{ color: "#f1f1f1" }} />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
              placeholder="Search"
              className="flex-1 bg-transparent border-none outline-none px-3 sm:px-4 py-2 text-sm min-w-0"
              style={{ color: "#f1f1f1" }}
            />
            {searchQuery && (
              <button onClick={onClear} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0" style={{ color: "#aaa" }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onSearch}
            disabled={!searchQuery.trim() || loading}
            className="px-4 sm:px-5 py-2 rounded-r-full flex items-center gap-2 transition-colors hover:bg-white/10 disabled:opacity-40 shrink-0"
            style={{ background: "#222222", border: "1px solid #303030", color: "#f1f1f1", height: "40px" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
        {downloadProgress > 0 && (
          <div className="h-0.5 rounded-full overflow-hidden mt-1" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full bg-[#e63946] rounded-full transition-all duration-500" style={{ width: `${downloadProgress}%` }} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <div className="relative hidden md:block" ref={menuRef}>
          {user ? (
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-white/20 transition-all flex items-center justify-center text-xs font-bold"
              style={{ background: "#e63946", color: "white" }}
              title={user.name}>
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : userInitials}
            </button>
          ) : (
            <button onClick={onLogin}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors hover:bg-white/10"
              style={{ border: "1px solid #3ea6ff", color: "#3ea6ff" }}>
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Sign in</span>
            </button>
          )}

          {showUserMenu && user && (
            <div className="absolute right-0 top-full mt-2 w-[280px] rounded-xl py-3 shadow-2xl z-[100]"
              style={{ background: "#282828", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="px-4 pb-3 mb-3 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold" style={{ background: "#e63946", color: "white" }}>
                  {user.picture ? <img src={user.picture} alt="" className="w-full h-full object-cover" /> : userInitials}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#f1f1f1" }}>{user.name}</p>
                  <p className="text-xs" style={{ color: "#aaa" }}>{user.email}</p>
                </div>
              </div>
              <button onClick={() => { onLogout(); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-sm"
                style={{ color: "#f1f1f1" }}>
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
