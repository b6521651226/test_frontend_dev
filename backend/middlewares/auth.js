const jwt = require('jsonwebtoken');
const JWT_SECRET = 'dev-secret';

function verifyToken(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'missing token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET); // { uid, role, iat, exp }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'invalid/expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'forbidden' });
  next();
}

module.exports = { verifyToken, adminOnly };
