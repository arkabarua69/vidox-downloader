const TEMPLATES = {
  short: [
    "This {duration} video by {uploader} covers {topic}. {viewsText}",
    "{uploader} presents a {duration} breakdown of {topic}. {viewsText}",
    "A {duration} {category} video exploring {topic}. {viewsText}",
  ],
  detail: [
    "In this {duration} video, {uploader} dives into {topic}. {description} {viewsText}",
    "{uploader} breaks down {topic} in this {duration} video. {description} {viewsText}",
  ],
};

const CATEGORY_KEYWORDS = {
  tutorial: ["how to", "tutorial", "guide", "learn", "step", "beginner", "teach"],
  tech: ["ai", "artificial intelligence", "coding", "programming", "software", "tech", "computer", "app", "website", "javascript", "python", "react"],
  music: ["song", "music", "album", "track", "remix", "lyrics", "concert", "live", "performance"],
  news: ["news", "update", "breaking", "report", "announce", "launch", "release"],
  entertainment: ["funny", "comedy", "prank", "challenge", "reaction", "vlog", "story"],
  gaming: ["game", "gaming", "gameplay", "stream", "esports", "valorant", "minecraft", "fortnite"],
  science: ["science", "physics", "chemistry", "biology", "space", "research", "experiment"],
  education: ["explained", "documentary", "history", "fact", "knowledge", "learn", "study"],
};

function detectCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return cat;
  }
  return "content";
}

function extractTopic(title) {
  let t = title
    .replace(/\|.*$/g, "").replace(/-.*$/g, "").replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "").replace(/#[^\s]+/g, "")
    .replace(/\b(part|episode|ep|pt)\s*\d+\b/gi, "")
    .trim();
  const words = t.split(/\s+/).filter((w) => w.length > 2);
  return words.slice(0, 6).join(" ");
}

function formatViews(n) {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function formatDuration(secs) {
  if (!secs) return "video";
  if (secs < 60) return `${secs}-second`;
  if (secs < 3600) return `${Math.floor(secs / 60)}-minute`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}-hour`;
}

export function generateSummary(info) {
  const { title, uploader, description, duration, view_count, upload_date } = info;
  const category = detectCategory(title, description || "");
  const topic = extractTopic(title);
  const durationText = formatDuration(duration);
  const viewsText = view_count ? `With ${formatViews(view_count)}, this video has attracted significant attention.` : "";
  const descriptionSnippet = description ? description.substring(0, 100).trim() : "";

  const templates = category === "tutorial" || category === "education" ? TEMPLATES.detail : TEMPLATES.short;
  const template = templates[Math.floor(Math.random() * templates.length)];

  let summary = template
    .replace("{duration}", durationText)
    .replace("{uploader}", uploader || "the creator")
    .replace("{topic}", topic || title)
    .replace("{category}", category)
    .replace("{viewsText}", viewsText)
    .replace("{description}", descriptionSnippet ? `${descriptionSnippet}.` : "")
    .trim();

  const tags = generateTags(title, description || "", category);

  return { summary, tags, category };
}

function generateTags(title, description, category) {
  const text = `${title} ${description}`.toLowerCase();
  const tags = new Set();

  tags.add(category);
  const words = text.split(/\s+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const freq = {};
  for (const w of words) {
    const clean = w.replace(/[^a-z0-9]/g, "");
    if (clean.length > 3) freq[clean] = (freq[clean] || 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  for (const [word] of sorted.slice(0, 8)) tags.add(word);

  return [...tags].slice(0, 10);
}

const STOP_WORDS = new Set([
  "this", "that", "with", "from", "your", "have", "will", "been", "they",
  "what", "when", "make", "like", "just", "over", "such", "take", "than",
  "them", "some", "very", "would", "could", "about", "which", "there",
  "their", "these", "those", "into", "more", "also", "other", "being",
  "each", "most", "only", "then", "after", "does", "made", "much",
]);
