import { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS, API_URL } from '../config';
import { CHAT_MODULE_LOADED } from '../types/chat';
import type { ChatSession, Message, AIModel } from '../types/chat';
import { useUser } from '../context/UserContext';

if (!CHAT_MODULE_LOADED) console.warn('Chat types module not loaded');

export interface AttachedResource {
    type: 'pr' | 'commit' | 'file' | 'folder';
    id: string;
    name: string;
    owner: string;
    repo: string;
}

const INITIAL_MESSAGE: Message = { 
    id: 'initial',
    role: 'assistant', 
    parts: [{ 
        type: 'text', 
        content: `# RepoInsight ChatOps 시스템 활성화\n리포지토리 분석, 보안 취약점 점검, 코드 품질 리뷰 등 프로젝트 최적화 프로토콜을 제안해 드립니다.\n\n### 시작 가이드\n1. 오른쪽 사이드바에서 **분석할 저장소**를 선택하세요.\n2. 상단 툴바에서 필요한 **Skill**이나 **Context Hook**을 활성화하세요.\n3. 특정 PR이나 파일을 부착하여 정밀 분석을 요청할 수 있습니다.` 
    }],
    timestamp: new Date()
};

/**
 * ChatOps 기능을 관리하는 커스텀 훅 (v3.8 - Preference Sync Hardened)
 */
