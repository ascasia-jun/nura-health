import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Minimize2, Bot, User, Lock, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useUser } from '../context/UserContext';
import { API_ENDPOINTS } from '../config';

// 채팅 메시지 인터페이스
interface Message {
    role: 'user' | 'ai';
    content: string;
}

// AI 챗봇 컴포넌트 (Open WebUI 스타일 고도화 버전)
export const AICompanionChat: React.FC = () => {
    const { tier, isLoggedIn } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: '안녕하세요! Nura AI 시스템 아키텍트입니다. 프로젝트의 기술적 난제를 해결하고 최적화 프로토콜을 제안해드릴 준비가 되었습니다.' }
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
        setMessages([{ role: 'ai', content: '대화가 초기화되었습니다. 무엇을 도와드릴까요?' }]);
    };

    // 스트리밍 메시지 전송 핸들러
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue.trim();
        setInputValue('');
        
        // 1. 사용자 메시지 추가
        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        // 2. AI 응답을 위한 빈 메시지 추가 (스트리밍 누적용)
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

            const response = await fetch(API_ENDPOINTS.CHAT_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history }),
            });

            if (!response.ok) throw new Error('스트리밍 요청 실패');

            const reader = response.body?.getReader();
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
                                    // 실시간 UI 업데이트
                                    setMessages(prev => {
                                        const last = prev[prev.length - 1];
                                        return [...prev.slice(0, -1), { ...last, content: accumulatedContent }];
                                    });
                                }
                            } catch (e) {
                                // JSON 파싱 에러 무시 (불완전한 청크 대비)
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: '죄송합니다. 메시지 수신 중 오류가 발생했습니다.' }]);
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
        <div className="fixed bottom-8 right-8 z-50 w-[380px] md:w-[450px] h-[600px] bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2 text-slate-100 font-sans font-semibold">
                    <Bot size={20} className="text-cyan-400" />
                    <span>Nura Assistant</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30 font-mono">LIVE</span>
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                            msg.role === 'ai' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                            {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-outfit leading-relaxed shadow-sm ${
                            msg.role === 'ai' 
                                ? 'bg-slate-800/50 text-slate-100 rounded-tl-none border border-white/5' 
                                : 'bg-cyan-600 text-white rounded-tr-none font-medium'
                        }`}>
                            {msg.role === 'ai' ? (
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
                                                    className="rounded-lg !my-4 !bg-black/40 border border-white/5"
                                                    {...props}
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
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
                                    {msg.content}
                                </ReactMarkdown>
                            ) : (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1].content === '' && (
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
