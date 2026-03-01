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

// --- API 엔드포인트 생략 (기존 유지) ---
router.get('/github/repos', async (req: Request, res: Response) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GitHub token missing' });
    try {
        const repos = await githubService.fetchUserRepos(token);
        res.json({ repos });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get('/github/repos/:owner/:repo/pulls', async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GitHub token missing' });
    try {
        const pulls = await githubService.fetchPullRequests(token, owner, repo);
        res.json({ pulls });
    } catch (error: any) { res.status(500).json({ error: 'Failed to fetch pull requests' }); }
});

router.get('/models', async (req: Request, res: Response) => {
    try {
        const models = await listAvailableModels();
        const currentModel = getCurrentModel();
        res.json({ models, currentModel });
    } catch (error) { res.status(500).json({ error: 'Failed to fetch models' }); }
});

router.post('/models/select', (req: Request, res: Response) => {
    const { modelName } = req.body;
    if (!modelName) return res.status(400).json({ error: 'modelName is required' });
    setCurrentModel(modelName);
    res.json({ currentModel: modelName });
});

/**
 * POST /api/chat/stream
 * 최적화된 AI 에이전트 루프
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
    const { message, history, model, selectedRepo } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GitHub token missing' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const repoContext = selectedRepo ? `Repository: ${selectedRepo.full_name}` : undefined;
        
        // 1. 이력 초기화 (프론트엔드에서 넘어온 history에 이번 질문 추가)
        let activeHistory: any[] = [...history];
        let currentPrompt: string = message; 
        let iteration = 0;
        const MAX_ITERATIONS = 8; // 분석 정확도를 위해 약간 상향 조정

        while (iteration < MAX_ITERATIONS) {
            iteration++;
            qaLogger.info('agent.loop_iteration', { iteration });

            // API 호출
            const result = await getAiChatStreamResponse(currentPrompt, activeHistory, repoContext, model);

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

            // [핵심] 이번 턴의 상호작용을 이력에 순서대로 기록
            // iteration 1에서만 user 메시지를 넣고, 이후는 function 결과가 user 역할을 대신함
            if (iteration === 1) {
                activeHistory.push({ role: 'user', parts: [{ text: message }] });
            }
            
            const modelParts: any[] = [];
            if (fullTextInTurn) modelParts.push({ text: fullTextInTurn });
            if (calls && calls.length > 0) {
                calls.forEach(call => modelParts.push({ functionCall: call }));
            }
            
            // 모델의 응답(텍스트 또는 도구 호출)을 이력에 추가
            if (modelParts.length > 0) {
                activeHistory.push({ role: 'model', parts: modelParts });
            }

            // 도구 호출이 없으면 에이전트 작업 완료
            if (!calls || calls.length === 0) break;

            // 2. 도구 실행 섹션
            const functionResponses: any[] = [];
            for (const call of calls) {
                let statusMsg = `Executing ${call.name}...`;
                if (call.name === 'read_file') statusMsg = `Reading file: ${(call.args as any).path}`;
                res.write(`data: ${JSON.stringify({ type: 'thought', content: statusMsg })}\n\n`);
                
                let toolResult: any;
                try {
                    if (call.name === 'list_files' && selectedRepo) {
                        const [owner, repo] = selectedRepo.full_name.split('/');
                        toolResult = await githubService.fetchRepoContent(token, owner, repo, (call.args as any).path || '');
                    } else if (call.name === 'read_file' && selectedRepo) {
                        const [owner, repo] = selectedRepo.full_name.split('/');
                        const data = await githubService.fetchRepoContent(token, owner, repo, (call.args as any).path);
                        toolResult = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : JSON.stringify(data);
                        // 토큰 절약을 위해 결과 최적화
                        if (toolResult.length > 8000) toolResult = toolResult.substring(0, 8000) + "...(content truncated)";
                    }
                    res.write(`data: ${JSON.stringify({ type: 'thought', content: `Completed: ${call.name}` })}\n\n`);
                } catch (e: any) {
                    toolResult = { error: e.message };
                    res.write(`data: ${JSON.stringify({ type: 'thought', content: `Failed: ${call.name}` })}\n\n`);
                }

                functionResponses.push({
                    functionResponse: { name: call.name, response: { content: toolResult } }
                });
            }

            // 3. 도구 실행 결과를 이력에 추가 (role: 'function'은 다음 루프에서 모델의 판단 근거가 됨)
            activeHistory.push({ role: 'function', parts: functionResponses });
            
            // 다음 루프를 위해 prompt를 비움 (이미 history에 정보가 충분함)
            currentPrompt = ""; 
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error: any) {
        qaLogger.error('agent.fatal_error', { message: error.message });
        res.write(`data: ${JSON.stringify({ error: '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' })}\n\n`);
        res.end();
    }
});

router.get('/metrics', (req: Request, res: Response) => {
    res.json([{ label: "SYSTEM", val: "STABLE" }]);
});

export default router;
