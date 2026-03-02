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

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'Protocols', href: '#protocols' },
        { name: 'Philosophy', href: '#philosophy' },
        { name: 'ChatOps', href: '#chatops' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5' : 'py-6 bg-transparent'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <a href="#" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                        <Bot size={24} />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-white uppercase">RepoInsight</span>
                </a>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a key={link.name} href={link.href} className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">
                            {link.name}
                        </a>
                    ))}
                    
                    <div className="h-4 w-px bg-white/10 mx-2" />

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
                        <button onClick={onLoginClick} className="px-6 py-2.5 bg-white text-slate-950 rounded-xl font-bold text-sm hover:bg-cyan-400 transition-all">
                            Sign In
                        </button>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-white/10 p-6 animate-in slide-in-from-top duration-300">
                    <div className="flex flex-col gap-6">
                        {navLinks.map((link) => (
                            <a key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-cyan-400 transition-colors">
                                {link.name}
                            </a>
                        ))}
                        {!user && (
                            <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="w-full py-4 bg-white text-slate-950 rounded-xl font-bold">
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};
