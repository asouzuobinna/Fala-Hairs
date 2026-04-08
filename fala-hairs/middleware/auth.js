// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fala-hairs-secret-2026-change-in-prod';

function requireAuth(req, res, next) {
  const token = req.cookies?.adminToken || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireSupreme(req, res, next) {
  requireAuth(req, res, () => {
    if (req.admin.role !== 'supreme') {
      return res.status(403).json({ error: 'Supreme Admin access required' });
    }
    next();
  });
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { requireAuth, requireSupreme, signToken };
