import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initDatabase() {
    if (db) return db;
    const dbPath = path.join(__dirname, '../../repoinsight.db');
    db = await open({ filename: dbPath, driver: sqlite3.Database });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            department TEXT,
            role TEXT DEFAULT 'user',
            preferred_model TEXT DEFAULT 'gemini-2.0-flash',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    try { await db.exec('ALTER TABLE users ADD COLUMN email TEXT'); } catch (e) {}
    try { await db.exec('ALTER TABLE users ADD COLUMN department TEXT'); } catch (e) {}
    try { await db.exec('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"'); } catch (e) {}
    try { await db.exec('ALTER TABLE users ADD COLUMN preferred_model TEXT DEFAULT "gemini-2.0-flash"'); } catch (e) {}

    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            service_name TEXT NOT NULL,
            encrypted_token TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, service_name),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_public_repos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            repo_full_name TEXT NOT NULL,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, repo_full_name),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            model TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content_json TEXT NOT NULL,
            timestamp DATETIME,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
        )
    `);

    console.log('[Database] SQLite initialized and schema migrated (v3.8 UX Refinement).');
    return db;
}

export async function seedInitialData() {
    if (!db) await initDatabase();
    const bcrypt = require('bcryptjs');
    const admin = await db!.get('SELECT * FROM users WHERE username = ?', ['admin']);
    const newHash = await bcrypt.hash('admin', 10);
    if (!admin) {
        await db!.run('INSERT INTO users (id, username, password_hash, name, role, department, preferred_model) VALUES (?, ?, ?, ?, ?, ?, ?)', ['user_admin', 'admin', newHash, 'Administrator', 'admin', 'Management', 'gemini-2.0-flash']);
    } else {
        await db!.run('UPDATE users SET password_hash = ?, role = ? WHERE username = ?', [newHash, 'admin', 'admin']);
    }
}

export const getDb = () => { if (!db) throw new Error('Database not initialized.'); return db; };
