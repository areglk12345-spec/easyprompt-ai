'use client';

import React from 'react';

interface LogoProps {
    variant?: 'full' | 'icon' | 'badge';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export default function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
    const sizeMap = {
        sm: { icon: 32, text: 'text-base', badge: 'text-[9px] px-1.5 py-0.5' },
        md: { icon: 38, text: 'text-xl', badge: 'text-[10px] px-2 py-0.5' },
        lg: { icon: 44, text: 'text-2xl', badge: 'text-xs px-2.5 py-1' },
        xl: { icon: 56, text: 'text-3xl', badge: 'text-sm px-3 py-1' },
    };

    const currentSize = sizeMap[size];

    return (
        <div className={`flex items-center gap-2.5 select-none ${className}`}>
            {/* Logo Emblem SVG Icon */}
            <div
                className="relative group shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-cyan-400 p-[1.5px] shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 group-hover:scale-105"
                style={{ width: currentSize.icon, height: currentSize.icon }}
            >
                <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center text-white overflow-hidden relative">
                    {/* Ambient Soft Glow */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-400/40 rounded-full blur-md"></div>

                    {/* "V" Wordmark Emblem — checkmark-style dual stroke, brand gradient */}
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4/5 h-4/5 drop-shadow-sm">
                        <defs>
                            <linearGradient id="verbaqo-v-left" x1="4" y1="4" x2="12" y2="18" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#4338ca" />
                            </linearGradient>
                            <linearGradient id="verbaqo-v-right" x1="12" y1="18" x2="20" y2="3" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="55%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#38bdf8" />
                            </linearGradient>
                        </defs>
                        <line x1="4.5" y1="4.5" x2="11.5" y2="17.5" stroke="url(#verbaqo-v-left)" strokeWidth="4.2" strokeLinecap="round" />
                        <line x1="11.5" y1="17.5" x2="19.5" y2="3" stroke="url(#verbaqo-v-right)" strokeWidth="4.2" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            {/* Logo Brand Text */}
            {variant !== 'icon' && (
                <div className="flex items-center gap-1.5 font-black tracking-tight">
                    <span className={`${currentSize.text} bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-100 dark:to-slate-200 bg-clip-text text-transparent font-extrabold`}>
                        Verbaqo
                    </span>
                    <span className={`${currentSize.badge} rounded-full bg-indigo-600 text-white font-extrabold uppercase tracking-wider shadow-xs`}>
                        AI
                    </span>
                </div>
            )}
        </div>
    );
}
