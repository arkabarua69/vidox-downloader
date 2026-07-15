import https from "https";
import crypto from "crypto";

const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_CLIENT = {
  hl: "en",
  gl: "US",
  clientName: "WEB",
  clientVersion: "2.20250701.00.00",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

function generateVisitorData() {
  const bytes = crypto.randomBytes(11);
  return bytes.toString("base64").replace(/=/g, "");
}

function makeContext(cookieHeader, visitorData) {
  const ctx = {
    client: {
      hl: INNERTUBE_CLIENT.hl,
      gl: INNERTUBE_CLIENT.gl,
      clientName: INNERTUBE_CLIENT.clientName,
      clientVersion: INNERTUBE_CLIENT.clientVersion,
    },
  };
  if (visitorData) ctx.client.visitorData = visitorData;
  return ctx;
}

function makeAndroidContext() {
  return {
    client: {
      hl: "en",
      gl: "US",
      clientName: "ANDROID",
      clientVersion: "19.29.37",
      androidSdkVersion: 33,
      osName: "Android",
      osVersion: "13",
      platform: "MOBILE",
    },
  };
}

function makeMWebContext() {
  return {
    client: {
      hl: "en",
      gl: "US",
      clientName: "MWEB",
      clientVersion: "2.20250701.00.00",
    },
  };
}

function fetchJSON(url, body, cookieHeader) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
      "User-Agent": INNERTUBE_CLIENT.userAgent,
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": INNERTUBE_CLIENT.clientVersion,
      "Origin": "https://www.youtube.com",
      "Referer": "https://www.youtube.com/",
    };
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers,
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(new Error("Failed to parse response"));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.write(data);
    req.end();
  });
}

export function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function parseVideoFromContinuation(item) {
  try {
    const renderer =
      item.compactVideoRenderer ||
      item.videoRenderer ||
      item.gridVideoRenderer ||
      item.richItemRenderer?.content?.videoRenderer;
    if (!renderer) return null;

    const id = renderer.videoId;
    if (!id) return null;

    const title =
      renderer.title?.runs?.map((r) => r.text).join("") ||
      renderer.title?.simpleText || "";
    const channel =
      renderer.ownerText?.runs?.[0]?.text ||
      renderer.shortBylineText?.runs?.[0]?.text ||
      renderer.channelName?.simpleText || "";
    const viewCount =
      renderer.viewCountText?.simpleText ||
      renderer.viewCountText?.runs?.map((r) => r.text).join("") || "";
    const published =
      renderer.publishedTimeText?.simpleText || "";
    const duration =
      renderer.lengthText?.simpleText ||
      renderer.lengthText?.runs?.map((r) => r.text).join("") || "";
    const thumbnail =
      renderer.thumbnail?.thumbnails?.slice(-1)[0]?.url || "";
    const description =
      renderer.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r) => r.text).join("") ||
      renderer.descriptionSnippet?.runs?.map((r) => r.text).join("") || "";

    return { id, title, channel, views: viewCount, time: published, duration, thumbnail, description };
  } catch {
    return null;
  }
}

function parsePlaylistFromContinuation(item) {
  try {
    const renderer =
      item.compactPlaylistRenderer ||
      item.playlistRenderer ||
      item.gridPlaylistRenderer;
    if (!renderer) return null;

    const id =
      renderer.playlistId ||
      renderer.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointFragmentMusicPlaylistItemRenderer?.playlistId || "";
    const title =
      renderer.title?.runs?.map((r) => r.text).join("") ||
      renderer.title?.simpleText || "";
    const channel =
      renderer.shortBylineText?.runs?.[0]?.text || "";
    const videoCount =
      renderer.videoCountText?.runs?.map((r) => r.text).join("") ||
      renderer.videoCountText?.simpleText || "";
    const thumbnail =
      renderer.thumbnail?.thumbnails?.slice(-1)[0]?.url || "";

    return { id, title, channel, videoCount, thumbnail };
  } catch {
    return null;
  }
}

