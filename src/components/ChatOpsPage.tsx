import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, LogOut, Sparkles, Code, Terminal, MessageSquare, Plus, Settings, RotateCcw, User, ChevronDown, Loader2, Github, X, FileText, Zap, Hash, ExternalLink, GitPullRequest, GitMerge, FileCode, Folder, FolderOpen, ChevronRight, Search, Check, Eye, Mail, Download, Edit2, Box, Wrench, Info } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';
import { SettingsModal } from './SettingsModal';
import { useChatOps } from '../hooks/useChatOps';
import { MarkdownRenderer } from './Chat/MarkdownRenderer';
import { ProcessNode } from './Chat/ProcessNode';
import { ChatLoader } from './Chat/ChatLoader';
import { ContentPreviewModal } from './Chat/ContentPreviewModal';

type SidebarTab = 'PR' | 'Push' | 'Code';

const MCP_TOOL_SPECS: Record<string, string> = {
    'grep_search': "# grep_search\n\n리포지토리 전역에서 특정 문자열이나 정규표현식 패턴을 검색합니다.\n\n### Parameters\n- `query`: 검색할 문자열 또는 정규표현식\n\n### Usage\n- 보안 취약점 패턴 탐지 (예: `eval(`, `apiKey`)\n- 특정 함수의 모든 사용처 조사\n- 환경 설정 키워드 추적",
    'glob': "# glob\n\n와일드카드 패턴을 사용하여 조건에 맞는 파일 목록을 탐색합니다.\n\n### Parameters\n- `pattern`: Glob 패턴 (예: `**/*.ts`, `src/components/*.tsx`)\n\n### Usage\n- 특정 확장자 파일 일괄 식별\n- 프로젝트 폴더 구조 분석\n- 설정 파일 자동 탐색",
    'read_many_files': "# read_many_files\n\n최대 10개의 파일 내용을 병렬로 한 번에 읽어옵니다.\n\n### Parameters\n- `paths`: 읽어올 파일 경로들의 배열\n\n### Usage\n- 상호 연관된 모듈 동시 분석\n- 아키텍처 의존성 확인\n- 대량의 코드 리뷰 수행 시 속도 향상",
    'list_files': "# list_files\n\n지정한 경로의 파일 및 디렉토리 목록을 가져옵니다.\n\n### Parameters\n- `path`: 탐색할 디렉토리 경로 (기본값: 루트)\n\n### Usage\n- 초기 프로젝트 구조 파악\n- 디렉토리 계층 이동 및 탐색",
    'read_file': "# read_file\n\n특정 파일의 전체 소스 코드를 정밀하게 읽어옵니다.\n\n### Parameters\n- `path`: 읽을 파일의 경로\n\n### Usage\n- 핵심 로직 상세 분석\n- 버그 원인 파악 및 코드 수정 제안",
    'read_pr_diff': "# read_pr_diff\n\n특정 Pull Request의 코드 변경 사항(Diff)을 읽어옵니다.\n\n### Parameters\n- `pull_number`: PR 번호\n\n### Usage\n- 코드 리뷰 및 변경 영향도 평가\n- 신규 기능 구현 사항 검증"
};

