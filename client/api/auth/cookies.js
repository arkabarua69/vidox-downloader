import fs from "fs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const cookiesPath = "/tmp/cookies.txt";

  if (req.method === "DELETE") {
    try {
      if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
      return res.json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === "POST") {
    const { cookies } = req.body;
    if (!cookies) return res.status(400).json({ error: "Cookies required" });
    try {
      const content = typeof cookies === "string" ? cookies : JSON.stringify(cookies);
      if (content.includes("# Netscape")) {
        fs.writeFileSync(cookiesPath, content, "utf-8");
        return res.json({ success: true });
      }
      let parsed;
      try { parsed = JSON.parse(content); } catch { fs.writeFileSync(cookiesPath, content, "utf-8"); return res.json({ success: true }); }
      let lines = ["# Netscape HTTP Cookie File"];
      if (Array.isArray(parsed)) {
        for (const c of parsed) {
          const d = c.domain || ".youtube.com";
          lines.push(`${d}\t${d.startsWith(".") ? "TRUE" : "FALSE"}\t${c.path || "/"}\t${c.secure ? "TRUE" : "FALSE"}\t${c.expirationDate ? Math.floor(c.expirationDate) : Math.floor(Date.now() / 1000 + 86400 * 365)}\t${c.name || ""}\t${c.value || ""}`);
        }
      }
      fs.writeFileSync(cookiesPath, lines.join("\n"), "utf-8");
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
}
