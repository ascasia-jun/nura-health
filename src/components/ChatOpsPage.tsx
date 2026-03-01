import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, LogOut, Sparkles, Code, Terminal, MessageSquare, Plus, Settings, RotateCcw, User, ChevronDown, Loader2, Github, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';
import { SettingsModal } from './SettingsModal';
import { useChatOps } from '../hooks/useChatOps';

const SyntaxHighlighterAny = SyntaxHighlighter as any;

export const ChatOpsPage: React.FC = () => {
    const { logout } = useUser();
    const [input, setInput] = useState('');
    const [isModelListOpen, setIsModelListOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [repositories, setRepositories] = useState<any[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [pullRequests, setPullRequests] = useState<any[]>([]);
    const [isRepoLoading, setIsRepoLoading] = useState(false);
    const [isPullsLoading, setIsPullsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        models,
        currentModel,
        setCurrentModel,
        sessions,
        currentSessionId,
        createNewSession,
        loadSession,
        sendMessage,
        setMessages
    } = useChatOps();

    const fetchRepositories = async () => {
        setIsRepoLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/repos`);
            const data = await res.json();
            if (data.repos && Array.isArray(data.repos)) {
                setRepositories(data.repos);
            }
        } catch (e) {
            console.error('Failed to fetch repositories');
        } finally {
            setIsRepoLoading(false);
        }
    };

    const fetchPullRequests = async (owner: string, repo: string) => {
        setIsPullsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/repos/${owner}/${repo}/pulls`);
            const data = await res.json();
            if (data.pulls) setPullRequests(data.pulls);
        } catch (e) {
            console.error('Failed to fetch pull requests');
        } finally {
            setIsPullsLoading(false);
        }
    };

    useEffect(() => {
        fetchRepositories();
    }, []);

    useEffect(() => {
        if (selectedRepo) {
            const [owner, name] = selectedRepo.full_name.split('/');
            fetchPullRequests(owner, name);
        } else {
            setPullRequests([]);
        }
    }, [selectedRepo]);

    const isCurrentSessionLoading = sessions.find(s => s.id === currentSessionId)?.isLoading || false;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isCurrentSessionLoading) return;
        const userMsg = input;
        setInput('');
        await sendMessage(userMsg, currentSessionId, selectedRepo);
    };

    const handleAnalyzeSourceCode = async () => {
        if (!selectedRepo || isCurrentSessionLoading) return;
        const analyzePrompt = `저장소 \`${selectedRepo.full_name}\`의 소스 코드를 분석해줘. 취약점 분석과 코드 리뷰를 수행하고 개선점을 제안해줘.`;
        await sendMessage(analyzePrompt, currentSessionId, selectedRepo);
    };

    const handlePrReview = async (pr: any) => {
        if (!selectedRepo || isCurrentSessionLoading) return;
        const reviewPrompt = `리포지토리 \`${selectedRepo.full_name}\`의 PR #${pr.number} ("${pr.title}")에 대한 코드 리뷰를 진행해줘. 
        변경 사항(diff)을 읽고 버그 가능성, 보안 이슈, 성능 최적화 관점에서 상세히 분석해줘.`;
        await sendMessage(reviewPrompt, currentSessionId, selectedRepo);
    };

    const handleSessionClick = (session: any) => {
        const previousInput = loadSession(session, input);
        setInput(previousInput);
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
                setMessages(prev => [...prev, { 
                    id: Date.now().toString(),
                    role: 'assistant', 
                    parts: [{ type: 'text', content: `**시스템 알림**: 모델이 \`${modelName}\`(으)로 변경되었습니다.` }],
                    timestamp: new Date()
                }]);
            }
        } catch (e) {
            console.error('Failed to change model');
        }
    };

    const resetChat = () => {
        setMessages([{ 
            id: 'reset',
            role: 'assistant', 
            parts: [{ type: 'text', content: '세션이 초기화되었습니다. 새로운 분석을 시작하세요.' }],
            timestamp: new Date()
        }]);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
            {/* Left Sidebar: Sessions */}
            <aside className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col hidden md:flex backdrop-blur-xl">
                <div className="p-6 flex items-center gap-3 border-b border-white/5">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        <Bot size={20} />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-100">Nura ChatOps</span>
                </div>

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
                    <button onClick={createNewSession} className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-sm font-medium mb-6 group">
                        <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                        <span>New Analysis Session</span>
                    </button>

                    <div className="px-2 text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Diagnostic History</div>
                    {sessions.length === 0 ? (
                        <div className="px-4 py-8 text-center border border-white/5 rounded-xl bg-white/5">
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest leading-loose">
                                No session history<br/>available
                            </p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <button 
                                key={session.id} 
                                onClick={() => handleSessionClick(session)}
                                className={`w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-left truncate group ${currentSessionId === session.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <MessageSquare size={14} className={currentSessionId === session.id ? 'text-cyan-400' : 'group-hover:text-cyan-400 transition-colors'} />
                                    <span className="truncate">{session.title}</span>
                                </div>
                                {session.isLoading && (
                                    <Loader2 size={12} className="animate-spin text-cyan-400 shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors text-sm"
                    >
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
                            {msg.role === 'assistant' && (
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-1 border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
                                    <Bot size={20} />
                                </div>
                            )}
                            <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-0 overflow-hidden flex flex-col gap-1 ${
                                msg.role === 'user' ? 'bg-transparent' : ''
                            }`}>
                                {msg.parts.map((part, pIdx) => {
                                    if (part.type === 'thought') {
                                        const isCompleted = part.content.startsWith('Completed:');
                                        const isFailed = part.content.startsWith('Failed:');

                                        return (
                                            <div key={pIdx} className={`bg-slate-900/60 border border-white/5 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300 ${isFailed ? 'border-red-500/30' : ''}`}>
                                                <div className="shrink-0">
                                                    {isCompleted ? (
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                                            <svg size={12} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                    ) : isFailed ? (
                                                        <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                                                            <X size={12} />
                                                        </div>
                                                    ) : (
                                                        <Loader2 size={14} className="animate-spin text-amber-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-[10px] font-mono uppercase tracking-tighter leading-none mb-1 ${isFailed ? 'text-red-500/70' : 'text-slate-500'}`}>Process Node</span>
                                                    <span className={`text-xs font-mono truncate ${isFailed ? 'text-red-300/80' : 'text-slate-300'}`}>{part.content}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={pIdx} className={`p-5 md:p-8 text-sm md:text-base leading-relaxed shadow-xl ${
                                            msg.role === 'user' 
                                                ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-none' 
                                                : 'bg-slate-900/40 text-slate-200 border border-white/10 rounded-2xl rounded-tl-none backdrop-blur-sm'
                                        }`}>
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code({className, children, ...props}) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return match ? (
                                                            <SyntaxHighlighterAny
                                                                style={atomDark}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                className="rounded-xl !my-6 !bg-black/60 border border-white/10 shadow-2xl"
                                                                {...props}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighterAny>
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
                                                {part.content}
                                            </ReactMarkdown>
                                        </div>
                                    );
                                })}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center shrink-0 mt-1 border border-white/10 shadow-lg">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                    ))}

                    {isCurrentSessionLoading && messages[messages.length - 1]?.parts.length === 0 && (
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
                            disabled={isCurrentSessionLoading}
                            rows={1}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isCurrentSessionLoading}
                            className={`absolute right-4 bottom-4 p-3 rounded-xl transition-all shadow-lg ${
                                !input.trim() || isCurrentSessionLoading 
                                    ? 'bg-white/5 text-white/10 cursor-not-allowed' 
                                    : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:scale-105 active:scale-95 shadow-cyan-500/20'
                            }`}
                        >
                            {isCurrentSessionLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
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

            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                currentModel={currentModel}
            />

            {/* Right Sidebar */}
            {isRightSidebarOpen && (
                <aside className="w-80 bg-slate-900/50 border-l border-white/5 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Github size={18} className="text-slate-400" />
                            <span className="font-bold text-sm tracking-tight text-slate-100">Repositories</span>
                        </div>
                        <button onClick={fetchRepositories} className="p-1.5 hover:bg-cyan-500/10 rounded-lg text-slate-500 hover:text-cyan-400 transition-all active:scale-90">
                            <RotateCcw size={14} className={isRepoLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        <div className="space-y-1">
                            {isRepoLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl mb-2"></div>
                                ))
                            ) : repositories.map((repo) => (
                                <button 
                                    key={repo.id}
                                    onClick={() => setSelectedRepo(repo)}
                                    className={`w-full text-left p-3 rounded-xl transition-all border ${selectedRepo?.id === repo.id ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="shrink-0 w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
                                            <div className="w-2 h-2 rounded-full bg-cyan-500/50"></div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold truncate">{repo.name}</div>
                                            <div className="text-[10px] opacity-50 truncate">{repo.full_name}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedRepo && (
                        <div className="flex-1 border-t border-white/5 flex flex-col min-h-0 bg-black/20">
                            <div className="p-4 flex items-center justify-between bg-white/5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Pull Requests</span>
                                {isPullsLoading && <Loader2 size={12} className="animate-spin text-cyan-400" />}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {pullRequests.map((pr) => (
                                    <div key={pr.id} className="p-3 bg-white/5 border border-white/5 rounded-xl group hover:border-cyan-500/30 transition-all">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug">{pr.title}</div>
                                            <span className="text-[9px] font-mono text-cyan-400/60 shrink-0">#{pr.number}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 opacity-50">
                                                <img src={pr.user.avatar_url} alt={pr.user.login} className="w-4 h-4 rounded-full" />
                                                <span className="text-[10px] truncate max-w-[80px]">{pr.user.login}</span>
                                            </div>
                                            <button 
                                                onClick={() => handlePrReview(pr)}
                                                disabled={isCurrentSessionLoading}
                                                className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-[9px] font-black uppercase hover:bg-cyan-500 hover:text-slate-950 transition-all"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedRepo && (
                        <div className="p-4 border-t border-white/5 bg-cyan-500/5">
                            <button 
                                onClick={handleAnalyzeSourceCode}
                                disabled={isCurrentSessionLoading}
                                className="w-full py-3 bg-cyan-500 text-slate-950 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
                            >
                                Analyze Source Code
                            </button>
                        </div>
                    )}
                </aside>
            )}
        </div>
    );
};