export const ChatOpsPage: React.FC = () => {
    const { logout } = useUser();
    const [input, setInput] = useState('');
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [isModelListOpen, setIsModelListOpen] = useState(false);
    const [isSkillListOpen, setIsSkillListOpen] = useState(false);
    const [isHookListOpen, setIsHookListOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTab>('PR');
    
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitleValue, setEditTitleValue] = useState('');

    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    
    const [repositories, setRepositories] = useState<any[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [pullRequests, setPullRequests] = useState<any[]>([]);
    const [commits, setCommits] = useState<any[]>([]);
    const [fileTree, setFileTree] = useState<any[]>([]);
    
    const [isRepoLoading, setIsRepoLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isProcessingRef = useRef<boolean>(false);

    const {
        messages, models, currentModel, setCurrentModel, sessions, currentSessionId, createNewSession, loadSession, sendMessage, setMessages,
        updateSessionTitle,
        skills, activeSkillId, setActiveSkillId, selectedHooks, toggleHook, attachedResources, toggleResource, removeResource
    } = useChatOps();

    const isCurrentSessionLoading = sessions.find(s => s.id === currentSessionId)?.isLoading || false;

    // 데이터 로드 로직
    const fetchRepositories = useCallback(async () => {
        setIsRepoLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/repos`);
            const data = await res.json();
            if (data.repos) setRepositories(data.repos);
        } catch (e) { console.error('저장소 로드 실패'); } finally { setIsRepoLoading(false); }
    }, []);

    const fetchDataForTab = useCallback(async () => {
        if (!selectedRepo) return;
        const [owner, name] = selectedRepo.full_name.split('/');
        setIsDataLoading(true);
        try {
            if (activeTab === 'PR') {
                const res = await fetch(`${API_URL}/api/github/repos/${owner}/${name}/pulls`);
                const data = await res.json();
                setPullRequests(data.pulls || []);
            } else if (activeTab === 'Push') {
                const res = await fetch(`${API_URL}/api/github/repos/${owner}/${name}/commits`);
                const data = await res.json();
                setCommits(data.commits || []);
            } else if (activeTab === 'Code') {
                const res = await fetch(`${API_URL}/api/github/repos/${owner}/${name}/tree`);
                const data = await res.json();
                
                // 계층형 정렬 알고리즘 (v3.7 고도화)
                const sortedTree = (data.tree || []).sort((a: any, b: any) => {
                    const partsA = a.path.split('/');
                    const partsB = b.path.split('/');
                    const len = Math.min(partsA.length, partsB.length);
                    for (let i = 0; i < len; i++) {
                        if (partsA[i] !== partsB[i]) {
                            const isLastA = i === partsA.length - 1;
                            const isLastB = i === partsB.length - 1;
                            const isFolderA = !isLastA || a.type === 'tree';
                            const isFolderB = !isLastB || b.type === 'tree';
                            if (isFolderA && !isFolderB) return -1;
                            if (!isFolderA && isFolderB) return 1;
                            return partsA[i].localeCompare(partsB[i]);
                        }
                    }
                    return partsA.length - partsB.length;
                });
                setFileTree(sortedTree);
            }
        } catch (e) { console.error('데이터 로드 실패'); } finally { setIsDataLoading(true); setIsDataLoading(false); }
    }, [selectedRepo, activeTab]);

    useEffect(() => { fetchRepositories(); }, [fetchRepositories]);
    useEffect(() => { fetchDataForTab(); }, [fetchDataForTab]);

    const filteredItems = useMemo(() => {
        const search = sidebarSearch.toLowerCase();
        if (activeTab === 'PR') return pullRequests.filter(pr => pr.title.toLowerCase().includes(search) || String(pr.number).includes(search));
        if (activeTab === 'Push') return commits.filter(c => c.commit.message.toLowerCase().includes(search) || c.sha.includes(search));
        if (activeTab === 'Code') return fileTree.filter(f => f.path.toLowerCase().includes(search));
        return [];
    }, [activeTab, sidebarSearch, pullRequests, commits, fileTree]);

    const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);
    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // --- 핸들러 ---

    const handleSendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isCurrentSessionLoading || isProcessingRef.current) return;
        try {
            isProcessingRef.current = true;
            setInput(''); 
            await sendMessage(trimmed, currentSessionId, selectedRepo);
        } finally { isProcessingRef.current = false; }
    };

    const handleAnalyzeSourceCode = async () => {
        if (!selectedRepo || isCurrentSessionLoading || isProcessingRef.current) return;
        await sendMessage(`저장소 \`${selectedRepo.full_name}\` 분석 요청`, currentSessionId, selectedRepo);
    };

    const handleResourceToggle = (type: 'pr' | 'commit' | 'file' | 'folder', item: any) => {
        if (!selectedRepo) return;
        const [owner, repo] = selectedRepo.full_name.split('/');
        const resource = {
            type, owner, repo,
            id: type === 'pr' ? String(item.number) : type === 'commit' ? item.sha : item.path,
            name: type === 'pr' ? `#${item.number}` : type === 'commit' ? item.sha.substring(0, 7) : item.path.split('/').pop() || item.path
        };
        toggleResource(resource);
    };

    const handleModelChange = async (modelName: string) => {
        try {
            const res = await fetch(`${API_URL}/api/models/select`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelName }) });
            if (res.ok) {
                setCurrentModel(modelName);
                setIsModelListOpen(false);
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', parts: [{ type: 'text', content: `**시스템 알림**: 모델이 \`${modelName}\`(으)로 변경되었습니다.` }], timestamp: new Date() }]);
            }
        } catch (e) { console.error('모델 변경 실패'); }
    };

    const handleOpenPreview = async (type: 'skill' | 'hook' | 'mcp', id: string, name: string) => {
        setIsPreviewLoading(true);
        setPreviewTitle(name);
        setIsPreviewOpen(true);
        try {
            if (type === 'mcp') { setPreviewContent(MCP_TOOL_SPECS[id] || '명세 정보가 없습니다.'); setIsPreviewLoading(false); return; }
            let url = '';
            if (type === 'skill') url = `${API_URL}/api/skills/${id}/content`;
            else url = `${API_URL}/api/context/hook?fileName=${id}`;
            const res = await fetch(url);
            const data = await res.json();
            setPreviewContent(data.content || '내용이 없습니다.');
        } catch (e) { setPreviewContent('콘텐츠를 불러오는 중 오류가 발생했습니다.'); } finally { setIsPreviewLoading(false); }
    };

    const handleExportWord = (content: string) => {
        const repoName = selectedRepo?.name || 'RepoInsight';
        const date = new Date().toLocaleDateString();
        const fullContent = `# RepoInsight Analysis Report\n\n- **Project**: ${repoName}\n- **Date**: ${date}\n\n---\n\n${content}`;
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${fullContent.replace(/\n/g, '<br>')}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `RepoInsight_Report_${repoName}_${date}.doc`;
        link.click(); URL.revokeObjectURL(url);
    };

    const handleSendEmail = (content: string) => {
        const repoName = selectedRepo?.name || 'Repository';
        const subject = encodeURIComponent(`[RepoInsight] Analysis Report for ${repoName}`);
        const body = encodeURIComponent(`Hello,\n\nHere is the analysis report for project ${repoName}.\n\n---\n\n${content}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const resetAllSelections = () => { setActiveSkillId(null); };

    const getSkillName = (id: string | null) => {
        if (!id) return null;
        const skill = skills.find(s => s.id === id);
        return skill ? skill.name : id.toUpperCase();
    };

    const startEditing = (e: React.MouseEvent, id: string, title: string) => { e.stopPropagation(); setEditingSessionId(id); setEditTitleValue(title); };
    const saveTitle = (id: string) => { if (editTitleValue.trim()) updateSessionTitle(id, editTitleValue.trim()); setEditingSessionId(null); };

    const toggleFolder = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    /**
     * [v3.7 Iteration] 재귀적으로 모든 부모 폴더가 펼쳐져 있는지 확인합니다.
     */
    const isPathVisible = (path: string) => {
        const parts = path.split('/');
        if (parts.length === 1) return true; // 루트 항목은 항상 보임
        
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
            if (!expandedFolders.has(currentPath)) return false;
        }
        return true;
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
            {/* 왼쪽 사이드바 */}
            <aside className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col hidden md:flex backdrop-blur-xl">
                <div className="p-6 flex items-center gap-3 border-b border-white/5">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]"><Bot size={20} /></div>
                    <span className="font-bold text-lg tracking-tight text-slate-100">RepoInsight ChatOps</span>
                </div>
                <div className="p-4 border-b border-white/5 relative">
                    <button onClick={() => setIsModelListOpen(!isModelListOpen)} className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-xs font-mono">
                        <div className="flex items-center gap-2 overflow-hidden text-xs font-mono"><Sparkles size={14} className="text-cyan-400 shrink-0" /><span className="truncate">{currentModel}</span></div>
                        <ChevronDown size={14} className={isModelListOpen ? 'rotate-180' : ''} />
                    </button>
                    {isModelListOpen && (
                        <div className="absolute left-4 right-4 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {(models || []).map(m => <button key={m.name} onClick={() => handleModelChange(m.name)} className={`w-full text-left px-4 py-2 hover:bg-white/5 text-xs font-mono border-b border-white/5 last:border-0 ${currentModel === m.name ? 'text-cyan-400' : 'text-slate-400'}`}>{m.name}</button>)}
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <button onClick={createNewSession} className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-sm font-medium mb-6"><Plus size={16} /><span>New Analysis Session</span></button>
                    {(sessions || []).map(s => (
                        <div key={s.id} className="relative group/session">
                            {editingSessionId === s.id ? (
                                <input autoFocus value={editTitleValue} onChange={(e) => setEditTitleValue(e.target.value)} onBlur={() => saveTitle(s.id)} onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(s.id); if (e.key === 'Escape') setEditingSessionId(null); }} className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-cyan-500/50 outline-none text-sm" />
                            ) : (
                                <button onClick={() => setInput(loadSession(s, input))} className={`w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-left truncate ${currentSessionId === s.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
                                    <div className="flex items-center gap-3 truncate"><MessageSquare size={14} className="shrink-0" /><span className="truncate">{s.title}</span></div>
                                    <div className="flex items-center gap-2"><Edit2 size={12} className="opacity-0 group-hover/session:opacity-100 hover:text-white transition-all shrink-0" onClick={(e) => startEditing(e, s.id, s.title)} />{s.isLoading && <Loader2 size={12} className="animate-spin text-cyan-400 shrink-0" />}</div>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-white/5 rounded-lg text-sm"><Settings size={16} /><span>Settings</span></button>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-sm"><LogOut size={16} /><span>Log Out</span></button>
                </div>
            </aside>

            {/* 메인 대화 영역 */}
            <main className="flex-1 flex flex-col relative bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 custom-scrollbar">
                    {(messages || []).map((msg, idx) => {
                        // @ts-ignore
                        const isDone = msg.isDone || false;
                        const lastTextPartIdx = [...(msg.parts || [])].reverse().findIndex(p => p.type === 'text');
                        const actualLastTextPartIdx = lastTextPartIdx === -1 ? -1 : (msg.parts?.length || 0) - 1 - lastTextPartIdx;
                        return (
                            <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (msg.parts?.length || 0) > 0 && (
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-1 border border-cyan-500/20 shadow-lg"><Bot size={20} /></div>
                                )}
                                <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-0 overflow-hidden flex flex-col gap-1 ${msg.role === 'user' ? 'bg-transparent items-end' : ''}`}>
                                    {msg.role === 'user' ? (
                                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tr-none shadow-2xl overflow-hidden flex flex-col">
                                            {msg.meta && (msg.meta.activeSkillId || (msg.meta.selectedHooks?.length || 0) > 0 || (msg.meta.attachedResources?.length || 0) > 0) && (
                                                <div className="flex flex-wrap gap-2 p-3 bg-white/5 border-b border-white/5">
                                                    {msg.meta.activeSkillId && (<span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-slate-950 rounded text-[9px] font-black uppercase shadow-glow"><Zap size={10} fill="currentColor" /> {getSkillName(msg.meta.activeSkillId)}</span>)}
                                                    {msg.meta.selectedHooks?.map(h => (<span key={h} className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[9px] font-black uppercase"><FileCode size={10} /> {h}</span>))}
                                                    {msg.meta.attachedResources?.map((r: any) => (<span key={`${r.type}-${r.id}`} className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-black uppercase"><Hash size={10} /> {r.name}</span>))}
                                                </div>
                                            )}
                                            <div className="p-5 md:p-8 text-sm md:text-base text-slate-100 leading-relaxed"><MarkdownRenderer content={msg.parts?.[0]?.content || ''} /></div>
                                        </div>
                                    ) : (
                                        <div className={`relative flex flex-col gap-1 ${isDone ? 'final-report' : ''}`}>
                                            {isDone && (<div className="flex justify-start mb-1"><div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.15)]"><Sparkles size={12} className="text-amber-400 animate-pulse" /><span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Final Analysis Report</span></div></div>)}
                                            {msg.parts?.map((part, pIdx) => {
                                                if (part.type === 'thought') {
                                                    const isProcessNode = part.content.startsWith('Completed:') || part.content.startsWith('Executing');
                                                    if (isDone && isProcessNode) return null;
                                                    return <ProcessNode key={pIdx} content={part.content} />;
                                                }
                                                const isLastMsg = idx === messages.length - 1;
                                                const isActualLastPart = isLastMsg && pIdx === actualLastTextPartIdx;
                                                return (<div key={pIdx} className="relative group/msg"><div className={`p-5 md:p-8 text-sm md:text-base leading-relaxed shadow-xl bg-slate-900/40 text-slate-200 border border-white/10 rounded-2xl rounded-tl-none backdrop-blur-sm`}><MarkdownRenderer content={part.content} collapsible={!isActualLastPart} defaultCollapsed={!isActualLastPart && isDone} />{isDone && isActualLastPart && (<div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5"><button onClick={() => handleExportWord(part.content)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 hover:text-cyan-400 transition-all uppercase tracking-tighter" title="Word로 내보내기"><FileText size={14} /> Export Word</button><button onClick={() => handleSendEmail(part.content)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 hover:text-amber-400 transition-all uppercase tracking-tighter" title="이메일로 보내기"><Mail size={14} /> Send Email</button></div>)}</div></div>);
                                            })}
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && (<div className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center shrink-0 mt-1 border border-white/10 shadow-lg"><User size={20} /></div>)}
                            </div>
                        );
                    })}
                    {isCurrentSessionLoading && (messages[messages.length - 1]?.parts || []).length === 0 && <ChatLoader />}
                    <div ref={messagesEndRef} />
                </div>

                {/* 입력창 및 툴바 영역 */}
                <div className="p-6 md:p-10 bg-slate-900/60 backdrop-blur-3xl border-t border-white/5 space-y-4">
                    <div className="max-w-4xl mx-auto flex flex-col gap-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button onClick={() => { setIsSkillListOpen(!isSkillListOpen); setIsHookListOpen(false); }} className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-[11px] font-black transition-all uppercase tracking-widest ${activeSkillId ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-400'}`}>
                                    <Zap size={14} fill={activeSkillId ? 'currentColor' : 'none'} /> {activeSkillId ? `Skill: ${getSkillName(activeSkillId)}` : 'Select Skill'}
                                </button>
                                {isSkillListOpen && (
                                    <div className="absolute bottom-full left-0 mb-3 w-[550px] max-w-[90vw] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-4 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex justify-between items-center mb-3 px-2 border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2"><Zap size={14} className="text-amber-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expert Intelligence ({(skills || []).length})</span></div>
                                            <button onClick={() => { setActiveSkillId(null); setIsSkillListOpen(false); }} className="text-[9px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase">Reset Skill</button>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[350px] p-1 custom-scrollbar">
                                            {(skills || []).map(s => (
                                                <div key={s.id} className="relative group/item">
                                                    <button onClick={() => { setActiveSkillId(s.id); setIsSkillListOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${activeSkillId === s.id ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-300'}`}>
                                                        <Zap size={10} className={activeSkillId === s.id ? 'text-amber-400' : 'text-slate-600 group-hover:text-amber-400'} /><span className="text-[10px] font-bold truncate pr-4 leading-none">{s.name}</span>
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenPreview('skill', s.id, s.name); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-cyan-400 opacity-0 group-hover/item:opacity-100 transition-all"><Eye size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <button onClick={() => { setIsHookListOpen(!isHookListOpen); setIsSkillListOpen(false); }} className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-[11px] font-black transition-all uppercase tracking-widest ${selectedHooks?.length > 0 ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-cyan-400'}`}>
                                    <Hash size={14} /> Context Hooks {selectedHooks?.length > 0 && `(${selectedHooks.length})`}
                                </button>
                                {isHookListOpen && (
                                    <div className="absolute bottom-full left-0 mb-3 w-[450px] max-w-[90vw] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-4 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex justify-between items-center mb-3 px-2 border-b border-white/5 pb-2">
                                            <div className="flex items-center gap-2"><FileText size={14} className="text-cyan-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Contexts</span></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 p-1">
                                            {['GEMINI.md', 'plan.md', 'checklist.md', 'README.md'].map(fileName => (
                                                <div key={fileName} className="relative group/item">
                                                    <button onClick={() => toggleHook(fileName)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${selectedHooks?.includes(fileName) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                                        <span className="text-[10px] font-bold truncate pr-4">{fileName}</span>
                                                        {selectedHooks?.includes(fileName) && <Check size={12} className="text-cyan-400" />}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenPreview('hook', fileName, fileName); }} className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-cyan-400 opacity-0 group-hover/item:opacity-100 transition-all"><Eye size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1" />
                            {(activeSkillId || (selectedHooks?.length || 0) > 0) && (
                                <button onClick={resetAllSelections} className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-red-400 transition-colors text-[10px] font-bold uppercase tracking-tighter"><RotateCcw size={12} /> Reset All</button>
                            )}
                        </div>
                        {(selectedHooks?.length > 0 || attachedResources?.length > 0) && (
                            <div className="flex flex-wrap gap-2 py-2 px-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                {selectedHooks.map(h => (<span key={h} className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-[9px] font-black uppercase"><FileCode size={10} /> {h}<X size={10} className="cursor-pointer hover:text-white" onClick={() => toggleHook(h)} /></span>))}
                                {attachedResources.map(r => (<span key={`${r.type}-${r.id}`} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[9px] font-black uppercase"><Hash size={10} /> {r.name}<X size={10} className="cursor-pointer hover:text-white" onClick={() => removeResource(r.type, r.id)} /></span>))}
                            </div>
                        )}
                    </div>
                    <div className="max-w-4xl mx-auto relative group">
                        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (!e.nativeEvent.isComposing && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={activeSkillId ? `Ask anything with [${getSkillName(activeSkillId)}] skill...` : "AI에게 프로젝트 분석 명령을 입력하세요..."} className={`w-full bg-slate-800/40 text-slate-100 rounded-2xl pr-16 border border-white/10 focus:outline-none focus:border-cyan-500 shadow-2xl resize-none min-h-[64px] max-h-48 custom-scrollbar transition-all py-5 pl-6`} disabled={isCurrentSessionLoading} rows={1} />
                        <button onClick={handleSendMessage} disabled={!input.trim() || isCurrentSessionLoading} className={`absolute right-4 bottom-4 p-3 rounded-xl transition-all shadow-lg ${!input.trim() || isCurrentSessionLoading ? 'bg-white/5 text-white/10' : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400'}`}>{isCurrentSessionLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}</button>
                    </div>
                </div>
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentModel={currentModel} />
            <ContentPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={previewTitle} content={previewContent} isLoading={isPreviewLoading} />

            {/* 오른쪽 사이드바 (Analysis & Tools) */}
            {isRightSidebarOpen && (
                <aside className="w-80 bg-slate-900/50 border-l border-white/5 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2"><Github size={18} className="text-slate-400" /><span className="font-bold text-sm text-slate-100">Repositories</span></div>
                            <button onClick={fetchRepositories} className="p-1.5 hover:bg-cyan-500/10 rounded-lg text-slate-500"><RotateCcw size={14} className={isRepoLoading ? 'animate-spin' : ''} /></button>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <select onChange={(e) => setSelectedRepo(repositories.find(r => r.id === Number(e.target.value)))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 appearance-none pr-8" value={selectedRepo?.id || ''}><option value="">Select a repository...</option>{repositories.map(repo => <option key={repo.id} value={repo.id}>{repo.name}</option>)}</select>
                                <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" />
                            </div>
                            <button onClick={handleAnalyzeSourceCode} disabled={!selectedRepo || isCurrentSessionLoading} className="p-2.5 bg-cyan-500 text-slate-950 rounded-lg hover:bg-white transition-all shadow-glow disabled:opacity-30 disabled:cursor-not-allowed" title="Analyze whole repository"><Sparkles size={16} /></button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 flex flex-col min-h-0">
                            {selectedRepo ? (
                                <>
                                    <div className="flex border-b border-white/5 bg-black/20">{(['PR', 'Push', 'Code'] as SidebarTab[]).map(tab => (<button key={tab} onClick={() => { setActiveTab(tab); setSidebarSearch(''); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500'}`}>{tab}</button>))}</div>
                                    <div className="px-3 py-2 border-b border-white/5 bg-white/5"><div className="relative"><Search size={12} className="absolute left-3 top-2.5 text-slate-600" /><input type="text" placeholder={`Filter ${activeTab}...`} value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-full pl-8 pr-4 py-1.5 text-[10px] text-slate-300 focus:outline-none" /></div></div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                                        {isDataLoading ? <div className="flex flex-col items-center justify-center h-full opacity-30 gap-2"><Loader2 size={24} className="animate-spin" /></div> : (
                                            <div className="flex flex-col gap-1">
                                                {activeTab === 'PR' && (filteredItems || []).map(pr => (<button key={pr.id} onClick={() => handleResourceToggle('pr', pr)} className={`w-full p-3 bg-white/5 border rounded-xl group transition-all text-left flex flex-col gap-2 hover:bg-white/10 ${attachedResources.find(r => r.type === 'pr' && r.id === String(pr.number)) ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-white/5'}`}><div className="flex justify-between items-start gap-2"><span className={`text-xs font-bold transition-colors uppercase flex-1 line-clamp-2 ${attachedResources.find(r => r.type === 'pr' && r.id === String(pr.number)) ? 'text-indigo-400' : 'text-slate-200 group-hover:text-cyan-400'}`}>{pr.title}</span><a href={pr.html_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-white/10 rounded text-slate-500 shrink-0"><ExternalLink size={12} /></a></div><div className="flex items-center justify-between text-[9px] font-mono opacity-50"><span>#{pr.number} by {pr.user?.login}</span><span className={`px-1.5 py-0.5 rounded ${pr.state === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{pr.state}</span></div></button>))}
                                                {activeTab === 'Push' && (filteredItems || []).map(commit => (<button key={commit.sha} onClick={() => handleResourceToggle('commit', commit)} className={`w-full p-3 bg-white/5 border rounded-xl group transition-all text-left flex flex-col gap-1 hover:bg-white/10 ${attachedResources.find(r => r.type === 'commit' && r.id === commit.sha) ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-white/5'}`}><div className="flex justify-between items-start gap-2"><span className={`text-xs font-bold transition-colors flex-1 line-clamp-2 ${attachedResources.find(r => r.type === 'commit' && r.id === commit.sha) ? 'text-indigo-400' : 'text-slate-200 group-hover:text-cyan-400'}`}>{commit.commit.message}</span><a href={commit.html_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-white/10 rounded text-slate-500 shrink-0"><ExternalLink size={12} /></a></div><div className="flex items-center justify-between text-[9px] font-mono opacity-50"><span>{commit.sha.substring(0, 7)}</span><span>{new Date(commit.commit.author.date).toLocaleDateString()}</span></div></button>))}
                                                {activeTab === 'Code' && (filteredItems || []).map(file => {
                                                    const depth = file.path.split('/').length - 1;
                                                    const name = file.path.split('/').pop();
                                                    const isFolder = file.type === 'tree';
                                                    const isExpanded = expandedFolders.has(file.path);
                                                    const isAttached = attachedResources.find(r => r.type === (isFolder ? 'folder' : 'file') && r.id === file.path);
                                                    if (depth > 0) {
                                                        const pathParts = file.path.split('/');
                                                        let currentCheck = '';
                                                        for (let i = 0; i < pathParts.length - 1; i++) {
                                                            currentCheck = currentCheck ? `${currentCheck}/${pathParts[i]}` : pathParts[i];
                                                            if (!expandedFolders.has(currentCheck)) return null;
                                                        }
                                                    }
                                                    return (
                                                        <div key={file.path} onClick={(e) => isFolder ? toggleFolder(e, file.path) : handleResourceToggle('file', file)} className={`w-full group flex items-center justify-between gap-2 py-0.5 px-2 rounded-lg transition-all hover:bg-white/10 cursor-pointer ${isAttached ? 'bg-indigo-500/10 border border-indigo-500/30' : ''}`} style={{ marginLeft: `${depth * 8}px`, width: `calc(100% - ${depth * 8}px)` }}>
                                                            <div className={`flex-1 flex items-center gap-2 truncate text-left ${isAttached ? 'text-indigo-400 font-black' : 'text-slate-400 group-hover:text-slate-200'}`}>{isFolder ? (isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />) : <div className="w-[10px]" />}{isFolder ? (isExpanded ? <FolderOpen size={10} className="text-cyan-400 shrink-0" /> : <Folder size={10} className="text-cyan-500 shrink-0" />) : <FileCode size={10} className="text-slate-500 shrink-0" />}<span className="text-[10px] truncate font-mono">{name}</span></div>
                                                            <div className="flex items-center gap-1">{isFolder && <button onClick={(e) => { e.stopPropagation(); handleResourceToggle('folder', file); }} className={`p-0.5 rounded ${isAttached ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-500 opacity-0 group-hover:opacity-100'}`}>{isAttached ? <X size={8} /> : <Plus size={8} />}</button>}{!isFolder && file.type === 'blob' && <div className={`w-1.5 h-1.5 rounded-full ${isAttached ? 'bg-indigo-500' : 'bg-transparent'}`} />}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-20"><Github size={48} className="mb-4" /><p className="text-xs uppercase tracking-widest font-black">Select a repository<br/>to explore insights</p></div>
                            )}
                        </div>

                        <div className="h-1/3 bg-black/40 border-t border-white/10 flex flex-col">
                            <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-white/5"><Wrench size={14} className="text-amber-400" /><span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Available MCP Tools</span></div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'grep_search', name: 'grep_search', desc: 'Global text search' },
                                        { id: 'glob', name: 'glob', desc: 'Pattern-based file listing' },
                                        { id: 'read_many_files', name: 'read_many_files', desc: 'Batch file reading' },
                                        { id: 'list_files', name: 'list_files', desc: 'Directory exploration' },
                                        { id: 'read_file', name: 'read_file', desc: 'Precise code reading' },
                                        { id: 'read_pr_diff', name: 'read_pr_diff', desc: 'PR change analysis' }
                                    ].map(tool => (
                                        <div key={tool.id} className="relative group/tool p-2 rounded-lg bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all flex justify-between items-center">
                                            <div className="flex-1"><div className="text-[10px] font-bold text-slate-200 mb-0.5 font-mono">{tool.name}</div><div className="text-[9px] text-slate-500 font-light leading-tight">{tool.desc}</div></div>
                                            <button onClick={() => handleOpenPreview('mcp', tool.id, tool.name)} className="p-1.5 text-slate-600 hover:text-amber-400 opacity-0 group-hover/tool:opacity-100 transition-all"><Info size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
};
