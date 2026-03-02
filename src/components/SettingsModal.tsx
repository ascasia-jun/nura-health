import React, { useState, useEffect } from 'react';
import { X, User, Shield, Key, Loader2, Save, Trash2, Plus, Building, Mail, Check, AlertCircle, Edit2, Github, LogOut, ExternalLink, Globe, Cpu, Database, Zap, Hash } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { API_URL } from '../config';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel: string;
    refreshModels: () => Promise<void>;
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
    availableModels: any[];
}> = ({ isOpen, onClose, onSuccess, mode, userData, currentUserId, availableModels }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        email: '',
        department: '',
        role: 'user',
        preferred_model: 'gemini-2.0-flash'
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
                role: userData.role || 'user',
                preferred_model: userData.preferred_model || 'gemini-2.0-flash'
            });
        } else {
            setFormData({ username: '', password: '', confirmPassword: '', name: '', email: '', department: '', role: 'user', preferred_model: 'gemini-2.0-flash' });
        }
        setError('');
    }, [mode, userData, isOpen]);

    const isPasswordMatched = formData.password === formData.confirmPassword;
    const canSave = mode === 'add' 
        ? (formData.username && formData.password && isPasswordMatched && formData.name && formData.email)
        : (formData.username && formData.name && formData.email && (formData.password ? isPasswordMatched : true));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSave) return;
        setIsLoading(true);
        try {
            const url = mode === 'add' ? `${API_URL}/api/admin/users` : `${API_URL}/api/admin/users/${userData.id}`;
            const method = mode === 'add' ? 'POST' : 'PUT';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId },
                body: JSON.stringify({ ...formData, password: formData.password || undefined })
            });
            if (res.ok) { onSuccess(); onClose(); }
            else { const data = await res.json(); setError(data.error || '처리 중 오류가 발생했습니다.'); }
        } catch (e) { setError('서버 통신 오류'); } finally { setIsLoading(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">{mode === 'add' ? <Plus size={18} /> : <Edit2 size={18} />}{mode === 'add' ? 'Add New Member' : 'Edit Member Profile'}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account ID*</label><input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} disabled={mode === 'edit'} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none disabled:opacity-50" placeholder="e.g. user01" /><p className="text-[9px] text-slate-600 px-1">로그인 시 사용되는 고유 식별자입니다.</p></div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role*</label><select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none">
                            <option value="user">USER</option><option value="admin">ADMIN</option>
                        </select><p className="text-[9px] text-slate-600 px-1">시스템 관리 권한 여부를 결정합니다.</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name*</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" placeholder="실명 입력" /><p className="text-[9px] text-slate-600 px-1">플랫폼 내에서 표시될 이름입니다.</p></div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" placeholder="부서명" /><p className="text-[9px] text-slate-600 px-1">소속된 팀 또는 조직 정보를 입력하세요.</p></div>
                    </div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address*</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" placeholder="name@company.com" /><p className="text-[9px] text-slate-600 px-1">알림 및 연락을 위한 공식 이메일입니다.</p></div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{mode === 'edit' ? 'Change PW (Opt)' : 'Password*'}</label><input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none" /></div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm PW</label><input type="password" value={formData.confirmPassword} onChange={(e) => setConfirmPw(e.target.value)} className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-white text-sm outline-none ${formData.confirmPassword && !isPasswordMatched ? 'border-red-500/50' : 'border-white/10'}`} /></div>
                    </div>

                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred AI Model</label><select value={formData.preferred_model} onChange={(e) => setFormData({...formData, preferred_model: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
                        {availableModels.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select><p className="text-[9px] text-slate-600 px-1">로그인 시 이 사용자에게 자동으로 적용될 기본 AI 엔진입니다.</p></div>

                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase transition-all">Cancel</button>
                        <button type="submit" disabled={isLoading || !canSave} className="flex-2 px-8 py-3 bg-cyan-500 text-slate-950 rounded-2xl text-xs font-black uppercase hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-glow">
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {mode === 'add' ? 'Create Member' : 'Apply Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentModel, refreshModels }) => {
    const { user, logout, updateLocalUser } = useUser();
    const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
    
    // Status & Loading
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    // State
    const [profileForm, setProfileForm] = useState({ name: '', email: '', dept: '', newPw: '', confirmPw: '' });
    const [credStatus, setCredStatus] = useState<any>({ github: false, gemini: false });
    const [ghToken, setGhToken] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [preferredModel, setPreferredModel] = useState(''); // [v3.8] 개별 상태로 관리
    const [isVerifying, setIsVerifying] = useState(false);
    const [publicRepoUrl, setPublicRepoUrl] = useState('');
    const [publicRepos, setPublicRepos] = useState<string[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    const [models, setModels] = useState<any[]>([]);

    // User Edit Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userModalMode, setUserModalMode] = useState<'add' | 'edit'>('add');
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        if (isOpen && user) {
            setProfileForm({ 
                name: user.name || '', email: user.email || '', dept: user.department || '', 
                newPw: '', confirmPw: '' 
            });
            setPreferredModel(user.preferred_model || 'gemini-2.0-flash');
            fetchCredentials();
            fetchPublicRepos();
            fetchModels();
            if (activeTab === 'Admin' && user.role === 'admin') fetchUsers();
        }
    }, [isOpen, activeTab, user]);

    const fetchModels = async () => {
        try {
            const res = await fetch(`${API_URL}/api/models`, { headers: { 'x-user-id': user?.id || '' } });
            const data = await res.json();
            if (data.models) setModels(data.models);
        } catch (e) {}
    };

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
        if (profileForm.newPw && profileForm.newPw !== profileForm.confirmPw) { setStatusMsg({ type: 'error', text: '비밀번호 확인이 일치하지 않습니다.' }); return; }
        setIsLoading(true);
        setStatusMsg({ type: '', text: '' });
        try {
            const res = await fetch(`${API_URL}/api/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ 
                    name: profileForm.name, 
                    email: profileForm.email, 
                    department: profileForm.dept, // [v3.8 Fix] department로 매핑
                    password: profileForm.newPw || undefined 
                })
            });
            if (res.ok) {
                setStatusMsg({ type: 'success', text: '프로필 정보가 저장되었습니다.' });
                updateLocalUser({ name: profileForm.name, email: profileForm.email, department: profileForm.dept });
            } else {
                const data = await res.json();
                setStatusMsg({ type: 'error', text: data.error || '저장 실패' });
            }
        } catch (e) { setStatusMsg({ type: 'error', text: '서버 통신 오류' }); } finally { setIsLoading(false); }
    };

    const handleSaveCred = async (serviceName: string, token: string) => {
        if (!token && serviceName !== 'gemini') return;
        setIsLoading(true);
        if (serviceName === 'gemini') setIsVerifying(true);
        try {
            const res = await fetch(`${API_URL}/api/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ 
                    serviceName, 
                    token, 
                    preferred_model: serviceName === 'gemini' ? preferredModel : undefined 
                })
            });
            if (res.ok) {
                setStatusMsg({ type: 'success', text: `${serviceName.toUpperCase()} 설정이 저장되었습니다.` });
                if (serviceName === 'github') setGhToken(''); else setGeminiKey('');
                fetchCredentials();
                if (serviceName === 'gemini') {
                    updateLocalUser({ preferred_model: preferredModel });
                    await refreshModels();
                }
            } else { const data = await res.json(); setStatusMsg({ type: 'error', text: data.error || '저장 실패' }); }
        } catch (e) { setStatusMsg({ type: 'error', text: '통신 오류' }); } finally { setIsLoading(false); setIsVerifying(false); }
    };

    const handleAddPublicRepo = async () => {
        if (!publicRepoUrl) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/github/public-repos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' }, body: JSON.stringify({ repoUrl: publicRepoUrl }) });
            if (res.ok) { setStatusMsg({ type: 'success', text: '공개 저장소 등록됨.' }); setPublicRepoUrl(''); fetchPublicRepos(); }
        } catch (e) {} finally { setIsLoading(false); }
    };

    const handleDeleteUser = async (targetId: string) => {
        if (!window.confirm('정말 이 사용자를 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${targetId}`, { method: 'DELETE', headers: { 'x-user-id': user?.id || '' } });
            if (res.ok) fetchUsers();
        } catch (e) {}
    };

    const openAddUser = () => { setUserModalMode('add'); setSelectedUser(null); setIsUserModalOpen(true); };
    const openEditUser = (u: any) => { setUserModalMode('edit'); setSelectedUser(u); setIsUserModalOpen(true); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[750px] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 font-sans relative">
                
                <div className="w-64 bg-black/20 border-r border-white/5 p-8 flex flex-col gap-2 shrink-0">
                    <div className="mb-10 px-2"><h2 className="text-2xl font-black text-white tracking-tighter italic uppercase flex items-center gap-2">Settings</h2><div className="h-1 w-12 bg-cyan-500 rounded-full mt-2" /></div>
                    <button onClick={() => setActiveTab('Profile')} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Profile' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><User size={16} /> My Profile</button>
                    <button onClick={() => setActiveTab('Credentials')} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Credentials' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Key size={16} /> Credentials</button>
                    {user?.role === 'admin' && (
                        <button onClick={() => setActiveTab('Admin')} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Admin' ? 'bg-amber-500 text-slate-950 shadow-glow' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Shield size={16} /> 계정관리</button>
                    )}
                    <div className="mt-auto"><button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3.5 text-slate-600 hover:text-red-400 text-xs font-black uppercase transition-all"><LogOut size={16} /> Sign Out</button></div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50 relative">
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        
                        {activeTab === 'Profile' && (
                            <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-10 animate-in slide-in-from-right-4 duration-300">
                                <div><h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">My Identity</h3><p className="text-sm text-slate-500 font-light">당신의 개인 프로필과 접속 권한을 최신화하세요.</p></div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account ID*</label><input type="text" value={user?.username} disabled className="w-full bg-black/30 border border-white/5 rounded-2xl px-5 py-4 text-slate-500 font-mono text-sm cursor-not-allowed" /><p className="text-[9px] text-slate-600 px-1">아이디는 변경할 수 없습니다.</p></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name*</label><input type="text" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 transition-all outline-none" /><p className="text-[9px] text-slate-600 px-1">서비스 내에서 표시될 실명을 입력하세요.</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email*</label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 transition-all outline-none" /><p className="text-[9px] text-slate-600 px-1">연락 가능한 업무용 이메일 주소입니다.</p></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label><input type="text" value={profileForm.dept} onChange={(e) => setProfileForm({...profileForm, dept: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 transition-all outline-none" /><p className="text-[9px] text-slate-600 px-1">소속된 팀 또는 부서 정보입니다. (선택)</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5 mt-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New PW</label><input type="password" value={profileForm.newPw} onChange={(e) => setProfileForm({...profileForm, newPw: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 transition-all outline-none" placeholder="비밀번호 변경 시 입력" /></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm PW</label><input type="password" value={profileForm.confirmPw} onChange={(e) => setProfileForm({...profileForm, confirmPw: e.target.value})} className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-500 outline-none ${profileForm.confirmPw && profileForm.newPw !== profileForm.confirmPw ? 'border-red-500/50' : 'border-white/10'}`} /></div>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-3 w-full bg-cyan-500 text-slate-950 font-black py-5 rounded-3xl hover:bg-white transition-all shadow-glow"><Save size={20} /> Sync Profile Info</button>
                            </form>
                        )}

                        {activeTab === 'Credentials' && (
                            <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                                <div><h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Credentials</h3><p className="text-sm text-slate-500 font-light">AI 엔진 및 개발 도구와의 지능형 연동 설계를 관리합니다.</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-[2.5rem] flex flex-col gap-6 relative overflow-hidden group">
                                        <div className="flex justify-between items-start"><div className="p-4 bg-cyan-500/20 rounded-2xl text-cyan-400"><Cpu size={32} /></div><div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${credStatus.gemini ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-500 border border-white/10'}`}>{credStatus.gemini ? 'Connected' : 'Not Linked'}</div></div>
                                        <div><div className="text-xl font-black text-white italic">Google Gemini</div><div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">AI Reasoning Engine</div></div>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">API Key</label><input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="Enter API Key" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none focus:border-cyan-500 transition-all" /><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-1 text-[9px] font-bold text-cyan-500 hover:text-white transition-colors uppercase tracking-tight"><ExternalLink size={10} /> Get API Key</a></div>
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Model</label><select value={preferredModel} onChange={(e) => setPreferredModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-cyan-500">{models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}</select></div>
                                            <button onClick={() => handleSaveCred('gemini', geminiKey)} disabled={isLoading} className="w-full bg-white text-slate-950 font-black py-3 rounded-xl text-xs uppercase hover:bg-cyan-400 transition-all disabled:opacity-30 flex items-center justify-center gap-2">{isVerifying ? <Loader2 size={14} className="animate-spin" /> : null}{isVerifying ? 'Verifying...' : 'Sync Gemini Config'}</button>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-[2rem] flex flex-col gap-6 relative overflow-hidden group">
                                        <div className="flex justify-between items-start"><div className="p-4 bg-indigo-500/20 rounded-2xl text-indigo-400"><Github size={32} /></div><div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${credStatus.github ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-500 border border-white/10'}`}>{credStatus.github ? 'Active' : 'Missing PAT'}</div></div>
                                        <div><div className="text-xl font-black text-white italic">GitHub Private</div><div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Personal Access Token</div></div>
                                        <div className="space-y-3"><div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Token</label><input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="ghp_****************" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none focus:border-indigo-500 transition-all" /></div><button onClick={() => handleSaveCred('github', ghToken)} disabled={isLoading || !ghToken} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase hover:bg-indigo-500 transition-all disabled:opacity-30">Save GitHub PAT</button></div>
                                    </div>
                                </div>
                                <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-8">
                                    <div className="flex justify-between items-end"><div><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-white/5 rounded-lg text-slate-400"><Globe size={20} /></div><h4 className="text-xl font-black text-white uppercase italic">Open Source Integration</h4></div><p className="text-xs text-slate-500 font-light">토큰 없이 URL 주소만으로 공개 리포지토리를 추가합니다.</p></div></div>
                                    <div className="flex gap-3"><input type="text" value={publicRepoUrl} onChange={(e) => setPublicRepoUrl(e.target.value)} placeholder="e.g. facebook/react" className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-white/30 transition-all" /><button onClick={handleAddPublicRepo} disabled={isLoading || !publicRepoUrl} className="px-8 bg-white text-slate-950 font-black rounded-2xl text-xs uppercase hover:bg-cyan-400 transition-all flex items-center gap-2"><Plus size={16} /> Add Repo</button></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{publicRepos.map(repo => (<div key={repo} className="flex justify-between items-center px-5 py-4 bg-white/5 border border-white/5 rounded-2xl group"><div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full" /><span className="text-xs font-mono text-slate-300">{repo}</span></div><button onClick={() => handleDeletePublicRepo(repo)} className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button></div>))}</div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Admin' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex flex-wrap md:flex-nowrap justify-between items-end gap-4 border-b border-white/5 pb-6">
                                    <div className="min-w-0">
                                        <h3 className="text-3xl font-black text-white mb-1 uppercase italic tracking-tighter truncate">계정관리</h3>
                                        <p className="text-xs text-slate-500 font-light truncate">조직 전체 사용자 계정을 제어하고 정책을 관리합니다.</p>
                                    </div>
                                    <button onClick={openAddUser} className="shrink-0 flex items-center gap-2 bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl text-xs font-black uppercase hover:bg-white transition-all shadow-glow"><Plus size={16} /> Add Member</button>
                                </div>
                                <div className="bg-black/20 border border-white/5 rounded-[2rem] overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]"><tr className="border-b border-white/5"><th className="px-8 py-6">User Identity</th><th className="px-8 py-6">Role / Dept</th><th className="px-8 py-6">Email</th><th className="px-8 py-6 text-right">Actions</th></tr></thead>
                                        <tbody className="text-xs">
                                            {users.map(u => (
                                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group/row">
                                                    <td className="px-8 py-5"><div className="font-black text-slate-200">{u.name}</div><div className="text-[10px] text-cyan-500 font-mono mt-0.5">{u.username}</div></td>
                                                    <td className="px-8 py-5"><div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-400'}`}>{u.role}</span><span className="text-[10px] text-slate-500 font-bold uppercase">{u.department || '-'}</span></div></td>
                                                    <td className="px-8 py-5 text-slate-400 font-medium">{u.email || '-'}</td>
                                                    <td className="px-8 py-5 text-right opacity-0 group-hover/row:opacity-100 transition-all">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={() => openEditUser(u)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={14} /></button>
                                                            <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === user?.id} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all disabled:opacity-0"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
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
                        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-4 rounded-3xl flex items-center gap-3 border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-[160] ${statusMsg.type === 'success' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}><Check size={20} /><span className="text-sm font-black italic uppercase tracking-tight">{statusMsg.text}</span><button onClick={() => setStatusMsg({type:'', text:''})} className="ml-4 opacity-50 hover:opacity-100"><X size={16} /></button></div>
                    )}
                </div>

                <button onClick={onClose} className="absolute top-10 right-10 p-3 text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl"><X size={24} /></button>
            </div>

            <UserEditModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                onSuccess={fetchUsers}
                mode={userModalMode}
                userData={selectedUser}
                currentUserId={user?.id || ''}
                availableModels={models}
            />
        </div>
    );
};
