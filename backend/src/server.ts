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

// 2. CORS 설정: 프론트엔드 포트(5173)로 제한하여 보안 강화
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
}));

// 3. JSON 요청 본문 파싱 및 크기 제한 (DoS 방지)
app.use(express.json({ limit: '10kb' }));

// 4. 전역 Rate Limiting: 15분 동안 IP당 100회 요청으로 제한
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 요청 횟수
  message: { error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API 라우트 설정
app.use('/api', apiRoutes);

// 기본 헬스 체크 라우트
app.get('/', (req: Request, res: Response) => {
  res.send('Nura Health Backend Server is running securely!');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
