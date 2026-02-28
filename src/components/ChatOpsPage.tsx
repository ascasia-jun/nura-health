import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, LogOut, Sparkles, Code, Terminal, MessageSquare, Plus, Settings, RotateCcw, User, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useUser } from '../context/UserContext';
import { API_ENDPOINTS, API_URL } from '../config';

// 채팅 메시지 인터페이스
interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface AIModel {
    name: string;
    displayName: string;
    description: string;
}

export const ChatOpsPage: React.FC = () => {
    const { logout } = useUser();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: '# ChatOps 시스템 활성화\n프로젝트 상태를 실시간으로 분석하고 제어할 수 있는 AI 환경에 오신 것을 환영합니다.\n\n### 가능한 작업:\n- **성능 분석**: `/analyze` 명령어로 현재 번들 사이즈 진단\n- **코드 리뷰**: 작성한 코드 조각을 붙여넣어 리뷰 요청\n- **시스템 상태**: 전체 인프라 가동률 확인' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [models, setModels] = useState<AIModel[]>([]);
    const [currentModel, setCurrentModel] = useState<string>('gemini-1.5-flash');
    const [isModelListOpen, setIsModelListOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 모델 목록 조회
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch(`${API_URL}/api/models`);
                const data = await res.json();
                if (data.models) setModels(data.models);
                if (data.currentModel) setCurrentModel(data.currentModel);
            } catch (e) {
                console.error('Failed to fetch models');
            }
        };
        fetchModels();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'ai', content: '' }]);

        try {
            // Gemini 형식으로 대화 이력 변환 및 첫 번째 model 메시지 제거 (API 규칙)
            let history = messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            // 첫 번째 메시지가 model이면 제거
            if (history.length > 0 && history[0].role === 'model') {
                history.shift();
            }

            const res = await fetch(API_ENDPOINTS.CHAT_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history }),
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
                                    setMessages(prev => {
                                        const last = prev[prev.length - 1];
                                        return [...prev.slice(0, -1), { ...last, content: accumulatedContent }];
                                    });
                                }
                            } catch (e) {}
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: '시스템 오류가 발생했습니다. 모델 설정을 확인해 보세요.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModelChange = async (modelName: string) => {
        try {
            const res = await fetch(`${API_URL}/api/models/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelName }),
            });
            if (res.ok) {
                setCurrentModel(modelName);
                setIsModelListOpen(false);
                setMessages(prev => [...prev, { role: 'ai', content: `**시스템 알림**: 모델이 \`${modelName}\`(으)로 변경되었습니다.` }]);
            }
        } catch (e) {
            console.error('Failed to change model');
        }
    };

    const resetChat = () => {
        setMessages([{ role: 'ai', content: '세션이 초기화되었습니다. 새로운 분석을 시작하세요.' }]);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col hidden md:flex backdrop-blur-xl">
                <div className="p-6 flex items-center gap-3 border-b border-white/5">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        <Bot size={20} />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-100">Nura ChatOps</span>
                </div>

                {/* Model Selector */}
                <div className="px-4 py-4 border-b border-white/5 relative">
                    <button 
                        onClick={() => setIsModelListOpen(!isModelListOpen)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Sparkles size={14} className="text-cyan-400 shrink-0" />
                            <span className="text-xs font-mono truncate text-slate-300 group-hover:text-white">{currentModel}</span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isModelListOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModelListOpen && (
                        <div className="absolute top-full left-4 right-4 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                {models.map((model) => (
                                    <button
                                        key={model.name}
                                        onClick={() => handleModelChange(model.name)}
                                        className={`w-full text-left px-4 py-3 hover:bg-cyan-500/10 transition-colors border-b border-white/5 last:border-0 ${currentModel === model.name ? 'bg-cyan-500/5 text-cyan-400' : 'text-slate-400'}`}
                                    >
                                        <div className="text-xs font-bold font-mono mb-0.5">{model.name}</div>
                                        <div className="text-[10px] opacity-50 truncate">{model.displayName || model.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <button onClick={resetChat} className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-sm font-medium mb-6 group">
                        <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                        <span>New Analysis Session</span>
                    </button>

                    <div className="px-2 text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Diagnostic History</div>
                    {['Bundle Optimization', 'Memory Usage Analysis', 'CI/CD Pipeline Fix', 'API Latency Check'].map((item, i) => (
                        <button key={i} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors text-sm text-left truncate group">
                            <MessageSquare size={14} className="group-hover:text-cyan-400 transition-colors" />
                            <span className="truncate">{item}</span>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors text-sm">
                        <Settings size={16} />
                        <span>Settings</span>
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors text-sm">
                        <LogOut size={16} />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative bg-gradient-to-b from-slate-950 to-slate-900">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ai' && (
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-1 border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
                                    <Sparkles size={20} />
                                </div>
                            )}
                            <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-5 md:p-8 text-sm md:text-base leading-relaxed shadow-xl ${
                                msg.role === 'user' 
                                    ? 'bg-cyan-600 text-white rounded-tr-none' 
                                    : 'bg-slate-900/40 text-slate-200 border border-white/10 rounded-tl-none backdrop-blur-sm'
                            }`}>
                                {msg.role === 'ai' && msg.content ? (
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({node, inline, className, children, ...props}) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        style={atomDark}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        className="rounded-xl !my-6 !bg-black/60 border border-white/10 shadow-2xl"
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className="bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-sm" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            },
                                            h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-white/10">{children}</h1>,
                                            h2: ({children}) => <h2 className="text-xl font-bold text-cyan-400 mt-6 mb-3">{children}</h2>,
                                            h3: ({children}) => <h3 className="text-lg font-semibold text-slate-100 mt-4 mb-2">{children}</h3>,
                                            p: ({children}) => <p className="mb-4 last:mb-0 text-slate-300">{children}</p>,
                                            ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-400">{children}</ul>,
                                            li: ({children}) => <li className="hover:text-slate-200 transition-colors">{children}</li>,
                                            blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-500 bg-white/5 p-4 rounded-r-lg italic my-4">{children}</blockquote>
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                ) : msg.role === 'ai' && !msg.content ? (
                                    <div className="flex items-center gap-2 text-cyan-400/50 italic animate-pulse text-xs font-mono">
                                        <Terminal size={14} /> 
                                        <span>AI is processing chunks...</span>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center shrink-0 mt-1 border border-white/10 shadow-lg">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1].content === '' && (
                        <div className="flex gap-4 max-w-4xl mx-auto">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                                <Sparkles size={20} />
                            </div>
                            <div className="bg-slate-900/40 border border-white/10 rounded-2xl rounded-tl-none p-6 flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 md:p-10 bg-slate-900/60 backdrop-blur-3xl border-t border-white/5">
                    <div className="max-w-4xl mx-auto relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="AI에게 프로젝트 분석 명령을 입력하세요 (Shift+Enter로 줄바꿈)..."
                            className="w-full bg-slate-800/40 text-slate-100 rounded-2xl pl-6 pr-16 py-5 border border-white/10 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 transition-all placeholder:text-slate-600 shadow-2xl resize-none max-h-48 min-h-[64px] custom-scrollbar"
                            disabled={isLoading}
                            rows={1}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className={`absolute right-4 bottom-4 p-3 rounded-xl transition-all shadow-lg ${
                                !input.trim() || isLoading 
                                    ? 'bg-white/5 text-white/10 cursor-not-allowed' 
                                    : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:scale-105 active:scale-95 shadow-cyan-500/20'
                            }`}
                        >
                            <Send size={22} />
                        </button>
                    </div>
                    <div className="max-w-4xl mx-auto mt-4 flex justify-between items-center px-2">
                        <div className="flex gap-6 text-[10px] text-slate-600 font-mono uppercase tracking-widest opacity-70">
                            <span className="flex items-center gap-2"><Terminal size={12} className="text-cyan-500" /> System: Online</span>
                            <span className="flex items-center gap-2"><Code size={12} className="text-cyan-500" /> Active Model: {currentModel}</span>
                        </div>
                        <button 
                            onClick={resetChat}
                            className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors font-mono flex items-center gap-1.5 uppercase tracking-tighter"
                        >
                            <RotateCcw size={10} /> Reset Session
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
