'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import UserMenu from '../../components/UserMenu';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';
import { usePromptActions } from '../../hooks/usePromptActions';
import HelpTooltip from '../../components/HelpTooltip';

type ChatHistory = {
    id: number;
    session_id: string;
    user_message: string;
    agent_response: string;
    fitted_prompt: string | null;
    tone: string | null;
    easy_language: boolean;
    created_at: string;
};

export default function HistoryPage() {
    const { authFetch, user, isLoggedIn, openLoginModal } = useAuth();
    const { t } = useLanguage();
    const { fontSize } = useFontSize();
    const { logActivity, copyToClipboard, downloadAsTxt, saveToTemplate, exportToPlatform } = usePromptActions();

    const [history, setHistory] = useState<ChatHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const textSize = fontSize === 'large' ? 'text-2xl' : 'text-base';

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                const urlSid = searchParams?.get('session_id');
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const url = urlSid 
                    ? `${API_URL}/api/history/?session_id=${urlSid}` 
                    : `${API_URL}/api/history/`;
                const response = await authFetch(url);
                if (!response.ok) throw new Error('Failed to fetch history');
                const data = await response.json();
                setHistory(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [authFetch]);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('th-TH', options);
    };

    // Filter query logic
    const filteredHistory = history.filter(item => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            item.user_message.toLowerCase().includes(query) ||
            item.agent_response.toLowerCase().includes(query) ||
            (item.fitted_prompt && item.fitted_prompt.toLowerCase().includes(query)) ||
            (item.tone && item.tone.toLowerCase().includes(query))
        );
    });

    // Helper to get matching icons and background colors based on history action category
    const getCategoryStyles = (item: ChatHistory) => {
        if (item.fitted_prompt) {
            if (item.tone === 'วิชาการ' || item.tone === 'การเรียนรู้') {
                return { icon: 'menu_book', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' };
            }
            if (item.tone === 'ทางการ' || item.tone === 'โหมดทำงาน') {
                return { icon: 'corporate_fare', color: 'bg-blue-100 text-blue-600 border-blue-200' };
            }
            return { icon: 'auto_fix_high', color: 'bg-primary-fixed text-primary border-primary/20' };
        }
        return { icon: 'chat', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    };

    // Grouping by Date: Today vs Earlier
    const getGroupedHistory = () => {
        const today: ChatHistory[] = [];
        const earlier: ChatHistory[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        filteredHistory.forEach(item => {
            const itemDate = new Date(item.created_at);
            itemDate.setHours(0, 0, 0, 0);
            if (itemDate.getTime() === now.getTime()) {
                today.push(item);
            } else {
                earlier.push(item);
            }
        });

        return { today, earlier };
    };

    const { today, earlier } = getGroupedHistory();

    return (
        <div className={`min-h-screen bg-transparent transition-all duration-300 ${textSize}`}>
            <div className="flex min-h-screen">
                <Sidebar activePage="history" />

                <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-y-auto h-screen relative custom-scrollbar transition-colors duration-300">
                    {/* Top AppBar */}
                    <header className="h-20 flex items-center justify-between px-6 md:px-12 sticky top-0 z-20 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30 shrink-0">
                        <div className="flex items-center gap-8 w-full max-w-2xl">
                            <span className="font-headline-md text-xl md:text-2xl font-bold text-primary dark:text-indigo-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-3xl">history</span>
                                {t('history.title')}
                                <HelpTooltip 
                                    title="ประวัติการใช้งาน (History)" 
                                    content="ดูประวัติการพูดคุยและคำสั่ง Prompt ทั้งหมดที่คุณเคยใช้ สามารถกดคัดลอกหรือบันทึกเก็บไว้ใช้ซ้ำได้"
                                />
                            </span>
                            
                            <div className="relative flex-1 hidden md:block">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-slate-100/60 dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder={t('history.search')}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                        </div>
                    </header>

                    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 py-10 space-y-8 animate-slide-up">
                        {/* Title Header */}
                        <section className="space-y-2">
                            <h2 className="font-display-lg text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">{t('history.title')}</h2>
                            <p className="font-body-lg text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                                {t('history.subtitle')}
                            </p>
                        </section>

                        {/* Search Input for Mobile */}
                        <div className="relative block md:hidden">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder={t('history.search_mobile')}
                                />
                        </div>

                        {!isLoggedIn && (
                            <div className="glass-panel-heavy border border-amber-200 bg-amber-50/60 rounded-3xl p-5 text-slate-700 flex items-center gap-3 shadow-sm">
                                <span className="shrink-0"><AlertTriangle className="w-8 h-8 text-amber-500" /></span>
                                <div className="text-sm">
                                    <span className="font-bold">{t('history.incognito_warning_1')}</span>{t('history.incognito_warning_2')}<button onClick={openLoginModal} className="text-blue-600 hover:text-blue-700 font-extrabold underline">{t('history.incognito_login')}</button>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="text-center text-slate-500 py-10 animate-pulse font-semibold">{t('history.loading')}</div>
                        ) : filteredHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center glass-panel-heavy rounded-[32px] p-16 shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-center space-y-6 bg-white/70 dark:bg-slate-800/70">
                                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
                                    <span className="material-symbols-outlined text-5xl">{searchQuery ? 'search_off' : 'history_toggle_off'}</span>
                                </div>
                                <div className="space-y-2 max-w-sm">
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {searchQuery ? t('history.not_found') : 'ยังไม่มีประวัติการใช้งาน'}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                        {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'ประวัติการพูดคุยและคำสั่ง Prompt ของคุณจะถูกบันทึกไว้ที่นี่ เริ่มต้นแชทใหม่เพื่อสร้างประวัติแรกของคุณเลย!'}
                                    </p>
                                </div>
                                {!searchQuery && (
                                    <Link
                                        href="/chat"
                                        className="mt-4 px-8 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">add_comment</span>
                                        เริ่มการสนทนาใหม่
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-10">
                                
                                {/* Today Section */}
                                {today.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="font-label-sm text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('history.today')}</span>
                                            <div className="h-px flex-1 bg-slate-200/60 dark:bg-slate-700/60"></div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {today.map(item => {
                                                const { icon, color } = getCategoryStyles(item);
                                                const isExpanded = expandedId === item.id;
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                                        className={`flex flex-col p-4 glass-panel-heavy rounded-2xl border border-outline-variant/20 dark:border-slate-700/40 hover:border-primary/40 dark:hover:border-indigo-500/40 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-indigo-500/5 transition-all cursor-pointer bg-white/60 dark:bg-slate-800/60 group`}
                                                    >
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${color}`}>
                                                                <span className="material-symbols-outlined text-2xl">{icon}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-headline-md text-lg font-semibold text-slate-800 dark:text-white mb-1 truncate">
                                                                    {item.user_message}
                                                                </h3>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-label-sm text-slate-400 text-xs">{formatDate(item.created_at)}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                    <div className="flex gap-2">
                                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-label-sm text-[10px] rounded uppercase tracking-tighter">
                                                                            {item.tone || 'ทั่วไป'}
                                                                        </span>
                                                                        {item.easy_language && (
                                                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 font-label-sm text-[10px] rounded uppercase tracking-tighter">
                                                                                {t('history.easy_mode_badge')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="material-symbols-outlined text-slate-400 transition-transform duration-200 transform group-hover:translate-x-1">
                                                                {isExpanded ? 'expand_less' : 'expand_more'}
                                                            </span>
                                                        </div>

                                                        {/* Expanded Content Box */}
                                                        {isExpanded && (
                                                            <div className="mt-6 border-t border-slate-200/50 dark:border-slate-700/50 pt-4 space-y-4 cursor-default" onClick={e => e.stopPropagation()}>
                                                                <div className="text-sm">
                                                                    <span className="font-extrabold text-slate-700">คุณ: </span>
                                                                    <span className="text-slate-600">{item.user_message}</span>
                                                                </div>
                                                                <div className="text-sm">
                                                                    <span className="font-extrabold text-primary font-bold">Agent: </span>
                                                                    <span className="text-slate-800">{item.agent_response}</span>
                                                                </div>
                                                                
                                                                {item.fitted_prompt && (
                                                                    <div className="mt-4 bg-primary/5 dark:bg-indigo-900/10 p-4 rounded-xl border border-primary/10 dark:border-indigo-500/20">
                                                                        <div className="text-xs font-bold text-primary dark:text-indigo-400 mb-2 uppercase tracking-wider">{t('history.fitted_prompt')}</div>
                                                                        <div className="font-mono text-sm text-slate-800 dark:text-slate-200 mb-3 whitespace-pre-wrap bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700 shadow-inner">
                                                                            {item.fitted_prompt}
                                                                        </div>
                                                                        <div className="flex gap-2 flex-wrap">
                                                                            <button
                                                                                onClick={() => copyToClipboard(item.fitted_prompt || item.agent_response, 'history')}
                                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all hover:text-primary hover:border-primary/30"
                                                                                title="คัดลอกข้อความ"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[16px]">content_copy</span> คัดลอก
                                                                            </button>
                                                                            <button
                                                                                onClick={() => saveToTemplate(item.fitted_prompt || item.agent_response, "Prompt จากประวัติ", "history")}
                                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all hover:text-amber-600 hover:border-amber-600/30"
                                                                                title="บันทึกเป็นเทมเพลต"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[16px]">bookmark_add</span> บันทึก
                                                                            </button>
                                                                            <button
                                                                                onClick={() => downloadAsTxt(item.fitted_prompt || item.agent_response, "history_prompt")}
                                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all hover:text-emerald-600 hover:border-emerald-600/30"
                                                                                title="ดาวน์โหลด .txt"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[16px]">download</span> .TXT
                                                                            </button>
                                                                            
                                                                            {/* Export Buttons */}
                                                                            <div className="flex gap-2 ml-auto">
                                                                                <button
                                                                                    onClick={() => exportToPlatform('chatgpt', item.fitted_prompt || item.agent_response, 'history')}
                                                                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
                                                                                    title="คัดลอกและเปิดเว็บ ChatGPT ทันที"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span> ChatGPT
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => exportToPlatform('claude', item.fitted_prompt || item.agent_response, 'history')}
                                                                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all"
                                                                                    title="คัดลอกและเปิดเว็บ Claude ทันที"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span> Claude
                                                                                </button>
                                                                            </div>
                                                                            </div>
                                                                    </div>
                                                                )}
                                                                <div className="mt-4 flex justify-end">
                                                                    <Link href={`/chat?session_id=${item.session_id}`} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center gap-2 transition-colors border border-indigo-200 shadow-sm">
                                                                        <span className="material-symbols-outlined text-sm">chat</span> {t('history.resume')}
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                {/* Earlier Section */}
                                {earlier.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-4 mb-6">
                                            <span className="font-label-sm text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('history.earlier')}</span>
                                            <div className="h-px flex-1 bg-slate-200/60 dark:bg-slate-700/60"></div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                            {earlier.map(item => {
                                                const { icon, color } = getCategoryStyles(item);
                                                const isExpanded = expandedId === item.id;
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                                        className="flex flex-col p-6 glass-panel-heavy rounded-2xl border border-outline-variant/10 dark:border-slate-700/40 hover:border-primary/40 dark:hover:border-indigo-500/40 hover:shadow-md transition-all cursor-pointer bg-white/60 dark:bg-slate-800/60 group"
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                                                                <span className="material-symbols-outlined text-xl">{icon}</span>
                                                            </div>
                                                            <span className="font-label-sm text-xs text-slate-400">{formatDate(item.created_at)}</span>
                                                        </div>
                                                        
                                                        <h3 className="font-headline-md text-lg font-bold text-slate-800 dark:text-white mb-2 truncate">
                                                            {item.user_message}
                                                        </h3>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                                                            {item.agent_response}
                                                        </p>

                                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100/50 dark:border-slate-700/50">
                                                            <div className="flex gap-2">
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] rounded uppercase tracking-tighter font-bold">
                                                                    {item.tone || 'ทั่วไป'}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-primary font-bold">{t('history.expand')}</span>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-4 cursor-default" onClick={e => e.stopPropagation()}>
                                                                <div className="text-sm">
                                                                    <span className="font-extrabold text-slate-700">คุณ: </span>
                                                                    <span className="text-slate-600">{item.user_message}</span>
                                                                </div>
                                                                <div className="text-sm">
                                                                    <span className="font-extrabold text-primary font-bold">Agent: </span>
                                                                    <span className="text-slate-800">{item.agent_response}</span>
                                                                </div>
                                                                
                                                                {item.fitted_prompt && (
                                                                    <div className="mt-4 bg-primary/5 dark:bg-indigo-900/10 p-4 rounded-xl border border-primary/10 dark:border-indigo-500/20">
                                                                        <div className="text-xs font-bold text-primary dark:text-indigo-400 mb-2 uppercase tracking-wider">{t('history.fitted_prompt')}</div>
                                                                        <div className="font-mono text-sm text-slate-850 dark:text-slate-200 mb-3 whitespace-pre-wrap bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                                                                            {item.fitted_prompt}
                                                                        </div>
                                                                        <div className="flex gap-2 flex-wrap">
                                                                            <button
                                                                                onClick={() => copyToClipboard(item.fitted_prompt || item.agent_response, 'history')}
                                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all hover:text-primary hover:border-primary/30"
                                                                                title="คัดลอกข้อความ"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[16px]">content_copy</span> คัดลอก
                                                                            </button>
                                                                            <button
                                                                                onClick={() => saveToTemplate(item.fitted_prompt || item.agent_response, "Prompt จากประวัติ", "history")}
                                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all hover:text-amber-600 hover:border-amber-600/30"
                                                                                title="บันทึกเป็นเทมเพลต"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[16px]">bookmark_add</span> บันทึก
                                                                            </button>
                                                                            <button
                                                                                onClick={() => downloadAsTxt(item.fitted_prompt || item.agent_response, "history_prompt")}
                                                                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all hover:text-emerald-600 hover:border-emerald-600/30"
                                                                                title="ดาวน์โหลด .txt"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[16px]">download</span> .TXT
                                                                            </button>
                                                                            
                                                                            {/* Export Buttons */}
                                                                            <div className="flex gap-2 ml-auto">
                                                                                <button
                                                                                    onClick={() => exportToPlatform('chatgpt', item.fitted_prompt || item.agent_response, 'history')}
                                                                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
                                                                                    title="คัดลอกและเปิดเว็บ ChatGPT ทันที"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span> ChatGPT
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => exportToPlatform('claude', item.fitted_prompt || item.agent_response, 'history')}
                                                                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all"
                                                                                    title="คัดลอกและเปิดเว็บ Claude ทันที"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span> Claude
                                                                                </button>
                                                                            </div>
                                                                            </div>
                                                                    </div>
                                                                )}
                                                                <div className="mt-4 flex justify-end">
                                                                    <Link href={`/chat?session_id=${item.session_id}`} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center gap-2 transition-colors border border-indigo-200 shadow-sm">
                                                                        <span className="material-symbols-outlined text-sm">chat</span> {t('history.resume')}
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}