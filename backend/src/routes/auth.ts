import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/db';

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
            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    username: user.username, 
                    name: user.name,
                    email: user.email,
                    department: user.department,
                    role: user.role,
                    preferred_model: user.preferred_model // [v3.8] 추가
                } 
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
