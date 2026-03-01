import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, LogOut, Sparkles, Code, Terminal, MessageSquare, Plus, Settings, RotateCcw, User, ChevronDown, Loader2, Github, X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';
import { SettingsModal } from './SettingsModal';
import { useChatOps } from '../hooks/useChatOps';
import { CHAT_MODULE_LOADED } from '../types/chat';
import type { ChatPart, Message, AIModel, ChatSession } from '../types/chat';
import { MarkdownRenderer } from './Chat/MarkdownRenderer';

// 모듈 로드 보장
if (!CHAT_MODULE_LOADED) console.warn('Chat types module not loaded');
import { ProcessNode } from './Chat/ProcessNode';
import { ChatLoader } from './Chat/ChatLoader';

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
    const isProcessingRef = useRef<boolean>(false); // [중요] 즉각적인 중복 클릭 차단용

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

    const isCurrentSessionLoading = sessions.find(s => s.id === currentSessionId)?.isLoading || false;

    // 데이터 패칭 로직 생략 (기존 유지)
    const fetchRepositories = async () => {
        setIsRepoLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/repos`);
            const data = await res.json();
            if (data.repos) setRepositories(data.repos);
        } catch (e) { console.error('저장소 로드 실패'); } finally { setIsRepoLoading(false); }
    };

    const fetchPullRequests = async (owner: string, repo: string) => {
        setIsPullsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/repos/${owner}/${repo}/pulls`);
            const data = await res.json();
            if (data.pulls) setPullRequests(data.pulls);
        } catch (e) { console.error('PR 로드 실패'); } finally { setIsPullsLoading(false); }
    };

    useEffect(() => { fetchRepositories(); }, []);
    useEffect(() => { if (selectedRepo) { const [owner, name] = selectedRepo.full_name.split('/'); fetchPullRequests(owner, name); } }, [selectedRepo]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    /**
     * [보안/안정성] 메시지 전송 핸들러
     * Ref를 사용하여 비동기 상태 변화 전이라도 중복 호출을 물리적으로 즉시 차단합니다.
     */
    const handleSendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isCurrentSessionLoading || isProcessingRef.current) return;
        
        try {
            isProcessingRef.current = true; // 락 시작
            setInput(''); 
            await sendMessage(trimmed, currentSessionId, selectedRepo);
        } finally {
            isProcessingRef.current = false; // 락 해제
        }
    };

    const handleAnalyzeSourceCode = async () => {
        if (!selectedRepo || isCurrentSessionLoading || isProcessingRef.current) return;
        await sendMessage(`저장소 \`${selectedRepo.full_name}\` 분석 시작`, currentSessionId, selectedRepo);
    };

    const handlePrReview = async (pr: any) => {
        if (!selectedRepo || isCurrentSessionLoading || isProcessingRef.current) return;
        await sendMessage(`PR #${pr.number} 리뷰 요청`, currentSessionId, selectedRepo);
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
        } catch (e) { console.error('모델 변경 실패'); }
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
            {/* 왼쪽 사이드바 (기존 UI 유지) */}
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
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-2 overflow-hidden text-xs font-mono">
                            <Sparkles size={14} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{currentModel}</span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isModelListOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModelListOpen && (
                        <div className="absolute top-full left-4 right-4 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                {models.map((m) => (
                                    <button key={m.name} onClick={() => handleModelChange(m.name)} className={`w-full text-left px-4 py-3 hover:bg-cyan-500/10 transition-colors border-b border-white/5 last:border-0 ${currentModel === m.name ? 'text-cyan-400' : 'text-slate-400'}`}>
                                        <div className="text-xs font-bold font-mono">{m.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <button onClick={createNewSession} className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-sm font-medium mb-6">
                        <Plus size={16} />
                        <span>New Analysis Session</span>
                    </button>
                    {sessions.map((s) => (
                        <button key={s.id} onClick={() => { const inp = loadSession(s, input); setInput(inp); }} className={`w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-left truncate ${currentSessionId === s.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
                            <div className="flex items-center gap-3 truncate">
                                <MessageSquare size={14} />
                                <span className="truncate">{s.title}</span>
                            </div>
                            {s.isLoading && <Loader2 size={12} className="animate-spin text-cyan-400" />}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-white/5 rounded-lg text-sm"><Settings size={16} /><span>Settings</span></button>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-sm"><LogOut size={16} /><span>Log Out</span></button>
                </div>
            </aside>

            {/* 메인 영역 */}
            <main className="flex-1 flex flex-col relative bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {/* [수정] 메시지 내용(parts)이 있을 때만 아이콘 표시하여 ChatLoader와 겹침 방지 */}
                            {msg.role === 'assistant' && (msg.parts?.length || 0) > 0 && (
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-1 border border-cyan-500/20 shadow-lg">
                                    <Bot size={20} />
                                </div>
                            )}
                            <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-0 overflow-hidden flex flex-col gap-1 ${msg.role === 'user' ? 'bg-transparent' : ''}`}>
                                {msg.parts?.map((part, pIdx) => (
                                    part.type === 'thought' 
                                        ? <ProcessNode key={pIdx} content={part.content} />
                                        : <div key={pIdx} className={`p-5 md:p-8 text-sm md:text-base leading-relaxed shadow-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-900/40 text-slate-200 border border-white/10 rounded-2xl rounded-tl-none backdrop-blur-sm'}`}>
                                            <MarkdownRenderer content={part.content} />
                                          </div>
                                ))}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center shrink-0 mt-1 border border-white/10 shadow-lg">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                    ))}
                    {isCurrentSessionLoading && (messages[messages.length - 1]?.parts || []).length === 0 && <ChatLoader />}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-6 md:p-10 bg-slate-900/60 backdrop-blur-3xl border-t border-white/5">
                    <div className="max-w-4xl mx-auto relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                // [한글 입력 완료 후 엔터 이중 트리거 방지]
                                if (e.nativeEvent.isComposing) return;
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="AI에게 명령을 입력하세요..."
                            className="w-full bg-slate-800/40 text-slate-100 rounded-2xl pl-6 pr-16 py-5 border border-white/10 focus:outline-none focus:border-cyan-500 shadow-2xl resize-none min-h-[64px] custom-scrollbar"
                            disabled={isCurrentSessionLoading}
                            rows={1}
                        />
                        <button onClick={handleSendMessage} disabled={!input.trim() || isCurrentSessionLoading} className={`absolute right-4 bottom-4 p-3 rounded-xl transition-all shadow-lg ${!input.trim() || isCurrentSessionLoading ? 'bg-white/5 text-white/10' : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400'}`}>
                            {isCurrentSessionLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
                        </button>
                    </div>
                </div>
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentModel={currentModel} />

            {isRightSidebarOpen && (
                <aside className="w-80 bg-slate-900/50 border-l border-white/5 flex flex-col backdrop-blur-xl">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2"><Github size={18} className="text-slate-400" /><span className="font-bold text-sm text-slate-100">Repositories</span></div>
                        <button onClick={fetchRepositories} className="p-1.5 hover:bg-cyan-500/10 rounded-lg text-slate-500"><RotateCcw size={14} className={isRepoLoading ? 'animate-spin' : ''} /></button>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {repositories.map((repo) => (
                            <button key={repo.id} onClick={() => setSelectedRepo(repo)} className={`w-full text-left p-3 rounded-xl transition-all border ${selectedRepo?.id === repo.id ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>
                                <div className="text-xs font-bold truncate">{repo.name}</div>
                                <div className="text-[10px] opacity-50 truncate">{repo.full_name}</div>
                            </button>
                        ))}
                    </div>
                    {selectedRepo && (
                        <div className="p-4 border-t border-white/5 bg-cyan-500/5">
                            <button onClick={handleAnalyzeSourceCode} disabled={isCurrentSessionLoading} className="w-full py-3 bg-cyan-500 text-slate-950 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)]">Analyze Source Code</button>
                        </div>
                    )}
                </aside>
            )}
        </div>
    );
};
