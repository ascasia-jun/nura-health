import { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS, API_URL } from '../config';

export interface Message {
    role: 'user' | 'ai';
    content: string;
}

export interface AIModel {
    name: string;
    displayName: string;
    description: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    model: string;
    timestamp: Date;
    draftInput?: string; // 세션별 입력 중인 텍스트 보관
    isLoading?: boolean; // 세션별 로딩 상태
}

// API Service
export const chatService = {
    fetchModels: async () => {
        const res = await fetch(`${API_URL}/api/models`);
        return res.json();
    },
    selectModel: async (modelName: string) => {
        return fetch(`${API_URL}/api/models/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelName }),
        });
    }
};

const INITIAL_MESSAGE: Message = { 
    role: 'ai', 
    content: `# ChatOps 시스템 활성화\n프로젝트 상태를 실시간으로 분석하고 제어할 수 있는 AI 환경에 오신 것을 환영합니다.` 
};

export const useChatOps = (initialModel: string = 'gemini-1.5-flash') => {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [models, setModels] = useState<AIModel[]>([]);
    const [currentModel, setCurrentModel] = useState<string>(initialModel);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    
    // 현재 세션 ID 참조용 Ref
    const currentSessionIdRef = useRef<string | null>(null);
    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    // 모델 목록 조회
    useEffect(() => {
        const loadModels = async () => {
            try {
                const data = await chatService.fetchModels();
                if (data.models && data.models.length > 0) {
                    setModels(data.models);
                    const modelExists = data.models.some((m: AIModel) => m.name === currentModel);
                    if (!modelExists) {
                        setCurrentModel(data.models[0].name);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch models');
            }
        };
        loadModels();
    }, [currentModel]);

    // 새로운 세션 생성
    const createNewSession = useCallback(() => {
        const newId = Date.now().toString();
        const newSession: ChatSession = {
            id: newId,
            title: 'New Analysis Session',
            messages: [INITIAL_MESSAGE],
            model: currentModel,
            timestamp: new Date(),
            draftInput: '',
            isLoading: false
        };
        
        setSessions(prev => [newSession, ...prev].slice(0, 20));
        setMessages([INITIAL_MESSAGE]);
        setCurrentSessionId(newId);
    }, [currentModel]);

    // 세션 로드 (입력창 상태 포함)
    const loadSession = useCallback((session: ChatSession, currentInput?: string) => {
        // 현재 세션의 입력 내용을 저장하고 전환
        if (currentSessionId) {
            setSessions(prev => prev.map(s => 
                s.id === currentSessionId ? { ...s, draftInput: currentInput } : s
            ));
        }

        setMessages([...session.messages]);
        setCurrentModel(session.model);
        setCurrentSessionId(session.id);
        
        return session.draftInput || '';
    }, [currentSessionId]);

    // 메시지 전송 (병렬 처리 지원)
    const sendMessage = async (input: string, sessionId: string | null, selectedRepo?: any) => {
        if (!input.trim()) return;
        
        let activeSessionId = sessionId;
        if (!activeSessionId) {
            const newId = Date.now().toString();
            activeSessionId = newId;
            const newSession: ChatSession = {
                id: newId,
                title: input.length > 20 ? input.substring(0, 20) + '...' : input,
                messages: [INITIAL_MESSAGE], // sendMessage 내부에서는 초기 메시지 보장
                model: currentModel,
                timestamp: new Date(),
                draftInput: '',
                isLoading: false
            };
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newId);
        }

        // 해당 세션의 로딩 상태 활성화
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, isLoading: true, draftInput: '' } : s));

        // 해당 세션의 현재 메시지 이력 가져오기
        const targetSession = sessions.find(s => s.id === activeSessionId);
        const baseMessages = targetSession ? targetSession.messages : messages;
        const newMessages: Message[] = [...baseMessages, { role: 'user', content: input }];
        
        // 현재 보고 있는 세션이면 UI 업데이트
        if (currentSessionIdRef.current === activeSessionId) {
            setMessages(newMessages);
        }

        try {
            // [Optimization] Sliding Window strategy for context efficiency
            const CONTEXT_WINDOW_LIMIT = 10;
            const historyMessages = newMessages.slice(-CONTEXT_WINDOW_LIMIT);
            
            // Zero Script QA Log
            console.log(JSON.stringify({
                event: 'chat.context_optimized',
                originalCount: newMessages.length,
                optimizedCount: historyMessages.length,
                windowLimit: CONTEXT_WINDOW_LIMIT,
                timestamp: new Date().toISOString()
            }));

            let history = historyMessages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            if (history.length > 0 && history[0].role === 'model') {
                history.shift();
            }

            const res = await fetch(API_ENDPOINTS.CHAT_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history, model: currentModel, selectedRepo }),
            });

            if (!res.ok) throw new Error('Streaming failed');

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') break;

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.text) {
                                    accumulatedContent += parsed.text;
                                    const updatedMessages: Message[] = [...newMessages, { role: 'ai' as const, content: accumulatedContent }];

                                    if (currentSessionIdRef.current === activeSessionId) {
                                        setMessages(updatedMessages);
                                    }
                                    
                                    setSessions(sPrev => sPrev.map(s => 
                                        s.id === activeSessionId 
                                            ? { 
                                                ...s, 
                                                messages: updatedMessages,
                                                title: s.title === 'New Analysis Session' ? (input.length > 20 ? input.substring(0, 20) + '...' : input) : s.title
                                              } 
                                            : s
                                    ));
                                }
                            } catch (e) {}
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            if (currentSessionIdRef.current === activeSessionId) {
                setMessages(prev => [...prev, { role: 'ai', content: '시스템 오류가 발생했습니다.' }]);
            }
        } finally {
            // 해당 세션의 로딩 상태 해제
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, isLoading: false } : s));
        }
    };

    return {
        messages,
        setMessages,
        models,
        currentModel,
        setCurrentModel,
        sessions,
        currentSessionId,
        createNewSession,
        loadSession,
        sendMessage
    };
};
