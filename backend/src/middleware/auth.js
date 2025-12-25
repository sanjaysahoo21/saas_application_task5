import jwt from 'jsonwebtoken';

const { JWT_SECRET = 'dev_secret' } = process.env;

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    // Enforce payload shape strictly
    const { userId, tenantId, role } = payload || {};
    if (!userId || typeof role !== 'string' || !('tenantId' in payload)) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.user = { userId, tenantId, role };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function signToken({ userId, tenantId, role, expiresIn = process.env.JWT_EXPIRES_IN || '1d' }) {
  const payload = { userId, tenantId, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
