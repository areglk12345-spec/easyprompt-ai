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
                className="relative group shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-[1.5px] shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 group-hover:scale-105"
                style={{ width: currentSize.icon, height: currentSize.icon }}
            >
                <div className="w-full h-full rounded-[10px] bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 flex items-center justify-center text-white overflow-hidden relative">
                    {/* Ambient Soft Glow */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-400/40 rounded-full blur-md"></div>
                    
                    {/* Vector AI Sparkle Prompt Icon */}
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3/5 h-3/5 text-white drop-shadow-sm">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" opacity="0.95" />
                        <path d="M19 2L20.2 5.8L24 7L20.2 8.2L19 12L17.8 8.2L14 7L17.8 5.8L19 2Z" fill="#38bdf8" />
                        <circle cx="6" cy="6" r="1.5" fill="#fbbf24" />
                    </svg>
                </div>
            </div>

            {/* Logo Brand Text */}
            {variant !== 'icon' && (
                <div className="flex items-center gap-1.5 font-black tracking-tight">
                    <span className={`${currentSize.text} bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-100 dark:to-slate-200 bg-clip-text text-transparent font-extrabold`}>
                        EasyPrompt
                    </span>
                    <span className={`${currentSize.badge} rounded-full bg-indigo-600 text-white font-extrabold uppercase tracking-wider shadow-xs`}>
                        AI
                    </span>
                </div>
            )}
        </div>
    );
}
