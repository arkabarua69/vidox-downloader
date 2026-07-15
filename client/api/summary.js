import { generateSummary } from "./_lib/summary.js";
import { rateLimit, getClientIp } from "./_lib/rate-limit.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 30, 60000);
  if (!rl.allowed) {
    return res.status(429).json({ error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` });
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch { body = {}; }
  }

  const { title, uploader, description, duration, view_count, upload_date } = body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  try {
    const result = generateSummary({ title, uploader, description, duration, view_count, upload_date });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate summary" });
  }
}
