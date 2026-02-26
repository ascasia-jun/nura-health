import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export const Protocols: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const cards = gsap.utils.toArray('.protocol-card') as HTMLElement[];

        cards.forEach((card, i) => {
            if (i < cards.length - 1) {
                gsap.to(card, {
                    scale: 0.9,
                    opacity: 0.3,
                    filter: 'blur(10px)',
                    scrollTrigger: {
                        trigger: card,
                        start: "top top",
                        end: "bottom top",
                        scrub: true,
                        pin: true,
                        pinSpacing: false,
                    }
                });
            } else {
                // Last card just pins
                ScrollTrigger.create({
                    trigger: card,
                    start: "top top",
                    end: "+=100%",
                    pin: true,
                });
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, { scope: container });

    return (
        <div ref={container} id="protocols" className="relative w-full bg-charcoal">
            <Card1 />
            <Card2 />
            <Card3 />
        </div>
    );
};

const Card1 = () => (
    <section className="protocol-card h-screen w-full sticky top-0 bg-[#161816] flex flex-col md:flex-row items-center justify-center p-8 md:p-24 overflow-hidden border-b border-white/5">
        <div className="flex-1 space-y-6 z-10">
            <div className="font-mono text-moss text-sm tracking-widest uppercase">Protocol Alpha</div>
            <h2 className="font-sans text-5xl md:text-7xl font-bold text-ivory tracking-tight">Cellular<br />Regeneration</h2>
            <p className="font-outfit text-clay text-lg max-w-md">Targeted biotherapy addressing cellular senescence at the molecular level.</p>
        </div>
        <div className="flex-1 relative h-full flex items-center justify-center min-h-[400px]">
            {/* Abstract Double Helix Gear / Circles */}
            <div className="relative w-64 h-64 md:w-96 md:h-96">
                <div className="absolute inset-0 border border-moss/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute inset-4 border border-moss/40 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <div className="absolute inset-8 border border-dashed border-moss/60 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-moss/10 blur-2xl rounded-full"></div>
            </div>
        </div>
    </section>
);

const Card2 = () => (
    <section className="protocol-card h-screen w-full sticky top-0 bg-[#0F1110] flex flex-col md:flex-row-reverse items-center justify-center p-8 md:p-24 overflow-hidden border-b border-white/5">
        <div className="flex-1 space-y-6 z-10 md:pl-24">
            <div className="font-mono text-emerald-600 text-sm tracking-widest uppercase">Protocol Beta</div>
            <h2 className="font-sans text-5xl md:text-7xl font-bold text-ivory tracking-tight">Neural<br />Optimization</h2>
            <p className="font-outfit text-clay text-lg max-w-md">Enhancing synaptic plasticity through low-frequency transcranial stimulation patterns.</p>
        </div>
        <div className="flex-1 relative h-full flex items-center justify-center min-h-[400px]">
            {/* Medical cell grid laser scan */}
            <div className="relative w-full max-w-md aspect-square grid grid-cols-5 grid-rows-5 gap-2 p-4 border border-white/10 bg-black/50 rounded-xl overflow-hidden">
                {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-sm flex items-center justify-center">
                        {Math.random() > 0.7 && <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>}
                    </div>
                ))}
                {/* Laser scan line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan_3s_ease-in-out_infinite_alternate]"></div>
            </div>
        </div>
    </section>
);

const Card3 = () => (
    <section className="protocol-card h-screen w-full sticky top-0 bg-[#1A1C1A] flex flex-col md:flex-row items-center justify-center p-8 md:p-24 overflow-hidden">
        <div className="flex-1 space-y-6 z-10">
            <div className="font-mono text-white/50 text-sm tracking-widest uppercase">Protocol Gamma</div>
            <h2 className="font-sans text-5xl md:text-7xl font-bold text-ivory tracking-tight">Metabolic<br />Resonance</h2>
            <p className="font-outfit text-clay text-lg max-w-md">Aligning mitochondrial function with circadian rhythms for peak systemic energy.</p>
        </div>
        <div className="flex-1 relative h-full flex items-center justify-center min-h-[400px] w-full">
            {/* Pulse EKG waveform */}
            <div className="w-full flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 500 150" className="w-full max-w-lg stroke-white fill-none stroke-[2] drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                    <path
                        className="animate-[dash_3s_linear_infinite]"
                        strokeDasharray="1000"
                        strokeDashoffset="1000"
                        d="M 0,75 L 100,75 L 120,40 L 140,110 L 160,20 L 180,130 L 200,60 L 220,90 L 240,75 L 500,75"
                    />
                </svg>
            </div>
        </div>
    </section>
);
