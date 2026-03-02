import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Minimize2, Bot, User, Lock, RotateCcw, Loader2, X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { API_ENDPOINTS } from '../config';
import { CHAT_MODULE_LOADED } from '../types/chat';
import type { ChatPart, Message } from '../types/chat';
import { MarkdownRenderer } from './Chat/MarkdownRenderer';
import { ProcessNode } from './Chat/ProcessNode';

// 모듈 로드 보장
if (!CHAT_MODULE_LOADED) console.warn('Chat types module not loaded properly');

/**
 * 랜딩 페이지에서 제공되는 소형 AI 어시스턴트 위젯입니다.
 */
export const AICompanionChat: React.FC = () => {
    const { tier } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: 'initial',
            role: 'assistant', 
            parts: [{ type: 'text', content: '안녕하세요! RepoInsight AI 시스템 아키텍트입니다. Git 리포지토리의 수명 주기 전반에 걸친 지능형 분석과 최적화 솔루션을 제공해 드립니다.' }],
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isProcessingRef = useRef<boolean>(false);

    // Apex 등급 사용자만 사용 가능
    const isLocked = tier !== 'Apex';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    /** 대화 내역을 초기화합니다. */
    const resetChat = () => {
        setMessages([{ 
            id: 'reset',
            role: 'assistant', 
            parts: [{ type: 'text', content: '대화가 초기화되었습니다. 무엇을 도와드릴까요?' }],
            timestamp: new Date()
        }]);
    };

    /** AI에게 메시지를 전송하고 스트리밍 응답을 수신합니다. */
    const handleSendMessage = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || isLoading || isProcessingRef.current) return;

        try {
            isProcessingRef.current = true;
            setInputValue('');
            
            const userMsg: Message = {
                id: Date.now().toString(),
                role: 'user',
                parts: [{ type: 'text', content: trimmed }],
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

            // 히스토리 구성 (최근 10턴, parts 널 체크 강화)
            let history = messages
                .filter(m => (m.parts || []).some(p => p.type === 'text' && p.content.trim() !== ''))
                .slice(-10)
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: (msg.parts || []).filter(p => p.type === 'text').map(p => ({ text: p.content }))
                }));

            if (history.length > 0 && history[0].role === 'model') history.shift();

            const response = await fetch(API_ENDPOINTS.CHAT_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, history }),
            });

            if (!response.ok) throw new Error('스트리밍 요청 실패');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let lineBuffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    lineBuffer += decoder.decode(value, { stream: true });
                    const lines = lineBuffer.split('\n');
                    lineBuffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
                        const rawData = trimmedLine.slice(6);
                        if (rawData === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(rawData);
                            if (parsed.done) break;

                            const type = parsed.type === 'answer' ? 'text' : 'thought';
                            const content = parsed.type === 'answer' ? parsed.text : parsed.content;

                            setMessages(prev => {
                                const next = [...prev];
                                const last = next[next.length - 1];
                                if (last && last.role === 'assistant') {
                                    if (!last.parts) last.parts = [];
                                    if (type === 'text') {
                                        const lastPart = last.parts[last.parts.length - 1];
                                        if (lastPart && lastPart.type === 'text') {
                                            if (!lastPart.content.endsWith(content)) lastPart.content += content;
                                        } else {
                                            last.parts.push({ type: 'text', content });
                                        }
                                    } else {
                                        // [지능형 갱신] 역순 탐색하여 완료되지 않은 가장 최근의 thought 파트 찾기
                                        const targetPart = [...last.parts].reverse().find(p => 
                                            p.type === 'thought' && 
                                            !p.content?.startsWith('Completed:') && 
                                            !p.content?.startsWith('Failed:')
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
                        } catch (e) {}
                    }
                }
            }
        } catch (error) {
            console.error('[AICompanionChat] 오류:', error);
        } finally {
            isProcessingRef.current = false;
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-50 bg-cyan-500 text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-110 transition-transform duration-300 flex items-center gap-2 font-bold border border-white/10"
            >
                {isLocked ? <Lock size={24} /> : <MessageSquare size={24} />}
                <span className="hidden md:inline">RepoInsight AI</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 z-50 w-[380px] md:w-[450px] h-[600px] bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 font-sans">
            {/* 헤더 */}
            <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2 text-slate-100 font-sans font-semibold">
                    <Bot size={20} className="text-cyan-400" />
                    <span>RepoInsight Assistant</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30 font-mono uppercase tracking-tighter">Intelligent</span>
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

            {/* 대화 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-black/20">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.role === 'assistant' && (msg.parts?.length || 0) > 0 && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                                <Bot size={16} />
                            </div>
                        )}
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1 bg-white/5 text-slate-400 border-white/10">
                                <User size={16} />
                            </div>
                        )}
                        <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                            {msg.parts?.map((part, pIdx) => (
                                part.type === 'thought' 
                                    ? <ProcessNode key={pIdx} content={part.content} compact />
                                    : <div key={pIdx} className={`rounded-2xl p-4 text-sm font-outfit leading-relaxed shadow-sm ${msg.role === 'assistant' ? 'bg-slate-800/50 text-slate-100 rounded-tl-none border border-white/5' : 'bg-cyan-600 text-white rounded-tr-none font-medium'}`}>
                                        <MarkdownRenderer content={part.content} />
                                      </div>
                            ))}
                        </div>
                    </div>
                ))}
                
                {isLoading && (messages[messages.length - 1]?.parts || []).length === 0 && (
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

            {/* 입력 영역 */}
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
                        <button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${!inputValue.trim() || isLoading ? 'text-white/10' : 'text-cyan-400 hover:bg-cyan-500/10'}`}>
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
