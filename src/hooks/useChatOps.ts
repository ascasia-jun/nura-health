import { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS, API_URL } from '../config';
import { CHAT_MODULE_LOADED } from '../types/chat';
import type { ChatSession, Message, AIModel } from '../types/chat';

// 모듈 로드 보장
if (!CHAT_MODULE_LOADED) console.warn('Chat types module not loaded');

export const useChatOps = (initialModel: string = 'gemini-1.5-flash') => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [models, setModels] = useState<AIModel[]>([]);
    const [currentModel, setCurrentModel] = useState<string>(initialModel);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    
    // --- 확장 기능 상태 ---
    const [skills, setSkills] = useState<{id: string, name: string}[]>([]);
    const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
    const [selectedHooks, setSelectedHooks] = useState<string[]>([]); // [NEW] 선택된 훅 목록
    
    const currentSessionIdRef = useRef<string | null>(null);
    const isSendingRef = useRef<boolean>(false);

    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    // 초기화
    useEffect(() => {
        const init = async () => {
            try {
                const mRes = await fetch(`${API_URL}/api/models`);
                const mData = await mRes.json();
                if (mData.models) {
                    setModels(mData.models);
                    if (mData.currentModel) setCurrentModel(mData.currentModel);
                }
                const sRes = await fetch(`${API_URL}/api/skills`);
                const sData = await sRes.json();
                if (sData.skills) setSkills(sData.skills);
            } catch (e) { console.error('시스템 초기화 실패'); }
        };
        init();
    }, []);

    const createNewSession = useCallback(() => {
        const newId = Date.now().toString();
        const newSession: ChatSession = {
            id: newId,
            title: 'New Analysis Session',
            messages: [],
            model: currentModel,
            timestamp: new Date(),
            draftInput: '',
            isLoading: false
        };
        setSessions(prev => [newSession, ...prev].slice(0, 20));
        setMessages([]);
        setCurrentSessionId(newId);
        setSelectedHooks([]); // 훅 초기화
    }, [currentModel]);

    const loadSession = useCallback((session: ChatSession, currentInput?: string) => {
        if (currentSessionId) {
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, draftInput: currentInput } : s));
        }
        setMessages([...(session.messages || [])]);
        setCurrentModel(session.model);
        setCurrentSessionId(session.id);
        return session.draftInput || '';
    }, [currentSessionId]);

    /**
     * 훅 선택 상태를 토글합니다.
     */
    const toggleHook = (fileName: string) => {
        setSelectedHooks(prev => 
            prev.includes(fileName) ? prev.filter(h => h !== fileName) : [...prev, fileName]
        );
    };

    /**
     * 서버에서 파일 내용을 읽어옵니다.
     */
    const getFileContent = async (fileName: string) => {
        try {
            const res = await fetch(`${API_URL}/api/context/hook?fileName=${fileName}`);
            const data = await res.json();
            return data.content || '';
        } catch (e) { return ''; }
    };

    /**
     * 스트리밍 데이터 파싱 및 상태 업데이트
     */
    const parseStreamChunk = useCallback((rawData: string, targetId: string) => {
        try {
            const parsed = JSON.parse(rawData);
            if (parsed.done) return true;

            const type = parsed.type === 'answer' ? 'text' : 'thought';
            const content = parsed.type === 'answer' ? parsed.text : parsed.content;

            setMessages(prev => {
                const updatedMessages = [...prev];
                const last = updatedMessages[updatedMessages.length - 1];
                if (!last || last.role !== 'assistant') return prev;

                if (!last.parts) last.parts = [];

                if (type === 'text') {
                    const lastPart = last.parts[last.parts.length - 1];
                    if (lastPart && lastPart.type === 'text') {
                        if (!lastPart.content.endsWith(content)) lastPart.content += content;
                    } else {
                        last.parts.push({ type: 'text', content });
                    }
                } else {
                    const targetPart = [...last.parts].reverse().find(p => 
                        p.type === 'thought' && !p.content.startsWith('Completed:') && !p.content.startsWith('Failed:')
                    );
                    if (targetPart && (content.startsWith('Completed:') || content.startsWith('Failed:') || content.includes('Analyzing'))) {
                        targetPart.content = content;
                    } else if (!last.parts.some(p => p.type === 'thought' && p.content === content)) {
                        last.parts.push({ type: 'thought', content });
                    }
                }

                setSessions(sPrev => sPrev.map(s => s.id === targetId ? { ...s, messages: updatedMessages } : s));
                return updatedMessages;
            });
        } catch (e) {}
        return false;
    }, []);

    const sendMessage = useCallback(async (input: string, sessionId: string | null, selectedRepo?: any) => {
        if (!input.trim() || isSendingRef.current) return;
        
        isSendingRef.current = true;
        let activeId: string = sessionId || Date.now().toString();

        try {
            // 1. 세션 및 메시지 생성 (UI에는 @훅이름 형태로만 표시)
            const hookTags = selectedHooks.map(h => `@${h}`).join(' ');
            const displayInput = hookTags ? `${hookTags}\n${input}` : input;

            if (!sessionId) {
                const newSession: ChatSession = { id: activeId, title: input.substring(0, 30), messages: [], model: currentModel, timestamp: new Date(), draftInput: '', isLoading: true };
                setSessions(prev => [newSession, ...prev]);
                setCurrentSessionId(activeId);
            } else {
                setSessions(prev => prev.map(s => s.id === activeId ? { ...s, isLoading: true, title: s.title === 'New Analysis Session' ? input.substring(0, 30) : s.title } : s));
            }

            const targetSession = sessions.find(s => s.id === activeId);
            const baseMessages = targetSession?.messages || messages;
            
            const userMsg: Message = { id: Date.now().toString(), role: 'user', parts: [{ type: 'text', content: displayInput }], timestamp: new Date() };
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', parts: [], timestamp: new Date(), model: currentModel };

            const nextMessages: Message[] = [...(baseMessages || []), userMsg, aiMsg];
            setMessages(nextMessages);

            // 2. [핵심] 실제 전송할 프롬프트 구성 (파일 내용 결합)
            let finalPrompt = input;
            if (selectedHooks.length > 0) {
                const contents = await Promise.all(selectedHooks.map(async h => {
                    const c = await getFileContent(h);
                    return `[Context: ${h}]\n${c}`;
                }));
                finalPrompt = `${contents.join('\n\n')}\n\n---\n\n${input}`;
            }

            const history = nextMessages
                .filter(m => (m.parts || []).some(p => p.type === 'text' && p.content.trim() !== ''))
                .slice(-15)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: (m.parts || []).filter(p => p.type === 'text' && p.content.trim() !== '').map(p => ({ text: p.content }))
                }));

            if (history.length > 0 && history[0].role === 'model') history.shift();

            // 3. API 요청 (내용이 결합된 finalPrompt 사용)
            const res = await fetch(API_ENDPOINTS.CHAT_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: finalPrompt, history, model: currentModel, selectedRepo, activeSkillId }),
            });

            // 선택된 훅 초기화
            setSelectedHooks([]);

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let lineBuffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    lineBuffer += decoder.decode(value, { stream: true });
                    const lines = lineBuffer.split('\n');
                    lineBuffer = lines.pop() || '';
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
    }, [currentModel, sessions, parseStreamChunk, activeSkillId, selectedHooks]);

    return { 
        messages, setMessages, models, currentModel, setCurrentModel, 
        sessions, currentSessionId, createNewSession, loadSession, sendMessage,
        skills, activeSkillId, setActiveSkillId, 
        selectedHooks, toggleHook // [NEW] 훅 관련 반환값
    };
};
