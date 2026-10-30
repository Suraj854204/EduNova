import jwt from 'jsonwebtoken';

/**
 * Custom JWT protection middleware (no Supabase Auth).
 * Expects:  Authorization: Bearer <token>
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.admin = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expired ? 'Session expired. Please sign in again.' : 'Invalid token.',
    });
  }
}
