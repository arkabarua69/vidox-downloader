import { useState, useEffect, useCallback } from "react";

const CLIENT_ID = "695749376382-2o1iv7cb6a8ph6hrs7lhubr3sknh3s4a.apps.googleusercontent.com";
const STORAGE_KEY = "vidox_google_user";

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (parent: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function loadGIS(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export function useGoogleAuth() {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGIS().then(() => {
      window.google?.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (!response.credential) return;
          try {
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            const googleUser: GoogleUser = {
              name: payload.name || "",
              email: payload.email || "",
              picture: payload.picture || "",
              sub: payload.sub || "",
            };
            setUser(googleUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
          } catch {}
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setReady(true);
    });
  }, []);

  const login = useCallback(() => {
    window.google?.accounts.id.prompt((notification) => {
      if (notification?.isNotDisplayed?.()) {
        renderFallbackButton();
      }
    });
  }, []);

  const renderFallbackButton = useCallback(() => {
    const container = document.getElementById("google-signin-container");
    if (container && window.google?.accounts?.id) {
      container.innerHTML = "";
      window.google.accounts.id.renderButton(container, {
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        shape: "pill",
        logo_alignment: "left",
      });
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    if (window.google?.accounts?.id) {
      (window.google.accounts.id as any).disableAutoSelect?.();
    }
  }, []);

  const getInitials = useCallback(() => {
    if (!user) return "";
    return user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }, [user]);

  return { user, ready, login, logout, getInitials };
}
