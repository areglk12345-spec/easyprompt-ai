'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFontSize } from '../context/FontSizeContext';
import { Building2, User, LogOut, LogIn, Settings, Zap } from 'lucide-react';

export default function UserMenu() {
    const { user, logout, isLoggedIn, activeWorkspace, switchWorkspace } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();
    const { fontSize } = useFontSize();

    const isLarge = fontSize === 'large';
    const textSize = isLarge ? 'text-lg' : 'text-sm';
    const buttonPadding = isLarge ? 'px-4 py-2' : 'px-3 py-1.5';

    useEffect(() => {
        if (activeWorkspace) {
            document.title = `EasyPrompt AI - Workspace: ${activeWorkspace}`;
        }
    }, [activeWorkspace]);

    const LanguageToggle = () => (
        <button
            onClick={toggleLanguage}
            className={`font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 rounded-full cursor-pointer flex items-center justify-center shadow-sm hover:scale-[1.02] active:scale-[0.98] ${buttonPadding} ${textSize}`}
            title="Toggle Language"
        >
            {language === 'th' ? 'TH' : 'EN'}
        </button>
    );

    if (isLoggedIn && user) {
        const hasOrg = user.organization && user.organization !== 'ทั่วไป';
        return (
            <div className="flex items-center gap-3">
                <LanguageToggle />
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-full font-bold text-blue-700 dark:text-blue-300 shadow-sm ${textSize}`}>
                        <User className="w-4 h-4" />
                        <span>{user.full_name || user.username}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800 rounded-full font-bold text-amber-600 dark:text-amber-400 shadow-sm cursor-pointer hover:bg-amber-100/70 transition-colors ${textSize}`} title="ยอดเครดิตคงเหลือ (คลิกเพื่อเติมเงิน)">
                        <Zap className="w-4 h-4 fill-amber-500" />
                        <span>{user.credits ?? 0}</span>
                    </div>
                    <div className="relative flex items-center hidden md:flex">
                        <select
                            aria-label="เลือก Workspace"
                            value={activeWorkspace}
                            onChange={(e) => switchWorkspace(e.target.value)}
                            className={`appearance-none bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-full font-bold text-indigo-700 dark:text-indigo-300 shadow-sm cursor-pointer pl-4 pr-10 focus:outline-none focus:ring-4 focus:ring-indigo-500 ${buttonPadding} ${textSize}`}
                        >
                            <option value="ทั่วไป">ทั่วไป (Personal)</option>
                            <option value="ทีม Marketing">ทีม Marketing</option>
                            <option value="ทีม HR">ทีม HR</option>
                            <option value="ทีม Developer">ทีม Developer</option>
                        </select>
                        <Building2 className="w-4 h-4 text-indigo-500 absolute right-3 pointer-events-none" />
                    </div>
                </div>

                <Link
                    href="/settings"
                    className={`font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-full cursor-pointer flex items-center gap-1 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${buttonPadding} ${textSize}`}
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </Link>

                <button
                    onClick={logout}
                    className={`font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors border border-rose-200 dark:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/40 rounded-full cursor-pointer flex items-center gap-1 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${buttonPadding} ${textSize}`}
                >
                    <LogOut className="w-4 h-4" />
                    <span>{t('menu.logout')}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
                href="/login"
                className={`font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-blue-200 dark:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 rounded-full cursor-pointer flex items-center gap-1 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${buttonPadding} ${textSize}`}
            >
                <LogIn className="w-4 h-4" />
                <span>{t('menu.login')}</span>
            </Link>
        </div>
    );
}
