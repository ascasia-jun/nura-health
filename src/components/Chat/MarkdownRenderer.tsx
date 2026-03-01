import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SyntaxHighlighterAny = SyntaxHighlighter as any;

interface Props {
    content: string;
    className?: string;
}

/**
 * 마크다운 콘텐츠를 렌더링하며 코드 하이라이팅을 지원합니다.
 * @param content 렌더링할 마크다운 문자열
 * @param className 추가 스타일 클래스
 */
export const MarkdownRenderer: React.FC<Props> = ({ content, className }) => {
    return (
        <div className={className}>
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
                h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-white/10">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-bold text-cyan-400 mt-6 mb-3">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-semibold text-slate-100 mt-4 mb-2">{children}</h3>,
                p: ({children}) => <p className="mb-4 last:mb-0 text-slate-300">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-400">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-400">{children}</ol>,
                li: ({children}) => <li className="hover:text-slate-200 transition-colors">{children}</li>,
                table: ({children}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-white/10 text-xs">{children}</table></div>,
                th: ({children}) => <th className="border border-white/10 bg-white/5 p-2 font-bold">{children}</th>,
                td: ({children}) => <td className="border border-white/10 p-2">{children}</td>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-500 bg-white/5 p-4 rounded-r-lg italic my-4">{children}</blockquote>
            }}
        >
            {content}
        </ReactMarkdown>
        </div>
    );
};
