import React, { useState } from 'react';
import { X, Shield, Cpu, User, Check, AlertCircle, Key, Github, Globe } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentModel }) => {
    const { user, tier } = useUser();
    const [activeTab, setActiveTab] = useState<'ai' | 'permissions' | 'account' | 'credentials'>('ai');

    if (!isOpen) return null;

    const tabs = [
        { id: 'ai', label: 'AI 관리', icon: Cpu },
        { id: 'permissions', label: '권한 관리', icon: Shield },
        { id: 'credentials', label: '크리덴셜 관리', icon: Key },
        { id: 'account', label: '계정 관리', icon: User },
    ] as const;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]">
                {/* Sidebar */}
                <div className="w-full md:w-48 bg-black/20 border-r border-white/5 p-4 flex flex-row md:flex-col gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            <tab.icon size={18} />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                    <div className="flex-1"></div>
                    <button 
                        onClick={onClose}
                        className="md:hidden p-3 text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        <button 
                            onClick={onClose}
                            className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {activeTab === 'ai' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em]">Active Engine</h3>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-cyan-500/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                                                <Cpu size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-100">{currentModel}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">Primary Processing Unit</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/60 bg-cyan-500/5 px-2 py-1 rounded-md">
                                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                                            STABLE
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em]">AI Performance Tier</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="text-xs text-slate-500 mb-2">Token Limit</div>
                                            <div className="text-lg font-mono text-slate-100">128K</div>
                                        </div>
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="text-xs text-slate-500 mb-2">Sync Rate</div>
                                            <div className="text-lg font-mono text-slate-100">0.4ms</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'permissions' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-amber-200/80 text-xs">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>일부 권한은 조직 관리자에 의해 제한될 수 있습니다.</span>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { label: '실시간 진단 액세스', active: true },
                                        { label: '데이터 분석 프로토콜', active: true },
                                        { label: '멤버십 관리 권한', active: tier === 'Apex' },
                                        { label: '시스템 인프라 제어', active: false },
                                    ].map((p, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-sm text-slate-300">{p.label}</span>
                                            {p.active ? (
                                                <Check size={18} className="text-cyan-400" />
                                            ) : (
                                                <X size={18} className="text-slate-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'credentials' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Github size={14} /> Git Integration
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                            <label className="block text-[10px] text-slate-500 mb-2 uppercase">GitHub Personal Access Token</label>
                                            <input 
                                                type="password" 
                                                placeholder="ghp_********************************"
                                                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                            />
                                            <p className="text-[10px] text-slate-600 mt-2 italic">* 저장소 분석 및 PR 리뷰를 위해 repo 권한이 필요합니다.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Globe size={14} /> Environment Config
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                            <label className="block text-[10px] text-slate-500 mb-2 uppercase">Base API URL</label>
                                            <input 
                                                type="text" 
                                                defaultValue="https://api.nurahealth.ai/v1"
                                                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                                            />
                                        </div>
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                            <label className="block text-[10px] text-slate-500 mb-2 uppercase">MCP Server Endpoint</label>
                                            <input 
                                                type="text" 
                                                defaultValue="https://api.bkend.ai/mcp"
                                                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button className="w-full py-3 bg-cyan-500 text-slate-950 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex flex-col items-center py-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-cyan-500/20 mb-4">
                                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{user?.username || 'Guest'}</h3>
                                    <p className="text-xs font-mono text-cyan-400 mt-1 uppercase tracking-widest">{tier} Member</p>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="text-xs text-slate-500 mb-1">Email Address</div>
                                        <div className="text-sm text-slate-200">developer@nurahealth.ai</div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="text-xs text-slate-500 mb-1">Organization</div>
                                        <div className="text-sm text-slate-200">Nura Health Autonomous Lab</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
