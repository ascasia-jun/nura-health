import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

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
    
    // SQLite 연결
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // 1. users 테이블
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. user_credentials 테이블 (암호화된 API 키 저장)
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

    console.log('[Database] SQLite initialized and schema verified.');
    return db;
}

/**
 * 초기 테스트용 관리자 계정 생성 (개발 편의용)
 */
export async function seedInitialData() {
    if (!db) await initDatabase();
    
    // admin 계정 존재 여부 확인 (비밀번호: admin123)
    // 실제 운영 시에는 별도의 가입 프로세스 사용
    const admin = await db!.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!admin) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('admin123', 10);
        await db!.run(
            'INSERT INTO users (id, username, password_hash, name) VALUES (?, ?, ?, ?)',
            ['user_admin', 'admin', hash, 'Administrator']
        );
        console.log('[Database] Seeded initial admin account.');
    }
}

export const getDb = () => {
    if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
    return db;
};
