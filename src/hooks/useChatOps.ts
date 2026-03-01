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
    
    const currentSessionIdRef = useRef<string | null>(null);
    const isSendingRef = useRef<boolean>(false);

    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const res = await fetch(`${API_URL}/api/models`);
                const data = await res.json();
                if (data.models && data.models.length > 0) {
                    setModels(data.models);
                    if (data.currentModel) setCurrentModel(data.currentModel);
                }
            } catch (e) { console.error('모델 로드 실패'); }
        };
        loadModels();
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
     * 스트리밍 데이터 파싱 (버퍼링 및 중복 방지 로직 강화)
     */
    const parseStreamChunk = useCallback((rawData: string, targetId: string) => {
        try {
            const parsed = JSON.parse(rawData);
            if (parsed.done) return true;

            const type = parsed.type === 'answer' ? 'text' : 'thought';
            const content = parsed.type === 'answer' ? parsed.text : parsed.content;

            setMessages(prev => {
                const nextMessages = [...prev];
                const last = nextMessages[nextMessages.length - 1];
                if (!last || last.role !== 'assistant') return prev;

                if (!last.parts) last.parts = [];

                if (type === 'text') {
                    const lastPart = last.parts[last.parts.length - 1];
                    if (lastPart && lastPart.type === 'text') {
                        // [중복 방지] 스트리밍 데이터가 중복으로 합쳐지는 현상 방어
                        if (!lastPart.content.endsWith(content)) {
                            lastPart.content += content;
                        }
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

                setSessions(sPrev => sPrev.map(s => s.id === targetId ? { ...s, messages: nextMessages } : s));
                return nextMessages;
            });
        } catch (e) { /* 불완전한 JSON은 무시 */ }
        return false;
    }, []);

    const sendMessage = useCallback(async (input: string, sessionId: string | null, selectedRepo?: any) => {
        if (!input.trim() || isSendingRef.current) return;
        
        isSendingRef.current = true;
        let activeId: string = sessionId || Date.now().toString();

        try {
            if (!sessionId) {
                const newSession: ChatSession = { id: activeId, title: input.substring(0, 30), messages: [], model: currentModel, timestamp: new Date(), draftInput: '', isLoading: true };
                setSessions(prev => [newSession, ...prev]);
                setCurrentSessionId(activeId);
            } else {
                setSessions(prev => prev.map(s => s.id === activeId ? { ...s, isLoading: true, title: s.title === 'New Analysis Session' ? input.substring(0, 30) : s.title } : s));
            }

            const targetSession = sessions.find(s => s.id === activeId);
            const baseMessages = targetSession?.messages || messages;
            
            const userMsg: Message = { id: Date.now().toString(), role: 'user', parts: [{ type: 'text', content: input }], timestamp: new Date() };
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', parts: [], timestamp: new Date(), model: currentModel };

            const nextMessages: Message[] = [...(baseMessages || []), userMsg, aiMsg];
            setMessages(nextMessages);

            const history = nextMessages
                .filter(m => (m.parts || []).some(p => p.type === 'text' && p.content.trim() !== ''))
                .slice(-10)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: (m.parts || [])
                        .filter(p => p.type === 'text' && p.content.trim() !== '')
                        .map(p => ({ text: p.content }))
                }));

            if (history.length > 0 && history[0].role === 'model') history.shift();

            const res = await fetch(API_ENDPOINTS.CHAT_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history, model: currentModel, selectedRepo }),
            });

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let lineBuffer = ''; // [중요] 불완전한 라인 처리를 위한 버퍼

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    lineBuffer += chunk; // 기존 버퍼에 추가

                    const lines = lineBuffer.split('\n');
                    lineBuffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 남김

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
                        
                        const rawData = trimmedLine.slice(6);
                        if (rawData === '[DONE]') break;
                        if (parseStreamChunk(rawData, activeId)) break;
                    }
                }
            }
        } catch (error) { console.error('전송 오류:', error); } finally {
            isSendingRef.current = false;
            setSessions(prev => prev.map(s => s.id === activeId ? { ...s, isLoading: false } : s));
        }
    }, [currentModel, sessions, parseStreamChunk]);

    return { messages, setMessages, models, currentModel, setCurrentModel, sessions, currentSessionId, createNewSession, loadSession, sendMessage };
};
