import { X } from "lucide-react";

interface Props {
  error: string;
}

export default function ErrorBanner({ error }: Props) {
  if (!error) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 mb-6">
      <div className="rounded-xl p-4 border text-accent-light text-sm flex items-start gap-2" style={{ background: "#1a1a22", borderColor: "rgba(230,57,70,0.3)" }}>
        <X className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p>{error}</p>
        </div>
      </div>
    </div>
  );
}
