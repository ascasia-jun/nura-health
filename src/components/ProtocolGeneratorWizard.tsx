import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Sparkles, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';

// AI 프로토콜 생성 마법사 컴포넌트
export const ProtocolGeneratorWizard: React.FC = () => {
    const { tier } = useUser(); // 멤버십 등급 확인
    const [userInput, setUserInput] = useState(''); // 사용자 입력 상태
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태
    const [response, setResponse] = useState<string | null>(null); // AI 응답 상태
    const [error, setError] = useState<string | null>(null); // 에러 상태

    // Apex 등급이 아니면 잠금 처리
    const isLocked = tier !== 'Apex';

    if (isLocked) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-white w-full max-w-2xl mx-auto shadow-2xl shadow-black/50 transition-all duration-500 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="p-4 bg-white/5 rounded-full mb-6">
                    <Lock className="text-slate-500" size={48} />
                </div>
                <h3 className="font-sans text-2xl font-semibold text-slate-100 mb-2">Access Restricted</h3>
                <p className="font-outfit text-slate-400 mb-8 max-w-md">
                    AI 프로토콜 생성은 <strong>Apex</strong> 멤버십 전용 기능입니다.<br />
                    무제한 AI 진단과 맞춤형 솔루션을 경험해보세요.
                </p>
                <a href="#pricing" className="px-8 py-4 bg-cyan-500 text-slate-900 rounded-xl font-sans font-bold hover:bg-cyan-400 transition-colors hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    멤버십 업그레이드
                </a>
            </div>
        );
    }

    // 진단 요청 핸들러
    const handleSubmit = async () => {
        if (!userInput.trim()) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            // 백엔드 API 호출 (Features.tsx와 동일한 엔드포인트 사용)
            const res = await fetch('http://localhost:3001/api/diagnose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userInput }),
            });

            if (!res.ok) {
                throw new Error(`서버 응답 오류: ${res.status}`);
            }

            const data = await res.json();
            // 백엔드 응답 구조에 따라 data.diagnosis 또는 data.protocol 등을 사용
            setResponse(data.diagnosis || data.protocol || "AI 응답을 확인할 수 없습니다.");
        } catch (err: any) {
            console.error(err);
            setError("AI 진단 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-md border border-cyan-500/20 rounded-3xl p-8 text-white w-full max-w-2xl mx-auto shadow-2xl shadow-black/50 transition-all duration-500 hover:border-cyan-500/40">
            <div className="flex items-center gap-3 mb-2">
                <Sparkles className="text-cyan-400" size={24} />
                <h3 className="font-sans text-2xl font-semibold text-slate-100">AI 프로토콜 생성</h3>
            </div>
            <p className="font-outfit text-slate-400 text-sm mb-6 pl-9">
                프로젝트의 증상이나 문제점을 입력하면, AI가 맞춤형 해결 프로토콜을 설계합니다.
            </p>

            {!response ? (
                <div className="space-y-4">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="예: React 프로젝트의 초기 로딩 속도가 너무 느립니다. 번들 사이즈가 크고 이미지 로딩에 시간이 많이 걸리는 것 같습니다."
                        className="w-full h-48 bg-black/40 rounded-xl p-5 border border-white/10 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500/50 focus:outline-none font-mono text-sm text-cyan-300 placeholder:text-slate-600 resize-none transition-all"
                        disabled={isLoading}
                    />

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !userInput.trim()}
                        className={`w-full py-4 rounded-xl font-sans font-semibold transition-all flex items-center justify-center gap-2
                            ${isLoading || !userInput.trim()
                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_15px_rgba(6,182,212,0.3)]'}`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>진단 프로토콜 생성 중...</span>
                            </>
                        ) : (
                            <span>AI 진단 시작</span>
                        )}
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 text-cyan-400 mb-4 bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/20">
                        <CheckCircle2 size={20} />
                        <span className="font-bold text-sm">AI 진단 완료</span>
                    </div>
                    
                    <div className="bg-black/40 rounded-xl p-6 border border-white/10 font-mono text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar shadow-inner">
                        {response}
                    </div>

                    <button
                        onClick={() => { setResponse(null); setUserInput(''); }}
                        className="w-full mt-6 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
                    >
                        새로운 진단 요청하기
                    </button>
                </div>
            )}
        </div>
    );
};
