import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { USER_TYPES, CATEGORIES, STATUSES } from '../constants.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLUMNS = `id, user_type as "userType", category, name, email, phone, message, status,
  created_at as "createdAt", updated_at as "updatedAt"`;

/* ------------------------------------------------------------------ *
 * PUBLIC: submit an inquiry
 * ------------------------------------------------------------------ */
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again in a few minutes.' },
});

router.post('/', submitLimiter, async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const data = {
      userType: String(b.userType ?? '').trim(),
      category: String(b.category ?? '').trim(),
      name: String(b.name ?? '').trim(),
      email: String(b.email ?? '').trim().toLowerCase(),
      phone: String(b.phone ?? '').trim(),
      message: String(b.message ?? '').trim(),
    };

    const errors = {};
    if (!USER_TYPES.includes(data.userType)) errors.userType = 'Select who you are.';
    if (!CATEGORIES.includes(data.category)) errors.category = 'Select a category.';
    if (data.name.length < 2 || data.name.length > 100) errors.name = 'Name must be 2-100 characters.';
    if (!EMAIL_RE.test(data.email) || data.email.length > 254) errors.email = 'Enter a valid email address.';
    if (!PHONE_RE.test(data.phone)) errors.phone = 'Enter a valid phone number (7-15 digits).';
    if (data.message.length < 5 || data.message.length > 2000) errors.message = 'Message must be 5-2000 characters.';

    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    const { rows } = await query(
      `insert into public.inquiries (user_type, category, name, email, phone, message)
       values ($1, $2, $3, $4, $5, $6)
       returning id, created_at as "createdAt"`,
      [data.userType, data.category, data.name, data.email, data.phone, data.message]
    );

    res.status(201).json({ message: 'Inquiry submitted successfully.', inquiry: rows[0] });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ *
 * PROTECTED: everything below requires a valid admin JWT
 * ------------------------------------------------------------------ */
router.use(requireAuth);

// Builds the WHERE clause shared by list + export
function buildFilters(q) {
  const where = [];
  const params = [];

  if (q.category && CATEGORIES.includes(q.category)) {
    params.push(q.category);
    where.push(`category = $${params.length}`);
  }
  if (q.userType && USER_TYPES.includes(q.userType)) {
    params.push(q.userType);
    where.push(`user_type = $${params.length}`);
  }
  if (q.status && STATUSES.includes(q.status)) {
    params.push(q.status);
    where.push(`status = $${params.length}`);
  }
  const search = String(q.search ?? '').trim().slice(0, 100);
  if (search) {
    // escape LIKE wildcards so user input is matched literally
    const escaped = search.replace(/[\\%_]/g, (c) => `\\${c}`);
    params.push(`%${escaped}%`);
    const i = params.length;
    where.push(`(name ilike $${i} or phone ilike $${i})`);
  }

  return { clause: where.length ? `where ${where.join(' and ')}` : '', params };
}

// GET /api/inquiries?category=&userType=&status=&search=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { clause, params } = buildFilters(req.query);

    const [list, count] = await Promise.all([
      query(
        `select ${COLUMNS} from public.inquiries ${clause}
         order by created_at desc
         limit $${params.length + 1} offset $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(`select count(*)::int as total from public.inquiries ${clause}`, params),
    ]);

    const total = count.rows[0].total;
    res.json({
      data: list.rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/inquiries/stats  -> dashboard summary cards
router.get('/stats', async (_req, res, next) => {
  try {
    const { rows } = await query(`
      select
        count(*)::int                                         as total,
        count(*) filter (where status = 'New')::int           as new,
        count(*) filter (where status = 'In Progress')::int   as "inProgress",
        count(*) filter (where status = 'Resolved')::int      as resolved,
        count(*) filter (where created_at >= now() - interval '7 days')::int as "last7Days"
      from public.inquiries
    `);
    const byCategory = await query(
      `select category, count(*)::int as count from public.inquiries group by category order by count desc`
    );
    res.json({ ...rows[0], byCategory: byCategory.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/inquiries/export  -> CSV of the current filter selection
router.get('/export', async (req, res, next) => {
  try {
    const { clause, params } = buildFilters(req.query);
    const { rows } = await query(
      `select ${COLUMNS} from public.inquiries ${clause} order by created_at desc limit 5000`,
      params
    );

    const esc = (v) => {
      let s = v instanceof Date ? v.toISOString() : String(v ?? '');
      // neutralise spreadsheet formula injection
      if (/^[=+\-@]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const header = ['Name', 'Phone', 'Email', 'User Type', 'Category', 'Status', 'Date', 'Message'];
    const lines = rows.map((r) =>
      [r.name, r.phone, r.email, r.userType, r.category, r.status, r.createdAt, r.message].map(esc).join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="inquiries.csv"');
    res.send('﻿' + [header.join(','), ...lines].join('\r\n'));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/inquiries/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = String(req.body?.status ?? '');
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid inquiry id.' });
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const { rows } = await query(
      `update public.inquiries set status = $1 where id = $2 returning ${COLUMNS}`,
      [status, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Inquiry not found.' });
    res.json({ inquiry: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/inquiries/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid inquiry id.' });
    const { rowCount } = await query('delete from public.inquiries where id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Inquiry not found.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
