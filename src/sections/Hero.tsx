import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Hero: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);
    const textGroupRef = useRef<HTMLDivElement>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ 
            defaults: { ease: 'power3.out' } 
        });

        // 1. Initial State Setup (Double Protection with autoAlpha)
        gsap.set(['.reveal-text', '.grid-container'], { autoAlpha: 0 });
        gsap.set('.reveal-text', { y: 30, filter: 'blur(10px)', scale: 0.98 });

        // 2. Coordinated Entrance Sequence
        tl.to('.grid-container', { 
            autoAlpha: 1, 
            duration: 1.5 
        })
        .to('.reveal-text', {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            scale: 1,
            duration: 1.2,
            stagger: 0.15,
        }, '-=0.8');

        // 3. Infinite Grid Motion (Subtle & High-end)
        gsap.to('.cyber-grid', {
            backgroundPosition: '0px 64px',
            duration: 2.5,
            repeat: -1,
            ease: 'none'
        });

        // 4. Mouse Parallax (Optimized)
        const xTo = gsap.quickTo(textGroupRef.current, 'x', { duration: 0.8, ease: 'power3' });
        const yTo = gsap.quickTo(textGroupRef.current, 'y', { duration: 0.8, ease: 'power3' });
        const gxTo = gsap.quickTo(gridContainerRef.current, 'x', { duration: 1.2, ease: 'power3' });
        const gyTo = gsap.quickTo(gridContainerRef.current, 'y', { duration: 1.2, ease: 'power3' });

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const xPercent = (clientX / window.innerWidth - 0.5);
            const yPercent = (clientY / window.innerHeight - 0.5);

            xTo(xPercent * 20);
            yTo(yPercent * 20);
            gxTo(xPercent * -40);
            gyTo(yPercent * -40);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, { scope: container });

    return (
        <section
            ref={container}
            className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-transparent select-none"
        >
            {/* 3D Cyber Grid Layer (Refined) */}
            <div ref={gridContainerRef} className="grid-container absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ perspective: '1500px' }}>
                <div 
                    className="cyber-grid absolute -inset-[100%] w-[300%] h-[300%] bg-[linear-gradient(to_right,rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:64px_64px] origin-center"
                    style={{
                        transform: 'rotateX(60deg) translateY(-5%)',
                        maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
                    }}
                ></div>
            </div>

            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 opacity-90"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Main Content (Refined Typography) */}
            <div ref={textGroupRef} className="relative z-10 text-center px-6 flex flex-col items-center max-w-6xl">
                <div className="reveal-text mb-8">
                    <span className="px-5 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 font-mono text-[10px] font-bold tracking-[0.3em] uppercase backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        Autonomous AI Evolution
                    </span>
                </div>
                
                <h1 className="reveal-text flex flex-col items-center gap-4 text-7xl md:text-9xl tracking-tighter leading-[0.85]">
                    <span className="font-sans font-black text-white mix-blend-plus-lighter">
                        NURA
                    </span>
                    <span className="font-serif italic font-thin text-cyan-400 bg-clip-text text-transparent bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600">
                        Health Engine
                    </span>
                </h1>

                <div className="reveal-text mt-14 space-y-10 flex flex-col items-center">
                    <p className="max-w-2xl text-lg md:text-xl text-slate-400 font-outfit font-extralight leading-relaxed tracking-wide">
                        데이터는 살아있어야 합니다. <br className="hidden md:block" />
                        실시간으로 진화하는 <strong className="text-cyan-400/80 font-normal">AI-DLC</strong> 프로토콜로 개발의 한계를 넘으세요.
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-8 pt-6">
                        <a href="#tools" className="px-10 py-5 bg-cyan-500 text-slate-950 rounded-full font-sans font-bold text-xs uppercase tracking-widest hover:bg-white transition-all duration-700 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-white/20">
                            Launch Protocol
                        </a>
                        <button className="px-10 py-5 bg-white/5 text-slate-300 border border-white/10 rounded-full font-sans font-semibold text-xs uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-xl group">
                            Explore Guide <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Aesthetic Telemetry Bar */}
            <div className="reveal-text absolute bottom-10 inset-x-0 flex justify-center items-center gap-16 text-[9px] font-mono text-slate-700 uppercase tracking-[0.4em] opacity-40">
                <div className="flex items-center gap-3"><div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse"></div> Link Active</div>
                <div className="hidden sm:block">Sync: 100%</div>
                <div className="hidden sm:block">Env: Production-Ready</div>
            </div>
        </section>
    );
};
