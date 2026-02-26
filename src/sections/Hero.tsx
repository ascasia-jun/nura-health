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
    }, { scope: container });

    return (
        <section
            ref={container}
            className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-charcoal"
        >
            {/* Background Image Setup */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-luminosity scale-105"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop")' }}
            ></div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 z-1 bg-gradient-to-b from-[var(--color-charcoal)]/30 via-transparent to-[var(--color-charcoal)]"></div>
            <div className="absolute inset-0 z-1 bg-gradient-to-t from-[var(--color-moss)]/20 to-transparent mix-blend-overlay"></div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 flex flex-col items-center">
                <h1 className="flex flex-col md:flex-row items-center gap-4 text-5xl md:text-7xl lg:text-8xl tracking-tight">
                    <span className="hero-text font-sans font-bold text-white">자연이</span>
                    <span className="hero-text font-serif italic font-light text-[var(--color-moss)]">알고리즘이다.</span>
                </h1>
                <p className="hero-text mt-8 max-w-xl text-lg md:text-xl text-white/80 font-outfit font-light">
                    Biological precision meets computational excellence.<br />
                    Next-generation health protocols.
                </p>
            </div>
        </section>
    );
};
