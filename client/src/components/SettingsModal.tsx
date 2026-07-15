import { useState } from "react";
import { X, Check, Trash2, Save, ChevronDown, LogIn, LogOut, User } from "lucide-react";
import type { Preferences } from "../utils/prefs";
import type { GoogleUser } from "../hooks/useGoogleAuth";

interface Props {
  onClose: () => void;
  prefs: Preferences;
  onSavePrefs: (p: Preferences) => void;
  onClearHistory: () => void;
  googleUser: GoogleUser | null;
  googleReady: boolean;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
}

export default function SettingsModal({ onClose, prefs, onSavePrefs, onClearHistory, googleUser, googleReady, onGoogleLogin, onGoogleLogout }: Props) {
  const [localPrefs, setLocalPrefs] = useState<Preferences>({ ...prefs });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSavePrefs(localPrefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div>
      <label className="text-xs uppercase tracking-wider mb-2 block font-medium" style={{ color: "#aaa" }}>{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-3 text-sm outline-none transition-colors cursor-pointer"
          style={{ background: "#272727", border: "1px solid #303030", color: "#f1f1f1" }}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#aaa" }} />
      </div>
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: "#f1f1f1" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#aaa" }}>{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className="relative w-12 h-7 rounded-full transition-colors"
        style={{ background: value ? "#e63946" : "rgba(255,255,255,0.1)" }}>
        <div className="absolute top-1 w-5 h-5 rounded-full bg-white transition-transform"
          style={{ left: value ? "26px" : "4px" }} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative rounded-2xl w-full max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: "#212121", border: "1px solid rgba(255,255,255,0.1)" }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#f1f1f1" }}>Settings</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors" style={{ color: "#aaa" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          <div className="border-b pb-5" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" style={{ color: "#3ea6ff" }} />
              <h3 className="text-sm font-semibold" style={{ color: "#f1f1f1" }}>Google Account</h3>
            </div>

            {googleUser ? (
              <div className="flex items-center gap-4">
                {googleUser.picture ? (
                  <img src={googleUser.picture} alt="" className="w-12 h-12 rounded-full" style={{ border: "2px solid #3ea6ff" }} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "#e63946", color: "white" }}>
                    {googleUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#f1f1f1" }}>{googleUser.name}</p>
                  <p className="text-xs truncate" style={{ color: "#aaa" }}>{googleUser.email}</p>
                </div>
                <button onClick={onGoogleLogout}
                  className="px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#aaa" }}>
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs mb-3" style={{ color: "#aaa" }}>
                  Sign in to access your private videos and playlists.
                </p>
                <button onClick={onGoogleLogin} disabled={!googleReady}
                  className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f1f1" }}>
                  <LogIn className="w-4 h-4" /> Sign in with Google
                </button>
                <div id="google-signin-container" className="mt-3 flex justify-center" />
              </div>
            )}
          </div>

          <Select label="Default Format" value={localPrefs.defaultFormat}
            onChange={(v) => setLocalPrefs({ ...localPrefs, defaultFormat: v as any })}
            options={[
              { value: "mp4", label: "MP4 (Video)" },
              { value: "mp3", label: "MP3 (Audio)" },
              { value: "webm", label: "WebM (Video)" },
            ]} />

          <Select label="Default Resolution" value={localPrefs.defaultResolution}
            onChange={(v) => setLocalPrefs({ ...localPrefs, defaultResolution: v as any })}
            options={[
              { value: "1080p", label: "1080p (Highest)" },
              { value: "720p", label: "720p (Medium)" },
              { value: "480p", label: "480p (Low)" },
              { value: "auto", label: "Auto (Best Available)" },
            ]} />

          <Select label="File Naming" value={localPrefs.fileNaming}
            onChange={(v) => setLocalPrefs({ ...localPrefs, fileNaming: v as any })}
            options={[
              { value: "title", label: "Video Title" },
              { value: "title_date", label: "Title + Date" },
              { value: "title_quality", label: "Title + Quality" },
            ]} />

          <Toggle label="Auto-Start Download" desc="Start download immediately when link is pasted"
            value={localPrefs.autoStart}
            onChange={(v) => setLocalPrefs({ ...localPrefs, autoStart: v })} />

          <div className="border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button onClick={onClearHistory}
              className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#ff6b6b" }}>
              <Trash2 className="w-4 h-4" /> Clear Download History
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            style={{ background: "linear-gradient(to right, #e63946, #ff6b6b)", color: "white" }}>
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  );
}
