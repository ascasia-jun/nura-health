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
import { detectSkillFromMessage } from '../utils/skillDetector';

const router = Router();

// --- Skills & Context Hook API (기존 유지) ---
router.get('/skills', async (req: Request, res: Response) => {
    try {
        const skillsDir = path.join(__dirname, '../skills');
        await fs.mkdir(skillsDir, { recursive: true });
        const entries = await fs.readdir(skillsDir, { withFileTypes: true });
        const skills = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                try {
                    const metadataPath = path.join(skillsDir, entry.name, 'metadata.json');
                    const metadataRaw = await fs.readFile(metadataPath, 'utf-8');
                    const metadata = JSON.parse(metadataRaw);
                    skills.push({ id: metadata.id || entry.name, name: metadata.name || entry.name.toUpperCase(), description: metadata.description || '' });
                } catch (e) { skills.push({ id: entry.name, name: entry.name.toUpperCase() }); }
            }
        }
        res.json({ skills });
    } catch (e) { res.status(500).json({ error: 'Failed to load skills' }); }
});

router.get('/skills/:id/content', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const skillsDir = path.join(__dirname, '../skills');
        const skillPath = path.join(skillsDir, id, 'SKILL.md');
        const content = await fs.readFile(skillPath, 'utf-8');
        res.json({ id, content });
    } catch (e) { res.status(404).json({ error: 'Skill content not found' }); }
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

// --- GitHub API (기존 유지) ---
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

router.post('/diagnose', async (req: Request, res: Response) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    try {
        const protocol = await getAiDiagnosis(message);
        res.json({ protocol });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

/**
 * POST /api/chat/stream (v3.5 - Advanced MCP Tools)
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
        let finalSkillId = activeSkillId;

        // --- [Auto Skill Trigger Detection] ---
        if (!finalSkillId) {
            finalSkillId = await detectSkillFromMessage(message);
            if (finalSkillId) {
                res.write(`data: ${JSON.stringify({ type: 'thought', content: `Auto-activating skill: ${finalSkillId}` })}\n\n`);
                res.write(`data: ${JSON.stringify({ type: 'thought', content: `Analyzing with specialized intelligence: ${finalSkillId.toUpperCase()}` })}\n\n`);
            }
        }

        // --- [Attached Resources Content Fetching] ---
        if (attachedResources && Array.isArray(attachedResources) && attachedResources.length > 0) {
            const resourceContents = await Promise.all(attachedResources.map(async (res: any) => {
                try {
                    let content = '';
                    if (res.type === 'pr') content = await githubService.fetchPullRequestDiff(token, res.owner, res.repo, Number(res.id));
                    else if (res.type === 'commit') content = await githubService.fetchCommitDiff(token, res.owner, res.repo, res.id);
                    else if (res.type === 'file') {
                        const data = await githubService.fetchRepoContent(token, res.owner, res.repo, res.id);
                        content = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : JSON.stringify(data);
                    }
                    if (!content) return `[EMPTY RESOURCE: ${res.name}]`;
                    return `[ATTACHED ${res.type.toUpperCase()}: ${res.name}]\n${content.substring(0, 8000)}`; 
                } catch (e: any) { return `[FAILED TO FETCH ${res.name}]`; }
            }));
            currentPrompt = `${resourceContents.join('\n\n')}\n\n---\n\n${currentPrompt}`;
        }
        
        // --- [Skills Injection] ---
        if (finalSkillId) {
            try {
                const skillPath = path.join(__dirname, '../skills', finalSkillId, 'SKILL.md');
                const skillContent = await fs.readFile(skillPath, 'utf-8');
                currentPrompt = `<activated_skill name="${finalSkillId}">\n${skillContent}\n</activated_skill>\n\n[USER MESSAGE]\n${currentPrompt}`;
            } catch (e) { qaLogger.warn('skill.load_failed', { finalSkillId }); }
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
                res.write(`data: ${JSON.stringify({ type: 'thought', content: `Executing ${call.name}...` })}\n\n`);
                let toolResult: any;
                try {
                    const [owner, repo] = selectedRepo ? selectedRepo.full_name.split('/') : [null, null];
                    
                    if (call.name === 'list_files' && owner && repo) {
                        toolResult = await githubService.fetchRepoContent(token, owner, repo, (call.args as any).path || '');
                    } else if (call.name === 'read_file' && owner && repo) {
                        const data = await githubService.fetchRepoContent(token, owner, repo, (call.args as any).path);
                        toolResult = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : JSON.stringify(data);
                    } else if (call.name === 'read_many_files' && owner && repo) {
                        // [신규] 대량 읽기 구현
                        const paths = (call.args as any).paths || [];
                        const files = await Promise.all(paths.slice(0, 10).map(async (p: string) => {
                            try {
                                const data = await githubService.fetchRepoContent(token, owner, repo, p);
                                return { path: p, content: data.content ? Buffer.from(data.content, 'base64').toString('utf-8').substring(0, 5000) : "Failed to load" };
                            } catch (e) { return { path: p, content: "Error loading file" }; }
                        }));
                        toolResult = { files };
                    } else if (call.name === 'grep_search' && owner && repo) {
                        // [신규] 코드 검색 구현
                        toolResult = await githubService.searchCode(token, owner, repo, (call.args as any).query);
                    } else if (call.name === 'glob' && owner && repo) {
                        // [신규] Glob 탐색 구현 (트리를 가져와서 정규표현식 매칭)
                        const pattern = (call.args as any).pattern || '';
                        const tree = await githubService.fetchFileTree(token, owner, repo);
                        // 단순 glob to regex 변환 (예: **/*.ts -> .*\.ts$)
                        const regexStr = pattern.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
                        const regex = new RegExp(`^${regexStr}$`);
                        const paths = tree.filter((f: any) => f.type === 'blob' && regex.test(f.path)).map((f: any) => f.path);
                        toolResult = { paths: paths.slice(0, 50) };
                    } else if (call.name === 'read_pr_diff' && owner && repo) {
                        toolResult = await githubService.fetchPullRequestDiff(token, owner, repo, (call.args as any).pull_number);
                    }

                    if (typeof toolResult === 'string' && toolResult.length > 10000) toolResult = toolResult.substring(0, 10000) + "...(truncated)";
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
        res.write(`data: ${JSON.stringify({ type: 'answer', text: `\n\n⚠️ **오류 발생**: ${error.message}` })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    }
});

router.get('/metrics', (req: Request, res: Response) => { res.json([{ label: "SYSTEM", val: "STABLE" }]); });

export default router;
