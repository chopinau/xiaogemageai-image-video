const requestCounts = new Map();

const CLEANUP_INTERVAL = 60000;
const WINDOW_MS = 60000;
const MAX_REQUESTS = 30;

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestCounts.entries()) {
    const valid = timestamps.filter(t => now - t < WINDOW_MS);
    if (valid.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, valid);
    }
  }
}, CLEANUP_INTERVAL);

export function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const requests = requestCounts.get(ip).filter(t => now - t < WINDOW_MS);
  requests.push(now);
  requestCounts.set(ip, requests);

  if (requests.length > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
  }

  next();
}
