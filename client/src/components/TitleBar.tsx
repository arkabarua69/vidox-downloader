import { useState, useEffect } from "react";
import { Play, Minus, Square, Maximize2, X } from "lucide-react";
import { isElectron } from "../utils/types";

export default function TitleBar() {
  const [isMax, setIsMax] = useState(false);
  useEffect(() => { window.electronAPI?.isMaximized().then(setIsMax); }, []);
  if (!isElectron) return null;

  return (
    <div className="flex items-center justify-between h-10 border-b select-none"
         style={{ background: "#111115", borderColor: "rgba(255,255,255,0.06)", WebkitAppRegion: "drag" } as any}>
      <div className="flex items-center gap-2 px-4">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
          <Play className="w-2.5 h-2.5 text-white fill-white" />
        </div>
        <span className="text-xs font-semibold" style={{ color: "#8b8b9e" }}>Vidox Downloader</span>
      </div>
      <div className="flex items-center" style={{ WebkitAppRegion: "no-drag" } as any}>
        <button onClick={() => window.electronAPI?.minimize()} className="w-11 h-10 flex items-center justify-center hover:bg-white/5 transition-colors" style={{ color: "#5a5a6e" }}>
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => window.electronAPI?.maximize()} className="w-11 h-10 flex items-center justify-center hover:bg-white/5 transition-colors" style={{ color: "#5a5a6e" }}>
          {isMax ? <Square className="w-3 h-3" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <button onClick={() => window.electronAPI?.close()} className="w-11 h-10 flex items-center justify-center hover:bg-accent transition-colors" style={{ color: "#5a5a6e" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
