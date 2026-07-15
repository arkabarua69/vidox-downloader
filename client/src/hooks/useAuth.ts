import { useState, useCallback, useEffect } from "react";
import { checkAuthStatus, saveCookies, deleteCookies } from "../utils/api";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [cookieText, setCookieText] = useState("");
  const [cookieFile, setCookieFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAuthStatus().then(setAuthenticated);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage("");
    try {
      let content = cookieText;
      if (cookieFile && !cookieText) {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(cookieFile);
        });
      }
      if (!content.trim()) { setMessage("Please paste cookies or select a file."); return; }
      const result = await saveCookies(content);
      if (result.success) {
        setMessage("Cookies saved!");
        setAuthenticated(true);
        setCookieText("");
        setCookieFile(null);
      } else {
        setMessage(result.error || "Failed");
      }
    } catch (e: any) {
      setMessage("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }, [cookieText, cookieFile]);

  const clear = useCallback(async () => {
    try {
      await deleteCookies();
      setAuthenticated(false);
      setMessage("Cookies removed.");
    } catch {}
  }, []);

  return {
    authenticated, cookieText, setCookieText,
    cookieFile, setCookieFile, saving, message, save, clear,
  };
}
