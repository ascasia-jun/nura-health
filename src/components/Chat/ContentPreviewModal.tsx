import React, { useEffect, useRef } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import gsap from 'gsap';

interface ContentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    isLoading?: boolean;
}

/**
 * 스킬 지침이나 프로젝트 문서 내용을 보여주는 미리보기 모달입니다.
 */
export const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({ isOpen, onClose, title, content, isLoading = false }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            gsap.fromTo(modalRef.current, 
                { opacity: 0, scale: 0.95, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power3.out' }
            );
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div 
                ref={modalRef}
                className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                            <FileText size={20} className="text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">{title}</h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Content Preview</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Body */}
                <div ref={contentRef} className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-black/20">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 size={32} className="animate-spin text-cyan-500" />
                            <p className="text-sm text-slate-500 font-mono animate-pulse">Fetching content from system...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <MarkdownRenderer content={content} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-slate-950/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-sm font-bold transition-all"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};

const Loader2 = ({ size, className }: { size: number, className: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
