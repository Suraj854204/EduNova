import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getPool } from '../server/db.js';

const name = process.env.ADMIN_NAME || 'Admin';
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';

if (!email || password.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in .env first.');
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 12);
  await getPool().query(
    `insert into public.admins (name, email, password_hash)
     values ($1, $2, $3)
     on conflict (lower(email))
     do update set name = excluded.name, password_hash = excluded.password_hash`,
    [name, email, hash]
  );
  console.log(`Admin ready: ${email}`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await getPool().end().catch(() => {});
}
