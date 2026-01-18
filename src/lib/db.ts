import Database from 'better-sqlite3';
import path from 'path';
import { migrate } from './migrate';

const dbPath = path.join(process.cwd(), 'bobmng.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Run migrations on initialization to ensure schema is up-to-date
// Using dynamic import and a global flag to avoid circular dependencies and multiple runs
if (!(global as any).__db_migrated) {
    (global as any).__db_migrated = true;
    import('./migrate')
        .then(({ migrate }) => {
            migrate(db);
        })
        .catch((err) => {
            console.error('Failed to run migrations:', err);
        });
}

export default db;
