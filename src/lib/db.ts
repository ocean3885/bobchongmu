import Database from 'better-sqlite3';
import path from 'path';
import { migrate } from './migrate';

const dbPath = path.join(process.cwd(), 'bobmng.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Run migrations on initialization to ensure schema is up-to-date
migrate();

export default db;
