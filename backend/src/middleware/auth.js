const { verifyToken } = require("../utils/jwt");

function getTokenFromHeader(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

// Blocks the request unless a valid token is present.
function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: "Sign in to do that." });
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Your session expired. Sign in again." });
  }
}

// Attaches req.user if a valid token is present, but doesn't block otherwise.
function optionalAuth(req, _res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
  } catch {
    // Ignore invalid/expired tokens on optional routes.
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
