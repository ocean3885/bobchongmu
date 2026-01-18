import db from './db';

const initDb = () => {
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
    console.log('Database initialized successfully.');
};

initDb();
