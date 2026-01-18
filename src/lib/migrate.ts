// This file should not import db.ts directly to avoid circular dependencies.
// The db instance should be passed in as an argument.
import { Database } from 'better-sqlite3';

export const migrate = (db: Database) => {
    try {
        console.log('Starting database initialization/migration...');

        // 1. Initial schema creation (using IF NOT EXISTS)
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NULL,
                name TEXT NOT NULL,
                overhead_balance INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                balance INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                withdrawn_at DATETIME NULL,
                FOREIGN KEY (group_id) REFERENCES groups(id)
            );

            CREATE TABLE IF NOT EXISTS meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                restaurant_name TEXT NOT NULL,
                date TEXT NOT NULL,
                total_amount INTEGER NOT NULL,
                amount_per_person INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups(id)
            );

            CREATE TABLE IF NOT EXISTS meal_participants (
                meal_id INTEGER NOT NULL,
                member_id INTEGER NOT NULL,
                PRIMARY KEY (meal_id, member_id),
                FOREIGN KEY (meal_id) REFERENCES meals(id),
                FOREIGN KEY (member_id) REFERENCES members(id)
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NULL,
                member_id INTEGER NULL,
                type TEXT NOT NULL,
                amount INTEGER NOT NULL,
                note TEXT,
                related_meal_id INTEGER NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups(id),
                FOREIGN KEY (member_id) REFERENCES members(id),
                FOREIGN KEY (related_meal_id) REFERENCES meals(id)
            );
        `);

        // 2. Incremental migrations (for existing databases)

        // Add user_id to groups if it doesn't exist (it should be there now if created fresh)
        const groupsColumns = db.prepare('PRAGMA table_info(groups)').all() as any[];
        const hasUserIdInGroups = groupsColumns.some(col => col.name === 'user_id');
        if (!hasUserIdInGroups) {
            db.prepare('ALTER TABLE groups ADD COLUMN user_id INTEGER').run();
            console.log('Incremental: Added user_id column to groups table.');
        }

        // Add group_id to transactions if it doesn't exist
        const transactionsColumns = db.prepare('PRAGMA table_info(transactions)').all() as any[];
        const hasGroupIdInTransactions = transactionsColumns.some(col => col.name === 'group_id');
        if (!hasGroupIdInTransactions) {
            console.log('Incremental: Updating transactions table schema to include group_id...');
            db.transaction(() => {
                db.exec(`
                    CREATE TABLE transactions_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        group_id INTEGER NULL,
                        member_id INTEGER NULL,
                        type TEXT NOT NULL,
                        amount INTEGER NOT NULL,
                        note TEXT,
                        related_meal_id INTEGER NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (group_id) REFERENCES groups(id),
                        FOREIGN KEY (member_id) REFERENCES members(id),
                        FOREIGN KEY (related_meal_id) REFERENCES meals(id)
                    );
                `);

                db.exec(`
                    INSERT INTO transactions_new (id, member_id, type, amount, note, related_meal_id, created_at)
                    SELECT id, member_id, type, amount, note, related_meal_id, created_at FROM transactions;
                `);

                db.exec("DROP TABLE transactions;");
                db.exec("ALTER TABLE transactions_new RENAME TO transactions;");
            })();
            console.log('Incremental: Transactions table updated successfully.');
        }

        console.log('Database initialization/migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};
