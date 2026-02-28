import { Router, Request, Response } from 'express';
import { getAiDiagnosis, getAiChatResponse } from '../services/geminiService';

const router = Router();

/**
 * POST /api/diagnose
 * AI 진단 및 처방을 요청하는 엔드포인트
 */
router.post('/diagnose', async (req: Request, res: Response) => {
    const { userInput } = req.body;

    if (!userInput) {
        return res.status(400).json({ error: 'userInput field is required.' });
    }

    try {
        // geminiService를 호출하여 AI 진단을 받습니다.
        const diagnosis = await getAiDiagnosis(userInput);
        res.json({ diagnosis });
    } catch (error) {
        console.error('Error getting AI diagnosis:', error);
        res.status(500).json({ error: 'Failed to get AI diagnosis.' });
    }
});

/**
 * POST /api/chat
 * AI 어시스턴트와의 대화 엔드포인트
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
