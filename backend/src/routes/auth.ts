import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    try {
        const db = getDb();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        if (user && await bcrypt.compare(password, user.password_hash)) {
            // 실제 서비스에서는 JWT 등을 발급해야 하나, 
            // 현재는 세션 기반 모의 처리를 위해 사용자 정보를 반환합니다.
            res.json({ 
                success: true, 
                user: { id: user.id, username: user.username, name: user.name } 
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/register (확장용)
 */
router.post('/register', async (req: Request, res: Response) => {
    const { username, password, name } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Required fields missing' });

    try {
        const db = getDb();
        const hash = await bcrypt.hash(password, 10);
        const id = `user_${Date.now()}`;

        await db.run(
            'INSERT INTO users (id, username, password_hash, name) VALUES (?, ?, ?, ?)',
            [id, username, hash, name || username]
        );

        res.json({ success: true, message: 'User registered successfully' });
    } catch (error: any) {
        if (error.message.includes('UNIQUE')) {
            res.status(409).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: 'Registration failed' });
        }
    }
});

export default router;
