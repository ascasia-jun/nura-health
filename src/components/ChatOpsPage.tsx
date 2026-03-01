import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, LogOut, Sparkles, Code, Terminal, MessageSquare, Plus, Settings, RotateCcw, User, ChevronDown, Loader2, Github, X, FileText, Zap, Hash } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';
import { SettingsModal } from './SettingsModal';
import { useChatOps } from '../hooks/useChatOps';
import { MarkdownRenderer } from './Chat/MarkdownRenderer';
import { ProcessNode } from './Chat/ProcessNode';
import { ChatLoader } from './Chat/ChatLoader';

/**
 * ChatOps 메인 페이지 컴포넌트입니다.
 */
export const ChatOpsPage: React.FC = () => {
    const { logout } = useUser();
    const [input, setInput] = useState('');
    const [isModelListOpen, setIsModelListOpen] = useState(false);
    const [isSkillListOpen, setIsSkillListOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [repositories, setRepositories] = useState<any[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [pullRequests, setPullRequests] = useState<any[]>([]);
    const [isRepoLoading, setIsRepoLoading] = useState(false);
    const [isPullsLoading, setIsPullsLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isProcessingRef = useRef<boolean>(false);

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
        setMessages,
        skills,
        activeSkillId,
        setActiveSkillId,
        selectedHooks,
        toggleHook
    } = useChatOps();

    const isCurrentSessionLoading = sessions.find(s => s.id === currentSessionId)?.isLoading || false;

    // --- 공통 데이터 패칭 함수 (컴포넌트 스코프) ---

    const fetchRepositories = useCallback(async () => {
        setIsRepoLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/repos`);
            const data = await res.json();
            if (data.repos && Array.isArray(data.repos)) setRepositories(data.repos);
        } catch (e) { 
            console.error('저장소 로드 실패'); 
        } finally { 
            setIsRepoLoading(false); 
        }
    }, []);

    const fetchPullRequests = useCallback(async (owner: string, repo: string) => {
        setIsPullsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/repos/${owner}/${repo}/pulls`);
            const data = await res.json();
            if (data.pulls && Array.isArray(data.pulls)) setPullRequests(data.pulls);
            else setPullRequests([]);
        } catch (e) { 
            console.error('PR 로드 실패'); 
            setPullRequests([]); 
        } finally { 
            setIsPullsLoading(false); 
        }
    }, []);

    // --- 생명주기 관리 ---

    useEffect(() => {
        fetchRepositories();
    }, [fetchRepositories]);

    useEffect(() => {
        if (selectedRepo) {
            const [owner, name] = selectedRepo.full_name.split('/');
            fetchPullRequests(owner, name);
        } else {
            setPullRequests([]);
        }
    }, [selectedRepo, fetchPullRequests]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { 
        scrollToBottom(); 
    }, [messages, scrollToBottom]);

    // --- 이벤트 핸들러 ---

    const handleSendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isCurrentSessionLoading || isProcessingRef.current) return;
        
        try {
            isProcessingRef.current = true;
            setInput(''); 
            await sendMessage(trimmed, currentSessionId, selectedRepo);
        } finally { 
            isProcessingRef.current = false; 
        }
    };

    const handleModelChange = async (modelName: string) => {
        try {
            const res = await fetch(`${API_URL}/api/models/select`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ modelName }) 
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
            console.error('모델 변경 실패'); 
        }
    };

    const resetChat = () => {
        setMessages([{ 
            id: 'reset', 
            role: 'assistant', 
            parts: [{ type: 'text', content: '세션이 초기화되었습니다.' }], 
            timestamp: new Date() 
        }]);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
            {/* 왼쪽 사이드바 */}
            <aside className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col hidden md:flex backdrop-blur-xl">
                <div className="p-6 flex items-center gap-3 border-b border-white/5">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]"><Bot size={20} /></div>
                    <span className="font-bold text-lg tracking-tight text-slate-100">Nura ChatOps</span>
                </div>

                <div className="p-4 border-b border-white/5 space-y-2">
                    <button onClick={() => setIsModelListOpen(!isModelListOpen)} className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-xs font-mono">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Sparkles size={14} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{currentModel}</span>
                        </div>
                        <ChevronDown size={14} className={isModelListOpen ? 'rotate-180' : ''} />
                    </button>
                    {isModelListOpen && (
                        <div className="absolute left-4 right-4 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                {(models || []).map(m => (
                                    <button key={m.name} onClick={() => handleModelChange(m.name)} className={`w-full text-left px-4 py-2 hover:bg-white/5 text-xs font-mono border-b border-white/5 last:border-0 ${currentModel === m.name ? 'text-cyan-400' : 'text-slate-400'}`}>
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <button onClick={createNewSession} className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-sm font-medium mb-6"><Plus size={16} /><span>New Analysis Session</span></button>
                    {(sessions || []).map(s => (
                        <button key={s.id} onClick={() => setInput(loadSession(s, input))} className={`w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-left truncate ${currentSessionId === s.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
                            <div className="flex items-center gap-3 truncate"><MessageSquare size={14} /><span className="truncate">{s.title}</span></div>
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
                    {(messages || []).map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (msg.parts?.length || 0) > 0 && (
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-1 border border-cyan-500/20 shadow-lg"><Bot size={20} /></div>
                            )}
                            <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-0 overflow-hidden flex flex-col gap-1 ${msg.role === 'user' ? 'bg-transparent' : ''}`}>
                                {msg.parts?.map((part, pIdx) => (
                                    part.type === 'thought' 
                                        ? <ProcessNode key={pIdx} content={part.content} />
                                        : <div key={pIdx} className={`p-5 md:p-8 text-sm md:text-base leading-relaxed shadow-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-900/40 text-slate-200 border border-white/10 rounded-2xl rounded-tl-none backdrop-blur-sm'}`}>
                                            <MarkdownRenderer content={part.content} collapsible={msg.role === 'assistant' && pIdx < (msg.parts?.length || 0) - 1} />
                                          </div>
                                ))}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center shrink-0 mt-1 border border-white/10 shadow-lg"><User size={20} /></div>
                            )}
                        </div>
                    ))}
                    {isCurrentSessionLoading && (messages[messages.length - 1]?.parts || []).length === 0 && <ChatLoader />}
                    <div ref={messagesEndRef} />
                </div>

                {/* 입력 및 툴바 영역 */}
                <div className="p-6 md:p-10 bg-slate-900/60 backdrop-blur-3xl border-t border-white/5 space-y-4">
                    <div className="max-w-4xl mx-auto flex flex-wrap gap-2 px-2 items-center">
                        {['GEMINI.md', 'plan.md', 'checklist.md'].map(fileName => (
                            <button 
                                key={fileName}
                                onClick={() => toggleHook(fileName)} 
                                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[10px] font-bold transition-all uppercase tracking-tighter ${selectedHooks?.includes(fileName) ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-cyan-400'}`}
                            >
                                <Hash size={12} className={selectedHooks?.includes(fileName) ? 'animate-pulse' : ''} /> {fileName}
                            </button>
                        ))}
                        
                        <div className="w-px h-4 bg-white/10 mx-1" />

                        <div className="relative">
                            <button onClick={() => setIsSkillListOpen(!isSkillListOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[10px] font-bold transition-all uppercase tracking-tighter ${activeSkillId ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-400'}`}>
                                <Zap size={12} fill={activeSkillId ? 'currentColor' : 'none'} /> {activeSkillId ? `Skill: ${activeSkillId}` : 'Select Skill'}
                            </button>
                            {isSkillListOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                                    <button onClick={() => { setActiveSkillId(null); setIsSkillListOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-white/5 text-[10px] font-bold text-slate-500 border-b border-white/5 last:border-0">NONE (DEFAULT)</button>
                                    {(skills || []).map(s => <button key={s.id} onClick={() => { setActiveSkillId(s.id); setIsSkillListOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-amber-500/10 text-[10px] font-bold text-amber-400 border-b border-white/5 last:border-0">{s.name}</button>)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto relative group">
                        {(selectedHooks || []).length > 0 && (
                            <div className="absolute top-3 left-4 flex gap-2 z-10">
                                {selectedHooks.map(h => (
                                    <span key={h} className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500 text-slate-900 rounded text-[9px] font-black uppercase">
                                        @{h} <X size={8} className="cursor-pointer" onClick={() => toggleHook(h)} />
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (!e.nativeEvent.isComposing && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder={activeSkillId ? `[SKILL: ${activeSkillId}] 명령을 입력하세요...` : "AI에게 명령을 입력하세요..."}
                            className={`w-full bg-slate-800/40 text-slate-100 rounded-2xl pr-16 border border-white/10 focus:outline-none focus:border-cyan-500 shadow-2xl resize-none min-h-[64px] custom-scrollbar transition-all ${(selectedHooks || []).length > 0 ? 'pt-10 pl-6' : 'py-5 pl-6'}`}
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

            {/* 오른쪽 사이드바 */}
            {isRightSidebarOpen && (
                <aside className="w-80 bg-slate-900/50 border-l border-white/5 flex flex-col backdrop-blur-xl">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2"><Github size={18} className="text-slate-400" /><span className="font-bold text-sm text-slate-100">Repositories</span></div>
                        <button onClick={fetchRepositories} className="p-1.5 hover:bg-cyan-500/10 rounded-lg text-slate-500"><RotateCcw size={14} className={isRepoLoading ? 'animate-spin' : ''} /></button>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {(repositories || []).map((repo) => (
                            <button key={repo.id} onClick={() => setSelectedRepo(repo)} className={`w-full text-left p-3 rounded-xl transition-all border ${selectedRepo?.id === repo.id ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0 w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/5"><div className="w-2 h-2 rounded-full bg-cyan-500/50"></div></div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold truncate">{repo.name}</div>
                                        <div className="text-[10px] opacity-50 truncate">{repo.full_name}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    {selectedRepo && (
                        <div className="flex-1 border-t border-white/5 flex flex-col min-h-0 bg-black/20">
                            <div className="p-4 flex items-center justify-between bg-white/5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Pull Requests</span>
                                {isPullsLoading && <Loader2 size={12} className="animate-spin text-cyan-400" />}
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {(pullRequests || []).map((pr) => (
                                    <div key={pr.id} className="p-3 bg-white/5 border border-white/5 rounded-xl group hover:border-cyan-500/30 transition-all">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug">{pr.title}</div>
                                            <span className="text-[9px] font-mono text-cyan-400/60 shrink-0">#{pr.number}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 opacity-50">
                                                <img src={pr.user?.avatar_url} alt={pr.user?.login} className="w-4 h-4 rounded-full" />
                                                <span className="text-[10px] truncate max-w-[80px]">{pr.user?.login}</span>
                                            </div>
                                            <button onClick={() => {}} disabled={isCurrentSessionLoading} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-[9px] font-black uppercase hover:bg-cyan-500 hover:text-slate-950 transition-all">Review</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectedRepo && (
                        <div className="p-4 border-t border-white/5 bg-cyan-500/5">
                            <button onClick={async () => await sendMessage(`저장소 \`${selectedRepo.full_name}\` 분석 요청`, currentSessionId, selectedRepo)} disabled={isCurrentSessionLoading} className="w-full py-3 bg-cyan-500 text-slate-950 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)]">Analyze Source Code</button>
                        </div>
                    )}
                </aside>
            )}
        </div>
    );
};
