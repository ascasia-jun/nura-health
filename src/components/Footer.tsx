import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-[#0F1110] text-clay pt-24 pb-12 px-6 rounded-t-[4rem] relative overflow-hidden border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">

                <div className="space-y-6">
                    <div className="font-outfit text-2xl font-bold text-ivory tracking-tight">Nura Health</div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                        <span className="font-mono text-xs uppercase tracking-widest text-emerald-500/80">System Online</span>
                    </div>
                    <p className="font-outfit text-sm max-w-xs opacity-60">
                        Biological precision meets computational excellence. Next-generation health protocols.
                    </p>
                </div>

                <div className="flex gap-16 font-sans text-sm">
                    <div className="space-y-4">
                        <div className="font-mono text-xs uppercase tracking-widest text-moss font-bold">Platform</div>
                        <div className="space-y-2 flex flex-col">
                            <a href="#" className="hover:text-ivory transition-colors">Diagnostics</a>
                            <a href="#" className="hover:text-ivory transition-colors">Telemetry</a>
                            <a href="#" className="hover:text-ivory transition-colors">Protocols</a>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="font-mono text-xs uppercase tracking-widest text-moss font-bold">Company</div>
                        <div className="space-y-2 flex flex-col">
                            <a href="#" className="hover:text-ivory transition-colors">Manifesto</a>
                            <a href="#" className="hover:text-ivory transition-colors">Research</a>
                            <a href="#" className="hover:text-ivory transition-colors">Contact</a>
                        </div>
                    </div>
                </div>

            </div>

            <div className="w-full max-w-6xl mx-auto mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 font-outfit text-xs opacity-50">
                <div>&copy; {new Date().getFullYear()} Nura Health Inc. All rights reserved.</div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white">Privacy Policy</a>
                    <a href="#" className="hover:text-white">Terms of Protocol</a>
                </div>
            </div>
        </footer>
    );
};
