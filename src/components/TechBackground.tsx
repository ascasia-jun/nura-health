import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const TechBackground: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const orbs = gsap.utils.toArray('.bg-orb');
        
        // 1. Initial set to prevent any residual flash
        gsap.set(['.bg-orb', '.bg-overlay'], { autoAlpha: 0 });

        // 2. Fade in the background atmospheric elements
        gsap.to(['.bg-orb', '.bg-overlay'], {
            autoAlpha: 1,
            duration: 2,
            stagger: 0.3,
            ease: 'power2.inOut'
        });

        // 3. Floating animation for nebula orbs
        orbs.forEach((orb: any) => {
            gsap.to(orb, {
                x: 'random(-150, 150)',
                y: 'random(-150, 150)',
                duration: 'random(15, 25)',
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        });
    }, { scope: container });

    return (
        <div ref={container} className="fixed inset-0 z-[-1] bg-slate-950 overflow-hidden pointer-events-none">
            {/* Global Atmosphere */}
            <div className="bg-orb absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-cyan-500/10 blur-[120px]"></div>
            <div className="bg-orb absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[100px]"></div>
            <div className="bg-orb absolute top-[30%] right-[5%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[80px]"></div>

            {/* Micro Grid (Single Source of Truth) */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>

            {/* Vignette Depth */}
            <div className="bg-overlay absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_90%)] opacity-80"></div>
            
            {/* Noise Grain */}
            <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-noise"></div>
        </div>
    );
};
