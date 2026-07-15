import https from "https";
import http from "http";

function followRedirects(urlStr, maxRedirects = 10, cookies = {}) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    const parsed = new URL(urlStr);
    const lib = parsed.protocol === "https:" ? https : http;
    const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.youtube.com/",
    };
    if (cookieStr) headers["Cookie"] = cookieStr;

    const req = lib.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers }, (res) => {
      const setCookies = res.headers["set-cookie"];
      if (setCookies) {
        for (const sc of (Array.isArray(setCookies) ? setCookies : [setCookies])) {
          const pair = sc.split(";")[0].trim();
          const eq = pair.indexOf("=");
          if (eq > 0) cookies[pair.substring(0, eq)] = pair.substring(eq + 1);
        }
      }

      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, urlStr).href;
        res.resume();
        resolve(followRedirects(next, maxRedirects - 1, cookies));
      } else {
        resolve({ stream: res, statusCode: res.statusCode, headers: res.headers, finalUrl: urlStr });
      }
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const fetchHeaders = {};
    if (req.headers.range) fetchHeaders.range = req.headers.range;

    const { stream, statusCode, headers } = await followRedirects(url);

    if (statusCode && statusCode >= 400) {
      stream.resume();
      return res.status(502).json({ error: `Upstream returned ${statusCode}` });
    }

    const passHeaders = ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"];
    for (const h of passHeaders) {
      if (headers[h]) res.setHeader(h, headers[h]);
    }
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    res.status(statusCode || 200);

    stream.pipe(res);
    stream.on("error", (err) => {
      console.error("STREAM_PROXY_ERROR:", err.message);
      if (!res.headersSent) res.status(502).json({ error: "Stream proxy failed" });
    });
  } catch (e) {
    console.error("STREAM_ERROR:", e.message);
    if (!res.headersSent) res.status(500).json({ error: "Invalid stream URL" });
  }
}
