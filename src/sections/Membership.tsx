import React from 'react';
import { Check } from 'lucide-react';

export const Membership: React.FC = () => {
    return (
        <section id="pricing" className="w-full bg-charcoal text-white py-32 px-6">
            <div className="w-full max-w-6xl mx-auto space-y-16">
                <div className="text-center space-y-6">
                    <p className="font-mono text-moss text-sm tracking-widest uppercase font-bold">Access Tiers</p>
                    <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-ivory">
                        시스템 멤버십
                    </h2>
                    <p className="font-outfit text-clay text-lg max-w-xl mx-auto">
                        Choose the diagnostic resolution that matches your operational needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Tier 1 */}
                    <div className="rounded-3xl border border-white/10 bg-[#1A1C1A] p-8 flex flex-col hover:border-moss/30 transition-colors">
                        <div className="mb-6">
                            <h3 className="font-sans text-2xl font-semibold text-ivory mb-2">Baseline</h3>
                            <p className="font-outfit text-clay text-sm">Essential biological telemetry</p>
                        </div>
                        <div className="mb-8">
                            <span className="font-mono text-4xl text-white tracking-tight">$99</span>
                            <span className="font-outfit text-clay text-sm"> / cycle</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {["Monthly diagnostics", "Base metabolic panel", "Standard telemetry sync"].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-outfit text-clay">
                                    <Check size={18} className="text-moss shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-4 rounded-xl border border-white/10 font-sans font-medium text-white hover:bg-white/5 transition-colors relative overflow-hidden group">
                            <span className="relative z-10">Initialize</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>

                    {/* Tier 2 */}
                    <div className="rounded-3xl bg-moss relative p-8 flex flex-col shadow-[0_0_40px_rgba(90,115,54,0.15)] transform md:-translate-y-4">
                        <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-ivory text-charcoal font-mono text-xs font-bold py-1 px-3 rounded-full uppercase tracking-wider">
                            Optimal
                        </div>
                        <div className="mb-6">
                            <h3 className="font-sans text-2xl font-semibold text-white mb-2">Performance</h3>
                            <p className="font-outfit text-white/80 text-sm">Advanced architectural intervention</p>
                        </div>
                        <div className="mb-8">
                            <span className="font-mono text-4xl text-white tracking-tight">$299</span>
                            <span className="font-outfit text-white/80 text-sm"> / cycle</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {["Continuous diagnostics", "Neural + Metabolic panel", "Real-time AI scheduler", "Priority protocol access"].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-outfit text-white/90">
                                    <Check size={18} className="text-white shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-4 rounded-xl bg-ivory font-sans font-semibold text-charcoal hover:scale-[1.02] transition-transform active:scale-[0.98]">
                            Deploy System
                        </button>
                    </div>

                    {/* Tier 3 */}
                    <div className="rounded-3xl border border-white/10 bg-[#1A1C1A] p-8 flex flex-col hover:border-moss/30 transition-colors">
                        <div className="mb-6">
                            <h3 className="font-sans text-2xl font-semibold text-ivory mb-2">Apex</h3>
                            <p className="font-outfit text-clay text-sm">Limitless systemic manipulation</p>
                        </div>
                        <div className="mb-8">
                            <span className="font-mono text-4xl text-white tracking-tight">$999</span>
                            <span className="font-outfit text-clay text-sm"> / cycle</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {["Unlimited diagnostics", "Full genome sequencing", "24/7 telemetry monitoring", "Custom cellular protocols", "Dedicated biochemist"].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-outfit text-clay">
                                    <Check size={18} className="text-moss shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-4 rounded-xl border border-white/10 font-sans font-medium text-white hover:bg-white/5 transition-colors relative overflow-hidden group">
                            <span className="relative z-10">Request Access</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
