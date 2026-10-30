import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getPool } from '../server/db.js';

const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../schema.sql');

try {
  await getPool().query(readFileSync(schemaPath, 'utf8'));
  console.log('Schema applied successfully.');
} catch (err) {
  console.error('Schema failed:', err.message);
  process.exitCode = 1;
} finally {
  await getPool().end().catch(() => {});
}
