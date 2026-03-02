import React, { useState, useEffect } from 'react';
import { Bot, Github, Twitter, Linkedin, Mail, ExternalLink, Activity } from 'lucide-react';
import { API_URL } from '../config';

export const Footer: React.FC = () => {
    const [systemStatus, setSystemStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');

    /**
     * 서버 헬스 체크
     */
    const checkSystemHealth = async () => {
        try {
            const res = await fetch(`${API_URL}/api/metrics`, { method: 'GET' });
            if (res.ok) setSystemStatus('ONLINE');
            else setSystemStatus('OFFLINE');
        } catch (e) {
            setSystemStatus('OFFLINE');
        }
    };

    useEffect(() => {
        checkSystemHealth();
        // 30초마다 상태 갱신
        const interval = setInterval(checkSystemHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <footer className="relative bg-slate-950 pt-24 pb-12 border-t border-white/5 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                <Bot size={24} className="text-cyan-400" />
                            </div>
                            <span className="font-black text-2xl tracking-tighter text-white uppercase italic">RepoInsight</span>
                        </div>
                        <p className="max-w-md text-slate-500 leading-relaxed font-light">
                            AI 기반 Dev Lifecycle Intelligence 플랫폼. 
                            Git 리포지토리의 보안, 품질, 부채를 정밀 분석하여 엔지니어링 생산성을 극대화합니다.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 transition-colors"><Github size={18} /></a>
                            <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 transition-colors"><Twitter size={18} /></a>
                            <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 transition-colors"><Linkedin size={18} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Platform</h4>
                        <ul className="space-y-4">
                            <li><a href="#features" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Core Features</a></li>
                            <li><a href="#protocols" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Diagnostics</a></li>
                            <li><a href="#chatops" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Autonomous ChatOps</a></li>
                        </ul>
                    </div>

                    {/* System Status Section */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Infrastructure</h4>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-slate-500" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Engine</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                        systemStatus === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                        systemStatus === 'OFFLINE' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-500'
                                    }`} />
                                    <span className={`text-[10px] font-mono font-bold ${
                                        systemStatus === 'ONLINE' ? 'text-emerald-400' : 
                                        systemStatus === 'OFFLINE' ? 'text-red-400' : 'text-slate-500'
                                    }`}>
                                        {systemStatus}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[9px] text-slate-600 font-mono leading-tight">
                                Connected to Google Gemini 2.0<br />
                                Last sync: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                        &copy; 2026 RepoInsight Autonomous Lab. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="text-[10px] text-slate-600 hover:text-white transition-colors uppercase tracking-tighter">Privacy Policy</a>
                        <a href="#" className="text-[10px] text-slate-600 hover:text-white transition-colors uppercase tracking-tighter">Terms of Service</a>
                        <a href="mailto:developer@repoinsight.ai" className="text-[10px] text-slate-600 hover:text-white transition-colors uppercase tracking-tighter flex items-center gap-1.5">
                            <Mail size={10} /> developer@repoinsight.ai
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
