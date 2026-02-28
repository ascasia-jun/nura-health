import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export const Philosophy: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Parallax background texture
        gsap.to('.parallax-bg', {
            scrollTrigger: {
                trigger: container.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
            y: 150,
            ease: 'none'
        });

        // Reveal text lines
        const mm = gsap.matchMedia();

        mm.add("(min-width: 768px)", () => {
            gsap.from('.philo-line', {
                scrollTrigger: {
                    trigger: container.current,
                    start: 'top 60%',
                    end: 'top 20%',
                    scrub: 1,
                },
                y: 100,
                opacity: 0,
                rotationX: -45,
                transformOrigin: "0% 50% -50",
                ease: 'power2.out',
                stagger: 0.2
            });
        });

        mm.add("(max-width: 767px)", () => {
            gsap.from('.philo-line', {
                scrollTrigger: {
                    trigger: container.current,
                    start: 'top 70%',
                },
                y: 30,
                opacity: 0,
                duration: 1,
                ease: 'power2.out',
                stagger: 0.2
            });
        });

        // Subtle Grid Animation
        gsap.to('.philo-grid', {
            backgroundPosition: '0px 30px',
            duration: 3,
            repeat: -1,
            ease: "none"
        });

        return () => mm.revert();
    }, { scope: container });

    return (
        <section
            id="philosophy"
            ref={container}
            className="relative w-full min-h-screen bg-transparent text-white flex items-center justify-center overflow-hidden py-32 px-6"
        >
            {/* Subtle Cybernetic Grid */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-30" style={{ perspective: '1000px' }}>
                <div 
                    className="philo-grid absolute -inset-[100%] w-[300%] h-[300%] bg-[linear-gradient(to_right,rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px] origin-center"
                    style={{
                        transform: 'rotateX(45deg) translateY(-100px)',
                    }}
                ></div>
            </div>

            {/* Background Gradient */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 via-cyan-950/10 to-slate-950"></div>

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col justify-center items-center text-center space-y-16 perspective-1000">
                <div className="space-y-4">
                    <p className="philo-line font-mono text-cyan-400 text-sm tracking-widest uppercase">The Paradigm Shift</p>
                    <div className="philo-line h-px w-24 bg-cyan-500/50 mx-auto"></div>
                </div>

                <div className="space-y-6 md:space-y-8 font-serif italic text-4xl md:text-5xl lg:text-7xl font-light leading-tight">
                    <p className="philo-line text-white/50">
                        현대 개발은 묻는다:<br />
                        <span className="font-sans font-medium text-white/40 text-xl md:text-3xl mt-2 block not-italic tracking-tight">"왜 비효율인가?"</span>
                    </p>

                    <div className="philo-line py-8">
                        <div className="w-1 h-12 bg-cyan-500/30 mx-auto rounded-full"></div>
                    </div>

                    <p className="philo-line text-white">
                        우리는 묻는다:<br />
                        <span className="font-sans font-bold text-cyan-400 text-2xl md:text-4xl mt-4 block not-italic tracking-tight">"어떻게 향상할까?"</span>
                    </p>
                </div>

                <div className="philo-line max-w-2xl mx-auto mt-16 text-slate-400 font-outfit text-lg md:text-xl font-light">
                    우리는 버그를 고치지 않습니다. 우리는 개발자의 워크플로를 최적화합니다. 지속적 AI 맞춤 콘텐츠로.
                </div>
            </div>
        </section>
    );
};
