'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
    variant?: 'full' | 'icon' | 'badge';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export default function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
    const sizeMap = {
        sm: { icon: 28, text: 'text-sm', badge: 'text-[9px] px-1.5 py-0.5' },
        md: { icon: 36, text: 'text-lg', badge: 'text-[10px] px-2 py-0.5' },
        lg: { icon: 48, text: 'text-2xl', badge: 'text-xs px-2.5 py-1' },
        xl: { icon: 64, text: 'text-3xl', badge: 'text-sm px-3 py-1' },
    };

    const currentSize = sizeMap[size];

    return (
        <div className={`flex items-center gap-2.5 select-none ${className}`}>
            {/* Logo Emblem Icon */}
            <div className="relative group shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-300"></div>
                <div 
                    className="relative rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-slate-900 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{ width: currentSize.icon, height: currentSize.icon }}
                >
                    <Image 
                        src="/logo.png" 
                        alt="EasyPrompt AI Logo" 
                        width={currentSize.icon * 2} 
                        height={currentSize.icon * 2}
                        className="object-cover w-full h-full transform scale-110"
                        priority
                    />
                </div>
            </div>

            {/* Logo Brand Text */}
            {variant !== 'icon' && (
                <div className="flex items-center gap-1.5 font-black tracking-tight">
                    <span className={`${currentSize.text} bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent drop-shadow-sm`}>
                        EasyPrompt
                    </span>
                    <span className={`${currentSize.badge} rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-extrabold shadow-sm tracking-wide`}>
                        AI
                    </span>
                </div>
            )}
        </div>
    );
}
