'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Library, Stethoscope, History, LayoutDashboard } from 'lucide-react';
import UserMenu from '../components/UserMenu';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFontSize } from '../context/FontSizeContext';

export default function Home() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const { t } = useLanguage();
    const { fontSize, toggleFontSize } = useFontSize();
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isLarge = false; // Forced normal size
    const textSize = isLarge ? 'text-xl md:text-2xl' : 'text-sm md:text-base';
    const titleSize = isLarge ? 'text-4xl md:text-5xl' : 'text-3xl md:text-[40px]';
    const subtitleSize = isLarge ? 'text-lg md:text-xl' : 'text-sm md:text-md';
    const cardPadding = isLarge ? 'p-10' : 'p-8';

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/chat?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className={`min-h-screen bg-transparent transition-all duration-300 ${isLarge ? 'text-lg' : 'text-sm'}`}>
            <div className="flex min-h-screen">
                {/* Sidebar Navigation */}
                <Sidebar activePage="home" />

                {/* Mobile Menu Panel */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
                        <aside className="w-64 bg-white dark:bg-slate-900 h-full p-6 space-y-6 flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-2xl font-bold">bolt</span>
                                    <span className="text-lg font-bold text-slate-800 dark:text-white">EasyPrompt</span>
                                </div>
                                <button className="text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <Link href="/chat" className="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 text-center" onClick={() => setMobileMenuOpen(false)}>
                                New Chat
                            </Link>
                            <nav className="flex-1 space-y-2">
                                <Link href="/chat" className="flex items-center gap-4 py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold transition-all block" onClick={() => setMobileMenuOpen(false)}>
                                    <MessageSquare className="w-5 h-5 inline-block mr-2" /> Chat
                                </Link>
                                <Link href="/templates" className="flex items-center gap-4 py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold transition-all block" onClick={() => setMobileMenuOpen(false)}>
                                    <Library className="w-5 h-5 inline-block mr-2" /> Templates
                                </Link>
                                <Link href="/doctor" className="flex items-center gap-4 py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold transition-all block" onClick={() => setMobileMenuOpen(false)}>
                                    <Stethoscope className="w-5 h-5 inline-block mr-2" /> Prompt Doctor
                                </Link>
                                <Link href="/history" className="flex items-center gap-4 py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold transition-all block" onClick={() => setMobileMenuOpen(false)}>
                                    <History className="w-5 h-5 inline-block mr-2" /> History
                                </Link>

                            </nav>
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <span className="text-slate-500 font-semibold text-sm">Text Size</span>
                                <button
                                    onClick={toggleFontSize}
                                    className={`w-12 h-6 rounded-full flex items-center transition-colors shadow-inner ${isLarge ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${isLarge ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </aside>
                    </div>
                )}

                {/* Main Content Canvas */}
                <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-x-hidden relative transition-colors duration-300">
                    {/* Top Navigation Header */}
                    <header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-12 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30">
                        <div className="md:hidden flex items-center">
                            <button className="text-slate-700 p-2" onClick={() => setMobileMenuOpen(true)}>
                                <span className="material-symbols-outlined text-2xl">menu</span>
                            </button>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Workspace</span>
                            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700"></span>
                            <Link href="/chat" className="text-primary dark:text-indigo-400 font-semibold text-sm hover:text-primary-dark transition-colors whitespace-nowrap">Chat Mode</Link>
                            <Link href="/doctor" className="text-slate-500 dark:text-slate-400 font-medium text-sm hover:text-primary dark:hover:text-indigo-400 transition-colors whitespace-nowrap">Diagnostic</Link>
                            <Link href="/templates" className="text-slate-500 dark:text-slate-400 font-medium text-sm hover:text-primary dark:hover:text-indigo-400 transition-colors whitespace-nowrap">Shared Library</Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-primary dark:text-indigo-400 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800">Version 1.0</span>
                            </div>
                            <UserMenu />
                        </div>
                    </header>

                    {/* Hero Section */}
                    <section className="relative pt-20 pb-16 px-6 md:px-12 hero-bg">
                        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8 animate-slide-up">
                            <div className="inline-flex items-center gap-2.5 py-1.5 px-4 rounded-full bg-primary/5 border border-primary/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Accessibility Agent</span>
                            </div>
                            <div className="space-y-4">
                                <h2 className={`${titleSize} font-extrabold text-slate-800 dark:text-white leading-[1.15] tracking-tight`}>
                                    {t('home.hero.title_1')} <br />
                                    <span className="bg-gradient-to-r from-primary via-purpleAccent to-roseAccent bg-clip-text text-transparent">
                                        {t('home.hero.title_2')}
                                    </span>
                                </h2>
                                <p className={`${subtitleSize} font-semibold text-slate-500 dark:text-slate-400 max-w-xl mx-auto`}>
                                    {t('home.hero.subtitle')}
                                </p>
                            </div>
                            
                            {/* Search Prompt Form */}
                            <div className="max-w-2xl mx-auto mt-10">
                                <form onSubmit={handleSearchSubmit} className="flex items-center bg-white dark:bg-slate-800 rounded-2xl border border-outline-variant dark:border-slate-600 p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                                    <span className="material-symbols-outlined px-3 text-slate-400 dark:text-slate-500">search</span>
                                    <input
                                        className="flex-1 border-none focus:ring-0 font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 py-3.5 bg-transparent"
                                        placeholder={t('home.placeholder')}
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    <button type="submit" className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-md">
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </section>

                    {/* Bento Feature Grid */}
                    <section className="py-16 px-6 md:px-12">
                        <div className="max-w-5xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Chat Card */}
                                <Link href="/chat" className={`md:col-span-2 minimal-card rounded-3xl ${cardPadding} flex flex-col justify-between min-h-[300px] cursor-pointer group`}>
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 shadow-sm">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <h3 className={`font-extrabold text-slate-800 dark:text-white mb-2 ${isLarge ? 'text-3xl' : 'text-xl'}`}>{t('home.bento.chat.title')}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-semibold max-w-md">{t('home.bento.chat.desc')}</p>
                                    </div>
                                    <div className="flex items-center text-primary font-bold gap-2 mt-4">
                                        <span>{t('home.bento.chat.btn')}</span>
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                                    </div>
                                </Link>

                                {/* Prompt Doctor */}
                                <Link href="/doctor" className={`minimal-card rounded-3xl ${cardPadding} flex flex-col justify-between min-h-[300px] cursor-pointer group`}>
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-roseAccent flex items-center justify-center mb-6 shadow-sm">
                                            <Stethoscope className="w-6 h-6" />
                                        </div>
                                        <h3 className={`font-extrabold text-slate-800 dark:text-white mb-2 ${isLarge ? 'text-3xl' : 'text-xl'}`}>{t('home.bento.doctor.title')}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-semibold">{t('home.bento.doctor.desc')}</p>
                                    </div>
                                    <div className="flex items-center text-roseAccent font-bold gap-2 mt-4">
                                        <span>{t('home.bento.doctor.btn')}</span>
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                                    </div>
                                </Link>

                                {/* Templates */}
                                <Link href="/templates" className={`minimal-card rounded-3xl ${cardPadding} flex flex-col justify-between min-h-[300px] cursor-pointer group`}>
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purpleAccent flex items-center justify-center mb-6 shadow-sm">
                                            <Library className="w-6 h-6" />
                                        </div>
                                        <h3 className={`font-extrabold text-slate-800 dark:text-white mb-2 ${isLarge ? 'text-3xl' : 'text-xl'}`}>{t('home.bento.templates.title')}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-semibold">{t('home.bento.templates.desc')}</p>
                                    </div>
                                    <div className="flex items-center text-purpleAccent font-bold gap-2 mt-4">
                                        <span>{t('home.bento.templates.btn')}</span>
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                                    </div>
                                </Link>

                                {/* History */}
                                <Link href="/history" className={`md:col-span-2 minimal-card rounded-3xl ${cardPadding} flex flex-col md:flex-row items-center gap-6 cursor-pointer group`}>
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm text-slate-500 dark:text-slate-400">
                                        <History className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 space-y-1 text-center md:text-left">
                                        <h3 className={`font-extrabold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'}`}>{t('home.bento.history.title')}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-semibold">{t('home.bento.history.desc')}</p>
                                    </div>
                                    <button className="px-6 py-3 rounded-xl border border-outline-variant dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300 hover:border-primary dark:hover:border-indigo-500 hover:text-primary dark:hover:text-indigo-400 transition-all shrink-0">
                                        {t('home.bento.history.btn')}
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Secondary CTA */}
                    <section className="py-12 px-6 md:px-12 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="max-w-3xl mx-auto text-center space-y-6">
                            <h4 className="text-2xl font-bold text-primary dark:text-indigo-400">{t('home.cta.title')}</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">
                                {t('home.cta.desc')}
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={toggleFontSize}
                                    className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    {isLarge ? t('home.cta.btn_senior_off') : t('home.cta.btn_senior_on')}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="py-8 px-6 md:px-12 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 font-bold text-xl">bolt</span>
                                <span className="text-sm font-bold text-slate-800 dark:text-white">EasyPrompt AI</span>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} EasyPrompt AI. Focused on simplicity.</p>
                            <div className="flex gap-4">
                                <a href="#" className="text-xs text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-indigo-400 transition-colors">Accessibility Policy</a>
                                <span className="text-slate-200 dark:text-slate-700">|</span>
                                <a href="#" className="text-xs text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-indigo-400 transition-colors">Privacy & Terms</a>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}