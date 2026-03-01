import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
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

// --- Skills & Context Hook API ---

/**
 * GET /api/skills
 * 사용 가능한 분석 스킬 목록을 반환합니다.
 */
router.get('/skills', async (req: Request, res: Response) => {
    try {
        const skillsDir = path.join(__dirname, '../skills');
        // 디렉토리가 없으면 생성
        await fs.mkdir(skillsDir, { recursive: true });
        
        const files = await fs.readdir(skillsDir);
        const skills = files
            .filter(f => f.endsWith('.md'))
            .map(f => ({ 
                id: f.replace('.md', ''), 
                name: f.replace('.md', '').replace(/-/g, ' ').toUpperCase() 
            }));
            
        qaLogger.info('skills.list_fetched', { count: skills.length });
        res.json({ skills });
    } catch (e) { 
        qaLogger.error('skills.fetch_failed', e);
        res.status(500).json({ error: 'Failed to load skills' }); 
    }
});

/**
 * GET /api/context/hook
 * 서버의 특정 MD 파일 내용을 읽어옵니다.
 */
router.get('/context/hook', async (req: Request, res: Response) => {
    const { fileName } = req.query;
    if (!fileName) return res.status(400).json({ error: 'fileName is required' });

    try {
        // 보안: 허용된 파일 목록만 읽기 가능
        const allowedFiles = ['GEMINI.md', 'plan.md', 'README.md', 'checklist.md', 'context_notes.md'];
        if (!allowedFiles.includes(fileName as string)) {
            return res.status(403).json({ error: 'Access denied to requested file' });
        }

        // nura-health 루트 디렉토리 기준으로 파일 찾기
        const filePath = path.join(process.cwd(), '..', fileName as string);
        const content = await fs.readFile(filePath, 'utf-8');
        
        res.json({ fileName, content });
    } catch (e) { 
        qaLogger.error('context.hook_failed', { fileName, error: e });
        res.status(500).json({ error: 'Failed to read file' }); 
    }
});

// --- GitHub API ---
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

// --- 모델 관리 ---
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
 * POST /api/chat/stream (v3 확장 버전)
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
    const { message, history, model, selectedRepo, activeSkillId } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GitHub token missing' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const repoContext = selectedRepo ? `Repository: ${selectedRepo.full_name}` : undefined;
        let activeHistory: any[] = [...history];
        let currentPrompt: string = message; 
        
        // --- [Skills Injection] ---
        if (activeSkillId) {
            try {
                const skillPath = path.join(__dirname, '../skills', `${activeSkillId}.md`);
                const skillContent = await fs.readFile(skillPath, 'utf-8');
                // 시스템 지시문으로 스킬 내용 주입
                currentPrompt = `[SYSTEM: ACTIVATED SKILL - ${activeSkillId}]\n${skillContent}\n\n[USER MESSAGE]\n${message}`;
                qaLogger.info('skill.injected', { activeSkillId });
            } catch (e) { 
                qaLogger.warn('skill.load_failed', { activeSkillId }); 
            }
        }

        let iteration = 0;
        const MAX_ITERATIONS = 30; // 서비스 확장에 맞춰 상향
        const lastCallTracker = new Set<string>(); // 루프 무한 반복 방지용

        while (iteration < MAX_ITERATIONS) {
            iteration++;
            qaLogger.info('agent.loop_iteration', { iteration });

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

            // 이력 기록 로직
            if (iteration === 1) {
                activeHistory.push({ role: 'user', parts: [{ text: currentPrompt }] });
            }
            
            const modelParts: any[] = [];
            if (fullTextInTurn) modelParts.push({ text: fullTextInTurn });
            if (calls && calls.length > 0) {
                calls.forEach(call => modelParts.push({ functionCall: call }));
            }
            if (modelParts.length > 0) {
                activeHistory.push({ role: 'model', parts: modelParts });
            }

            if (!calls || calls.length === 0) break;

            // [Loop Protection]
            const callFingerprint = JSON.stringify(calls);
            if (lastCallTracker.has(callFingerprint)) {
                res.write(`data: ${JSON.stringify({ type: 'thought', content: 'Detected repeated actions. Terminating loop for stability.' })}\n\n`);
                break;
            }
            lastCallTracker.add(callFingerprint);

            // 도구 실행
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
                        if (toolResult.length > 8000) toolResult = toolResult.substring(0, 8000) + "...(truncated)";
                    }
                    res.write(`data: ${JSON.stringify({ type: 'thought', content: `Completed: ${call.name}` })}\n\n`);
                } catch (e: any) {
                    toolResult = { error: e.message };
                    res.write(`data: ${JSON.stringify({ type: 'thought', content: `Failed: ${call.name}` })}\n\n`);
                }
                functionResponses.push({ functionResponse: { name: call.name, response: { content: toolResult } } });
            }

            activeHistory.push({ role: 'function', parts: functionResponses });
            currentPrompt = ""; 
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error: any) {
        qaLogger.error('agent.fatal_error', { message: error.message });
        res.write(`data: ${JSON.stringify({ error: '시스템 분석 중 오류가 발생했습니다.' })}\n\n`);
        res.end();
    }
});

router.get('/metrics', (req: Request, res: Response) => {
    res.json([{ label: "SYSTEM", val: "STABLE" }]);
});

export default router;
