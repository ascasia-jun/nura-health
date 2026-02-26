import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Activity, Terminal, Cpu } from 'lucide-react';
import { cn } from '../components/Navigation';

gsap.registerPlugin(useGSAP);

export const Features: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Reveal section title
        gsap.from('.feature-title', {
            scrollTrigger: {
                trigger: container.current,
                start: 'top 80%',
            },
            y: 30,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });

        // Reveal cards
        gsap.from('.feature-card', {
            scrollTrigger: {
                trigger: '.feature-cards-grid',
                start: 'top 75%',
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out'
        });
    }, { scope: container });

    return (
        <section
            id="features"
            ref={container}
            className="relative w-full min-h-screen bg-charcoal text-white py-32 px-6 flex flex-col items-center"
        >
            <div className="w-full max-w-6xl mx-auto space-y-24 z-10">
                <div className="feature-title text-center space-y-6">
                    <p className="font-mono text-moss tracking-widest uppercase text-sm font-bold">Precision Tools</p>
                    <h2 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ivory">
                        정밀 마이크로 UI 대시보드
                    </h2>
                    <p className="font-outfit text-clay text-lg max-w-2xl mx-auto">
                        Biological data requires specialized tools. Our interface is designed to surface complex diagnostic matrices with crystal clarity.
                    </p>
                </div>

                <div className="feature-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <DiagnosticShufflerCard />
                    <TelemetryTypewriterCard />
                    <ProtocolSchedulerCard />
                </div>
            </div>
        </section>
    );
};

// Subcomponent: Diagnostic Shuffler Card
const DiagnosticShufflerCard = () => {
    const items = [
        { label: "BIOMARKER ANALYSIS", val: "A+" },
        { label: "CELLULAR REGENERATION", val: "OPTIMAL" },
        { label: "METABOLIC EFFICIENCY", val: "94%" },
        { label: "NEUROPLASTICITY", val: "ACTIVE" }
    ];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, 2500);
        return () => clearInterval(timer);
    }, [items.length]);

    return (
        <div className="feature-card h-[400px] rounded-3xl bg-[#1A1C1A] border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 text-moss opacity-50 group-hover:opacity-100 transition-opacity">
                <Activity size={24} />
            </div>
            <div>
                <h3 className="font-sans text-2xl font-semibold mb-2 text-ivory">진단 셔플러</h3>
                <p className="font-outfit text-clay text-sm">Real-time biological metrics rotation.</p>
            </div>

            <div className="h-32 flex flex-col justify-center relative">
                {items.map((item, i) => (
                    <div
                        key={item.label}
                        className={cn(
                            "absolute inset-x-0 transition-all duration-500 flex flex-col",
                            i === index ? "opacity-100 translate-y-0" :
                                i === (index - 1 + items.length) % items.length ? "opacity-0 -translate-y-8" :
                                    "opacity-0 translate-y-8"
                        )}
                    >
                        <span className="font-mono text-xs text-moss mb-1">{item.label}</span>
                        <span className="font-sans text-3xl font-light text-ivory border-b border-moss/30 pb-2">{item.val}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 font-mono text-xs text-clay opacity-50">
                <span>[01]</span>
                <span>CYCLING MODE</span>
            </div>
        </div>
    );
};

// Subcomponent: Telemetry Typewriter Card
const TelemetryTypewriterCard = () => {
    const [text, setText] = useState("");
    const fullText = "> Initialize full systemic bypass...\n> Accessing patient telemetry...\n> Syncing neural pathways...\n> SYSTEM ONLINE.";

    useEffect(() => {
        let currentText = "";
        let i = 0;

        // reset animation on mount
        const timer = setInterval(() => {
            if (i < fullText.length) {
                currentText += fullText.charAt(i);
                setText(currentText);
                i++;
            } else {
                // restart after a delay
                setTimeout(() => {
                    i = 0; currentText = ""; setText("");
                }, 3000);
            }
        }, 50);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="feature-card h-[400px] rounded-3xl bg-[#1A1C1A] border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 text-moss opacity-50 group-hover:opacity-100 transition-opacity">
                <Terminal size={24} />
            </div>
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-sans text-2xl font-semibold text-ivory">텔레메트리 연동</h3>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                </div>
                <p className="font-outfit text-clay text-sm">Live data feed streaming.</p>
            </div>

            <div className="flex-1 mt-8 mb-4 bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                <pre className="font-mono text-xs text-moss whitespace-pre-wrap">
                    {text}
                    <span className="inline-block w-2 h-3 bg-moss ml-1 animate-pulse"></span>
                </pre>
            </div>

            <div className="flex gap-2 font-mono text-xs text-clay opacity-50">
                <span>[02]</span>
                <span>TELEMETRY FEED</span>
            </div>
        </div>
    );
};

// Subcomponent: Protocol Scheduler Card
const ProtocolSchedulerCard = () => {
    return (
        <div className="feature-card h-[400px] rounded-3xl bg-[#1A1C1A] border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 text-moss opacity-50 group-hover:opacity-100 transition-opacity">
                <Cpu size={24} />
            </div>
            <div>
                <h3 className="font-sans text-2xl font-semibold mb-2 text-ivory">프로토콜 스케줄러</h3>
                <p className="font-outfit text-clay text-sm">Automated regimen tracking grid.</p>
            </div>

            <div className="flex-1 mt-6 mb-4 relative">
                <div className="grid grid-cols-4 gap-2 h-full">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "rounded-md border border-white/5 transition-colors duration-500",
                                i === 5 || i === 10 || i === 15 ? "bg-moss/20 border-moss/50" : "bg-black/20"
                            )}
                        ></div>
                    ))}
                </div>

                {/* Mock Cursor Animation using CSS */}
                <div className="absolute w-4 h-4 text-white z-10 bottom-4 right-4 animate-[bounce_3s_ease-in-out_infinite]">
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="drop-shadow-lg">
                        <path d="M4 4l5.33 16 2.67-6.67L18.67 10.67 4 4z"></path>
                    </svg>
                </div>
            </div>

            <div className="flex gap-2 font-mono text-xs text-clay opacity-50">
                <span>[03]</span>
                <span>AI ALLOCATION</span>
            </div>
        </div>
    );
};