export async function search(query, cookieHeader) {
  const visitorData = generateVisitorData();
  const body = {
    context: makeContext(cookieHeader, visitorData),
    query,
  };

  const data = await fetchJSON(
    `https://www.youtube.com/youtubei/v1/search?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
    body,
    cookieHeader
  );

  if (!data.contents) {
    throw new Error("InnerTube search returned no contents");
  }

  const results = [];
  const contents =
    data.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents || [];

  for (const section of contents) {
    const items =
      section.itemSectionRenderer?.contents ||
      [];

    for (const item of items) {
      if (item.videoRenderer) {
        const v = item.videoRenderer;
        const id = v.videoId;
        if (!id) continue;
        results.push({
          id,
          title: v.title?.runs?.map((r) => r.text).join("") || "",
          channel: v.ownerText?.runs?.[0]?.text || "",
          views: v.viewCountText?.simpleText || "",
          time: v.publishedTimeText?.simpleText || "",
          duration: v.lengthText?.simpleText || "",
          thumbnail: v.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
          description: v.descriptionSnippet?.runs?.map((r) => r.text).join("") || "",
        });
      } else if (item.channelRenderer) {
        const ch = item.channelRenderer;
        results.push({
          id: ch.channelId || "",
          title: ch.title?.simpleText || "",
          channel: ch.title?.simpleText || "",
          views: "",
          time: "",
          duration: "",
          thumbnail: ch.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
          description: ch.descriptionSnippet?.runs?.map((r) => r.text).join("") || "",
          type: "channel",
          subscriberCount: ch.subscriberCountText?.simpleText || "",
        });
      } else if (item.playlistRenderer) {
        const pl = item.playlistRenderer;
        results.push({
          id: pl.playlistId || "",
          title: pl.title?.simpleText || pl.title?.runs?.map((r) => r.text).join("") || "",
          channel: pl.shortBylineText?.runs?.[0]?.text || "",
          views: "",
          time: "",
          duration: "",
          thumbnail: pl.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
          description: "",
          type: "playlist",
          videoCount: pl.videoCountText?.runs?.map((r) => r.text).join("") || pl.videoCountText?.simpleText || "",
        });
      }
    }
  }

  const continuationToken = contents
    .find((s) => s.continuationItemRenderer)
    ?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;

  return { results, continuationToken };
}

export async function getTrending(cookieHeader) {
  const visitorData = generateVisitorData();
  const body = {
    context: makeContext(cookieHeader, visitorData),
    browseId: "FEtrending",
  };

  const data = await fetchJSON(
    `https://www.youtube.com/youtubei/v1/browse?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
    body,
    cookieHeader
  );

  const results = [];
  const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];

  for (const tab of tabs) {
    const sections =
      tab.tabRenderer?.content?.sectionListRenderer?.contents || [];
    for (const section of sections) {
      const items =
        section.itemSectionRenderer?.contents ||
        section.shelfRenderer?.content?.expandedShelfContentsRenderer?.items ||
        section.shelfRenderer?.content?.horizontalListRenderer?.items ||
        [];
      for (const item of items) {
        const video = item.videoRenderer || item.compactVideoRenderer;
        if (!video) continue;
        const parsed = parseVideoFromContinuation({ videoRenderer: video } );
        if (parsed) results.push(parsed);
      }
    }
  }

  return results;
}

export async function getPlaylist(playlistId, cookieHeader) {
  const body = {
    context: makeContext(cookieHeader),
    browseId: `VL${playlistId}`,
  };

  const data = await fetchJSON(
    `https://www.youtube.com/youtubei/v1/browse?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
    body,
    cookieHeader
  );

  const header =
    data.header?.playlistHeaderRenderer ||
    data.header?.gridHeaderRenderer || {};
  const title =
    header.title?.runs?.map((r) => r.text).join("") ||
    header.title?.simpleText || "Untitled Playlist";
  const channel =
    header.ownerText?.runs?.[0]?.text ||
    header.bylineText?.runs?.[0]?.text || "";

  const videos = [];
  const contents =
    data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content
      ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]
      ?.playlistVideoListRenderer?.contents || [];

  for (const item of contents) {
    if (!item.playlistVideoRenderer) continue;
    const v = item.playlistVideoRenderer;
    const id = v.videoId;
    if (!id) continue;
    videos.push({
      id,
      url: `https://www.youtube.com/watch?v=${id}`,
      title: v.title?.runs?.map((r) => r.text).join("") || "",
      thumbnail: v.thumbnail?.thumbnails?.slice(-1)[0]?.url || "",
      duration: v.lengthText?.simpleText || "",
      duration_string: v.lengthText?.simpleText || "",
      uploader: v.shortBylineText?.runs?.[0]?.text || channel,
    });
  }

  return {
    title,
    channel,
    count: videos.length,
    videos,
  };
}

