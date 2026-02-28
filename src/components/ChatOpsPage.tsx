import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, LogOut, Sparkles, Code, Terminal, MessageSquare, Plus, Settings } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Typewriter = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                setDisplayedText((prev) => prev + text.charAt(index));
                index++;
            } else {
                setIsTyping(false);
                clearInterval(interval);
            }
        }, 15);
        return () => clearInterval(interval);
    }, [text]);

    return (
        <div className="whitespace-pre-wrap">
            {displayedText}
            {isTyping && <span className="animate-pulse text-cyan-500">▍</span>}
        </div>
    );
};

export const ChatOpsPage: React.FC = () => {
    const { logout } = useUser();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
        { role: 'ai', content: 'ChatOps 시스템이 활성화되었습니다.\n프로젝트 상태를 실시간으로 분석하고 제어할 수 있습니다. 무엇을 도와드릴까요?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

        try {
             const res = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
            });

            if (!res.ok) throw new Error('Network response was not ok');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: '시스템 오류가 발생했습니다.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col hidden md:flex">
                <div className="p-6 flex items-center gap-3 border-b border-white/5">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        <Bot size={20} />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-100">Nura ChatOps</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-sm font-medium mb-6">
                        <Plus size={16} />
                        <span>New Session</span>
                    </button>

                    <div className="px-2 text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Recent Activity</div>
                    {['Project Alpha Optimization', 'Memory Leak Analysis', 'Docker Build Fix', 'API Latency Check'].map((item, i) => (
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
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-1 border border-cyan-500/30">
                                    <Sparkles size={16} />
                                </div>
                            )}
                            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-6 text-sm md:text-base leading-relaxed shadow-lg ${
                                msg.role === 'user' 
                                    ? 'bg-cyan-600 text-white rounded-tr-none' 
                                    : 'bg-slate-800/50 text-slate-200 border border-white/10 rounded-tl-none backdrop-blur-sm'
                            }`}>
                                {msg.role === 'ai' ? (
                                    <Typewriter text={msg.content} />
                                ) : (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 max-w-3xl mx-auto">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                                <Sparkles size={16} />
                            </div>
                            <div className="bg-slate-800/50 border border-white/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-1">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl border-t border-white/5">
                    <div className="max-w-3xl mx-auto relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="AI에게 명령을 입력하세요 (예: 성능 진단 실행, 코드 리뷰...)"
                            className="w-full bg-slate-800/50 text-slate-100 rounded-2xl pl-6 pr-14 py-4 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-500 shadow-inner"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-cyan-500 text-slate-900 rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="max-w-3xl mx-auto mt-3 flex justify-center gap-6 text-xs text-slate-500 font-mono opacity-70">
                        <span className="flex items-center gap-1.5"><Terminal size={12} /> Ready to execute</span>
                        <span className="flex items-center gap-1.5"><Code size={12} /> Context loaded</span>
                    </div>
                </div>
            </main>
        </div>
    );
};