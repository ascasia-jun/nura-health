import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Navigation: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                        ? "bg-white/70 backdrop-blur-md border border-[var(--color-moss)]/20 shadow-sm text-charcoal"
                        : "bg-transparent text-white"
                )}
            >
                <div className={cn("text-xl font-bold tracking-tight font-outfit", isScrolled ? "text-[var(--color-moss)]" : "text-white")}>
                    Nura Health
                </div>

                <div className="hidden md:flex items-center space-x-8 text-sm font-medium font-sans">
                    <a href="#features" className="hover:opacity-70 transition-opacity">Features</a>
                    <a href="#philosophy" className="hover:opacity-70 transition-opacity">Philosophy</a>
                    <a href="#protocols" className="hover:opacity-70 transition-opacity">Protocols</a>
                    <button className={cn(
                        "px-5 py-2 rounded-full transition-colors",
                        isScrolled
                            ? "bg-[var(--color-moss)] text-white hover:bg-[var(--color-moss)]/90"
                            : "bg-white text-[var(--color-charcoal)] hover:bg-white/90"
                    )}>
                        Access System
                    </button>
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
                <div className="absolute top-24 left-6 right-6 bg-charcoal text-white rounded-2xl p-6 flex flex-col space-y-4 pointer-events-auto md:hidden shadow-xl border border-white/10 backdrop-blur-md bg-charcoal/90">
                    <a href="#features" className="text-lg">Features</a>
                    <a href="#philosophy" className="text-lg">Philosophy</a>
                    <a href="#protocols" className="text-lg">Protocols</a>
                </div>
            )}
        </nav>
    );
};
