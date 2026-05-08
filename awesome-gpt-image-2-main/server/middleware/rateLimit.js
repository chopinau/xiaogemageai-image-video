const requestCounts = new Map();

export function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 30;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const requests = requestCounts.get(ip).filter(t => now - t < windowMs);
  requests.push(now);
  requestCounts.set(ip, requests);

  if (requests.length > maxRequests) {
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }

  next();
}
