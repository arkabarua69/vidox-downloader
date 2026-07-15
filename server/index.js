const express = require("express");
const cors = require("cors");
const path = require("path");
const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

function findYtDlp() {
  const candidates = [
    path.join(__dirname, "..", "bin-win", "yt-dlp.exe"),
    path.join(__dirname, "..", "bin-win", "yt-dlp"),
    path.join(__dirname, "bin", "yt-dlp.exe"),
    path.join(__dirname, "bin", "yt-dlp"),
    path.join(os.homedir(), "AppData", "Local", "Programs", "Python", "Python314", "Scripts", "yt-dlp.exe"),
    path.join(os.homedir(), "AppData", "Local", "Programs", "Python", "Python314", "Scripts", "yt-dlp"),
    "/tmp/yt-dlp",
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
  ];
  for (const p of candidates) { if (fs.existsSync(p)) return p; }
  throw new Error("yt-dlp not found!");
}

function findCookies() {
  const candidates = [
    path.join(__dirname, "..", "bin-win", "cookies.txt"),
    path.join(__dirname, "bin", "cookies.txt"),
    path.join(os.tmpdir(), "ytdownloader-cookies", "cookies.txt"),
  ];
  for (const p of candidates) { if (fs.existsSync(p)) return p; }
  return null;
}

const YTDLP_PATH = findYtDlp();
const FFMPEG_PATH = fs.existsSync(path.join(__dirname, "..", "bin-win", "ffmpeg.exe"))
  ? path.join(__dirname, "..", "bin-win", "ffmpeg")
  : path.join(__dirname, "bin", "ffmpeg");
const FFPROBE_PATH = fs.existsSync(path.join(__dirname, "..", "bin-win", "ffprobe.exe"))
  ? path.join(__dirname, "..", "bin-win", "ffprobe")
  : path.join(__dirname, "bin", "ffprobe");
let COOKIES_FILE = findCookies();
const DOWNLOAD_DIR = path.join(os.homedir(), "Downloads", "VidoxDownloader");

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

console.log(`[yt-dlp] ${YTDLP_PATH}`);
console.log(`[Cookies] ${COOKIES_FILE || "none"}`);
console.log(`[Downloads] ${DOWNLOAD_DIR}`);

const clientDistPath = path.join(__dirname, "..", "client", "dist");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/downloads", express.static(DOWNLOAD_DIR));

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

function runYtDlp(args, timeout = 60000) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(FFMPEG_PATH)) args.push("--ffmpeg-location", path.dirname(FFMPEG_PATH));
    execFile(YTDLP_PATH, args, { timeout, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve({ stdout, stderr });
    });
  });
}

