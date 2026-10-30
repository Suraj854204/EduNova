import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getPool } from './db.js';
import authRoutes from './routes/auth.js';
import inquiryRoutes from './routes/inquiries.js';

const app = express();

app.set('trust proxy', 1); // Vercel / reverse proxies: needed for correct client IP in rate limiting
app.disable('x-powered-by');
app.use(helmet());

// Frontend and API share one origin on Vercel, so CORS is only needed for local split setups.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);
app.use(express.json({ limit: '20kb' }));

// Fail with a readable message instead of crashing when env vars are missing
app.use((req, res, next) => {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((k) => !process.env[k]);
  if (missing.length) {
    return res.status(500).json({ error: `Server misconfigured. Missing env: ${missing.join(', ')}` });
  }
  if (process.env.JWT_SECRET.length < 16) {
    return res.status(500).json({ error: 'JWT_SECRET is too short (use 32+ random characters).' });
  }
  return next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

app.get('/api/health', async (_req, res) => {
  try {
    await getPool().query('select 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/inquiries', inquiryRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Route not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

export default app;
