import { execFile } from "child_process";
import fs from "fs";
import https from "https";
import path from "path";

const YTDLP_PATH = "/tmp/yt-dlp";
const COOKIES_PATH = "/tmp/cookies.txt";
const YTDLP_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";

const EMBEDDED_COOKIES = `# Netscape HTTP Cookie File
# https://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

.youtube.com	TRUE	/	TRUE	1792348821	__Secure-BUCKET	CLEG
.youtube.com	TRUE	/	TRUE	1818511065	PREF	f6=40000000&tz=Asia.Dhaka&f7=100
.youtube.com	TRUE	/	FALSE	1817796639	HSID	A34ngpMwCMppXOJEu
.youtube.com	TRUE	/	TRUE	1817796639	SSID	Algwd6OLyXGhfZ8-r
.youtube.com	TRUE	/	FALSE	1817796639	APISID	HMD7gsxBYDUKjOPb/AGHJ3XIL3gSPSwV3N
.youtube.com	TRUE	/	TRUE	1817796639	SAPISID	_2cPpmK0zTks-xio/ApDO_owkaf-nDRxPk
.youtube.com	TRUE	/	TRUE	1817796639	__Secure-1PAPISID	_2cPpmK0zTks-xio/ApDO_owkaf-nDRxPk
.youtube.com	TRUE	/	TRUE	1818266281	__Secure-3PAPISID	_2cPpmK0zTks-xio/ApDO_owkaf-nDRxPk
.youtube.com	TRUE	/	FALSE	1817796639	SID	g.a000_wjJAS303idBfH3FhpnVNERnYvvvAlJ-xTVukd1t6b3aS2csYn63GF9TmMago14I63mOkQACgYKAaUSARISFQHGX2Mi9BaZwtut93cxY8wKEfotnhoVAUF8yKrXovUIHk2SX_g5w6ARbcBR0076
.youtube.com	TRUE	/	TRUE	1817796639	__Secure-1PSID	g.a000_wjJAS303idBfH3FhpnVNERnYvvvAlJ-xTVukd1t6b3aS2cs951XmoJiPvdNNUD03bm-FQACgYKAYwSARISFQHGX2MitK9ooRAqpwE7U_MbziYGWxoVAUF8yKqUEmn8imC5D6_TA3Dr_-z40076
.youtube.com	TRUE	/	TRUE	1818266209	LOGIN_INFO	AFmmF2swRAIgEqEbdQqNRJ4RmU1roYX3-oUJa4PPfmb8OfumlAHDkSUCIEqXNIBaiQ2jv5Yy5n0DefMBZXIkAk-aBT0iINZqFPgz:QUQ3MjNmeEZUOHplMDJkRVRLZlJ6dkxIemNOODlrZ3lUdGlJVU1uMHliY2JWSkg2c25QLVRKS2I1emhTTUVSOHctSUZQOElKLUxMQ3cyYkJFbExwdzE0WFQ4bHo0NXNaTTlBU3NjZG11dUpjRUh1RTdWWlY0aFZ6a1poY215THU1SGJyZ292Nm53OFdJUm9lMkR1c0dOLTU1bTg2NjZoRVhB
.youtube.com	TRUE	/	TRUE	1818266281	__Secure-3PSID	g.a000_wjJAS303idBfH3FhpnVNERnYvvvAlJ-xTVukd1t6b3aS2csGZuzgcCrqcIrLBg3S_FXxAACgYKARASARISFQHGX2MiU2pZVDuUlWl4fIXQcvqs6xoVAUF8yKp0VhpufqwdFWUTWl4LtZTg0076
.youtube.com	TRUE	/	TRUE	1815484389	__Secure-1PSIDTS	sidts-CjIBPWEu2WXH27FwAfhr8swbm56sEPhv0woQ8mtUaCPiYv9VEzV2JBN8iUrermMncd2JpxAA
.youtube.com	TRUE	/	TRUE	1815484389	__Secure-3PSIDTS	sidts-CjIBPWEu2WXH27FwAfhr8swbm56sEPhv0woQ8mtUaCPiYv9VEzV2JBN8iUrermMncd2JpxAA
.youtube.com	TRUE	/	FALSE	1815487106	SIDCC	AKEyXzWBmk6bDiqtGYOMXrOWLqMLzW8vfDyHI4gQjOgNNx49W61JVD-KsUsnqJJOUNRiZh5a1Hw
.youtube.com	TRUE	/	TRUE	1815487106	__Secure-1PSIDCC	AKEyXzUvaFWw0imew2EjeMWPicP8nC0WWLyCHwYPyHJ3XAZ2J7xHx19_nq5fXVJK6tbIwbTyCP4
.youtube.com	TRUE	/	TRUE	1815487106	__Secure-3PSIDCC	AKEyXzX-9puDdFUf4JK7DZ0JdUgjY4OfPit87UB2ZO1ttqzn9ZGkxT9erazuWb89DSChL5P8I1I
.youtube.com	TRUE	/	TRUE	1799503063	VISITOR_INFO1_LIVE	p0Kv8uV_oCc
.youtube.com	TRUE	/	TRUE	1799503063	VISITOR_PRIVACY_METADATA	CgJCRBIEGgAgEg%3D%3D
.youtube.com	TRUE	/	TRUE	1799438181	__Secure-YNID	19.YT=XC4HiaNiobhbKtzlyIaykvMax2z0Zt73iYQcm5QjqiuuAlE6P8dHG_da7H0HPNrnlov5pGnYnnPTKnIrbIIXqjL9bFeEm-W24oD9exVFBS9IiqZpl9F2T-Y7Q75jAYjWF_GDoSMsqJCPgi_EMhmzpjwuibYz-sUwLFo47T8K-JN8SO8LgT0cJyJsWCkobP7ywAoItZ4PGVSIHFX7rxwh8Bg_HSp0u6sxaEGucMTKvgcdIbEiR945nuC7jAts_OQ6wL6uU_2xrLv9yg-QWHZfrNsemOvphMVwkU-TZflbH_ggKbWc9_RumzpFo0COEpaQBWEYBS5VWiUiMpm0tNRg8g
.youtube.com	TRUE	/	TRUE	1799438181	__Secure-ROLLOUT_TOKEN	CMDygfX136i3VBC33PP6y_-TAxjUso-txs6VAw%3D%3D
.youtube.com	TRUE	/	TRUE	0	YSC	6UIJi4xYyGE`;

