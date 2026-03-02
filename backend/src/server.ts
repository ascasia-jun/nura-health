import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api';
import authRoutes from './routes/auth';
import { initDatabase, seedInitialData } from './database/db';

// 환경 변수 로드
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// 1. 보안 헤더 설정
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS 설정
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'], // x-user-id 추가
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '1mb' }));

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 4. 라우트 설정
app.use('/api/auth', authRoutes); // 인증 라우트 추가
app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('RepoInsight Secure Backend is running!');
});

/**
 * 서버 시작 및 인프라 초기화
 */
async function startServer() {
    try {
        // 데이터베이스 초기화 및 시드 데이터 생성
        await initDatabase();
        await seedInitialData();

        app.listen(Number(port), '0.0.0.0', () => {
            console.log(`[server]: RepoInsight Backend running at http://0.0.0.0:${port}`);
            console.log(`[server]: Database (SQLite) initialized.`);
        });
    } catch (error) {
        console.error('[server]: Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
