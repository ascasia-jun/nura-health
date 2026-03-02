import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

/**
 * 데이터베이스 연결 객체
 */
let db: Database | null = null;

/**
 * DB 초기화 및 테이블 생성
 */
export async function initDatabase() {
    if (db) return db;

    const dbPath = path.join(__dirname, '../../repoinsight.db');
    
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // 1. users 테이블 (v3.8 확장 필드 포함)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            department TEXT,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 기존 테이블에 필드가 없는 경우 추가 (Migration)
    try { await db.exec('ALTER TABLE users ADD COLUMN email TEXT'); } catch (e) {}
    try { await db.exec('ALTER TABLE users ADD COLUMN department TEXT'); } catch (e) {}
    try { await db.exec('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"'); } catch (e) {}

    // 2. user_credentials 테이블
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            service_name TEXT NOT NULL,
            encrypted_token TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // 3. chat_sessions 테이블
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

    // 4. messages 테이블
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

    console.log('[Database] SQLite initialized and schema migrated.');
    return db;
}

/**
 * 초기 테스트용 관리자 계정 생성 (개발 편의용)
 */
export async function seedInitialData() {
    if (!db) await initDatabase();
    
    const bcrypt = require('bcryptjs');
    const admin = await db!.get('SELECT * FROM users WHERE username = ?', ['admin']);
    
    const newHash = await bcrypt.hash('admin', 10);

    if (!admin) {
        await db!.run(
            'INSERT INTO users (id, username, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?, ?)',
            ['user_admin', 'admin', newHash, 'Administrator', 'admin', 'Management']
        );
        console.log('[Database] Seeded initial admin account (admin/admin).');
    } else {
        // 이미 존재할 경우 비밀번호 및 권한 최신화
        await db!.run('UPDATE users SET password_hash = ?, role = ? WHERE username = ?', [newHash, 'admin', 'admin']);
        console.log('[Database] Admin account synchronized.');
    }
}

export const getDb = () => {
    if (!db) throw new Error('Database not initialized.');
    return db;
};