let ytDlpReady = null;

function getServerCookies() {
  // Priority 1: Environment variable (Base64 encoded)
  if (process.env.YOUTUBE_COOKIES) {
    try {
      return Buffer.from(process.env.YOUTUBE_COOKIES, "base64").toString("utf-8");
    } catch {}
  }
  // Priority 2: Hardcoded fallback
  return EMBEDDED_COOKIES;
}

function ensureCookies() {
  try {
    const cookies = getServerCookies();
    fs.writeFileSync(COOKIES_PATH, cookies, "utf-8");
  } catch(e) {}
}

function downloadYtDlp() {
  if (ytDlpReady) return ytDlpReady;
  ytDlpReady = new Promise((resolve, reject) => {
    try {
      ensureCookies();
      if (fs.existsSync(YTDLP_PATH)) {
        try { fs.chmodSync(YTDLP_PATH, 0o755); } catch(e) {}
        return resolve();
      }
    } catch(e) {}

    const doDownload = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const parsed = new URL(url);
      const options = { hostname: parsed.hostname, path: parsed.pathname + parsed.search };
      https.get(options, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return doDownload(response.headers.location, redirects + 1);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`Download failed: ${response.statusCode}`));
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          try {
            const buf = Buffer.concat(chunks);
            fs.writeFileSync(YTDLP_PATH, buf);
            fs.chmodSync(YTDLP_PATH, 0o755);
            resolve();
          } catch (e) { reject(e); }
        });
        response.on("error", reject);
      }).on("error", reject);
    };
    doDownload(YTDLP_URL);
  });
  return ytDlpReady;
}

function runYtDlp(args, timeout = 55000) {
  const nodePath = process.execPath || "/usr/bin/node";
  const env = { ...process.env, PATH: `${path.dirname(nodePath)}:${process.env.PATH || ""}` };
  return new Promise((resolve, reject) => {
    execFile(YTDLP_PATH, ["--js-runtimes", `node:${nodePath}`, ...args], { timeout, maxBuffer: 10 * 1024 * 1024, env }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve({ stdout, stderr });
    });
  });
}

async function getProxyArgs() {
  try {
    const { getProxy, getProxyCount } = await import("./proxy.js");
    const proxy = await getProxy();
    if (proxy) return ["--proxy", proxy];
  } catch {}
  return [];
}

function parseInfo(stdout) {
  const info = JSON.parse(stdout);
  const formats = (info.formats || [])
    .filter((f) => f.vcodec !== "none" || f.acodec !== "none")
    .map((f) => ({
      formatId: f.format_id, ext: f.ext, resolution: f.resolution || "audio only",
      fps: f.fps, vcodec: f.vcodec, acodec: f.acodec, filesize: f.filesize,
      formatNote: f.format_note, qualityLabel: f.quality_label, tbr: f.tbr,
    }));
  return {
    id: info.id, title: info.title || "Untitled",
    thumbnail: info.thumbnail || (info.thumbnails?.length ? info.thumbnails[info.thumbnails.length - 1].url : ""),
    duration: info.duration, duration_string: info.duration_string || "",
    uploader: info.uploader || info.creator || info.channel || "",
    upload_date: info.upload_date || "", view_count: info.view_count || 0,
    description: (info.description || "").substring(0, 300),
    extractor: info.extractor || "", webpage_url: info.webpage_url || "",
    formats,
  };
}

export { downloadYtDlp, runYtDlp, parseInfo, YTDLP_PATH, COOKIES_PATH, ensureCookies, getProxyArgs, getServerCookies, EMBEDDED_COOKIES };
