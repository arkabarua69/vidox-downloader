import { X, Smartphone } from "lucide-react";

interface Props {
  onInstall: () => void;
  onDismiss: () => void;
}

export default function PwaInstallBanner({ onInstall, onDismiss }: Props) {
  return (
    <div className="sticky top-[57px] z-40 max-w-lg mx-auto px-4 sm:px-6 w-full py-2">
      <div className="rounded-2xl p-3 sm:p-4 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Install Vidox</p>
          <p className="text-xs" style={{ color: "#5a5a6e" }}>Add to home screen for faster access</p>
        </div>
        <button onClick={onInstall}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold shrink-0 active:scale-95 transition-transform"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
          Install
        </button>
        <button onClick={onDismiss}
          className="p-2 rounded-xl shrink-0 active:bg-white/10 transition-colors"
          style={{ color: "#888", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
