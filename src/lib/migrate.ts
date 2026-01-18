import db from './db';

const migrate = () => {
    try {
        console.log('Starting migration...');

        // 1. Add users table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 2. Add group_id to transactions and handle nullable member_id
        const tableInfo = db.prepare("PRAGMA table_info(transactions)").all() as any[];
        const hasGroupId = tableInfo.some(col => col.name === 'group_id');

        if (!hasGroupId) {
            console.log('Updating transactions table schema...');
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
            console.log('Transactions table updated successfully.');
        }

        // 3. Add user_id to groups
        const groupsColumns = db.prepare('PRAGMA table_info(groups)').all() as any[];
        const hasUserId = groupsColumns.some(col => col.name === 'user_id');

        if (!hasUserId) {
            db.prepare('ALTER TABLE groups ADD COLUMN user_id INTEGER').run();
            console.log('Added user_id column to groups table.');
        }

        console.log('Database migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

migrate();
