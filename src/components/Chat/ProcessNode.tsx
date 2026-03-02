import React from 'react';
import { Loader2, Check, X } from 'lucide-react';

interface Props {
    content: string;
    compact?: boolean; // 작게 표시할지 여부 (예: AICompanionChat에서 사용)
}

/**
 * AI의 도구 실행 상태나 사고 과정을 CLI 스타일의 노드로 표시합니다.
 * @param content 표시할 텍스트 (예: 'Reading directory...', 'Completed: list_files')
 * @param compact 컴팩트 모드 여부
 */
export const ProcessNode: React.FC<Props> = ({ content, compact = false }) => {
    const isCompleted = content.startsWith('Completed:');
    const isFailed = content.startsWith('Failed:');

    // 일반 모드 (ChatOpsPage용)
    if (!compact) {
        return (
            <div className={`bg-slate-900/60 border border-white/5 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300 ${isFailed ? 'border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : ''}`}>
                <div className="shrink-0">
                    {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                            <Check size={12} strokeWidth={3} />
                        </div>
                    ) : isFailed ? (
                        <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                            <X size={12} strokeWidth={3} />
                        </div>
                    ) : (
                        <Loader2 size={14} className="animate-spin text-amber-400" />
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] font-mono uppercase tracking-tighter leading-none mb-1 ${isFailed ? 'text-red-500/70' : 'text-slate-500'}`}>
                        Process Node
                    </span>
                    <span className={`text-xs font-mono truncate ${isFailed ? 'text-red-300/80' : 'text-slate-300'}`}>
                        {content}
                    </span>
                </div>
            </div>
        );
    }

    // 컴팩트 모드 (AICompanionChat용)
    return (
        <div className={`bg-slate-800/60 border border-white/5 rounded-xl p-2.5 flex items-center gap-3 w-full animate-in fade-in slide-in-from-left-2 duration-300 ${isFailed ? 'border-red-500/30' : ''}`}>
            {isCompleted ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Check size={10} strokeWidth={3} />
                </div>
            ) : isFailed ? (
                <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                    <X size={10} strokeWidth={3} />
                </div>
            ) : (
                <Loader2 size={12} className="animate-spin text-amber-400" />
            )}
            <span className={`text-[10px] font-mono truncate ${isFailed ? 'text-red-300/80' : 'text-slate-300'}`}>
                {content}
            </span>
        </div>
    );
};