export async function getChannel(channelId, cookieHeader) {
  const body = {
    context: makeContext(cookieHeader),
    browseId: channelId,
  };

  const data = await fetchJSON(
    `https://www.youtube.com/youtubei/v1/browse?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
    body,
    cookieHeader
  );

  const header =
    data.header?.c4TabbedHeaderRenderer ||
    data.header?.pageHeaderRenderer || {};
  const channelName =
    header.title?.runs?.map((r) => r.text).join("") ||
    header.title?.simpleText || "";
  const subscriberCount =
    header.subscriberCountText?.simpleText || "";
  const avatar =
    header.avatar?.thumbnails?.slice(-1)[0]?.url || "";

  const videos = [];
  const tabs =
    data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find(
    (t) => t.tabRenderer?.title === "Videos" || t.tabRenderer?.selected
  );

  if (videosTab) {
    const tabContents =
      videosTab.tabRenderer?.content?.richGridRenderer?.contents ||
      videosTab.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items || [];

    for (const item of tabContents) {
      const parsed = parseVideoFromContinuation(item);
      if (parsed) videos.push(parsed);
    }
  }

  return {
    id: channelId,
    name: channelName,
    subscriberCount,
    avatar,
    videos,
  };
}

export async function getChannelVideos(channelId, cookieHeader) {
  const body = {
    context: makeContext(cookieHeader),
    browseId: channelId,
    params: "6gQJRkVleHBsb3Jl",
  };

  const data = await fetchJSON(
    `https://www.youtube.com/youtubei/v1/browse?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
    body,
    cookieHeader
  );

  const videos = [];
  const contents =
    data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content
      ?.richGridRenderer?.contents || [];

  for (const item of contents) {
    const parsed = parseVideoFromContinuation(item);
    if (parsed) videos.push(parsed);
  }

  return videos;
}

export async function getDirectStreamUrl(videoId, cookieHeader) {
  const body = {
    context: {
      client: {
        hl: INNERTUBE_CLIENT.hl,
        gl: INNERTUBE_CLIENT.gl,
        clientName: INNERTUBE_CLIENT.clientName,
        clientVersion: INNERTUBE_CLIENT.clientVersion,
      },
    },
    videoId,
  };

  const data = await fetchJSON(
    `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
    body,
    cookieHeader
  );

  if (data.playabilityStatus && data.playabilityStatus.status !== "OK") {
    const reason = data.playabilityStatus.reason || data.playabilityStatus.status;
    throw new Error(`Playability: ${reason}`);
  }

  if (!data || !data.streamingData) {
    throw new Error("No streaming data available");
  }

  const { streamingData } = data;
  const videoDetails = data.videoDetails || {};
  const title = videoDetails.title || "Untitled";
  const thumbnail = videoDetails.thumbnail?.thumbnails?.slice(-1)[0]?.url || "";
  const duration = parseInt(videoDetails.lengthSeconds) || 0;
  const author = videoDetails.author || "";

  const formats = [];

  if (streamingData.adaptiveFormats) {
    for (const f of streamingData.adaptiveFormats) {
      if (!f.url) continue;
      formats.push({
        itag: f.itag,
        url: f.url,
        mimeType: f.mimeType || "",
        qualityLabel: f.qualityLabel || f.quality || "",
        width: f.width || 0,
        height: f.height || 0,
        contentLength: parseInt(f.contentLength) || 0,
        bitrate: f.bitrate || 0,
        fps: f.fps || 0,
        type: "adaptive",
      });
    }
  }

  if (streamingData.formats) {
    for (const f of streamingData.formats) {
      if (!f.url) continue;
      formats.push({
        itag: f.itag,
        url: f.url,
        mimeType: f.mimeType || "",
        qualityLabel: f.qualityLabel || f.quality || "",
        width: f.width || 0,
        height: f.height || 0,
        contentLength: parseInt(f.contentLength) || 0,
        bitrate: f.bitrate || 0,
        fps: f.fps || 0,
        type: "combined",
      });
    }
  }

  if (formats.length === 0) {
    throw new Error("No direct stream URLs available (video may require sign-in)");
  }

  const combined = formats
    .filter((f) => f.type === "combined" && f.mimeType.includes("video/mp4"))
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  const adaptiveVideo = formats
    .filter((f) => f.type === "adaptive" && f.mimeType.includes("video"))
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  const adaptiveAudio = formats
    .filter((f) => f.type === "adaptive" && f.mimeType.includes("audio"))
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  return {
    id: videoId,
    title,
    thumbnail,
    duration,
    uploader: author,
    formats: {
      bestCombined: combined[0] || null,
      bestVideo: adaptiveVideo[0] || null,
      bestAudio: adaptiveAudio[0] || null,
      all: formats,
    },
  };
}
