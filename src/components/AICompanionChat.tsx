import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Minimize2, Bot, User, Lock, RotateCcw, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useUser } from '../context/UserContext';
import { API_ENDPOINTS } from '../config';

const SyntaxHighlighterAny = SyntaxHighlighter as any;

// 채팅 파트 및 메시지 인터페이스 (ChatOpsPage와 동일 규격)
interface ChatPart {
    type: 'text' | 'thought' | 'tool_result';
    content: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    parts: ChatPart[];
    timestamp: Date;
}

// AI 챗봇 컴포넌트 (지능형 UI 업그레이드 버전)
export const AICompanionChat: React.FC = () => {
    const { tier } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: 'initial',
            role: 'assistant', 
            parts: [{ type: 'text', content: '안녕하세요! Nura AI 시스템 아키텍트입니다. 프로젝트의 기술적 난제를 해결하고 최적화 프로토콜을 제안해드릴 준비가 되었습니다.' }],
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Apex 등급이 아니면 기능 잠금
    const isLocked = tier !== 'Apex';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // 대화 내역 초기화
    const resetChat = () => {
        setMessages([{ 
            id: 'reset',
            role: 'assistant', 
            parts: [{ type: 'text', content: '대화가 초기화되었습니다. 무엇을 도와드릴까요?' }],
            timestamp: new Date()
        }]);
    };

    // 스트리밍 메시지 전송 핸들러
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsgText = inputValue.trim();
        setInputValue('');
        
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            parts: [{ type: 'text', content: userMsgText }],
            timestamp: new Date()
        };

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            parts: [],
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg, aiMsg]);
        setIsLoading(true);

        try {
            let history = messages
                .filter(m => m.parts.length > 0)
                .slice(-10)
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: msg.parts.filter(p => p.type === 'text').map(p => ({ text: p.content }))
                }));

            if (history.length > 0 && history[0].role === 'model') history.shift();

            const response = await fetch(API_ENDPOINTS.CHAT_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsgText, history }),
            });

            if (!response.ok) throw new Error('스트리밍 요청 실패');

            const reader = response.body?.getReader();
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

                                    setMessages(prev => {
                                        const next = [...prev];
                                        const last = next[next.length - 1];
                                        if (last && last.role === 'assistant') {
                                            if (type === 'text') {
                                                const lastPart = last.parts[last.parts.length - 1];
                                                if (lastPart && lastPart.type === 'text') {
                                                    lastPart.content += content;
                                                } else {
                                                    last.parts.push({ type: 'text', content });
                                                }
                                            } else {
                                                // [지능형 갱신] 역순 탐색하여 완료되지 않은 가장 최근의 thought 파트 찾기
                                                const targetPart = [...last.parts].reverse().find(p => 
                                                    p.type === 'thought' && 
                                                    !p.content.startsWith('Completed:') && 
                                                    !p.content.startsWith('Failed:')
                                                );

                                                if (targetPart && (content.startsWith('Completed:') || content.startsWith('Failed:') || content.includes('Analyzing'))) {
                                                    targetPart.content = content;
                                                } else {
                                                    last.parts.push({ type: 'thought', content });
                                                }
                                            }
                                        }
                                        return next;
                                    });
                                }
                            } catch (e) {}
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            setMessages(prev => {
                const next = [...prev];
                next[next.length - 1].parts.push({ type: 'text', content: '죄송합니다. 메시지 수신 중 오류가 발생했습니다.' });
                return next;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-50 bg-cyan-500 text-slate-900 p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-110 transition-transform duration-300 flex items-center gap-2 font-bold border border-white/10"
            >
                {isLocked ? <Lock size={24} /> : <MessageSquare size={24} />}
                <span className="hidden md:inline">Nura AI</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 z-50 w-[380px] md:w-[450px] h-[600px] bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 font-sans">
            {/* Header */}
            <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2 text-slate-100 font-sans font-semibold">
                    <Bot size={20} className="text-cyan-400" />
                    <span>Nura Assistant</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30 font-mono">INTELLIGENT</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={resetChat} title="대화 초기화" className="text-slate-400 hover:text-white transition-colors">
                        <RotateCcw size={16} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <Minimize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-black/20">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1 ${
                            msg.role === 'assistant' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                            {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                            {msg.parts.map((part, pIdx) => {
                                if (part.type === 'thought') {
                                    const isCompleted = part.content.startsWith('Completed:');
                                    const isFailed = part.content.startsWith('Failed:');
                                    
                                    return (
                                        <div key={pIdx} className={`bg-slate-800/60 border border-white/5 rounded-xl p-2.5 flex items-center gap-3 w-full animate-in fade-in slide-in-from-left-2 duration-300 ${isFailed ? 'border-red-500/30' : ''}`}>
                                            {isCompleted ? (
                                                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                                    <svg size={10} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-2.5 h-2.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                            ) : isFailed ? (
                                                <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                                                    <X size={10} />
                                                </div>
                                            ) : (
                                                <Loader2 size={12} className="animate-spin text-amber-400" />
                                            )}
                                            <span className={`text-[10px] font-mono truncate ${isFailed ? 'text-red-300/80' : 'text-slate-300'}`}>{part.content}</span>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={pIdx} className={`rounded-2xl p-4 text-sm font-outfit leading-relaxed shadow-sm ${
                                        msg.role === 'assistant' 
                                            ? 'bg-slate-800/50 text-slate-100 rounded-tl-none border border-white/5' 
                                            : 'bg-cyan-600 text-white rounded-tr-none font-medium'
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
                                                            className="rounded-lg !my-4 !bg-black/40 border border-white/5"
                                                            {...props}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighterAny>
                                                    ) : (
                                                        <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs" {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                },
                                                table: ({children}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-white/10 text-xs">{children}</table></div>,
                                                th: ({children}) => <th className="border border-white/10 bg-white/5 p-2 font-bold">{children}</th>,
                                                td: ({children}) => <td className="border border-white/10 p-2">{children}</td>,
                                                ul: ({children}) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>
                                            }}
                                        >
                                            {part.content}
                                        </ReactMarkdown>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1].parts.length === 0 && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                            <Bot size={16} />
                        </div>
                        <div className="bg-slate-800/50 border border-white/5 rounded-2xl rounded-tl-none p-4 flex items-center gap-1">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/5">
                {isLocked ? (
                    <div className="text-center py-2">
                        <p className="text-slate-400 text-xs mb-2">Apex 멤버십 전용 기능입니다.</p>
                        <a href="#pricing" onClick={() => setIsOpen(false)} className="text-cyan-400 text-xs font-bold hover:underline">멤버십 업그레이드</a>
                    </div>
                ) : (
                    <div className="relative">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="메시지를 입력하세요..."
                            className="w-full bg-black/40 text-white text-sm rounded-xl pl-4 pr-12 py-3 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-white/20 resize-none max-h-32 min-h-[46px] custom-scrollbar"
                            disabled={isLoading}
                            rows={1}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${
                                !inputValue.trim() || isLoading ? 'text-white/10' : 'text-cyan-400 hover:bg-cyan-500/10'
                            }`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
