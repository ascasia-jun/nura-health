import React, { useState, useEffect } from 'react';
import { X, User, Shield, Key, Loader2, Save, Trash2, Plus, Building, Mail, Check, AlertCircle, Edit2, Github, LogOut, ExternalLink, Globe, Cpu, Database, Zap } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel: string;
}

type SettingsTab = 'Profile' | 'Admin' | 'Credentials';

/**
 * [v3.8] 통합 크리덴셜 및 공개 저장소 관리 시스템
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentModel }) => {
    const { user, logout, updateLocalUser } = useUser();
    const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
    
    // Status & Loading
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // Profile State
    const [profileForm, setProfileForm] = useState({ name: '', email: '', dept: '', newPw: '', confirmPw: '' });
    
    // Credentials State
    const [credStatus, setCredStatus] = useState<any>({ github: false, gemini: false });
    const [ghToken, setGhToken] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [publicRepoUrl, setPublicRepoUrl] = useState('');
    const [publicRepos, setPublicRepos] = useState<string[]>([]);
    
    // Admin State
    const [users, setUsers] = useState<any[]>([]);
    const [isAdminLoading, setIsAdminLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setProfileForm({ 
                name: user.name || '', 
                email: user.email || '', 
                dept: user.department || '', 
                newPw: '', 
                confirmPw: '' 
            });
            if (activeTab === 'Credentials') { fetchCredentials(); fetchPublicRepos(); }
            if (activeTab === 'Admin' && user.role === 'admin') fetchUsers();
        }
    }, [isOpen, activeTab, user]);

    const fetchCredentials = async () => {
        try {
            const res = await fetch(`${API_URL}/api/credentials`, { headers: { 'x-user-id': user?.id || '' } });
            const data = await res.json();
            if (data.status) setCredStatus(data.status);
        } catch (e) {}
    };

    const fetchPublicRepos = async () => {
        try {
            const res = await fetch(`${API_URL}/api/github/public-repos`, { headers: { 'x-user-id': user?.id || '' } });
            const data = await res.json();
            if (data.repos) setPublicRepos(data.repos);
        } catch (e) {}
    };

    const fetchUsers = async () => {
        setIsAdminLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, { headers: { 'x-user-id': user?.id || '' } });
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (e) {} finally { setIsAdminLoading(false); }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (profileForm.newPw && profileForm.newPw !== profileForm.confirmPw) {
            setStatusMsg({ type: 'error', text: '비밀번호 확인이 일치하지 않습니다.' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ 
                    name: profileForm.name, 
                    email: profileForm.email, 
                    department: profileForm.dept, 
                    password: profileForm.newPw || undefined 
                })
            });
            if (res.ok) {
                setStatusMsg({ type: 'success', text: '프로필이 업데이트되었습니다.' });
                updateLocalUser({ name: profileForm.name, email: profileForm.email, department: profileForm.dept });
            }
        } catch (e) { setStatusMsg({ type: 'error', text: '통신 오류' }); } finally { setIsLoading(false); }
    };

    const handleSaveCred = async (serviceName: string, token: string) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ serviceName, token })
            });
            if (res.ok) {
                setStatusMsg({ type: 'success', text: `${serviceName.toUpperCase()} 연동이 완료되었습니다.` });
                if (serviceName === 'github') setGhToken(''); else setGeminiKey('');
                fetchCredentials();
            }
        } catch (e) {} finally { setIsLoading(false); }
    };

    const handleAddPublicRepo = async () => {
        if (!publicRepoUrl) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/public-repos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ repoUrl: publicRepoUrl })
            });
            if (res.ok) {
                setStatusMsg({ type: 'success', text: '공개 저장소가 등록되었습니다.' });
                setPublicRepoUrl('');
                fetchPublicRepos();
            } else {
                const data = await res.json();
                setStatusMsg({ type: 'error', text: data.error || '등록 실패' });
            }
        } catch (e) {} finally { setIsLoading(false); }
    };

    const handleDeletePublicRepo = async (ownerRepo: string) => {
        const [owner, repo] = ownerRepo.split('/');
        try {
            const res = await fetch(`${API_URL}/api/github/public-repos/${owner}/${repo}`, {
                method: 'DELETE',
                headers: { 'x-user-id': user?.id || '' }
            });
            if (res.ok) fetchPublicRepos();
        } catch (e) {}
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[700px] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 font-sans relative">
                
                {/* Sidebar Navigation */}
                <div className="w-64 bg-black/20 border-r border-white/5 p-8 flex flex-col gap-2 shrink-0">
                    <div className="mb-10 px-2">
                        <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase flex items-center gap-2">Settings</h2>
                        <div className="h-1 w-12 bg-cyan-500 rounded-full mt-2" />
                    </div>
                    
                    <button onClick={() => setActiveTab('Profile')} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Profile' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><User size={16} /> Profile</button>
                    <button onClick={() => setActiveTab('Credentials')} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Credentials' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Key size={16} /> Credentials</button>
                    {user?.role === 'admin' && (
                        <button onClick={() => setActiveTab('Admin')} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Admin' ? 'bg-amber-500 text-slate-950' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Shield size={16} /> Admin</button>
                    )}
                    
                    <div className="mt-auto"><button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3.5 text-slate-600 hover:text-red-400 text-xs font-black uppercase transition-all"><LogOut size={16} /> Sign Out</button></div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50 relative">
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        
                        {activeTab === 'Profile' && (
                            <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-10 animate-in slide-in-from-right-4 duration-300">
                                <div><h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">My Identity</h3><p className="text-sm text-slate-500 font-light">당신의 개인 프로필과 접속 권한을 최신화하세요.</p></div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Account ID</label><input type="text" value={user?.username} disabled className="w-full bg-black/30 border border-white/5 rounded-2xl px-5 py-4 text-slate-500 font-mono text-sm cursor-not-allowed" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label><input type="text" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 transition-all outline-none" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email</label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 transition-all outline-none" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Department</label><input type="text" value={profileForm.dept} onChange={(e) => setProfileForm({...profileForm, dept: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 transition-all outline-none" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">New Password</label><input type="password" value={profileForm.newPw} onChange={(e) => setProfileForm({...profileForm, newPw: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 transition-all outline-none" placeholder="Leave blank to keep" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Confirm PW</label><input type="password" value={profileForm.confirmPw} onChange={(e) => setProfileForm({...profileForm, confirmPw: e.target.value})} className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white text-sm outline-none transition-all ${profileForm.confirmPw && profileForm.newPw !== profileForm.confirmPw ? 'border-red-500/50' : 'border-white/10'}`} /></div>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-3 w-full bg-cyan-500 text-slate-950 font-black py-5 rounded-3xl hover:bg-white transition-all shadow-glow"><Save size={20} /> Update Profile Info</button>
                            </form>
                        )}

                        {activeTab === 'Credentials' && (
                            <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                                <div><h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Credentials</h3><p className="text-sm text-slate-500 font-light">다양한 AI 엔진 및 개발 플랫폼과의 연동 키를 관리합니다.</p></div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Gemini Card */}
                                    <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-[2rem] flex flex-col gap-6 relative overflow-hidden group">
                                        <div className="flex justify-between items-start">
                                            <div className="p-4 bg-cyan-500/20 rounded-2xl text-cyan-400"><Cpu size={32} /></div>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${credStatus.gemini ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-500 border border-white/10'}`}>{credStatus.gemini ? 'Connected' : 'Not Linked'}</div>
                                        </div>
                                        <div><div className="text-xl font-black text-white italic">Google Gemini</div><div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">AI Reasoning Engine</div></div>
                                        <div className="space-y-3">
                                            <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="Enter API Key" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none focus:border-cyan-500 transition-all" />
                                            <button onClick={() => handleSaveCred('gemini', geminiKey)} disabled={isLoading || !geminiKey} className="w-full bg-white text-slate-950 font-black py-3 rounded-xl text-xs uppercase hover:bg-cyan-400 transition-all disabled:opacity-30">Link Gemini Key</button>
                                        </div>
                                    </div>

                                    {/* GitHub Private Card */}
                                    <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-[2rem] flex flex-col gap-6 relative overflow-hidden group">
                                        <div className="flex justify-between items-start">
                                            <div className="p-4 bg-indigo-500/20 rounded-2xl text-indigo-400"><Github size={32} /></div>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${credStatus.github ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-500 border border-white/10'}`}>{credStatus.github ? 'Active' : 'Missing PAT'}</div>
                                        </div>
                                        <div><div className="text-xl font-black text-white italic">GitHub Private</div><div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Personal Access Token</div></div>
                                        <div className="space-y-3">
                                            <input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="ghp_****************" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none focus:border-indigo-500 transition-all" />
                                            <button onClick={() => handleSaveCred('github', ghToken)} disabled={isLoading || !ghToken} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase hover:bg-indigo-500 transition-all disabled:opacity-30">Save GitHub PAT</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Public Repo Integration */}
                                <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-8">
                                    <div className="flex justify-between items-end">
                                        <div><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-white/5 rounded-lg text-slate-400"><Globe size={20} /></div><h4 className="text-xl font-black text-white uppercase italic">Open Source Integration</h4></div><p className="text-xs text-slate-500 font-light">토큰 없이 URL 주소만으로 공개 리포지토리를 분석 목록에 추가합니다.</p></div>
                                    </div>
                                    <div className="flex gap-3">
                                        <input type="text" value={publicRepoUrl} onChange={(e) => setPublicRepoUrl(e.target.value)} placeholder="e.g. facebook/react" className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-white/30 transition-all" />
                                        <button onClick={handleAddPublicRepo} disabled={isLoading || !publicRepoUrl} className="px-8 bg-white text-slate-950 font-black rounded-2xl text-xs uppercase hover:bg-cyan-400 transition-all flex items-center gap-2"><Plus size={16} /> Add Repo</button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {publicRepos.map(repo => (
                                            <div key={repo} className="flex justify-between items-center px-5 py-4 bg-white/5 border border-white/5 rounded-2xl group">
                                                <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /><span className="text-xs font-mono text-slate-300">{repo}</span></div>
                                                <button onClick={() => handleDeletePublicRepo(repo)} className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                        {publicRepos.length === 0 && <div className="col-span-full py-10 text-center border-2 border-dashed border-white/5 rounded-3xl text-[10px] text-slate-600 font-black uppercase tracking-widest italic">No public repos added yet</div>}
                                    </div>
                                </div>

                                {/* Coming Soon services */}
                                <div className="grid grid-cols-3 gap-4 opacity-30 grayscale pointer-events-none">
                                    {['GitLab', 'n8n Hub', 'OpenAI'].map(s => (
                                        <div key={s} className="p-6 border border-white/10 rounded-2xl flex flex-col items-center gap-2"><Database size={20} className="text-slate-500" /><span className="text-[10px] font-black uppercase tracking-widest">{s} Integration</span></div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Admin' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div><h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">System Governance</h3><p className="text-sm text-slate-500 font-light">조직의 모든 구성원과 데이터 접근 정책을 관리합니다.</p></div>
                                <div className="bg-black/20 border border-white/5 rounded-[2rem] overflow-hidden">
                                    <table className="w-full text-left border-collapse"><thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]"><tr className="border-b border-white/5"><th className="px-8 py-6">User Identity</th><th className="px-8 py-6">Role / Dept</th><th className="px-8 py-6 text-right">Actions</th></tr></thead>
                                        <tbody className="text-xs">{users.map(u => (
                                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"><td className="px-8 py-5"><div className="font-black text-slate-200">{u.name}</div><div className="text-[10px] text-cyan-500 font-mono mt-0.5">{u.username}</div></td><td className="px-8 py-5"><div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-400'}`}>{u.role}</span><span className="text-[10px] text-slate-500 font-bold uppercase">{u.department || '-'}</span></div></td><td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100"><button className="p-2 text-slate-500 hover:text-white"><Edit2 size={14} /></button></td></tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {statusMsg.text && (
                        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-4 rounded-3xl flex items-center gap-3 border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-[160] ${statusMsg.type === 'success' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}>
                            {statusMsg.type === 'success' ? <Check size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
                            <span className="text-sm font-black italic uppercase tracking-tight">{statusMsg.text}</span>
                            <button onClick={() => setStatusMsg({type:'', text:''})} className="ml-4 opacity-50 hover:opacity-100"><X size={16} /></button>
                        </div>
                    )}
                </div>

                <button onClick={onClose} className="absolute top-10 right-10 p-3 text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl"><X size={24} /></button>
            </div>
        </div>
    );
};
