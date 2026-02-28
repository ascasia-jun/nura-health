import React, { useState } from 'react';
import { X, Lock, User } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');
    const { login } = useUser();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(id, pw)) {
            onClose();
            setId('');
            setPw('');
            setError('');
        } else {
            setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
            <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">System Access</h2>
                    <p className="text-slate-400 text-sm">AI-DLC 플랫폼에 로그인하세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-cyan-500 uppercase tracking-wider">Identity</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Enter ID"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-cyan-500 uppercase tracking-wider">Passcode</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="password" 
                                value={pw}
                                onChange={(e) => setPw(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Enter Password"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs text-center">{error}</p>
                    )}

                    <button 
                        type="submit"
                        className="w-full bg-cyan-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                        Initialize Session
                    </button>
                </form>
            </div>
        </div>
    );
};