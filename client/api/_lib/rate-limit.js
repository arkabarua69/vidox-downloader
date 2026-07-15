const hits = new Map();

function rateLimit(ip, limit = 30, windowMs = 60000) {
  const now = Date.now();
  const record = hits.get(ip);
  if (!record || now - record.start > windowMs) {
    hits.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }
  record.count++;
  if (record.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((windowMs - (now - record.start)) / 1000) };
  }
  return { allowed: true, remaining: limit - record.count };
}

const _cleanup = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of hits) {
    if (now - record.start > 120000) hits.delete(ip);
  }
}, 60000);
if (_cleanup.unref) _cleanup.unref();

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

export { rateLimit, getClientIp };
