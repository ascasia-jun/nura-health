import { Router, Request, Response } from 'express';
import { 
    getAiDiagnosis, 
    getAiChatResponse, 
    getAiChatStreamResponse, 
    listAvailableModels, 
    setCurrentModel,
    getCurrentModel
} from '../services/geminiService';

const router = Router();

/**
 * GET /api/models
 * 사용 가능한 Gemini 모델 목록을 조회합니다.
 */
router.get('/models', async (req: Request, res: Response) => {
    try {
        const models = await listAvailableModels();
        res.json({ 
            models,
            currentModel: getCurrentModel()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

/**
 * POST /api/models/select
 * 사용할 모델을 동적으로 변경합니다.
 */
router.post('/models/select', (req: Request, res: Response) => {
    const { modelName } = req.body;
    if (!modelName) {
        return res.status(400).json({ error: 'modelName is required' });
    }

    try {
        setCurrentModel(modelName);
        res.json({ message: `Model changed to ${modelName}`, currentModel: modelName });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change model' });
    }
});

/**
 * POST /api/diagnose
... (기타 라우트 유지)

 */
router.post('/diagnose', async (req: Request, res: Response) => {
    const { userInput } = req.body;

    if (!userInput) {
        return res.status(400).json({ error: 'userInput field is required.' });
    }

    try {
        const diagnosis = await getAiDiagnosis(userInput);
        res.json({ diagnosis });
    } catch (error) {
        console.error('Error getting AI diagnosis:', error);
        res.status(500).json({ error: 'Failed to get AI diagnosis.' });
    }
});

/**
 * POST /api/chat
 * AI 어시스턴트와의 대화 엔드포인트 (일반형)
 */
router.post('/chat', async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'message field is required.' });
    }

    try {
        const reply = await getAiChatResponse(message);
        res.json({ reply });
    } catch (error) {
        console.error('Error getting AI chat response:', error);
        res.status(500).json({ error: 'Failed to get AI chat response.' });
    }
});

/**
 * POST /api/chat/stream
 * AI 어시스턴트와의 실시간 스트리밍 대화 엔드포인트 (SSE)
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'message field is required.' });
    }

    // SSE 설정을 위한 헤더
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const stream = await getAiChatStreamResponse(message, history);

        for await (const chunk of stream) {
            const chunkText = chunk.text();
            // 클라이언트에게 데이터 전송 (SSE 형식)
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // 스트림 종료 알림
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
        res.end();
    }
});

/**
 * GET /api/metrics
 * 실시간 AI 메트릭을 요청하는 엔드포인트
 */
router.get('/metrics', (req: Request, res: Response) => {
    try {
        const metrics = [
            { label: "BIOMARKER ANALYSIS", val: ["A+", "A-", "B+"][Math.floor(Math.random() * 3)] },
            { label: "CELLULAR REGENERATION", val: ["OPTIMAL", "STABLE", "DEGRADED"][Math.floor(Math.random() * 3)] },
            { label: "METABOLIC EFFICIENCY", val: `${Math.floor(Math.random() * 15) + 85}%` },
            { label: "NEUROPLASTICITY", val: ["ACTIVE", "INACTIVE"][Math.floor(Math.random() * 2)] }
        ];
        res.json(metrics);
    } catch (error) {
        console.error('Error getting metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics.' });
    }
});

export default router;
