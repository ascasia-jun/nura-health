import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Sparkles, Terminal, Shield, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const Hero: React.FC<{ onStartClick: () => void }> = ({ onStartClick }) => {
    const heroRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const badgeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(badgeRef.current, {
                y: -20,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            });

            gsap.from(titleRef.current?.children || [], {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: 'power4.out',
                delay: 0.2
            });

            gsap.from('.hero-stats > div', {
                scale: 0.8,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'back.out(1.7)',
                delay: 0.8
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <Sparkles size={14} className="animate-pulse" />
                    AI-Powered Dev Lifecycle Intelligence
                </div>

                <h1 ref={titleRef} className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-none">
                    <span className="block text-white">RETAINS CODE</span>
                    <span className="block bg-gradient-to-r from-cyan-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x text-shadow-glow">REPOINSIGHT</span>
                </h1>

                <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed font-light">
                    Git 기반 리포지토리를 대상으로 <span className="text-cyan-400 font-medium">보안 취약점 · 코드 품질 · 기술부채 · 진척도 · 리스크</span>를 
                    종합 진단하는 AI 기반 지능형 플랫폼입니다. 개발 생명주기의 모든 단계를 데이터로 시각화하고 최적화하세요.
                </p>

                <div className="flex flex-wrap justify-center gap-4 mb-20">
                    <button 
                        onClick={onStartClick}
                        className="group relative px-10 py-5 bg-cyan-500 text-slate-950 rounded-2xl font-black text-xl hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(6,182,212,0.4)] flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        <span>Get Started with RepoInsight</span>
                        <Zap size={20} fill="currentColor" />
                    </button>
                </div>

                {/* Core Diagnostic Metrics */}
                <div className="hero-stats grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
                    {[
                        { icon: <Shield size={18} />, label: 'Security', val: 'Audit' },
                        { icon: <Zap size={18} />, label: 'Quality', val: 'Clean' },
                        { icon: <AlertTriangle size={18} />, label: 'Debt', val: 'Manage' },
                        { icon: <TrendingUp size={18} />, label: 'Progress', val: 'Track' },
                        { icon: <Terminal size={18} />, label: 'Risk', val: 'Analyze' },
                    ].map((stat, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-cyan-500/30 transition-colors group">
                            <div className="text-cyan-400 mb-3 flex justify-center group-hover:scale-110 transition-transform">{stat.icon}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{stat.label}</div>
                            <div className="text-white font-mono font-bold">{stat.val}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
