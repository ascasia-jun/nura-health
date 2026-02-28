import React from 'react';
import { ProtocolGeneratorWizard } from '../components/ProtocolGeneratorWizard';

// AI 프로토콜 섹션 컴포넌트
export const Protocols: React.FC = () => {
    return (
        <section
            id="protocols"
            className="relative w-full bg-transparent text-white py-32 px-6 flex flex-col items-center justify-center scroll-mt-32"
        >
            <div className="w-full max-w-4xl mx-auto space-y-16 z-10 text-center">
                <div className="space-y-6">
                    <p className="font-mono text-cyan-400 tracking-widest uppercase text-sm font-bold">
                        Dynamic Protocol Generation
                    </p>
                    <h2 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-100">
                        맞춤형 AI 솔루션
                    </h2>
                    <p className="font-outfit text-slate-400 text-lg max-w-2xl mx-auto">
                        AI에게 직접 프로젝트의 문제점을 설명하고, 즉시 맞춤형 해결 프로토콜을 제안받으세요.
                    </p>
                </div>

                <ProtocolGeneratorWizard />

            </div>
        </section>
    );
};
