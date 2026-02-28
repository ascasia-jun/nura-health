import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export const Hero: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from('.hero-text', {
            y: 50,
            opacity: 0,
            duration: 1.2,
            stagger: 0.2,
            ease: 'power3.out',
            delay: 0.2
        });

        // Grid Animation
        gsap.to('.cyber-grid', {
            backgroundPosition: '0px 50px',
            duration: 3,
            repeat: -1,
            ease: "none"
        });
    }, { scope: container });

    return (
        <section
            ref={container}
            className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-transparent"
        >
            {/* Cybernetic Grid */}
            <div className="absolute inset-0 z-0 overflow-hidden" style={{ perspective: '1000px' }}>
                <div 
                    className="cyber-grid absolute -inset-[100%] w-[300%] h-[300%] bg-[linear-gradient(to_right,rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px] origin-center"
                    style={{
                        transform: 'rotateX(60deg) translateY(-200px)',
                        maskImage: 'linear-gradient(to bottom, black 0%, black 100%)'
                    }}
                ></div>
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950"></div>
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 flex flex-col items-center">
                <h1 className="flex flex-col md:flex-row items-center gap-4 text-5xl md:text-7xl lg:text-8xl tracking-tight">
                    <span className="hero-text font-sans font-bold text-slate-100">AI로</span>
                    <span className="hero-text font-serif italic font-light text-cyan-400">개발자의 삶을 재정의한다.</span>
                </h1>
                <p className="hero-text mt-8 max-w-xl text-lg md:text-xl text-white/80 font-outfit font-light">
                    AI-DLC로 매일 새로운 기능을 즉시 적용하여 개발 생산성을 극대화하세요.
                </p>
            </div>
        </section>
    );
};
