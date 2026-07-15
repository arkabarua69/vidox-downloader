import { Loader2 } from "lucide-react";

export default function PlaylistLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 mb-10">
      <div className="rounded-2xl p-6 text-center" style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Loader2 className="w-8 h-8 text-accent-light animate-spin mx-auto mb-3" />
        <p className="text-sm" style={{ color: "#8b8b9e" }}>Loading playlist...</p>
      </div>
    </div>
  );
}
