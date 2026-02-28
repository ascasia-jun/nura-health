import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Activity, Terminal, Cpu, Lock } from 'lucide-react';
import { cn } from '../components/Navigation';
import { useUser } from '../context/UserContext';
import { API_ENDPOINTS } from '../config';

gsap.registerPlugin(useGSAP);

// 주요 기능 섹션 컴포넌트
export const Features: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Reveal section title
        // 섹션 제목 애니메이션
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
        // 카드 순차 등장 애니메이션
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
            id="tools"
            ref={container}
            className="relative w-full bg-transparent text-white py-32 px-0 flex flex-col items-center scroll-mt-32"
        >
            <div className="w-full max-w-6xl mx-auto space-y-12 z-10">
                <div className="feature-title text-center space-y-6">
                    <p className="font-mono text-cyan-400 tracking-widest uppercase text-sm font-bold">AI‑DLC 도구 모음</p>
                    <h2 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-100">
                        정밀 마이크로 UI 대시보드
                    </h2>
                    <p className="font-outfit text-slate-400 text-lg max-w-2xl mx-auto">
                        AI 데이터는 전문 도구를 요구합니다. 우리의 인터페이스는 복잡한 AI‑DLC 매트릭스를 투명하게 드러냅니다.
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
// 서브 컴포넌트: AI 샘플러 카드 (실시간 메트릭 순환)
const DiagnosticShufflerCard = () => {
    type Metric = { label: string; val: string };

    const [items, setItems] = useState<Metric[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [index, setIndex] = useState(0);

    // 데이터 페칭: 백엔드에서 메트릭 데이터 가져오기
    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.METRICS);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Metric[] = await response.json();
                setItems(data);
            } catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                setError(errorMessage);
                setItems([
                    { label: "CONNECTION ERROR", val: "N/A" },
                    { label: "PLEASE REFRESH", val: "N/A" },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    // 데이터 순환 애니메이션: 일정 간격으로 표시되는 메트릭 변경
    useEffect(() => {
        if (items.length === 0) return;

        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, 2500);
        return () => clearInterval(timer);
    }, [items]);

    return (
        <div className="feature-card h-[400px] rounded-3xl bg-slate-900/50 backdrop-blur-md border border-cyan-500/20 p-8 flex flex-col justify-between overflow-hidden relative group hover:border-cyan-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-8 text-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity">
                <Activity size={24} />
            </div>
            <div>
                <h3 className="font-sans text-2xl font-semibold mb-2 text-slate-100">AI 샘플러</h3>
                <p className="font-outfit text-slate-400 text-sm">실시간 AI 메트릭 회전.</p>
            </div>

            <div className="h-32 flex flex-col justify-center relative">
                {isLoading ? (
                    <p className="font-mono text-xs text-slate-500">Loading metrics...</p>
                ) : (
                    items.map((item, i) => (
                        <div
                            key={item.label}
                            className={cn(
                                "absolute inset-x-0 transition-all duration-500 flex flex-col",
                                i === index ? "opacity-100 translate-y-0" :
                                    i === (index - 1 + items.length) % items.length ? "opacity-0 -translate-y-8" :
                                        "opacity-0 translate-y-8"
                            )}
                        >
                            <span className={cn("font-mono text-xs mb-1", error ? 'text-red-400' : 'text-cyan-400')}>{item.label}</span>
                            <span className="font-sans text-3xl font-light text-slate-100 border-b border-cyan-500/30 pb-2">{item.val}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="flex gap-2 font-mono text-xs text-slate-500 opacity-50">
                <span>[01]</span>
                <span>{error ? 'CONNECTION FAILED' : 'LIVE CYCLING MODE'}</span>
            </div>
        </div>
    );
};

// Subcomponent: Telemetry Typewriter Card
// 서브 컴포넌트: 데이터 스트리머 카드 (실시간 진단 데이터)
const TelemetryTypewriterCard = () => {
    const [data, setData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { tier } = useUser();
    // Performance 등급 이상만 접근 가능
    const isLocked = tier === 'Free' || tier === 'Baseline';

    useEffect(() => {
        if (isLocked) return;

        const fetchData = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.DIAGNOSE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userInput: "React 프로젝트의 초기 로딩 속도가 느립니다." }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                setData(result.diagnosis);
            } catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isLocked]);

    return (
        <div className="feature-card h-[400px] rounded-3xl bg-slate-900/50 backdrop-blur-md border border-cyan-500/20 p-8 flex flex-col justify-between overflow-hidden relative group hover:border-cyan-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-8 text-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity">
                <Terminal size={24} />
            </div>
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-sans text-2xl font-semibold text-slate-100">데이터 스트리머</h3>
                    <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                </div>
                <p className="font-outfit text-slate-400 text-sm">실시간 AI 진단 데이터를 스트리밍합니다.</p>
            </div>

            <div className="flex-1 mt-8 mb-4 bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden font-mono text-xs text-cyan-300 whitespace-pre-wrap shadow-inner">
                {isLocked ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 text-center p-4">
                        <Lock className="text-clay mb-2" size={24} />
                        <p className="text-white font-sans font-bold">Access Restricted</p>
                        <p className="text-clay text-[10px] mt-1">Performance 등급 이상 필요</p>
                    </div>
                ) : (
                    <>
                        {isLoading && <p>AI 진단 데이터를 불러오는 중...</p>}
                        {error && <p className="text-red-400">오류: {error}</p>}
                        {data && <pre className="whitespace-pre-wrap">{data}</pre>}
                    </>
                )}
            </div>

            <div className="flex gap-2 font-mono text-xs text-slate-500 opacity-50">
                <span>[02]</span>
                <span>TELEMETRY FEED</span>
            </div>
        </div>
    );
};

// Subcomponent: Protocol Scheduler Card
// 서브 컴포넌트: 프로토콜 스케줄러 카드 (시각적 장식용)
const ProtocolSchedulerCard = () => {
    return (
        <div className="feature-card h-[400px] rounded-3xl bg-slate-900/50 backdrop-blur-md border border-cyan-500/20 p-8 flex flex-col justify-between overflow-hidden relative group hover:border-cyan-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-8 text-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity">
                <Cpu size={24} />
            </div>
            <div>
                <h3 className="font-sans text-2xl font-semibold mb-2 text-slate-100">DLC 스케줄러</h3>
                <p className="font-outfit text-slate-400 text-sm">AI‑DLC 업데이트를 시계열로 자동 배포합니다.</p>
            </div>

            <div className="flex-1 mt-6 mb-4 relative">
                <div className="grid grid-cols-4 gap-2 h-full">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "rounded-md border border-white/5 transition-colors duration-500",
                                i === 5 || i === 10 || i === 15 ? "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "bg-black/20"
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

            <div className="flex gap-2 font-mono text-xs text-slate-500 opacity-50">
                <span>[03]</span>
                <span>AI ALLOCATION</span>
            </div>
        </div>
    );
};
