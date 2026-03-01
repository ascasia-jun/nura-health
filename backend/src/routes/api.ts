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
        const token = process.env.GITHUB_TOKEN!;
        const repoContext = selectedRepo ? `Repository: ${selectedRepo.full_name}` : undefined;
        
        let activeHistory: any[] = [...history];
        let currentInput: any = message; // 최초는 문자열 메시지
        let iteration = 0;
        const MAX_ITERATIONS = 5;

        while (iteration < MAX_ITERATIONS) {
            iteration++;
            qaLogger.info('agent.loop_iteration', { iteration });

            // [안정성] 이력이 너무 커지면 가장 오래된 도구 결과부터 정리 (최근 10턴 유지)
            if (activeHistory.length > 20) {
                activeHistory = [activeHistory[0], ...activeHistory.slice(-15)];
            }

            let result;
            try {
                // 클라이언트가 보낸 model 값을 명시적으로 전달
                result = await getAiChatStreamResponse(currentInput, activeHistory, repoContext, model);
            } catch (error: any) {
                // 만약 모델이 지원되지 않아 404가 발생하면 기본 모델로 자동 폴백
                if (error.message.includes('404') || error.message.includes('not found')) {
                    qaLogger.warn('agent.model_fallback', { failedModel: model, fallbackModel: 'gemini-1.5-flash' });
                    result = await getAiChatStreamResponse(currentInput, activeHistory, repoContext, 'gemini-1.5-flash');
                } else {
                    throw error; // 다른 에러는 위로 던짐
                }
            }
            
            let fullTextInTurn = '';
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    fullTextInTurn += chunkText;
                    res.write(`data: ${JSON.stringify({ type: 'answer', text: chunkText })}\n\n`);
                }
            }

            const response = await result.response;
            const calls = response.functionCalls();

            const modelParts: any[] = [];
            if (fullTextInTurn) modelParts.push({ text: fullTextInTurn });
            if (calls && calls.length > 0) {
                calls.forEach(call => modelParts.push({ functionCall: call }));
            }

            activeHistory.push({ role: 'user', parts: typeof currentInput === 'string' ? [{ text: currentInput }] : currentInput });
            activeHistory.push({ role: 'model', parts: modelParts });

            if (!calls || calls.length === 0) break;

            const functionResponses: any[] = [];
            for (const call of calls) {
                res.write(`data: ${JSON.stringify({ type: 'thought', content: `Executing ${call.name}...` })}\n\n`);
                
                let toolResult: any;
                try {
                    if (call.name === 'list_files' && selectedRepo) {
                        const [owner, repo] = selectedRepo.full_name.split('/');
                        toolResult = await githubService.fetchRepoContent(token, owner, repo, (call.args as any).path || '');
                    } else if (call.name === 'read_file' && selectedRepo) {
                        const [owner, repo] = selectedRepo.full_name.split('/');
                        const data = await githubService.fetchRepoContent(token, owner, repo, (call.args as any).path);
                        let content = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : JSON.stringify(data);
                        
                        // [최적화] 파일 내용이 너무 길면 절단하여 컨텍스트 보호 (최대 10,000자)
                        if (content.length > 10000) {
                            content = content.substring(0, 10000) + "\n\n... (Content truncated due to size limits) ...";
                        }
                        toolResult = content;
                    } else if (call.name === 'read_pr_diff' && selectedRepo) {
                        const [owner, repo] = selectedRepo.full_name.split('/');
                        let diff = await githubService.fetchPullRequestDiff(token, owner, repo, (call.args as any).pull_number);
                        if (diff.length > 10000) {
                            diff = diff.substring(0, 10000) + "\n\n... (Diff truncated) ...";
                        }
                        toolResult = diff;
                    }
                } catch (e: any) {
                    qaLogger.error('mcp.tool_error', { tool: call.name, error: e.message });
                    toolResult = { error: `Failed to execute tool: ${e.message}` };
                }

                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: { content: toolResult || "No data returned" }
                    }
                });
            }

            activeHistory.push({ role: 'function', parts: functionResponses });
            currentInput = "Review the results and provide the next analysis or final summary.";
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error: any) {
        qaLogger.error('agent.fatal_error', { message: error.message, stack: error.stack });
        res.write(`data: ${JSON.stringify({ error: '시스템 용량 또는 정책 제한으로 인해 응답이 중단되었습니다. 대화 내용을 간결하게 유지해 주세요.' })}\n\n`);
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
