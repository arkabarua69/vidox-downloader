import ytdl from "@distube/ytdl-core";

const agents = [
  ytdl.createAgent(),
  ytdl.createAgent([{"cookie":"CONSENT=YES+cb.20210420-15-p0.en+FX+999"}]),
];
let agentIdx = 0;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range");
  if (req.method === "OPTIONS") return res.status(200).end();

  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  try {
    const agent = agents[agentIdx % agents.length];
    agentIdx++;

    const origCwd = process.cwd();
    process.chdir("/tmp");
    let info;
    try {
      const infoPromise = ytdl.getInfo(videoId, { agent });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("ytdl timeout")), 15000));
      info = await Promise.race([infoPromise, timeoutPromise]);
    } finally {
      process.chdir(origCwd);
    }

    const format = info.formats.find(f => f.itag === 18) || info.formats.find(f => f.hasAudio && f.hasVideo);
    if (!format) throw new Error("No suitable format found");

    const stream = ytdl.downloadFromInfo(info, { format, agent });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges, Content-Type");
    res.status(200);

    stream.on("data", (chunk) => {
      const ok = res.write(chunk);
      if (!ok) stream.pause();
    });
    res.on("drain", () => {
      if (stream.isPaused()) stream.resume();
    });
    stream.on("end", () => res.end());
    stream.on("error", (err) => {
      console.error("STREAM_ERROR:", err.message);
      if (!res.headersSent) res.status(500).json({ error: "Stream failed: " + err.message });
      else res.end();
    });
  } catch (e) {
    console.error("STREAM_ERROR:", e.message);
    if (!res.headersSent) res.status(500).json({ error: "Stream proxy failed: " + e.message });
  }
}
