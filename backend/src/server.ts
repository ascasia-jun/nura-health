import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api';

// 환경 변수 로드
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// 1. 보안 헤더 설정 (helmet)
app.use(helmet());

// 2. CORS 설정: 로컬 개발 환경 안정성 강화
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 3. JSON 요청 본문 파싱 및 크기 제한
app.use(express.json({ limit: '1mb' }));

// 4. 전역 Rate Limiting (개발 편의를 위해 limit 상향 조정)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  message: { error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API 라우트 설정
app.use('/api', apiRoutes);

// 기본 헬스 체크
app.get('/', (req: Request, res: Response) => {
  res.send('RepoInsight Backend Server is running securely!');
});

// 서버 실행: 0.0.0.0 바인딩을 통해 로컬 네트워크 접근성 확보
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(`[server]: Internal API available at http://127.0.0.1:${port}/api`);
});
