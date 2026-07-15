export default function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 mb-10">
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="aspect-video shimmer" style={{ background: "rgba(255,255,255,0.03)" }} />
        <div className="p-6 space-y-3">
          <div className="h-5 shimmer rounded-lg w-3/4" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="h-4 shimmer rounded-lg w-1/2" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="flex gap-3 mt-4">
            <div className="h-10 shimmer rounded-xl flex-1" style={{ background: "rgba(255,255,255,0.03)" }} />
            <div className="h-10 shimmer rounded-xl flex-1" style={{ background: "rgba(255,255,255,0.03)" }} />
            <div className="h-10 shimmer rounded-xl flex-1" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
