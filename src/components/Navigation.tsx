import React, { useState, useEffect } from 'react';
import { Bot, Menu, X, User, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind 클래스들을 조건부로 결합하고 병합하는 유틸리티 함수입니다.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface NavigationProps {
    onLoginClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onLoginClick }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useUser();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // [수정] 메인 페이지에서는 메뉴 링크를 노출하지 않음
    const navLinks: { name: string; href: string }[] = [];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5' : 'py-6 bg-transparent'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <a href="#" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                        <Bot size={24} />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-white uppercase italic">RepoInsight</span>
                </a>

                {/* Desktop Menu - Logo와 Sign In 버튼만 유지 */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                                <User size={14} className="text-cyan-400" />
                                <span className="text-xs font-bold text-slate-200">{user.name}</span>
                            </div>
                            <button onClick={logout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={onLoginClick} className="px-6 py-2.5 bg-white text-slate-950 rounded-xl font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95">
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};
