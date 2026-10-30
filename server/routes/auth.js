import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Used to keep response time similar when the email does not exist (timing attacks)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!EMAIL_RE.test(email) || password.length < 1) {
      return res.status(400).json({ error: 'Enter a valid email and password.' });
    }

    const { rows } = await query(
      'select id, name, email, password_hash from public.admins where lower(email) = $1 limit 1',
      [email]
    );
    const admin = rows[0];

    const ok = await bcrypt.compare(password, admin ? admin.password_hash : DUMMY_HASH);
    if (!admin || !ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { subject: admin.id, expiresIn: process.env.JWT_EXPIRES_IN || '8h', algorithm: 'HS256' }
    );

    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    next(err);
  }
});

// Validates the stored token and returns the current admin
router.get('/me', requireAuth, (req, res) => {
  res.json({ admin: req.admin });
});

export default router;
