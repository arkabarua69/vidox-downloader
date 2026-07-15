import { Home, History, Download, User } from "lucide-react";
import type { GoogleUser } from "../hooks/useGoogleAuth";

interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
  historyCount: number;
  googleUser: GoogleUser | null;
}

const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "history", label: "History", icon: History },
  { id: "downloads", label: "Downloads", icon: Download },
];

export default function MobileTabBar({ currentPage, onNavigate, historyCount, googleUser }: Props) {
  const activeTab = ["home", "history", "downloads"].includes(currentPage) ? currentPage : "home";
  const isUserActive = currentPage === "account";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[80] flex border-t" style={{ background: "#0f0f0f", borderColor: "rgba(255,255,255,0.1)" }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button key={tab.id} onClick={() => onNavigate(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
            style={{ color: isActive ? "#f1f1f1" : "#aaa" }}>
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.id === "history" && historyCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0 rounded-full bg-[#e63946] text-white text-[8px] font-bold min-w-[14px] text-center">
                  {historyCount > 99 ? "99+" : historyCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
      <button onClick={() => onNavigate("account")}
        className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
        style={{ color: isUserActive ? "#f1f1f1" : "#aaa" }}>
        {googleUser?.picture ? (
          <img src={googleUser.picture} alt="" className={`w-6 h-6 rounded-full ${isUserActive ? "ring-2 ring-white" : ""}`} referrerPolicy="no-referrer" />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="text-[10px] font-medium">{googleUser ? "You" : "Sign In"}</span>
      </button>
    </div>
  );
}
