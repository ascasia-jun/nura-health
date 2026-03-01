import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface Props {
    role?: 'assistant';
    variant?: 'dots' | 'circles';
}

/**
 * AI가 응답을 생성 중일 때 표시되는 로딩 애니메이션 컴포넌트입니다.
 */
export const ChatLoader: React.FC<Props> = ({ role = 'assistant', variant = 'dots' }) => {
    return (
        <div className="flex gap-4 max-w-4xl mx-auto">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-lg ${
                role === 'assistant' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-cyan-500/5' : 'bg-white/5 text-slate-400 border-white/10'
            }`}>
                {role === 'assistant' ? <Bot size={20} /> : <Sparkles size={20} />}
            </div>
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl rounded-tl-none p-6 flex items-center gap-1.5 backdrop-blur-sm">
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
        </div>
    );
};