function parseInfo(stdout) {
  const info = JSON.parse(stdout);
  const formats = (info.formats || [])
    .filter((f) => f.vcodec !== "none" || f.acodec !== "none")
    .map((f) => ({
      formatId: f.format_id,
      ext: f.ext,
      resolution: f.resolution || "audio only",
      fps: f.fps,
      vcodec: f.vcodec,
      acodec: f.acodec,
      filesize: f.filesize,
      formatNote: f.format_note,
      qualityLabel: f.quality_label,
      tbr: f.tbr,
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

app.get("/api/auth/status", (req, res) => {
  COOKIES_FILE = findCookies();
  res.json({ authenticated: !!COOKIES_FILE });
});

app.post("/api/auth/cookies", (req, res) => {
  const { cookies } = req.body;
  if (!cookies) return res.status(400).json({ error: "Cookies required" });
  try {
    const content = typeof cookies === "string" ? cookies : JSON.stringify(cookies);
    const cookiesPath = path.join(__dirname, "bin", "cookies.txt");
    if (!fs.existsSync(path.join(__dirname, "bin"))) fs.mkdirSync(path.join(__dirname, "bin"), { recursive: true });
    if (content.includes("# Netscape")) {
      fs.writeFileSync(cookiesPath, content, "utf-8");
      COOKIES_FILE = cookiesPath;
      return res.json({ success: true });
    }
    let parsed;
    try { parsed = JSON.parse(content); } catch { fs.writeFileSync(cookiesPath, content, "utf-8"); COOKIES_FILE = cookiesPath; return res.json({ success: true }); }
    let lines = ["# Netscape HTTP Cookie File"];
    if (Array.isArray(parsed)) {
      for (const c of parsed) {
        const d = c.domain || ".youtube.com";
        lines.push(`${d}\t${d.startsWith(".") ? "TRUE" : "FALSE"}\t${c.path || "/"}\t${c.secure ? "TRUE" : "FALSE"}\t${c.expirationDate ? Math.floor(c.expirationDate) : Math.floor(Date.now() / 1000 + 86400 * 365)}\t${c.name || ""}\t${c.value || ""}`);
      }
    }
    fs.writeFileSync(cookiesPath, lines.join("\n"), "utf-8");
    COOKIES_FILE = cookiesPath;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/auth/cookies", (req, res) => {
  try {
    const cookiesPath = path.join(__dirname, "bin", "cookies.txt");
    if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
    COOKIES_FILE = null;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/info", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });
  try { new URL(url.trim()); } catch { return res.status(400).json({ error: "Invalid URL" }); }
  console.log(`[Info] ${url}`);

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const hasCookies = COOKIES_FILE && fs.existsSync(COOKIES_FILE);

  if (hasCookies) {
    try {
      const { stdout } = await runYtDlp(["--no-warnings", "--no-playlist", "--cookies", COOKIES_FILE, "--dump-json", "--no-download", url.trim()]);
      const data = parseInfo(stdout);
      if (data.formats.length > 0) return res.json(data);
    } catch (e) {
      if (e.message.includes("Sign in") || e.message.includes("Private"))
        return res.status(401).json({ error: "Private content. Update cookies.", needsAuth: true });
    }
  }

  if (!hasCookies || !isYouTube) {
    try {
      const { stdout } = await runYtDlp(["--no-warnings", "--no-playlist", "--dump-json", "--no-download", url.trim()]);
      const data = parseInfo(stdout);
      if (data.formats.length > 0) return res.json(data);
    } catch (e) { console.log(`[Info] No-cookie failed`); }
  }

  return res.status(400).json({ error: "Failed to fetch video info." });
});

app.post("/api/download", async (req, res) => {
  const { url, formatId, quality } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const jobId = uuidv4();
  const outputTemplate = path.join(DOWNLOAD_DIR, `${jobId}_%(title)s.%(ext)s`);

  function getArgs(fmt) {
    let args = ["--no-warnings", "--no-playlist", "-o", outputTemplate, "--print", "after_move:filepath"];
    if (COOKIES_FILE && fs.existsSync(COOKIES_FILE)) {
      args.push("--cookies", COOKIES_FILE);
    }
    if (fmt === "audio") args.push("-f", "bestaudio", "-x", "--audio-format", "mp3");
    else if (fmt === "best") args.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best");
    else if (fmt === "720") args.push("-f", "bestvideo[height<=?720][ext=mp4]+bestaudio[ext=m4a]/best[height<=?720]");
    else if (fmt) args.push("-f", fmt);
    else args.push("-f", "bestvideo[height<=?720][ext=mp4]+bestaudio[ext=m4a]/best[height<=?720]");
    args.push(url.trim());
    return args;
  }

  console.log(`[Download] ${url} (format: ${formatId || quality || "default"})`);

  // Try primary format
  try {
    const args = getArgs(formatId || quality);
    const { stdout } = await runYtDlp(args, 120000);
    const filePath = stdout.trim().split("\n").find((l) => l.startsWith("/") && fs.existsSync(l));
    if (filePath) {
      const fileName = path.basename(filePath);
      console.log(`[Download] OK: ${fileName}`);
      return res.json({ success: true, fileName, downloadUrl: `/downloads/${fileName}` });
    }
  } catch (e) {
    console.log(`[Download] Primary failed: ${e.message.substring(0, 100)}`);
  }

  // Fallback: try "best"
  if (formatId || quality) {
    try {
      console.log(`[Download] Trying fallback best...`);
      const args = getArgs("best");
      const { stdout } = await runYtDlp(args, 120000);
      const filePath = stdout.trim().split("\n").find((l) => l.startsWith("/") && fs.existsSync(l));
      if (filePath) {
        const fileName = path.basename(filePath);
        console.log(`[Download] Fallback OK: ${fileName}`);
        return res.json({ success: true, fileName, downloadUrl: `/downloads/${fileName}` });
      }
    } catch (e) {
      console.log(`[Download] Fallback failed: ${e.message.substring(0, 100)}`);
    }
  }

  // Fallback: try without format flag
  try {
    console.log(`[Download] Trying no-format fallback...`);
    const fallbackArgs = ["--no-warnings", "--no-playlist", "-o", outputTemplate, "--print", "after_move:filepath"];
    if (COOKIES_FILE && fs.existsSync(COOKIES_FILE)) {
      fallbackArgs.push("--cookies", COOKIES_FILE);
    }
    fallbackArgs.push(url.trim());
    const { stdout } = await runYtDlp(fallbackArgs, 120000);
    const filePath = stdout.trim().split("\n").find((l) => l.startsWith("/") && fs.existsSync(l));
    if (filePath) {
      const fileName = path.basename(filePath);
      console.log(`[Download] No-format OK: ${fileName}`);
      return res.json({ success: true, fileName, downloadUrl: `/downloads/${fileName}` });
    }
  } catch (e) {
    console.log(`[Download] No-format failed: ${e.message.substring(0, 100)}`);
  }

  return res.status(500).json({ error: "Download failed. Try a different quality." });
});

app.get("/api/downloads/open", (req, res) => {
  const { exec } = require("child_process");
  const cmd = process.platform === "win32" ? `explorer "${DOWNLOAD_DIR}"` : process.platform === "darwin" ? `open "${DOWNLOAD_DIR}"` : `xdg-open "${DOWNLOAD_DIR}"`;
  exec(cmd);
  res.json({ success: true, path: DOWNLOAD_DIR });
});

app.get("/api/health", (req, res) => {
  COOKIES_FILE = findCookies();
  res.json({ status: "ok", ytdlp: YTDLP_PATH, cookies: !!COOKIES_FILE, downloads: DOWNLOAD_DIR });
});

if (fs.existsSync(clientDistPath)) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Vidox Downloader API`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
