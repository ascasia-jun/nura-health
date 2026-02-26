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

        return () => mm.revert();
    }, { scope: container });

    return (
        <section
            id="philosophy"
            ref={container}
            className="relative w-full min-h-screen bg-charcoal text-white flex items-center justify-center overflow-hidden py-32 px-6"
        >
            {/* Background Parallax Image */}
            <div
                className="parallax-bg absolute inset-0 z-0 opacity-20 mix-blend-screen scale-125"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1927&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-charcoal via-transparent to-charcoal"></div>

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col justify-center items-center text-center space-y-16 perspective-1000">
                <div className="space-y-4">
                    <p className="philo-line font-mono text-moss text-sm tracking-widest uppercase">The Paradigm Shift</p>
                    <div className="philo-line h-px w-24 bg-moss/50 mx-auto"></div>
                </div>

                <div className="space-y-6 md:space-y-8 font-serif italic text-4xl md:text-5xl lg:text-7xl font-light leading-tight">
                    <p className="philo-line text-white/50">
                        현대 의학은 묻는다:<br />
                        <span className="font-sans font-medium text-white/40 text-xl md:text-3xl mt-2 block not-italic tracking-tight">"무엇이 잘못되었는가?"</span>
                    </p>

                    <div className="philo-line py-8">
                        <div className="w-1 h-12 bg-moss/30 mx-auto rounded-full"></div>
                    </div>

                    <p className="philo-line text-white">
                        우리는 묻는다:<br />
                        <span className="font-sans font-bold text-moss text-2xl md:text-4xl mt-4 block not-italic tracking-tight">"무엇이 최적인가?"</span>
                    </p>
                </div>

                <div className="philo-line max-w-2xl mx-auto mt-16 text-clay font-outfit text-lg md:text-xl font-light">
                    We don't just treat symptoms. We optimize the underlying biological architecture, merging elite medical protocols with continuous telemetry.
                </div>
            </div>
        </section>
    );
};
