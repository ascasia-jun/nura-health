import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Hero: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Simple and Stable Entrance
        gsap.fromTo('.hero-content', 
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 0.2 }
        );

        // Subtle Background Animation (No Flickering)
        gsap.to('.bg-glow', {
            scale: 1.1,
            duration: 10,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }, { scope: container });

    return (
        <section
            ref={container}
            className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-slate-950 select-none"
        >
            {/* Minimalist Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="bg-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)]"></div>
            </div>

            {/* Simple & Powerful Content */}
            <div className="hero-content relative z-10 text-center px-6 max-w-4xl opacity-0">
                <div className="mb-6">
                    <span className="text-cyan-500 font-mono text-[10px] font-bold tracking-[0.5em] uppercase opacity-70">
                        Autonomous Health Engine
                    </span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none mb-8">
                    NURA HEALTH
                </h1>

                <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed tracking-wide mb-12 max-w-2xl mx-auto">
                    복잡함을 걷어내고 <strong className="text-white font-medium">데이터 본연의 가치</strong>에 집중합니다. <br className="hidden md:block" />
                    실시간 AI 진단으로 프로젝트의 새로운 기준을 세우세요.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-6">
                    <a 
                        href="#tools" 
                        className="px-10 py-5 bg-white text-slate-950 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all duration-300 shadow-xl shadow-white/5"
                    >
                        Get Started
                    </a>
                    <button className="px-10 py-5 bg-transparent text-slate-300 border border-white/10 rounded-full font-semibold text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
                        Documentation
                    </button>
                </div>
            </div>

            {/* Static Telemetry Info */}
            <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-12 text-[9px] font-mono text-slate-600 uppercase tracking-[0.3em] opacity-50">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-cyan-500 rounded-full"></span>
                    System Online
                </div>
                <div>v1.2.0-Stable</div>
            </div>
        </section>
    );
};
