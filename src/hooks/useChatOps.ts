import { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS, API_URL } from '../config';

export interface ChatPart {
    type: 'text' | 'thought' | 'tool_result';
    content: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    parts: ChatPart[];
    timestamp: Date;
    model?: string;
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
    draftInput?: string;
    isLoading?: boolean;
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
    id: 'initial',
    role: 'assistant', 
    parts: [{ 
        type: 'text', 
        content: `# ChatOps 시스템 활성화\n프로젝트 상태를 실시간으로 분석하고 제어할 수 있는 AI 환경에 오신 것을 환영합니다.` 
    }],
    timestamp: new Date()
};

export const useChatOps = (initialModel: string = 'gemini-1.5-flash') => {

    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [models, setModels] = useState<AIModel[]>([]);
    const [currentModel, setCurrentModel] = useState<string>(initialModel);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    
    const currentSessionIdRef = useRef<string | null>(null);
    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const data = await chatService.fetchModels();
                if (data.models && data.models.length > 0) {
                    setModels(data.models);
                    if (data.currentModel) {
                        setCurrentModel(data.currentModel);
                    } else {
                        const modelExists = data.models.some((m: AIModel) => m.name === currentModel);
                        if (!modelExists) {
                            setCurrentModel(data.models[0].name);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to fetch models');
            }
        };
        loadModels();
    }, []);

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

    const loadSession = useCallback((session: ChatSession, currentInput?: string) => {
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

    const sendMessage = async (input: string, sessionId: string | null, selectedRepo?: any, onThinking?: (status: string | null) => void) => {
        if (!input.trim()) return;
        
        let activeSessionId = sessionId;
        if (!activeSessionId) {
            const newId = Date.now().toString();
            activeSessionId = newId;
            const newSession: ChatSession = {
                id: newId,
                title: input.length > 20 ? input.substring(0, 20) + '...' : input,
                messages: [INITIAL_MESSAGE],
                model: currentModel,
                timestamp: new Date(),
                draftInput: '',
                isLoading: false
            };
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newId);
        }

        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, isLoading: true, draftInput: '' } : s));

        const targetSession = sessions.find(s => s.id === activeSessionId);
        const baseMessages = targetSession ? targetSession.messages : messages;
        
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            parts: [{ type: 'text', content: input }],
            timestamp: new Date()
        };

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            parts: [],
            timestamp: new Date(),
            model: currentModel
        };

        const nextMessages: Message[] = [...baseMessages, userMsg, aiMsg];
        
        if (currentSessionIdRef.current === activeSessionId) {
            setMessages(nextMessages);
        }

        try {
            const history = nextMessages
                .filter(m => m.parts.length > 0)
                .slice(-10)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: m.parts.filter(p => p.type === 'text').map(p => ({ text: p.content }))
                }));

            if (history.length > 0 && history[0].role === 'model') history.shift();

            const res = await fetch(API_ENDPOINTS.CHAT_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history, model: currentModel, selectedRepo }),
            });

            if (!res.ok) throw new Error('Streaming failed');

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

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
                                if (parsed.done) break;

                                    if (parsed.type === 'answer' || parsed.type === 'thought') {
                                        const type = parsed.type === 'answer' ? 'text' : 'thought';
                                        const content = parsed.type === 'answer' ? parsed.text : parsed.content;

                                        if (parsed.type === 'answer' && onThinking) onThinking(null);
                                        if (parsed.type === 'thought' && onThinking) onThinking(content);

                                        setMessages(prev => {
                                            const updatedMessages = [...prev];
                                            const lastMsg = updatedMessages[updatedMessages.length - 1];
                                            
                                            if (lastMsg && lastMsg.role === 'assistant') {
                                                if (type === 'text') {
                                                    const lastPart = lastMsg.parts[lastMsg.parts.length - 1];
                                                    if (lastPart && lastPart.type === 'text') {
                                                        lastPart.content += content;
                                                    } else {
                                                        lastMsg.parts.push({ type: 'text', content });
                                                    }
                                                } else {
                                                    // [지능형 갱신] 역순 탐색하여 완료되지 않은 가장 최근의 thought 파트 찾기
                                                    const targetPart = [...lastMsg.parts].reverse().find(p => 
                                                        p.type === 'thought' && 
                                                        !p.content.startsWith('Completed:') && 
                                                        !p.content.startsWith('Failed:')
                                                    );

                                                    if (targetPart && (content.startsWith('Completed:') || content.startsWith('Failed:') || content.includes('Analyzing'))) {
                                                        targetPart.content = content;
                                                    } else {
                                                        lastMsg.parts.push({ type: 'thought', content });
                                                    }
                                                }
                                            }

                                            setSessions(sPrev => sPrev.map(s => 
                                                s.id === activeSessionId ? { ...s, messages: updatedMessages } : s
                                            ));
                                            return updatedMessages;
                                        });
                                    }
                            } catch (e) {}
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            if (currentSessionIdRef.current === activeSessionId) {
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1].parts.push({ type: 'text', content: '오류가 발생했습니다.' });
                    return next;
                });
            }
        } finally {
            if (onThinking) onThinking(null);
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
