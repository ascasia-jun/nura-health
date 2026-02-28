import React from 'react';
import { Check, Zap, ShieldCheck, Crown } from 'lucide-react';
import { useUser, type Tier } from '../context/UserContext';

// 멤버십 섹션 컴포넌트
export const Membership: React.FC = () => {
    const { tier: activeTier, setTier } = useUser(); // 전역 상태에서 현재 등급과 변경 함수 가져오기

    // 등급 선택 핸들러
    const handleSelectTier = (selectedTier: Tier) => {
        setTier(selectedTier);
    };

    return (
        <section id="pricing" className="w-full bg-transparent text-white py-32 px-6 scroll-mt-32">
            <div className="w-full max-w-6xl mx-auto space-y-16">
                <div className="text-center space-y-6">
                    <p className="font-mono text-cyan-400 text-sm tracking-widest uppercase font-bold">Access Tiers</p>
                    <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-slate-100">
                        AI‑DLC 멤버십
                    </h2>
                    <p className="font-outfit text-slate-400 text-lg max-w-xl mx-auto">
                        운영 요구에 맞는 AI‑DLC 등급을 선택하세요.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Tier 1 */}
                    {/* Tier 1: Baseline */}
                    <div className={`rounded-3xl border p-8 flex flex-col transition-all duration-300 ${
                        activeTier === 'Baseline' 
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]' 
                            : 'border-white/10 bg-slate-900/50 backdrop-blur-sm hover:border-cyan-500/30'
                    }`}>
                        <div className="mb-6">
                            <Zap className={`mb-4 ${activeTier === 'Baseline' ? 'text-cyan-400' : 'text-slate-500'}`} size={32} />
                            <h3 className="font-sans text-2xl font-semibold text-slate-100 mb-2">Baseline</h3>
                            <p className="font-outfit text-slate-400 text-sm">Essential biological telemetry</p>
                        </div>
                        <div className="mb-8">
                            <span className="font-mono text-4xl text-white tracking-tight">$99</span>
                            <span className="font-outfit text-slate-500 text-sm"> / cycle</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {["월간 AI 진단", "기본 개발 패널", "표준 데이터 동기화"].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-outfit text-slate-400">
                                    <Check size={18} className="text-cyan-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={() => handleSelectTier('Baseline')}
                            className={`w-full py-4 rounded-xl font-sans font-medium transition-all relative overflow-hidden group ${
                                activeTier === 'Baseline' 
                                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                                    : 'border border-white/10 text-white hover:bg-white/5'
                            }`}
                        >
                            <span className="relative z-10">{activeTier === 'Baseline' ? 'Active Plan' : 'Initialize'}</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>

                    {/* Tier 2 */}
                    {/* Tier 2: Performance */}
                    <div className={`rounded-3xl relative p-8 flex flex-col transform md:-translate-y-4 transition-all duration-300 ${
                        activeTier === 'Performance' ? 'bg-cyan-600 shadow-[0_0_50px_rgba(8,145,178,0.5)] scale-105' : 'bg-cyan-700 shadow-[0_0_40px_rgba(8,145,178,0.2)]'
                    }`}>
                        <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-white text-slate-900 font-mono text-xs font-bold py-1 px-3 rounded-full uppercase tracking-wider">
                            Optimal
                        </div>
                        <div className="mb-6">
                            <ShieldCheck className="mb-4 text-white" size={32} />
                            <h3 className="font-sans text-2xl font-semibold text-white mb-2">Performance</h3>
                            <p className="font-outfit text-white/80 text-sm">Advanced architectural intervention</p>
                        </div>
                        <div className="mb-8">
                            <span className="font-mono text-4xl text-white tracking-tight">$299</span>
                            <span className="font-outfit text-white/80 text-sm"> / cycle</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {["연속 AI 진단", "네트워크 + 성능 패널", "실시간 AI 스케줄러", "우선 프로토콜 접근"].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-outfit text-white/90">
                                    <Check size={18} className="text-white shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={() => handleSelectTier('Performance')}
                            className="w-full py-4 rounded-xl bg-white font-sans font-semibold text-slate-900 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                        >
                            {activeTier === 'Performance' ? 'System Deployed' : 'Deploy System'}
                        </button>
                    </div>

                    {/* Tier 3 */}
                    {/* Tier 3: Apex */}
                    <div className={`rounded-3xl border p-8 flex flex-col transition-all duration-300 ${
                        activeTier === 'Apex' 
                            ? 'border-white bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                            : 'border-white/10 bg-slate-900/50 backdrop-blur-sm hover:border-cyan-500/30'
                    }`}>
                        <div className="mb-6">
                            <Crown className={`mb-4 ${activeTier === 'Apex' ? 'text-white' : 'text-slate-500'}`} size={32} />
                            <h3 className="font-sans text-2xl font-semibold text-slate-100 mb-2">Apex</h3>
                            <p className="font-outfit text-slate-400 text-sm">Limitless systemic manipulation</p>
                        </div>
                        <div className="mb-8">
                            <span className="font-mono text-4xl text-white tracking-tight">$999</span>
                            <span className="font-outfit text-slate-500 text-sm"> / cycle</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {["무제한 AI 진단", "전체 코드 분석", "24/7 데이터 모니터링", "맞춤형 AI 프로토콜", "전담 AI 엔지니어"].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-outfit text-slate-400">
                                    <Check size={18} className="text-cyan-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={() => handleSelectTier('Apex')}
                            className={`w-full py-4 rounded-xl font-sans font-medium transition-all relative overflow-hidden group ${
                                activeTier === 'Apex' 
                                    ? 'bg-white text-slate-900 font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                                    : 'border border-white/10 text-white hover:bg-white/5'
                            }`}
                        >
                            <span className="relative z-10">{activeTier === 'Apex' ? 'Access Granted' : 'Request Access'}</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
