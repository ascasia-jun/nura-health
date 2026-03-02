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

// --- Skills & Context Hook API (기존 유지) ---
router.get('/skills', async (req: Request, res: Response) => {
    try {
        const skillsDir = path.join(__dirname, '../skills');
        await fs.mkdir(skillsDir, { recursive: true });
        const files = await fs.readdir(skillsDir);
        const skills = files.filter(f => f.endsWith('.md')).map(f => ({ id: f.replace('.md', ''), name: f.replace('.md', '').replace(/-/g, ' ').toUpperCase() }));
        res.json({ skills });
    } catch (e) { res.status(500).json({ error: 'Failed to load skills' }); }
});

router.get('/context/hook', async (req: Request, res: Response) => {
    const { fileName } = req.query;
    if (!fileName) return res.status(400).json({ error: 'fileName is required' });
    try {
        const allowedFiles = ['GEMINI.md', 'plan.md', 'README.md', 'checklist.md', 'context_notes.md'];
        if (!allowedFiles.includes(fileName as string)) return res.status(403).json({ error: 'Access denied' });
        const filePath = path.join(process.cwd(), '..', fileName as string);
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ fileName, content });
    } catch (e) { res.status(500).json({ error: 'Failed to read file' }); }
});

// --- GitHub API 확장 ---

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

router.get('/github/repos/:owner/:repo/commits', async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GitHub token missing' });
    try {
        const commits = await githubService.fetchCommits(token, owner, repo);
        res.json({ commits });
    } catch (error: any) { res.status(500).json({ error: 'Failed to fetch commits' }); }
});

router.get('/github/repos/:owner/:repo/tree', async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GitHub token missing' });
    try {
        const tree = await githubService.fetchFileTree(token, owner, repo);
        res.json({ tree });
    } catch (error: any) { res.status(500).json({ error: 'Failed to fetch file tree' }); }
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
 * POST /api/diagnose
 * 텔레메트리 기반 가상 진단 프로토콜 생성
 */
router.post('/diagnose', async (req: Request, res: Response) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    try {
        const protocol = await getAiDiagnosis(message);
        res.json({ protocol });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/chat/stream (v3.1 - GitHub Insight Expansion)
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
    const { message, history, model, selectedRepo, activeSkillId, attachedResources } = req.body;
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

        // --- [Attached Resources Content Fetching] ---
        if (attachedResources && Array.isArray(attachedResources) && attachedResources.length > 0) {
            const resourceContents = await Promise.all(attachedResources.map(async (res: any) => {
                try {
                    let content = '';
                    if (res.type === 'pr') {
                        content = await githubService.fetchPullRequestDiff(token, res.owner, res.repo, Number(res.id));
                    } else if (res.type === 'commit') {
                        content = await githubService.fetchCommitDiff(token, res.owner, res.repo, res.id);
                    } else if (res.type === 'file') {
                        const data = await githubService.fetchRepoContent(token, res.owner, res.repo, res.id);
                        content = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : JSON.stringify(data);
                    }
                    
                    if (!content) return `[EMPTY RESOURCE: ${res.name}]`;
                    return `[ATTACHED ${res.type.toUpperCase()}: ${res.name}]\n${content.substring(0, 8000)}`; 
                } catch (e: any) { 
                    qaLogger.warn('agent.resource_fetch_failed', { resource: res.name, error: e.message });
                    return `[FAILED TO FETCH ${res.name}: ${e.message}]`; 
                }
            }));
            currentPrompt = `${resourceContents.join('\n\n')}\n\n---\n\n${currentPrompt}`;
        }
        
        // --- [Skills Injection] ---
        if (activeSkillId) {
            try {
                const skillPath = path.join(__dirname, '../skills', `${activeSkillId}.md`);
                const skillContent = await fs.readFile(skillPath, 'utf-8');
                currentPrompt = `[SYSTEM: ACTIVATED SKILL - ${activeSkillId}]\n${skillContent}\n\n[USER MESSAGE]\n${currentPrompt}`;
            } catch (e) { qaLogger.warn('skill.load_failed', { activeSkillId }); }
        }

        let iteration = 0;
        const MAX_ITERATIONS = 30;
        const lastCallTracker = new Set<string>();

        while (iteration < MAX_ITERATIONS) {
            iteration++;
            const result = await getAiChatStreamResponse(iteration === 1 ? currentPrompt : "", activeHistory, repoContext, model);

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

            if (iteration === 1) activeHistory.push({ role: 'user', parts: [{ text: currentPrompt }] });
            
            const modelParts: any[] = [];
            if (fullTextInTurn) modelParts.push({ text: fullTextInTurn });
            if (calls && calls.length > 0) calls.forEach(call => modelParts.push({ functionCall: call }));
            if (modelParts.length > 0) activeHistory.push({ role: 'model', parts: modelParts });

            if (!calls || calls.length === 0) break;

            const callFingerprint = JSON.stringify(calls);
            if (lastCallTracker.has(callFingerprint)) break;
            lastCallTracker.add(callFingerprint);

            const functionResponses: any[] = [];
            for (const call of calls) {
                let statusMsg = `Executing ${call.name}...`;
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
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error: any) {
        qaLogger.error('agent.fatal_error', { message: error.message });
        const errorMsg = `\n\n⚠️ **분석 중 오류 발생**: ${error.message}\n현재 선택된 모델(\`${model}\`)을 사용할 수 없거나 할당량이 초과되었을 수 있습니다. 다른 모델(예: gemini-1.5-flash)로 변경하여 다시 시도해 주세요.`;
        res.write(`data: ${JSON.stringify({ type: 'answer', text: errorMsg })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    }
});

router.get('/metrics', (req: Request, res: Response) => { res.json([{ label: "SYSTEM", val: "STABLE" }]); });

export default router;
