'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFontSize } from '../context/FontSizeContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, User, LogOut, LogIn, Settings, Zap, Globe, ChevronDown, Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMenu() {
    const { user, logout, isLoggedIn, activeWorkspace, switchWorkspace, openLoginModal } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();
    const { fontSize } = useFontSize();
    const { themeMode, setThemeMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeWorkspace) {
            document.title = `EasyPrompt AI - Workspace: ${activeWorkspace}`;
        }
    }, [activeWorkspace]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoggedIn && user) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 sm:px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md transition-all focus:outline-none"
                >
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="hidden sm:inline-block max-w-[100px] truncate text-sm">{user.full_name || user.username}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10, transformOrigin: 'bottom left' }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                            className="absolute left-2 bottom-full mb-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-premium dark:shadow-premium-dark border border-slate-100 dark:border-slate-800 z-50 overflow-hidden"
                        >
                            {/* Header Profile Info */}
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.full_name || user.username}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email || 'user@example.com'}</p>
                            </div>

                            {/* Credits & Workspace */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
                            {/* Theme Toggle */}
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                                    <button
                                        onClick={() => setThemeMode('light')}
                                        className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${themeMode === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                        title="โหมดสว่าง (Light)"
                                    >
                                        <Sun className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setThemeMode('system')}
                                        className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${themeMode === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                        title="ตามระบบ (System)"
                                    >
                                        <Monitor className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setThemeMode('dark')}
                                        className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${themeMode === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                        title="โหมดมืด (Dark)"
                                    >
                                        <Moon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                                <div className="space-y-1.5">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('menu.workspace')}</span>
                                    <div className="relative">
                                        <select
                                            aria-label={t('menu.workspace')}
                                            value={activeWorkspace}
                                            onChange={(e) => switchWorkspace(e.target.value)}
                                            className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 py-1.5 pl-2.5 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
                                        >
                                            <option value="ทั่วไป">{t('menu.workspace.personal')}</option>
                                            <option value="ทีม Marketing">{t('menu.workspace.marketing')}</option>
                                            <option value="ทีม HR">{t('menu.workspace.hr')}</option>
                                            <option value="ทีม Developer">{t('menu.workspace.dev')}</option>
                                        </select>
                                        <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Menu Actions */}
                            <div className="p-2 space-y-1">
                                <Link
                                    href="/settings"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex items-center gap-2 px-2 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer hover-spring"
                                >
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    {t('menu.settings.label')}
                                </Link>


                            </div>
                            
                            {/* Logout */}
                            <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => { setIsOpen(false); logout(); }}
                                    className="w-full flex items-center gap-2 px-2 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors text-left hover-spring"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('menu.logout')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={openLoginModal}
                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-blue-200 dark:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 rounded-full cursor-pointer flex items-center gap-1 shadow-sm hover:scale-[1.02] active:scale-[0.98] px-3 py-1.5 text-sm"
            >
                <LogIn className="w-4 h-4" />
                <span>{t('menu.login')}</span>
            </button>
        </div>
    );
}
