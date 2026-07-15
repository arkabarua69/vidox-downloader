import { Home, Clock, History, Download, ChevronDown, Smartphone, Settings } from "lucide-react";

interface Props {
  collapsed: boolean;
  onNavigate: (page: string) => void;
  currentPage: string;
  onInstall?: () => void;
  canInstall?: boolean;
  onShowSettings?: () => void;
}

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "history", label: "History", icon: History },
  { id: "watch-later", label: "Watch Later", icon: Clock },
  { id: "downloads", label: "Other Downloads", icon: Download },
];

function SidebarItem({ item, collapsed, active, onClick }: { item: { label: string; icon: React.ElementType }; collapsed: boolean; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-5 px-3 py-0 rounded-lg text-sm transition-colors ${active ? "bg-white/10 font-medium" : "hover:bg-white/5"}`}
      style={{ color: active ? "#f1f1f1" : "#aaa", height: "40px" }}
    >
      <Icon className="w-5 h-5 shrink-0" style={active ? { color: "#f1f1f1" } : undefined} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

export default function Sidebar({ collapsed, onNavigate, currentPage, onInstall, canInstall, onShowSettings }: Props) {
  if (collapsed) {
    return (
      <aside className="fixed left-0 top-[56px] w-[72px] h-[calc(100vh-56px)] overflow-y-auto py-2 px-1 z-40 hidden md:block" style={{ background: "#0f0f0f" }}>
        {NAV_ITEMS.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className="w-full flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: currentPage === item.id ? "#f1f1f1" : "#aaa" }}>
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
        {canInstall && onInstall && (
          <button onClick={onInstall}
            className="w-full flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "#3ea6ff" }}>
            <Smartphone className="w-5 h-5" />
            <span className="text-[10px]">Install</span>
          </button>
        )}
        {onShowSettings && (
          <button onClick={onShowSettings}
            className="w-full flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "#aaa" }}>
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-[56px] w-[240px] h-[calc(100vh-56px)] overflow-y-auto py-3 px-3 z-40 hidden md:block" style={{ background: "#0f0f0f" }}>
      <div className="pb-3 mb-1">
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.id} item={item} collapsed={false} active={currentPage === item.id} onClick={() => onNavigate(item.id)} />
        ))}
        {canInstall && onInstall && (
          <button onClick={onInstall}
            className="w-full flex items-center gap-5 px-3 py-0 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: "#3ea6ff", height: "40px" }}>
            <Smartphone className="w-5 h-5 shrink-0" />
            <span className="truncate">Install App</span>
          </button>
        )}
        {onShowSettings && (
          <button onClick={onShowSettings}
            className="w-full flex items-center gap-5 px-3 py-0 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: "#aaa", height: "40px" }}>
            <Settings className="w-5 h-5 shrink-0" />
            <span className="truncate">Settings</span>
          </button>
        )}
      </div>

      <div className="border-t pt-3 mt-2 px-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "#717171" }}>
          Privacy Policy<br />
          Terms of Service
        </p>
        <p className="text-xs mt-3" style={{ color: "#717171" }}>Vidox Downloader &copy; 2026. All rights reserved.</p>
        <p className="text-xs mt-1" style={{ color: "#717171" }}>Powered by Mac GunJon</p>
      </div>
    </aside>
  );
}

export function SidebarOverlay({ show, onClose, onNavigate, currentPage, onInstall, canInstall, onShowSettings }: { show: boolean; onClose: () => void; onNavigate: (page: string) => void; currentPage: string; onInstall?: () => void; canInstall?: boolean; onShowSettings?: () => void }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute left-0 top-0 w-[280px] h-full overflow-y-auto py-3 px-3" style={{ background: "#212121" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-5 px-3 mb-4">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" style={{ color: "#f1f1f1" }}>
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
          <span className="text-lg font-semibold" style={{ color: "#f1f1f1" }}>Menu</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <button key={item.id} onClick={() => { onNavigate(item.id); onClose(); }}
            className={`w-full flex items-center gap-5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors`}
            style={{ color: currentPage === item.id ? "#f1f1f1" : "#ddd" }}>
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
        {canInstall && onInstall && (
          <button onClick={() => { onInstall(); onClose(); }}
            className="w-full flex items-center gap-5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "#3ea6ff" }}>
            <Smartphone className="w-5 h-5" />
            <span className="text-sm">Install App</span>
          </button>
        )}
        {onShowSettings && (
          <button onClick={() => { onShowSettings(); onClose(); }}
            className="w-full flex items-center gap-5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "#ddd" }}>
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>
        )}
      </div>
    </div>
  );
}
