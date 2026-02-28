import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/api';

// 환경 변수 로드
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors()); // CORS 활성화
app.use(express.json()); // JSON 요청 본문 파싱

// API 라우트 설정
app.use('/api', apiRoutes);

// 기본 헬스 체크 라우트
app.get('/', (req: Request, res: Response) => {
  res.send('Nura Health Backend Server is running!');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
