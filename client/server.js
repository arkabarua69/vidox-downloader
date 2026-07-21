import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range, X-User-Cookies");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

function wrapHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      console.error("Handler error:", e.message);
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    }
  };
}

async function loadHandler(relativePath) {
  const fullPath = join(__dirname, "api", relativePath);
  const mod = await import(fullPath);
  return mod.default;
}

const distPath = join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: "1y", immutable: true }));
  app.use("/assets", express.static(join(distPath, "assets"), { maxAge: "1y", immutable: true }));
}

app.get("/healthz", (req, res) => res.json({ ok: true }));

async function setupRoutes() {
  const routes = [
    ["get", "/api/info", "info.js"],
    ["post", "/api/info", "info.js"],
    ["post", "/api/download", "download.js"],
    ["get", "/api/stream", "stream.js"],
    ["post", "/api/summary", "summary.js"],
    ["get", "/api/health", "health.js"],
    ["get", "/api/playlist", "playlist.js"],
    ["post", "/api/playlist-download", "playlist-download.js"],
    ["get", "/api/auth/status", "auth/status.js"],
    ["post", "/api/auth/cookies", "auth/cookies.js"],
    ["delete", "/api/auth/cookies", "auth/cookies.js"],
    ["post", "/api/auth/refresh", "auth/refresh.js"],
    ["get", "/api/auth/health", "auth/health.js"],
  ];

  for (const [method, path, file] of routes) {
    try {
      const handler = await loadHandler(file);
      app[method](path, wrapHandler(handler));
      console.log(`  Route: ${method.toUpperCase()} ${path}`);
    } catch (e) {
      console.error(`  Failed to load ${file}: ${e.message}`);
    }
  }

  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found" });
    }
    const indexPath = join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Build not found. Run 'npm run build' first.");
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupRoutes().catch((e) => {
  console.error("Failed to setup routes:", e);
  process.exit(1);
});