export const useChatOps = (initialModel: string = 'gemini-2.0-flash') => {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [models, setModels] = useState<AIModel[]>([]);
    const [currentModel, setCurrentModel] = useState<string>(initialModel);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    
    const [skills, setSkills] = useState<{id: string, name: string}[]>([]);
    const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
    const [selectedHooks, setSelectedHooks] = useState<string[]>([]);
    const [attachedResources, setAttachedResources] = useState<AttachedResource[]>([]);
    
    const currentSessionIdRef = useRef<string | null>(null);
    const isSendingRef = useRef<boolean>(false);

    useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);

    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
    }), [user]);

    /**
     * 가용 AI 모델 목록을 서버에서 새로 불러옵니다.
     */
    const refreshModels = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/api/models`, { headers: getHeaders() as any });
            const data = await res.json();
            if (data.models) {
                setModels(data.models);
                // [v3.8] 사용자의 선호 모델이 있으면 최우선으로 설정
                if (user.preferred_model) {
                    setCurrentModel(user.preferred_model);
                } else if (data.currentModel && !data.models.some((m: any) => m.name === currentModel)) {
                    setCurrentModel(data.currentModel);
                }
            }
        } catch (e) { console.error('모델 목록 갱신 실패'); }
    }, [user, getHeaders, currentModel]);

    // 사용자의 선호 모델 변화 감지 및 즉시 적용
    useEffect(() => {
        if (user?.preferred_model) {
            setCurrentModel(user.preferred_model);
        }
    }, [user?.preferred_model]);

    useEffect(() => {
        const init = async () => {
            if (!user) return;
            try {
                // 1. 초기 모델 로드 (선호 모델 자동 적용 포함)
                await refreshModels();
                
                // 2. 스킬 로드
                const sRes = await fetch(`${API_URL}/api/skills`);
                const sData = await sRes.json();
                if (sData.skills) setSkills(sData.skills);

                // 3. 세션 목록 로드
                const sessRes = await fetch(`${API_URL}/api/sessions`, { headers: getHeaders() as any });
                const sessData = await sessRes.json();
                if (sessData.sessions) setSessions(sessData.sessions);
            } catch (e) { console.error('시스템 초기화 실패'); }
        };
        init();
    }, [user, getHeaders, refreshModels]);

    const createNewSession = useCallback(async () => {
        if (!user) return;
        const title = 'New Analysis Session';
        try {
            const res = await fetch(`${API_URL}/api/sessions`, {
                method: 'POST',
                headers: getHeaders() as any,
                body: JSON.stringify({ title, model: currentModel })
            });
            const data = await res.json();
            if (data.success) {
                const newId = data.sessionId;
                const newSession: ChatSession = { id: newId, title, messages: [INITIAL_MESSAGE], model: currentModel, timestamp: new Date(), isLoading: false };
                setSessions(prev => [newSession, ...prev]);
                setMessages([INITIAL_MESSAGE]);
                setCurrentSessionId(newId);
                setSelectedHooks([]);
                setAttachedResources([]);
                setActiveSkillId(null);
            }
        } catch (e) { console.error('세션 생성 실패'); }
    }, [user, currentModel, getHeaders]);

    const loadSession = useCallback(async (session: ChatSession, currentInput?: string) => {
        if (currentSessionId) {
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, draftInput: currentInput } : s));
        }
        try {
            const res = await fetch(`${API_URL}/api/sessions/${session.id}/messages`, { headers: getHeaders() as any });
            const data = await res.json();
            setMessages(data.messages?.length > 0 ? data.messages : [INITIAL_MESSAGE]);
        } catch (e) { setMessages([INITIAL_MESSAGE]); }
        setCurrentModel(session.model);
        setCurrentSessionId(session.id);
        return session.draftInput || '';
    }, [currentSessionId, getHeaders]);

    const updateSessionTitle = useCallback(async (sessionId: string, newTitle: string) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    }, []);

    const toggleHook = (fileName: string) => {
        setSelectedHooks(prev => prev.includes(fileName) ? prev.filter(h => h !== fileName) : [...prev, fileName]);
    };

    const toggleResource = (resource: AttachedResource) => {
        setAttachedResources(prev => {
            const exists = prev.find(r => r.type === resource.type && r.id === resource.id);
            if (exists) return prev.filter(r => !(r.type === resource.type && r.id === resource.id));
            return [...prev, resource];
        });
    };

    const removeResource = (type: string, id: string) => {
        setAttachedResources(prev => prev.filter(r => !(r.type === type && r.id === id)));
    };

    const parseStreamChunk = useCallback((rawData: string, targetId: string) => {
        try {
            const parsed = JSON.parse(rawData);
            if (parsed.done) {
                setMessages(prev => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last.role === 'assistant') last.isDone = true;
                    return next;
                });
                return true;
            }
            const type = parsed.type === 'answer' ? 'text' : 'thought';
            const content = parsed.type === 'answer' ? parsed.text : parsed.content;
            if (type === 'thought' && content.startsWith('Auto-activating skill: ')) {
                const skillId = content.replace('Auto-activating skill: ', '').trim();
                setActiveSkillId(skillId);
                setMessages(prev => {
                    const next = [...prev];
                    for (let i = next.length - 1; i >= 0; i--) {
                        if (next[i].role === 'user') { if (!next[i].meta) next[i].meta = {}; next[i].meta!.activeSkillId = skillId; break; }
                    }
                    return next;
                });
            }
            setMessages(prev => {
                const updatedMessages = [...prev];
                const last = updatedMessages[updatedMessages.length - 1];
                if (!last || last.role !== 'assistant') return prev;
                if (!last.parts) last.parts = [];
                if (type === 'text') {
                    const lastPart = last.parts[last.parts.length - 1];
                    if (lastPart && lastPart.type === 'text') { if (!lastPart.content.endsWith(content)) lastPart.content += content; }
                    else { last.parts.push({ type: 'text', content }); }
                } else {
                    const targetPart = [...last.parts].reverse().find(p => p.type === 'thought' && !p.content?.startsWith('Completed:') && !p.content?.startsWith('Failed:'));
                    if (targetPart && (content.startsWith('Completed:') || content.startsWith('Failed:') || content.includes('Analyzing'))) { targetPart.content = content; }
                    else if (content && !last.parts.some(p => p.type === 'thought' && p.content === content)) { last.parts.push({ type: 'thought', content }); }
                }
                setSessions(sPrev => sPrev.map(s => s.id === targetId ? { ...s, messages: updatedMessages } : s));
                return updatedMessages;
            });
        } catch (e) {}
        return false;
    }, []);

    const sendMessage = useCallback(async (input: string, sessionId: string | null, selectedRepo?: any) => {
        if (!input.trim() || isSendingRef.current || !user) return;
        isSendingRef.current = true;
        let activeId: string = sessionId || '';
        try {
            // [v3.8] 히스토리 구성 로직 강화
            const history = messages
                .filter(m => (m.parts || []).some(p => p.type === 'text' && p.content.trim() !== ''))
                .slice(-10)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: (m.parts || []).filter(p => p.type === 'text' && p.content.trim() !== '').map(p => ({ text: p.content }))
                }));
            while (history.length > 0 && history[0].role === 'model') { history.shift(); }

            if (!activeId) {
                const res = await fetch(`${API_URL}/api/sessions`, { method: 'POST', headers: getHeaders() as any, body: JSON.stringify({ title: input.substring(0, 30), model: currentModel }) });
                const data = await res.json();
                if (data.success) activeId = data.sessionId;
                else throw new Error('Session creation failed');
                const newSession: ChatSession = { id: activeId, title: input.substring(0, 30), messages: [INITIAL_MESSAGE], model: currentModel, timestamp: new Date(), isLoading: true };
                setSessions(prev => [newSession, ...prev]);
                setCurrentSessionId(activeId);
            } else { setSessions(prev => prev.map(s => s.id === activeId ? { ...s, isLoading: true } : s)); }

            const userMsg: Message = { id: Date.now().toString(), role: 'user', parts: [{ type: 'text', content: input }], timestamp: new Date(), meta: { activeSkillId, selectedHooks: [...selectedHooks], attachedResources: [...attachedResources] } };
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', parts: [], timestamp: new Date(), model: currentModel };
            setMessages(prev => [...prev, userMsg, aiMsg]);

            let hookContext = '';
            if (selectedHooks.length > 0) {
                const contents = await Promise.all(selectedHooks.map(async h => {
                    const res = await fetch(`${API_URL}/api/context/hook?fileName=${h}`);
                    const data = await res.json();
                    return `[FILE: ${h}]\n${data.content || ''}`;
                }));
                hookContext = contents.join('\n\n');
            }

            const res = await fetch(API_ENDPOINTS.CHAT_STREAM, { 
                method: 'POST', 
                headers: getHeaders() as any, 
                body: JSON.stringify({ 
                    message: hookContext ? `${hookContext}\n\n---\n\n${input}` : input, 
                    history, 
                    model: currentModel, 
                    selectedRepo, 
                    activeSkillId, 
                    attachedResources, 
                    sessionId: activeId 
                }), 
            });

            setSelectedHooks([]); setAttachedResources([]);
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let lineBuffer = '';
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read(); if (done) break;
                    lineBuffer += decoder.decode(value, { stream: true });
                    const lines = lineBuffer.split('\n'); lineBuffer = lines.pop() || '';
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
                        if (parseStreamChunk(trimmedLine.slice(6), activeId)) break;
                    }
                }
            }
        } catch (error) { console.error('전송 오류:', error); } finally {
            isSendingRef.current = false;
            setSessions(prev => prev.map(s => s.id === activeId ? { ...s, isLoading: false } : s));
        }
    }, [user, currentModel, messages, parseStreamChunk, activeSkillId, selectedHooks, attachedResources, getHeaders]);

    return { 
        messages, setMessages, models, currentModel, setCurrentModel, refreshModels,
        sessions, currentSessionId, createNewSession, loadSession, sendMessage, updateSessionTitle,
        skills, activeSkillId, setActiveSkillId, selectedHooks, toggleHook, attachedResources, toggleResource, removeResource
    };
};
