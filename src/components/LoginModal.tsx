import React, { useState } from 'react';
import { X, Lock, User, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useUser();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !pw) {
            setError('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await login(id, pw);
            if (result.success) {
                window.location.hash = '#chatops';
                onClose();
                setId('');
                setPw('');
            } else {
                // 서버에서 전달받은 구체적인 에러 메시지 표시 (비밀번호 불일치 등)
                setError(result.error || '로그인에 실패했습니다.');
            }
        } catch (err) {
            setError('시스템 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
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
                    <p className="text-slate-400 text-sm">RepoInsight 플랫폼에 로그인하세요.</p>
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
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
                                placeholder="Enter ID (hint: admin)"
                                disabled={isLoading}
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
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
                                placeholder="Enter Password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyan-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <span>Initialize Analysis Session</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
