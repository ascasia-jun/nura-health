import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Zap, TrendingUp, AlertTriangle, Terminal } from 'lucide-react';
import { cn } from '../components/Navigation';

gsap.registerPlugin(ScrollTrigger);

const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    className?: string;
    tag?: string;
}> = ({ icon, title, description, className, tag }) => (
    <div className={cn(
        "group relative p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-500 flex flex-col h-full",
        className
    )}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col h-full text-center">
            <div className="text-cyan-400 mb-4 flex justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                {title}
            </h3>
            <p className="text-slate-500 leading-tight text-xs font-light">
                {description}
            </p>
        </div>
    </div>
);

export const Features: React.FC = () => {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.feature-card', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 85%',
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out'
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="features" ref={sectionRef} className="py-24 relative bg-slate-950/50">
            <div className="container mx-auto px-6">
                {/* 타이틀 가운데 정렬 */}
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <h2 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-4">Core Intelligence</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-6">
                        프로젝트의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 text-shadow-glow">핵심 지표</span>를 한 눈에.
                    </h3>
                    <p className="text-slate-500 text-base font-light leading-relaxed">
                        RepoInsight는 Git 기반의 5대 핵심 지표를 정밀 진단하여 데이터 기반의 의사결정을 지원합니다.
                    </p>
                </div>

                {/* 핵심 5대 지표 한 줄(Row) 배치 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <FeatureCard
                        className="feature-card"
                        icon={<Shield size={28} />}
                        title="Security"
                        description="보안 취약점 및 민감 정보 노출을 실시간 탐지하고 hardenining 프로토콜을 제시합니다."
                    />
                    <FeatureCard
                        className="feature-card"
                        icon={<Zap size={28} />}
                        title="Quality"
                        description="클린 코드 원칙에 따른 복잡도와 유지보수성을 측정하고 중복 로직을 식별합니다."
                    />
                    <FeatureCard
                        className="feature-card"
                        icon={<AlertTriangle size={28} />}
                        title="Debt"
                        description="누적된 기술 부채를 시각화하고 리팩토링이 시급한 지점을 자동으로 추출합니다."
                    />
                    <FeatureCard
                        className="feature-card"
                        icon={<TrendingUp size={28} />}
                        title="Progress"
                        description="커밋 밀도와 작업 주기를 분석하여 프로젝트의 병목 현상을 예측하고 트래킹합니다."
                    />
                    <FeatureCard
                        className="feature-card"
                        icon={<Terminal size={28} />}
                        title="Risk"
                        description="종속성 취약점 및 환경 설정 오류 등 시스템 전반의 리스크를 통합 진단합니다."
                    />
                </div>
            </div>
        </section>
    );
};
