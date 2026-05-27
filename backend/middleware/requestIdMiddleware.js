const crypto = require('crypto');

function generateRequestId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function requestIdMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const requestId = (typeof incoming === 'string' && incoming.trim()) || generateRequestId();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  return next();
}

module.exports = { requestIdMiddleware };
