// Load .env file manually since dotenv isn't installed
import { readFileSync } from 'fs';
import { join } from 'path';
try {
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && !k.startsWith('#') && rest.length) process.env[k.trim()] = rest.join('=').trim();
  }
} catch { /* .env not found */ }
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const SUBJECTS = [
  { slug: 'math',     name: 'Mathematics', color: 'var(--accent)', icon: '➗' },
  { slug: 'science',  name: 'Science',     color: 'var(--cyan)',   icon: '🔬' },
  { slug: 'english',  name: 'English',     color: 'var(--green)',  icon: '📖' },
  { slug: 'history',  name: 'History',     color: 'var(--amber)',  icon: '🏛️' },
  { slug: 'buddhism', name: 'Buddhism',    color: 'var(--pink)',   icon: '☸️' },
  { slug: 'music',    name: 'Music',       color: 'var(--red)',    icon: '🎵' },
];

const GRADES = [
  { label: 'Grade 7',  order: 1 },
  { label: 'Grade 8',  order: 2 },
  { label: 'Grade 9',  order: 3 },
  { label: 'Grade 10', order: 4 },
  { label: 'Grade 11', order: 5 },
  { label: 'Grade 12', order: 6 },
  { label: 'Grade 13', order: 7 },
];

async function main() {
  console.log('Seeding subjects…');
  for (const s of SUBJECTS) {
    try {
      await db.insert(schema.subjects).values(s).onConflictDoNothing();
      console.log(`  ✓ ${s.name}`);
    } catch (e) {
      console.log(`  - ${s.name} (skip)`);
    }
  }

  console.log('Seeding grades…');
  for (const g of GRADES) {
    try {
      await db.insert(schema.grades).values(g).onConflictDoNothing();
      console.log(`  ✓ ${g.label}`);
    } catch (e) {
      console.log(`  - ${g.label} (skip)`);
    }
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
