import React, { useState, useEffect } from 'react';
import { X, User, Shield, Key, Loader2, Save, Trash2, Plus, Building, Mail, Check, AlertCircle, Edit2, Github, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel: string;
}

type SettingsTab = 'Profile' | 'Admin' | 'Credentials';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentModel }) => {
    const { user, logout, updateLocalUser } = useUser();
    const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
    
    // Profile State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dept, setDept] = useState('');
    const [newPw, setNewPw] = useState('');
    
    // Admin State
    const [users, setUsers] = useState<any[]>([]);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    
    // Credential State (GitHub Token)
    const [ghToken, setGhToken] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // 모달이 열릴 때 현재 유저 정보로 폼 초기화
    useEffect(() => {
        if (isOpen && user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setDept(user.department || '');
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (isOpen && activeTab === 'Admin' && user?.role === 'admin') {
            fetchUsers();
        }
    }, [isOpen, activeTab, user]);

    const fetchUsers = async () => {
        setIsAdminLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'x-user-id': user?.id || '' }
            });
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (e) { console.error('사용자 목록 로드 실패'); } finally { setIsAdminLoading(false); }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMsg({ type: '', text: '' });
        try {
            const res = await fetch(`${API_URL}/api/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ name, email, department: dept, password: newPw || undefined })
            });
            if (res.ok) {
                setStatusMsg({ type: 'success', text: '프로필이 업데이트되었습니다.' });
                // 로컬 전역 상태 업데이트 (UI 즉시 반영)
                updateLocalUser({ name, email, department: dept });
                setNewPw('');
            } else { setStatusMsg({ type: 'error', text: '업데이트에 실패했습니다.' }); }
        } catch (e) { setStatusMsg({ type: 'error', text: '서버 통신 오류' }); } finally { setIsLoading(false); }
    };

    const handleSaveCredential = async () => {
        if (!ghToken) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ serviceName: 'github', token: ghToken })
            });
            if (res.ok) {
                setStatusMsg({ type: 'success', text: 'GitHub 토큰이 안전하게 저장되었습니다.' });
                setGhToken('');
            }
        } catch (e) { setStatusMsg({ type: 'error', text: '저장 실패' }); } finally { setIsLoading(false); }
    };

    const handleDeleteUser = async (targetId: string) => {
        if (!window.confirm('정말 이 사용자를 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${targetId}`, {
                method: 'DELETE',
                headers: { 'x-user-id': user?.id || '' }
            });
            if (res.ok) fetchUsers();
        } catch (e) { alert('삭제 실패'); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl h-[600px] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-2">
                    <div className="mb-8 px-2">
                        <h2 className="text-xl font-bold text-white tracking-tight italic uppercase">Settings</h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">RepoInsight v3.8</p>
                    </div>
                    
                    <button onClick={() => setActiveTab('Profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'Profile' ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:bg-white/5'}`}>
                        <User size={18} /> Profile
                    </button>
                    <button onClick={() => setActiveTab('Credentials')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'Credentials' ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:bg-white/5'}`}>
                        <Key size={18} /> Credentials
                    </button>
                    {user?.role === 'admin' && (
                        <button onClick={() => setActiveTab('Admin')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'Admin' ? 'bg-amber-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:bg-white/5'}`}>
                            <Shield size={18} /> User Management
                        </button>
                    )}
                    
                    <div className="mt-auto">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 text-sm font-bold transition-colors">
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {activeTab === 'Profile' && (
                            <form onSubmit={handleUpdateProfile} className="max-w-md space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">My Profile</h3>
                                    <p className="text-sm text-slate-500 font-light">당신의 개인 정보를 관리하고 비밀번호를 업데이트하세요.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username (Read-only)</label>
                                        <input type="text" value={user?.username} disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-slate-500 font-mono text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 transition-all outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                                            <input type="text" value={dept} onChange={(e) => setDept(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 transition-all outline-none" placeholder="Engineer" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 transition-all outline-none" placeholder="name@example.com" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password (Optional)</label>
                                        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 transition-all outline-none" placeholder="Leave blank to keep current" />
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-cyan-400 transition-all disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    <span>Update Profile Info</span>
                                </button>
                            </form>
                        )}

                        {activeTab === 'Credentials' && (
                            <div className="max-w-md space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">API Credentials</h3>
                                    <p className="text-sm text-slate-500 font-light">외부 서비스를 연동하기 위한 토큰을 암호화하여 안전하게 보관합니다.</p>
                                </div>
                                <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Github size={24} className="text-indigo-400" />
                                        <span className="font-bold text-white">GitHub Personal Access Token</span>
                                    </div>
                                    <div className="space-y-2">
                                        <input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="ghp_************************" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-xs focus:border-indigo-500 transition-all outline-none" />
                                        <p className="text-[9px] text-slate-500 leading-tight px-1">토큰은 DB 내부에 AES-256-GCM 알고리즘으로 암호화되어 저장되며 분석 시에만 사용됩니다.</p>
                                    </div>
                                    <button onClick={handleSaveCredential} disabled={isLoading || !ghToken} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-30">Save Securely</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Admin' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">User Management</h3>
                                        <p className="text-sm text-slate-500 font-light">플랫폼 전체 사용자를 관리하고 권한을 부여합니다.</p>
                                    </div>
                                    <button className="flex items-center gap-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-white transition-all"><Plus size={14} /> Add User</button>
                                </div>
                                <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                                <th className="px-6 py-4">Identity</th>
                                                <th className="px-6 py-4">Name / Dept</th>
                                                <th className="px-6 py-4">Contact</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {users.map((u) => (
                                                <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 font-mono text-cyan-400">{u.username}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-200">{u.name}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">{u.department || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400">{u.email || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-500/20 text-slate-400 border border-white/10'}`}>{u.role}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button className="p-1.5 text-slate-500 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                                            <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === user?.id} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-0"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Feedback */}
                    {statusMsg.text && (
                        <div className={`mx-10 mb-6 p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-bottom-2 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            {statusMsg.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                            <span className="text-xs font-bold">{statusMsg.text}</span>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
        </div>
    );
};
