import React, { useState, useEffect } from 'react';
import { X, User, Shield, Key, Loader2, Save, Trash2, Plus, Building, Mail, Check, AlertCircle, Edit2, Github, LogOut, ChevronRight, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel: string;
}

type SettingsTab = 'Profile' | 'Admin' | 'Credentials';

/**
 * [v3.8 Refinement] 사용자 추가 및 수정을 위한 통합 팝업 컴포넌트
 */
const UserEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mode: 'add' | 'edit';
    userData?: any;
    currentUserId: string;
}> = ({ isOpen, onClose, onSuccess, mode, userData, currentUserId }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        email: '',
        department: '',
        role: 'user'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && userData) {
            setFormData({
                username: userData.username || '',
                password: '',
                confirmPassword: '',
                name: userData.name || '',
                email: userData.email || '',
                department: userData.department || '',
                role: userData.role || 'user'
            });
        } else {
            setFormData({ username: '', password: '', confirmPassword: '', name: '', email: '', department: '', role: 'user' });
        }
        setError('');
    }, [mode, userData, isOpen]);

    const isPasswordMatched = formData.password === formData.confirmPassword;
    const canSave = mode === 'add' 
        ? (formData.username && formData.password && isPasswordMatched && formData.name)
        : (formData.username && formData.name && (formData.password ? isPasswordMatched : true));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSave) return;
        
        setIsLoading(true);
        setError('');
        try {
            const url = mode === 'add' ? `${API_URL}/api/admin/users` : `${API_URL}/api/admin/users/${userData.id}`;
            const method = mode === 'add' ? 'POST' : 'PUT';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId },
                body: JSON.stringify({
                    ...formData,
                    password: formData.password || undefined
                })
            });
            const data = await res.json();
            if (res.ok) {
                onSuccess();
                onClose();
            } else { setError(data.error || '처리 중 오류가 발생했습니다.'); }
        } catch (e) { setError('서버 통신 오류가 발생했습니다.'); } finally { setIsLoading(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                        {mode === 'add' ? <Plus size={18} /> : <Edit2 size={18} />}
                        {mode === 'add' ? 'Add New User' : 'Edit User Profile'}
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account ID</label>
                            <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} disabled={mode === 'edit'} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none disabled:opacity-50" placeholder="e.g. jdoe" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role</label>
                            <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none appearance-none cursor-pointer">
                                <option value="user">USER</option>
                                <option value="admin">ADMIN</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" placeholder="John Doe" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                            <input type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" placeholder="Dev Team" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" placeholder="john@example.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                {mode === 'edit' ? 'Change Password (Opt)' : 'Password'}
                            </label>
                            <div className="relative">
                                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all ${formData.password && isPasswordMatched ? 'border-emerald-500/50' : 'border-white/10 focus:border-cyan-500'}`} />
                                {formData.password && isPasswordMatched && <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative">
                                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all ${formData.confirmPassword && !isPasswordMatched ? 'border-red-500/50' : formData.confirmPassword && isPasswordMatched ? 'border-emerald-500/50' : 'border-white/10 focus:border-cyan-500'}`} />
                                {formData.confirmPassword && !isPasswordMatched && <AlertCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                                {formData.confirmPassword && isPasswordMatched && <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                            </div>
                        </div>
                    </div>
                    {formData.confirmPassword && !isPasswordMatched && <p className="text-[10px] text-red-400 font-bold ml-1 italic">비밀번호가 일치하지 않습니다.</p>}
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase transition-all">Cancel</button>
                        <button type="submit" disabled={isLoading || !canSave} className="flex-2 px-8 py-3 bg-cyan-500 text-slate-950 rounded-2xl text-xs font-black uppercase hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-glow">
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {mode === 'add' ? 'Create User' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentModel }) => {
    const { user, logout, updateLocalUser } = useUser();
    const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dept, setDept] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    
    const [users, setUsers] = useState<any[]>([]);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    
    const [ghToken, setGhToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // User Edit Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userModalMode, setUserModalMode] = useState<'add' | 'edit'>('add');
    const [selectedUser, setSelectedUser] = useState<any>(null);

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
            const res = await fetch(`${API_URL}/api/admin/users`, { headers: { 'x-user-id': user?.id || '' } });
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (e) { console.error('목록 로드 실패'); } finally { setIsAdminLoading(false); }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPw && newPw !== confirmPw) { setStatusMsg({ type: 'error', text: '비밀번호 확인이 일치하지 않습니다.' }); return; }
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
                updateLocalUser({ name, email, department: dept });
                setNewPw(''); setConfirmPw('');
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
            if (res.ok) { setStatusMsg({ type: 'success', text: 'GitHub 토큰이 저장되었습니다.' }); setGhToken(''); }
        } catch (e) { setStatusMsg({ type: 'error', text: '저장 실패' }); } finally { setIsLoading(false); }
    };

    const handleDeleteUser = async (targetId: string) => {
        if (!window.confirm('정말 이 사용자를 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${targetId}`, { method: 'DELETE', headers: { 'x-user-id': user?.id || '' } });
            if (res.ok) fetchUsers();
        } catch (e) { alert('삭제 실패'); }
    };

    const openAddUser = () => { setUserModalMode('add'); setSelectedUser(null); setIsUserModalOpen(true); };
    const openEditUser = (u: any) => { setUserModalMode('edit'); setSelectedUser(u); setIsUserModalOpen(true); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[650px] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 font-sans relative">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-2 shrink-0">
                    <div className="mb-8 px-2">
                        <h2 className="text-xl font-bold text-white tracking-tight italic uppercase">Settings</h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">RepoInsight Enterprise</p>
                    </div>
                    <button onClick={() => setActiveTab('Profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${activeTab === 'Profile' ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:bg-white/5'}`}><User size={16} /> My Profile</button>
                    <button onClick={() => setActiveTab('Credentials')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${activeTab === 'Credentials' ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:bg-white/5'}`}><Key size={16} /> Credentials</button>
                    {user?.role === 'admin' && (
                        <button onClick={() => setActiveTab('Admin')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${activeTab === 'Admin' ? 'bg-amber-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:bg-white/5'}`}><Shield size={16} /> Admin Center</button>
                    )}
                    <div className="mt-auto pt-6 border-t border-white/5"><button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 text-xs font-black uppercase transition-colors"><LogOut size={16} /> Sign Out</button></div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {activeTab === 'Profile' && (
                            <form onSubmit={handleUpdateProfile} className="max-w-md space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div><h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">My Identity</h3><p className="text-sm text-slate-500 font-light">개인 정보를 최신화하고 접속 암호를 관리하세요.</p></div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username (ID)</label><input type="text" value={user?.username} disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-slate-500 font-mono text-sm" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none" /></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label><input type="text" value={dept} onChange={(e) => setDept(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none" /></div>
                                    </div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New PW</label><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none" placeholder="Change?" /></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm</label><input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none ${confirmPw && newPw !== confirmPw ? 'border-red-500/50' : 'border-white/10'}`} /></div>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-cyan-400 transition-all disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    <span>Sync Profile Info</span>
                                </button>
                            </form>
                        )}

                        {activeTab === 'Credentials' && (
                            <div className="max-w-md space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div><h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">API Context</h3><p className="text-sm text-slate-500 font-light">GitHub 데이터 분석을 위한 전용 액세스 토큰을 보관합니다.</p></div>
                                <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl space-y-6">
                                    <div className="flex items-center gap-3"><div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><Github size={24} /></div><div><div className="font-black text-white text-sm">GitHub Connector</div><div className="text-[9px] text-slate-500 uppercase tracking-widest">Personal Access Token</div></div></div>
                                    <div className="space-y-2"><input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="ghp_************************" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-xs focus:border-indigo-500 transition-all outline-none" /><p className="text-[9px] text-slate-500 leading-tight px-1 italic">※ 토큰은 서버 사이드에서 AES-256-GCM 알고리즘으로 강력하게 암호화됩니다.</p></div>
                                    <button onClick={handleSaveCredential} disabled={isLoading || !ghToken} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-500 transition-all disabled:opacity-30 shadow-lg shadow-indigo-500/20">Securely Save Token</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Admin' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                {/* [v3.8 Refinement] 타이틀 레이아웃 깨짐 방지 - flex-nowrap 및 items-end 정렬 */}
                                <div className="flex flex-wrap md:flex-nowrap justify-between items-end gap-4 border-b border-white/5 pb-6">
                                    <div className="min-w-0">
                                        <h3 className="text-2xl font-black text-white mb-1 uppercase italic tracking-tighter truncate">User Governance</h3>
                                        <p className="text-xs text-slate-500 font-light truncate">조직 전체 사용자 계정을 제어하고 정책을 관리합니다.</p>
                                    </div>
                                    <button onClick={openAddUser} className="shrink-0 flex items-center gap-2 bg-amber-500 text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase hover:bg-white transition-all shadow-glow"><Plus size={14} /> Add Member</button>
                                </div>
                                <div className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead><tr className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]"><th className="px-6 py-5">Identity</th><th className="px-6 py-5">Name / Dept</th><th className="px-6 py-5">Contact</th><th className="px-6 py-5">Role</th><th className="px-6 py-5 text-right">Control</th></tr></thead>
                                        <tbody className="text-xs">
                                            {users.map((u) => (
                                                <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 font-mono text-cyan-400 font-bold">{u.username}</td>
                                                    <td className="px-6 py-4"><div className="font-black text-slate-200">{u.name}</div><div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{u.department || 'No Dept'}</div></td>
                                                    <td className="px-6 py-4 text-slate-400 font-medium">{u.email || '-'}</td>
                                                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-500/20 text-slate-400 border border-white/10'}`}>{u.role}</span></td>
                                                    <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => openEditUser(u)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={14} /></button><button onClick={() => handleDeleteUser(u.id)} disabled={u.id === user?.id} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all disabled:opacity-0"><Trash2 size={14} /></button></div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {isAdminLoading && <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>}
                                </div>
                            </div>
                        )}
                    </div>

                    {statusMsg.text && (
                        <div className={`mx-10 mb-6 p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-bottom-2 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}><Check size={18} /><span className="text-xs font-bold">{statusMsg.text}</span></div>
                    )}
                </div>

                <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl"><X size={20} /></button>
            </div>

            {/* 사용자 추가/수정 전용 팝업 */}
            <UserEditModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                onSuccess={fetchUsers}
                mode={userModalMode}
                userData={selectedUser}
                currentUserId={user?.id || ''}
            />
        </div>
    );
};
