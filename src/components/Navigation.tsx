import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LoginModal } from './LoginModal';
import { useUser } from '../context/UserContext';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Navigation: React.FC = () => {
    const { isLoggedIn, logout } = useUser();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className="fixed top-0 inset-x-0 z-50 flex justify-center p-6 pointer-events-none">
            <div
                className={cn(
                    "pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ease-out w-full max-w-5xl",
                    isScrolled
                        ? "bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-sm text-slate-100"
                        : "bg-transparent text-white"
                )}
            >
                <div className={cn("text-xl font-bold tracking-tight font-outfit", isScrolled ? "text-cyan-400" : "text-white")}>
                    AI Dev. Life
                </div>

                <div className="hidden md:flex items-center space-x-8 text-sm font-medium font-sans">
                    <a href="#tools" className="hover:opacity-70 transition-opacity">Tools</a>
                    <a href="#protocols" className="hover:opacity-70 transition-opacity">기능</a>
                    {isLoggedIn ? (
                        <button 
                            onClick={logout}
                            className={cn(
                                "px-5 py-2 rounded-full transition-colors font-mono text-xs",
                                isScrolled
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                                    : "bg-white/10 text-white hover:bg-white/20"
                            )}
                        >
                            Terminate Session
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsLoginModalOpen(true)}
                            className={cn(
                                "px-5 py-2 rounded-full transition-colors",
                                isScrolled
                                    ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400"
                                    : "bg-white text-slate-900 hover:bg-white/90"
                            )}
                        >
                            Access System
                        </button>
                    )}
                </div>

                <button
                    className="md:hidden"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu (simplified for now) */}
            {isMenuOpen && (
                <div className="absolute top-24 left-6 right-6 bg-slate-900 text-white rounded-2xl p-6 flex flex-col space-y-4 pointer-events-auto md:hidden shadow-xl border border-white/10 backdrop-blur-md bg-slate-900/90">
                    <a href="#tools" className="text-lg">Tools</a>
                    <a href="#protocols" className="text-lg">기능</a>
                </div>
            )}

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </nav>
    );
};
