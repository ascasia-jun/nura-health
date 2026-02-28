import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Minimize2, Bot, User, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';

// 채팅 메시지 인터페이스
interface Message {
    role: 'user' | 'ai';
    content: string;
}

// AI 챗봇 컴포넌트
export const AICompanionChat: React.FC = () => {
    const { tier, isLoggedIn } = useUser(); // 전역 사용자 상태에서 멤버십 등급 가져오기
    const [isOpen, setIsOpen] = useState(false); // 채팅창 열림/닫힘 상태
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: '안녕하세요. AI 개발 어시스턴트입니다. 프로젝트 최적화에 대해 무엇이든 물어보세요.' }
    ]);
    const [inputValue, setInputValue] = useState(''); // 입력 필드 상태
    const [isLoading, setIsLoading] = useState(false); // API 요청 로딩 상태
    const messagesEndRef = useRef<HTMLDivElement>(null); // 스크롤 자동 이동을 위한 ref

    // Apex 등급이 아니면 기능 잠금
    const isLocked = tier !== 'Apex';

    // 새 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // 로그인 감지하여 채팅창 열기 및 환영 메시지 (ChatOps)
    useEffect(() => {
        if (isLoggedIn && tier === 'Apex') {
            setIsOpen(true);
            setMessages(prev => [
                ...prev, 
                { role: 'ai', content: '시스템 접속이 확인되었습니다. ChatOps 모드가 활성화되었습니다.\n\n[가능한 작업]\n1. 프로젝트 성능 진단\n2. 코드 리팩토링 제안\n3. 실시간 에러 로그 분석\n\n무엇을 도와드릴까요?' }
            ]);
        }
    }, [isLoggedIn, tier]);

    // 메시지 전송 핸들러
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue.trim();
        setInputValue('');
        // 사용자 메시지 추가
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // 백엔드 API 호출
            const res = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
            });

            if (!res.ok) throw new Error('Network response was not ok');

            const data = await res.json();
            // AI 응답 메시지 추가
            setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'ai', content: '죄송합니다. 일시적인 오류가 발생했습니다.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // 엔터 키 입력 시 전송
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 닫혀있을 때 플로팅 버튼 렌더링
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-50 bg-cyan-500 text-slate-900 p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-110 transition-transform duration-300 flex items-center gap-2 font-bold border border-white/10"
            >
                {isLocked ? <Lock size={24} /> : <MessageSquare size={24} />}
                <span className="hidden md:inline">AI Assistant</span>
            </button>
        );
    }

    // 열려있을 때 채팅창 렌더링
    return (
        <div className="fixed bottom-8 right-8 z-50 w-[350px] md:w-[400px] h-[500px] bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            {/* 헤더 영역 */}
            <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2 text-slate-100 font-sans font-semibold">
                    <Bot size={20} className="text-cyan-400" />
                    <span>AI Development Companion</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <button onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                        <Minimize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            {/* 메시지 목록 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            msg.role === 'ai' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-slate-400'
                        }`}>
                            {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl p-3 text-sm font-outfit leading-relaxed ${
                            msg.role === 'ai' 
                                ? 'bg-white/5 text-slate-100 rounded-tl-none border border-white/5' 
                                : 'bg-cyan-600 text-white rounded-tr-none font-medium'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 flex items-center gap-1">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {/* 입력 영역 */}
            <div className="p-4 bg-white/5 border-t border-white/5">
                {isLocked ? (
                    <div className="text-center py-2">
                        <p className="text-slate-400 text-xs mb-2">Apex 멤버십 전용 기능입니다.</p>
                        <a href="#pricing" onClick={() => setIsOpen(false)} className="text-cyan-400 text-xs font-bold hover:underline">멤버십 업그레이드</a>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="AI에게 질문하기..."
                            className="w-full bg-black/40 text-white text-sm rounded-xl pl-4 pr-12 py-3 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-white/20"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-white disabled:text-white/10 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};