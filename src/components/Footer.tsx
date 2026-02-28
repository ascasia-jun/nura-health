import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-slate-950 text-slate-400 pt-24 pb-12 px-6 rounded-t-[4rem] relative overflow-hidden border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">

                <div className="space-y-6">
                    <div className="font-outfit text-2xl font-bold text-slate-100 tracking-tight">AI Dev. Life</div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                        <span className="font-mono text-xs uppercase tracking-widest text-emerald-500/80">System Online</span>
                    </div>
                    <p className="font-outfit text-sm max-w-xs opacity-60">
                        AI 정밀도와 개발자 삶의 완벽한 조화. AI 기반 AI‑DLC 프로토콜.
                    </p>
                </div>

                <div className="flex gap-16 font-sans text-sm">
                    <div className="space-y-4">
                        <div className="font-mono text-xs uppercase tracking-widest text-cyan-500 font-bold">Platform</div>
                        <div className="space-y-2 flex flex-col">
                            <a href="#" className="hover:text-slate-100 transition-colors">AI 샘플러</a>
                            <a href="#" className="hover:text-slate-100 transition-colors">데이터 스트리머</a>
                            <a href="#" className="hover:text-slate-100 transition-colors">기능</a>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="font-mono text-xs uppercase tracking-widest text-cyan-500 font-bold">Company</div>
                        <div className="space-y-2 flex flex-col">
                            <a href="#" className="hover:text-slate-100 transition-colors">Manifesto</a>
                            <a href="#" className="hover:text-slate-100 transition-colors">Research</a>
                            <a href="#" className="hover:text-slate-100 transition-colors">Contact</a>
                        </div>
                    </div>
                </div>

            </div>

            <div className="w-full max-w-6xl mx-auto mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 font-outfit text-xs opacity-50">
                <div>&copy; {new Date().getFullYear()} AI Dev. Life Inc. All rights reserved.</div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white">Privacy Policy</a>
                    <a href="#" className="hover:text-white">Terms of Protocol</a>
                </div>
            </div>
        </footer>
    );
};
