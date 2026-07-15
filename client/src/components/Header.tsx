import { Play, Settings, FolderOpen, History, Zap, Shield, Sparkles } from "lucide-react";
import { isElectron } from "../utils/types";

interface Props {
  onSettings: () => void;
  onHistory: () => void;
  historyCount: number;
}

export default function Header({ onSettings, onHistory, historyCount }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: "#111115", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center glow-red-sm">
            <Play className="w-4.5 h-4.5 text-white fill-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            <span className="gradient-text">Vidox</span> Downloader
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-5 text-sm font-medium" style={{ color: "#8b8b9e" }}>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-accent-light" /> Fast</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-success" /> Safe</span>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-warning" /> Free</span>
          </div>
          {isElectron && (
            <button onClick={() => window.electronAPI?.openDownloads()} className="rounded-xl p-2.5 transition-all hover:bg-white/5" style={{ color: "#8b8b9e" }} title="Open Downloads">
              <FolderOpen className="w-4.5 h-4.5" />
            </button>
          )}
          <button onClick={onHistory} className="hidden sm:flex relative rounded-xl p-2.5 transition-all hover:bg-white/5" style={{ color: "#8b8b9e" }} title="Download History">
            <History className="w-4.5 h-4.5" />
            {historyCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2" style={{ borderColor: "#111115" }} />}
          </button>
          <button onClick={onSettings} className="relative rounded-xl p-2.5 transition-all" style={{ color: "#8b8b9e", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} title="Settings">
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
