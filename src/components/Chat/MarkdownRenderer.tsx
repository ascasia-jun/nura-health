import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean; // [v3.4] 기본 접힘 상태 지원
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, collapsible = false, defaultCollapsed = false }) => {
    // defaultCollapsed 속성을 초기값으로 사용
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed && collapsible);
    const [copied, setCopied] = useState(false);

    // 외부에서 content가 바뀌거나 강제로 상태가 변할 때 대응 (필요 시)
    useEffect(() => {
        if (defaultCollapsed && collapsible) {
            setIsCollapsed(true);
        }
    }, [defaultCollapsed, collapsible]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (collapsible && isCollapsed) {
        return (
            <div className="group relative">
                <button 
                    onClick={() => setIsCollapsed(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >
                    <ChevronDown size={14} />
                    Show Intermediate Analysis Result
                </button>
            </div>
        );
    }

    return (
        <div className="relative group/md">
            {collapsible && (
                <button 
                    onClick={() => setIsCollapsed(true)}
                    className="absolute -top-4 -right-4 z-10 p-1.5 bg-slate-800 border border-white/10 rounded-lg text-slate-500 hover:text-white transition-all opacity-0 group-hover/md:opacity-100 shadow-xl"
                    title="접기"
                >
                    <ChevronUp size={14} />
                </button>
            )}
            
            <div className="markdown-body prose prose-invert prose-slate max-w-none text-sm md:text-base leading-relaxed">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeValue = String(children).replace(/\n$/, '');
                            
                            return !inline && match ? (
                                <div className="relative my-6 rounded-xl overflow-hidden border border-white/10 shadow-2xl group/code">
                                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <FileText size={12} className="text-cyan-400" />
                                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{match[1]}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleCopy(codeValue)}
                                            className="text-slate-500 hover:text-white transition-colors"
                                        >
                                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <SyntaxHighlighter
                                        style={vscDarkPlus as any}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{
                                            margin: 0,
                                            padding: '1.5rem',
                                            backgroundColor: '#0f172a',
                                            fontSize: '0.85rem',
                                            lineHeight: '1.6'
                                        }}
                                        {...props}
                                    >
                                        {codeValue}
                                    </SyntaxHighlighter>
                                </div>
                            ) : (
                                <code className={`${className} bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[0.9em] border border-white/5`} {...props}>
                                    {children}
                                </code>
                            );
                        },
                        // 테이블 스타일링 강화
                        table: ({children}) => (
                            <div className="overflow-x-auto my-8 rounded-xl border border-white/10 shadow-lg">
                                <table className="w-full text-left border-collapse bg-slate-900/50">{children}</table>
                            </div>
                        ),
                        th: ({children}) => <th className="px-4 py-3 bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/10">{children}</th>,
                        td: ({children}) => <td className="px-4 py-3 border-b border-white/5 text-sm text-slate-300">{children}</td>,
                        // 리스트 스타일링
                        ul: ({children}) => <ul className="list-disc list-outside ml-6 space-y-2 my-4 text-slate-300">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-outside ml-6 space-y-2 my-4 text-slate-300">{children}</ol>,
                        // 구분선
                        hr: () => <hr className="my-12 border-t-2 border-dashed border-white/5" />
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
};
