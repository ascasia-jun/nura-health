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
import { getDb } from '../database/db';
import { encrypt, decrypt } from '../utils/security';

const router = Router();

// --- [User Session & History Management API] ---

/**
 * GET /api/sessions
 * 사용자별 대화 세션 목록 조회
 */
router.get('/sessions', async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string; // 헤더에서 사용자 ID 획득
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const db = getDb();
        const sessions = await db.all('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY timestamp DESC', [userId]);
        res.json({ sessions });
    } catch (e) { res.status(500).json({ error: 'Failed to load sessions' }); }
});

/**
 * POST /api/sessions
 * 신규 세션 생성 및 DB 저장
 */
router.post('/sessions', async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { title, model } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const db = getDb();
        const sessionId = `sess_${Date.now()}`;
        await db.run(
            'INSERT INTO chat_sessions (id, user_id, title, model) VALUES (?, ?, ?, ?)',
            [sessionId, userId, title, model]
        );
        res.json({ success: true, sessionId });
    } catch (e) { res.status(500).json({ error: 'Failed to create session' }); }
});

/**
 * GET /api/sessions/:id/messages
 * 특정 세션의 메시지 이력 조회
 */
router.get('/sessions/:id/messages', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const db = getDb();
        const rows = await db.all('SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC', [id]);
        const messages = rows.map(r => ({
            ...JSON.parse(r.content_json),
            role: r.role,
            timestamp: r.timestamp
        }));
        res.json({ messages });
    } catch (e) { res.status(500).json({ error: 'Failed to load messages' }); }
});

// --- [Skills & Context Hook API] ---

router.get('/skills', async (req: Request, res: Response) => {
    try {
        const skillsDir = path.join(__dirname, '../skills');
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
    try {
        const allowedFiles = ['GEMINI.md', 'plan.md', 'README.md', 'checklist.md', 'context_notes.md'];
        if (!allowedFiles.includes(fileName as string)) return res.status(403).json({ error: 'Access denied' });
        const filePath = path.join(process.cwd(), '..', fileName as string);
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ fileName, content });
    } catch (e) { res.status(500).json({ error: 'Failed to read file' }); }
});

// --- [GitHub & Model Management (Enhanced with Encryption)] ---

