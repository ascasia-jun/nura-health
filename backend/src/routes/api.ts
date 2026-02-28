import { Router, Request, Response } from 'express';
import { 
    getAiDiagnosis, 
    getAiChatResponse, 
    getAiChatStreamResponse, 
    listAvailableModels, 
    setCurrentModel,
    getCurrentModel
} from '../services/geminiService';
import { qaLogger } from '../utils/logger';
import { githubService } from '../services/githubService';

const router = Router();

/**
 * GET /api/github/repos
 * GitHub 리포지토리 목록을 가져옵니다.
 */
router.get('/github/repos', async (req: Request, res: Response) => {
    console.log('>>> [BACKEND] Received request for /api/github/repos');
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
        qaLogger.error('github.repos_fetch_failed', 'GitHub token is missing in .env');
        return res.status(500).json({ error: 'GitHub configuration missing on server' });
    }

    try {
        qaLogger.info('github.repos_request_start', { hasToken: !!token });
        const repos = await githubService.fetchUserRepos(token);
        
        if (!repos || !Array.isArray(repos)) {
            qaLogger.error('github.repos_invalid_format', { type: typeof repos });
            return res.status(500).json({ error: 'GitHub API returned an invalid response format' });
        }

        qaLogger.info('github.repos_fetched_success', { count: repos.length });
        res.json({ repos });
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status || 500;
        
        qaLogger.error('github.repos_fetch_failed', {
            message: errorMessage,
            status: statusCode,
            data: error.response?.data
        });
        
        res.status(statusCode).json({ 
            error: `GitHub API Error: ${errorMessage}`,
            details: error.response?.data 
        });
    }
});

/**
 * GET /api/github/repos/:owner/:repo/pulls
 * 특정 저장소의 Open PR 목록을 가져옵니다.
 */
router.get('/github/repos/:owner/:repo/pulls', async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const token = process.env.GITHUB_TOKEN;

    if (!token) return res.status(500).json({ error: 'GitHub configuration missing' });

    try {
        const pulls = await githubService.fetchPullRequests(token, owner, repo);
        qaLogger.info('github.pulls_fetched', { owner, repo, count: pulls.length });
        res.json({ pulls });
    } catch (error: any) {
        qaLogger.error('github.pulls_fetch_failed', error.message);
        res.status(500).json({ error: 'Failed to fetch pull requests' });
    }
});

/**
 * GET /api/models
 * 사용 가능한 Gemini 모델 목록을 조회합니다.
 */
router.get('/models', async (req: Request, res: Response) => {
    try {
        const models = await listAvailableModels();
        const currentModel = getCurrentModel();
        
        qaLogger.info('model.list_fetched', { count: models.length, currentModel });
        
        res.json({ 
            models,
            currentModel
        });
    } catch (error) {
        qaLogger.error('model.fetch_failed', error);
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
        qaLogger.info('model.selected', { modelName });
        res.json({ message: `Model changed to ${modelName}`, currentModel: modelName });
    } catch (error) {
        qaLogger.error('model.selection_failed', { modelName, error });
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
    const { message, history, model, selectedRepo } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'message field is required.' });
    }

    // [보안] GITHUB_TOKEN 안전성 확보
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        qaLogger.error('github.config_missing', 'GITHUB_TOKEN is not configured');
        return res.status(500).json({ error: 'GitHub configuration missing on server' });
    }

    qaLogger.info('chat.stream_started', { model, repo: selectedRepo?.full_name });

    // SSE 설정을 위한 헤더
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const repoContext = selectedRepo ? `Repository: ${selectedRepo.full_name}` : undefined;
        
        let result = await getAiChatStreamResponse(message, history, repoContext);
        let stream = result.stream;

        // 1. 초기 스트림 처리
        for await (const chunk of stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // 2. 도구 호출(Function Calling) 확인 및 처리
        const response = await result.response;
        const calls = response.functionCalls();

        if (calls && calls.length > 0) {
            for (const call of calls) {
                qaLogger.info('mcp.tool_called', { tool: call.name, args: call.args });
                
                let toolResult: any = null;
                
                // [보안] 인자 검증 및 Sanitization
                if (call.name === 'list_files' || call.name === 'read_file') {
                    let path = (call.args as any).path || '';
                    // 경로 탐색 취약점(Path Traversal) 방지
                    if (path.includes('..')) {
                        toolResult = { error: 'Access denied: Path traversal attempt detected.' };
                    } else if (selectedRepo) {
                        const [owner, repoName] = selectedRepo.full_name.split('/');
                        if (call.name === 'list_files') {
                            toolResult = await githubService.fetchRepoContent(token, owner, repoName, path);
                        } else {
                            const data = await githubService.fetchRepoContent(token, owner, repoName, path);
                            toolResult = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : data;
                        }
                    }
                } else if (call.name === 'read_pr_diff' && selectedRepo) {
                    const pullNumber = (call.args as any).pull_number;
                    // PR 번호 유효성 검사
                    if (typeof pullNumber !== 'number' || pullNumber <= 0) {
                        toolResult = { error: 'Invalid PR number provided.' };
                    } else {
                        const [owner, repoName] = selectedRepo.full_name.split('/');
                        toolResult = await githubService.fetchPullRequestDiff(token, owner, repoName, pullNumber);
                    }
                }

                // [안정성] toolResult가 없을 경우 AI에게 실패 알림
                const finalToolResult = toolResult || { error: 'Failed to retrieve data from GitHub.' };

                const modelObj = (await import('../services/geminiService')).getCurrentModel();
                const genAI = new (await import('@google/generative-ai')).GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
                const activeModel = genAI.getGenerativeModel({ model: modelObj });
                
                // 대화 이력 재구성 (정확한 타입 보장)
                const chatHistory: any[] = [
                    ...history,
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { content: finalToolResult } } }] }
                ];
                
                const secondResult = await activeModel.generateContent({
                    contents: chatHistory
                });
                
                const finalReply = (await secondResult.response).text();
                res.write(`data: ${JSON.stringify({ text: `\n\n> **AI 분석 결과:**\n\n${finalReply}` })}\n\n`);
            }
        }

        // 스트림 종료 알림
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error: any) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
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
