import { downloadYtDlp, runYtDlp, YTDLP_PATH } from "./_lib/yt-dlp.js";
import fs from "fs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const info = { platform: "vercel" };

  try {
    info.ytdlpExists = fs.existsSync(YTDLP_PATH);
    await downloadYtDlp();
    info.ytdlpAfterDownload = fs.existsSync(YTDLP_PATH);

    if (fs.existsSync(YTDLP_PATH)) {
      const stat = fs.statSync(YTDLP_PATH);
      info.ytdlpSize = stat.size;
    }

    const { stdout } = await runYtDlp(["--version"], 10000);
    info.version = stdout.trim();
    info.status = "ok";
  } catch (e) {
    info.status = "error";
    info.error = e.message;
  }

  res.json(info);
}
