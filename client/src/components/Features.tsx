import { Globe, Lock, Zap } from "lucide-react";

const FEATURES = [
  { icon: <Globe className="w-6 h-6" />, title: "1000+ Sites", desc: "YouTube, TikTok, Instagram, Twitter, Facebook, Reddit & more", color: "text-accent-light", bg: "from-accent/10 to-accent/5" },
  { icon: <Lock className="w-6 h-6" />, title: "Private Videos", desc: "Download private and unlisted content with cookie authentication", color: "text-success", bg: "from-success/10 to-success/5" },
  { icon: <Zap className="w-6 h-6" />, title: "All Formats", desc: "Video (MP4, WebM) and Audio (MP3, M4A) in multiple qualities", color: "text-warning", bg: "from-warning/10 to-warning/5" },
];

export default function Features() {
  return (
    <section className="max-w-4xl mx-auto px-4 pb-8 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <div key={i} className="rounded-2xl p-6 text-center transition-all group" style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.bg} ${f.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>{f.icon}</div>
            <h3 className="font-semibold text-text-primary mb-1.5">{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#8b8b9e" }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
