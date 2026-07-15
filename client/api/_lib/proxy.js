import https from "https";
import http from "http";

let proxies = [];
let lastFetch = 0;
const FETCH_INTERVAL = 5 * 60 * 1000;
const PROXY_URLS = [
  "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
  "https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt",
  "https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/https.txt",
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      timeout: 8000,
    };
    const req = mod.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString()));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function refreshProxies() {
  const now = Date.now();
  if (proxies.length > 0 && now - lastFetch < FETCH_INTERVAL) return;

  const results = await Promise.allSettled(PROXY_URLS.map((u) => fetchUrl(u)));
  const all = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      const lines = r.value.split("\n").map((l) => l.trim()).filter((l) => l && l.includes(":"));
      all.push(...lines.slice(0, 100));
    }
  }

  if (all.length > 0) {
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    proxies = all;
    lastFetch = now;
  }
}

export async function getProxy() {
  await refreshProxies();
  if (proxies.length === 0) return null;
  const idx = Math.floor(Math.random() * proxies.length);
  const proxy = proxies[idx];
  proxies.splice(idx, 1);
  return `http://${proxy}`;
}

export function getProxyCount() {
  return proxies.length;
}
