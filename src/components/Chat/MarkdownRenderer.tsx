import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SyntaxHighlighterAny = SyntaxHighlighter as any;

interface Props {
    content: string;
    className?: string;
    collapsible?: boolean; // 접기 기능 활성화 여부
}

/**
 * 마크다운 콘텐츠를 렌더링하며 코드 하이라이팅 및 접기 기능을 지원합니다.
 */
export const MarkdownRenderer: React.FC<Props> = ({ content, className, collapsible = false }) => {
    const [isExpanded, setIsExpanded] = useState(!collapsible);
    
    // 내용이 너무 짧으면 접기 기능 무시
    const shouldShowCollapse = collapsible && content.length > 300;

    return (
        <div className={className}>
            <div className={`relative transition-all duration-500 ease-in-out overflow-hidden ${(!isExpanded && shouldShowCollapse) ? 'max-h-32' : 'max-h-[5000px]'}`}>
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
                                    className="rounded-xl !my-6 !bg-black/60 border border-white/10 shadow-2xl custom-scrollbar"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighterAny>
                            ) : (
                                <code className="bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-sm" {...props}>
                                    {children}
                                </code>
                            )
                        },
                        h1: ({children}) => <h1 className="text-xl font-bold text-white mb-3 pb-1 border-b border-white/10">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-bold text-cyan-400 mt-4 mb-2">{children}</h2>,
                        p: ({children}) => <p className="mb-3 last:mb-0 text-slate-300 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-400">{children}</ul>,
                        li: ({children}) => <li className="hover:text-slate-200 transition-colors">{children}</li>,
                        table: ({children}) => <div className="overflow-x-auto my-4"><table className="min-w-full border border-white/10 text-xs">{children}</table></div>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-500 bg-white/5 p-3 rounded-r-lg italic my-3">{children}</blockquote>
                    }}
                >
                    {content}
                </ReactMarkdown>

                {/* 하단 페이드 아웃 효과 (접혔을 때만) */}
                {!isExpanded && shouldShowCollapse && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />
                )}
            </div>

            {shouldShowCollapse && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20"
                >
                    {isExpanded ? (
                        <>Collapse Content <ChevronUp size={12} /></>
                    ) : (
                        <>Expand Full Report <ChevronDown size={12} /></>
                    )}
                </button>
            )}
        </div>
    );
};