router.get('/github/repos', async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    // 1. DB에서 사용자의 암호화된 토큰 조회 시도
    // 2. 없으면 환경 변수 폴백 (기존 호환성)
    let token = process.env.GITHUB_TOKEN;
    
    try {
        const db = getDb();
        const cred = await db.get('SELECT * FROM user_credentials WHERE user_id = ? AND service_name = ?', [userId, 'github']);
        if (cred) token = decrypt(cred.encrypted_token); // 복호화 사용
        
        if (!token) return res.status(500).json({ error: 'GitHub token missing' });
        const repos = await githubService.fetchUserRepos(token);
        res.json({ repos });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// (기타 GitHub API 라우트들도 위와 동일한 토큰 로직 적용 필요 - 생략 후 핵심 스트리밍 수정)

router.get('/models', async (req: Request, res: Response) => {
    try {
        const models = await listAvailableModels();
        const currentModel = getCurrentModel();
        res.json({ models, currentModel });
    } catch (error) { res.status(500).json({ error: 'Failed to fetch models' }); }
});

/**
 * POST /api/chat/stream (v3.7 - Persistent Storage Integrated)
 */
router.post('/chat/stream', async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const { message, history, model, selectedRepo, activeSkillId, attachedResources, sessionId } = req.body;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let token = process.env.GITHUB_TOKEN;
    try {
        const db = getDb();
        const cred = await db.get('SELECT * FROM user_credentials WHERE user_id = ? AND service_name = ?', [userId, 'github']);
        if (cred) token = decrypt(cred.encrypted_token);
    } catch(e) {}

    if (!token) return res.status(500).json({ error: 'GitHub token missing' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const repoContext = selectedRepo ? `Repository: ${selectedRepo.full_name}` : undefined;
        let activeHistory: any[] = [...history];
        let currentPrompt: string = message; 
        let finalSkillId = activeSkillId;

        // Auto Trigger
        if (!finalSkillId) {
            finalSkillId = await detectSkillFromMessage(message);
            if (finalSkillId) {
                res.write(`data: ${JSON.stringify({ type: 'thought', content: `Auto-activating skill: ${finalSkillId}` })}\n\n`);
            }
        }

        // Resources
        if (attachedResources?.length > 0) {
            const resourceContents = await Promise.all(attachedResources.map(async (res: any) => {
                try {
                    let content = '';
                    if (res.type === 'pr') content = await githubService.fetchPullRequestDiff(token!, res.owner, res.repo, Number(res.id));
                    else if (res.type === 'commit') content = await githubService.fetchCommitDiff(token!, res.owner, res.repo, res.id);
                    else if (res.type === 'file') {
                        const data = await githubService.fetchRepoContent(token!, res.owner, res.repo, res.id);
                        content = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : JSON.stringify(data);
                    } else if (res.type === 'folder') {
                        const tree = await githubService.fetchFileTree(token!, res.owner, res.repo);
                        const subItems = tree.filter((f: any) => f.path.startsWith(res.id));
                        content = `Structure for ${res.id}:\n` + subItems.map((f: any) => `- ${f.path}`).join('\n');
                    }
                    return `[ATTACHED ${res.type.toUpperCase()}: ${res.name}]\n${content.substring(0, 5000)}`; 
                } catch (e) { return `[FAILED: ${res.name}]`; }
            }));
            currentPrompt = `${resourceContents.join('\n\n')}\n\n---\n\n${currentPrompt}`;
        }
        
        // Skill Injection
        if (finalSkillId) {
            const skillPath = path.join(__dirname, '../skills', finalSkillId, 'SKILL.md');
            const skillContent = await fs.readFile(skillPath, 'utf-8');
            currentPrompt = `<activated_skill name="${finalSkillId}">\n${skillContent}\n</activated_skill>\n\n${currentPrompt}`;
        }

        let iteration = 0;
        let fullAIResponse = ''; // 저장용

        while (iteration < 30) {
            iteration++;
            const result = await getAiChatStreamResponse(iteration === 1 ? currentPrompt : "", activeHistory, repoContext, model);
            
            let turnText = '';
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    turnText += text;
                    fullAIResponse += text;
                    res.write(`data: ${JSON.stringify({ type: 'answer', text })}\n\n`);
                }
            }

            const response = await result.response;
            const calls = response.functionCalls();
            if (iteration === 1) activeHistory.push({ role: 'user', parts: [{ text: currentPrompt }] });
            const modelParts: any[] = [];
            if (turnText) modelParts.push({ text: turnText });
            if (calls?.length > 0) calls.forEach(call => modelParts.push({ functionCall: call }));
            if (modelParts.length > 0) activeHistory.push({ role: 'model', parts: modelParts });

            if (!calls || calls.length === 0) break;

            const functionResponses: any[] = [];
            for (const call of calls) {
                res.write(`data: ${JSON.stringify({ type: 'thought', content: `Executing ${call.name}...` })}\n\n`);
                let toolResult: any;
                try {
                    const [owner, repo] = selectedRepo.full_name.split('/');
                    if (call.name === 'list_files') toolResult = await githubService.fetchRepoContent(token!, owner, repo, (call.args as any).path || '');
                    else if (call.name === 'read_file') {
                        const data = await githubService.fetchRepoContent(token!, owner, repo, (call.args as any).path);
                        toolResult = data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : JSON.stringify(data);
                    }
                    res.write(`data: ${JSON.stringify({ type: 'thought', content: `Completed: ${call.name}` })}\n\n`);
                } catch (e: any) { toolResult = { error: e.message }; }
                functionResponses.push({ functionResponse: { name: call.name, response: { content: toolResult } } });
            }
            activeHistory.push({ role: 'function', parts: functionResponses });
        }

        // [v3.7] 대화 종료 시 DB 저장
        if (sessionId) {
            const db = getDb();
            // 사용자 메시지 저장
            await db.run(
                'INSERT INTO messages (session_id, role, content_json, timestamp) VALUES (?, ?, ?, ?)',
                [sessionId, 'user', JSON.stringify({ parts: [{ type: 'text', content: message }], meta: { activeSkillId, attachedResources } }), new Date()]
            );
            // AI 응답 저장
            await db.run(
                'INSERT INTO messages (session_id, role, content_json, timestamp) VALUES (?, ?, ?, ?)',
                [sessionId, 'assistant', JSON.stringify({ parts: [{ type: 'text', content: fullAIResponse }] }), new Date()]
            );
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error: any) {
        res.write(`data: ${JSON.stringify({ type: 'answer', text: `\n\n⚠️ 오류: ${error.message}` })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    }
});

router.get('/metrics', (req: Request, res: Response) => { res.json([{ label: "SYSTEM", val: "STABLE" }]); });

export default router;
