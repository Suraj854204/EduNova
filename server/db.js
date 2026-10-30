import pg from 'pg';

const { Pool } = pg;

let pool;

/**
 * Lazily creates the pool so a missing DATABASE_URL produces a clean API error
 * (see server/app.js) instead of crashing the serverless function on import.
 */
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      // Serverless: keep connections few; use Supabase's pooler URL (port 6543 / 5432 session pooler)
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on('error', (err) => console.error('Unexpected Postgres pool error:', err.message));
  }
  return pool;
}

export const query = (text, params) => getPool().query(text, params);
