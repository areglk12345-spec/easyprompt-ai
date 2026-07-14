'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, Sun, Monitor } from 'lucide-react';
import FontSizeToggle from './FontSizeToggle';
import { useFontSize } from '../context/FontSizeContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface AdminSidebarProps {
    activePage?: 'dashboard' | 'users' | 'settings' | 'audit' | 'variables' | 'templates';
}

export default function AdminSidebar({ activePage }: AdminSidebarProps) {
    const { fontSize, toggleFontSize } = useFontSize();
    const { isDarkMode, themeMode, setThemeMode } = useTheme();
    const { user } = useAuth();
    
    const activeClass = "flex items-center gap-4 py-3 px-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold transition-all border border-indigo-100 dark:border-indigo-800/50";
    const inactiveClass = "flex items-center gap-4 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-semibold transition-all";

    const themeIcon = themeMode === 'system' ? <Monitor className="w-4 h-4" /> : isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
    const themeLabel = themeMode === 'system' ? 'Auto' : isDarkMode ? 'Dark' : 'Light';

    return (
        <aside className={`hidden md:flex flex-col h-screen py-8 px-6 bg-slate-50/50 dark:bg-slate-900/80 border-r border-outline-variant/40 dark:border-slate-700/50 sticky top-0 ${fontSize === 'large' ? 'w-80' : 'w-72'} shrink-0 z-40 transition-all duration-300 ease-in-out`}>
            <div className="flex items-center space-x-3 px-2 mb-10">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        <span className="material-symbols-outlined !font-bold text-xl">admin_panel_settings</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Admin Center</h1>
                        <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">{user?.organization || 'Workspace'}</p>
                    </div>
                </div>
            </div>
            
            <nav className="flex-1 space-y-2">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 px-2 uppercase tracking-wider">Overview</div>
                <Link href="/dashboard" className={activePage === 'dashboard' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-[15px]">แดชบอร์ดสถิติ</span>
                </Link>
                
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-6 mb-4 px-2 uppercase tracking-wider">Organization</div>
                <Link href="/admin?tab=users" className={activePage === 'users' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">group</span>
                    <span className="text-[15px]">ผู้ใช้งานระบบ</span>
                </Link>
                <Link href="/admin?tab=settings" className={activePage === 'settings' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-[15px]">ตั้งค่าองค์กร</span>
                </Link>
                <Link href="/admin?tab=variables" className={activePage === 'variables' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">code</span>
                    <span className="text-[15px]">ตัวแปร Prompt</span>
                </Link>
                <Link href="/admin?tab=audit" className={activePage === 'audit' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">history</span>
                    <span className="text-[15px]">Audit Logs</span>
                </Link>
                
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-6 mb-4 px-2 uppercase tracking-wider">Content</div>
                <Link href="/admin?tab=templates" className={activePage === 'templates' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    <span className="text-[15px]">จัดการ Template</span>
                </Link>
            </nav>

            <div className="pt-6 mt-auto space-y-4">
                <Link 
                    href="/chat" 
                    className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    กลับสู่โหมดผู้ใช้งาน
                </Link>

                <div className="border-t border-outline-variant/30 dark:border-slate-700/50 pt-3 space-y-3">
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm flex items-center gap-2">
                            {themeIcon}
                            {themeLabel}
                        </span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
                            <button
                                onClick={() => setThemeMode('light')}
                                className={`p-1.5 rounded-md transition-all ${themeMode === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                            >
                                <Sun className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            <button
                                onClick={() => setThemeMode('system')}
                                className={`p-1.5 rounded-md transition-all ${themeMode === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                            >
                                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <button
                                onClick={() => setThemeMode('dark')}
                                className={`p-1.5 rounded-md transition-all ${themeMode === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                            >
                                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                            </button>
                        </div>
                    </div>
                    {/* Font Size Toggle */}
                    <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Text Size</span>
                        <FontSizeToggle isLarge={fontSize === 'large'} onToggle={toggleFontSize} />
                    </div>
                </div>
            </div>
        </aside>
    );
}
