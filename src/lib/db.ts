import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bobmng.db');
// Add timeout to handle multiple processes (common in Next.js build)
const db = new Database(dbPath, { timeout: 5000 });

db.pragma('journal_mode = WAL');

// Run migrations on initialization to ensure schema is up-to-date
// We skip this during the build phase to avoid multiple workers locking the DB
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME;

if (!isBuildPhase && !(global as any).__db_migrated) {
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
