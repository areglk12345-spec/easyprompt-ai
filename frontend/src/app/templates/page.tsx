'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, Building2, User, Library, Briefcase, BookOpen, Palette, Pin, Star } from 'lucide-react';
import UserMenu from '../../components/UserMenu';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';
import TemplateList from '../../components/TemplateList';

type Template = {
    id: number;
    title: string;
    prompt_text: string;
    category?: string;
    is_public?: boolean;
    user_id?: number | null;
    is_favorite?: boolean;
};

const CATEGORIES = ['ทั้งหมด', 'ทั่วไป', 'โหมดทำงาน', 'โหมดเรียนรู้', 'โหมดสร้างสรรค์'];

const CATEGORY_COLORS: Record<string, string> = {
    'ทั่วไป': 'bg-slate-100 text-slate-600 border-slate-200',
    'โหมดทำงาน': 'bg-blue-50 text-blue-700 border-blue-200',
    'โหมดเรียนรู้': 'bg-amber-50 text-amber-700 border-amber-200',
    'โหมดสร้างสรรค์': 'bg-purple-50 text-purple-700 border-purple-200',
};

const CATEGORY_ICONS: Record<string, any> = {
    'ทั่วไป': Pin,
    'โหมดทำงาน': Briefcase,
    'โหมดเรียนรู้': BookOpen,
    'โหมดสร้างสรรค์': Palette,
};

export default function TemplatesPage() {
    const { authFetch, isLoggedIn, user } = useAuth();
    const { t } = useLanguage();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
    const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine' | 'public' | 'favorites'>('all');

    const textSize = isLarge ? 'text-2xl' : 'text-base';
    const cardPadding = isLarge ? 'p-8' : 'p-6';

    // ดึงข้อมูลเมื่อ activeCategory เปลี่ยน
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const url = activeCategory === 'ทั้งหมด'
                    ? `${API_URL}/api/templates`
                    : `${API_URL}/api/templates?category=${encodeURIComponent(activeCategory)}`;
                const response = await authFetch(url);
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                setTemplates(data);
            } catch (error) {
                console.error("Error fetching templates:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplates();
    }, [activeCategory, authFetch]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("คัดลอก Prompt ไปใช้งานได้เลย!");
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบเทมเพลตนี้?")) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/templates/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('ลบเทมเพลตล้มเหลว');
            setTemplates(templates.filter(t => t.id !== id));
            alert("ลบเทมเพลตเรียบร้อยแล้ว");
        } catch (error) {
            console.error(error);
            alert("ไม่สามารถลบเทมเพลตได้");
        }
    };

    const handleToggleFavorite = async (id: number) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/templates/${id}/favorite`, { method: 'POST' });
            if (!response.ok) throw new Error('Toggle favorite failed');
            const data = await response.json();
            setTemplates(templates.map(t => t.id === id ? { ...t, is_favorite: data.is_favorite } : t));
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const downloadAsTxt = (text: string, title: string) => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = `${title.replace(/\s+/g, "_")}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };



    return (
        <div className={`min-h-screen bg-transparent transition-all duration-300 ${textSize}`}>
            <div className="flex min-h-screen">
                <Sidebar activePage="templates" />

                <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-y-auto h-screen relative transition-colors duration-300">
                    {/* Top AppBar */}
                    <header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-12 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30 shrink-0">
                        <div className="flex items-center space-x-4">
                            <span className="font-headline-md text-xl md:text-2xl font-bold text-primary dark:text-indigo-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-3xl">grid_view</span>
                                {t('sidebar.templates')}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <UserMenu />
                        </div>
                    </header>

                    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 py-12 space-y-12 animate-slide-up">
                        {/* Title Header */}
                        <section className="space-y-2">
                            <h2 className="font-display-lg text-4xl font-extrabold text-slate-800 dark:text-white leading-tight flex items-center gap-3">
                                <Library className="w-8 h-8 text-primary dark:text-indigo-400" /> {t('templates.title')}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                                {t('templates.desc')}
                            </p>
                        </section>

                        {/* Ownership Filter Bar (Private vs Public) */}
                        {isLoggedIn && (
                            <div className="flex gap-2 bg-slate-100/60 dark:bg-slate-800/60 p-1.5 rounded-2xl max-w-md border border-slate-200/40 dark:border-slate-700/40" role="group" aria-label="กรองเทมเพลตตามสิทธิ์">
                                <button
                                    onClick={() => setOwnershipFilter('all')}
                                    aria-pressed={ownershipFilter === 'all'}
                                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
                                        ownershipFilter === 'all'
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Globe className="w-4 h-4 inline-block mr-1" /> {t('templates.filter.all')}
                                </button>
                                <button
                                    onClick={() => setOwnershipFilter('public')}
                                    aria-pressed={ownershipFilter === 'public'}
                                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
                                        ownershipFilter === 'public'
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Building2 className="w-4 h-4 inline-block mr-1" /> {t('templates.filter.public')}
                                </button>
                                <button
                                    onClick={() => setOwnershipFilter('mine')}
                                    aria-pressed={ownershipFilter === 'mine'}
                                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
                                        ownershipFilter === 'mine'
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <User className="w-4 h-4 inline-block mr-1" /> {t('templates.filter.mine')}
                                </button>
                                <button
                                    onClick={() => setOwnershipFilter('favorites')}
                                    aria-pressed={ownershipFilter === 'favorites'}
                                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
                                        ownershipFilter === 'favorites'
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Star className="w-4 h-4 inline-block mr-1" /> รายการโปรด
                                </button>
                            </div>
                        )}

                        {/* Category Filter Tabs */}
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="หมวดหมู่เทมเพลต">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    id={`filter-tab-${cat}`}
                                    role="tab"
                                    aria-selected={activeCategory === cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
                                        activeCategory === cat
                                            ? 'bg-gradient-to-r from-primary to-tertiary text-white border-none shadow-md shadow-primary/20 scale-105'
                                            : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white/95 dark:hover:bg-slate-700/60 hover:border-primary/45'
                                    } ${isLarge ? 'px-6 py-3 text-base' : ''}`}
                                >
                                    {cat === 'ทั้งหมด' ? <Library className="w-4 h-4 inline-block mr-1" /> : React.createElement(CATEGORY_ICONS[cat] || Pin, { className: "w-4 h-4 inline-block mr-1" })} {cat}
                                </button>
                            ))}
                        </div>

                        {isLoading ? (
                            <div className="text-center text-slate-500 py-10 animate-pulse font-semibold">{t('templates.loading')}</div>
                        ) : (
                            <TemplateList
                                templates={templates}
                                isLarge={isLarge}
                                ownershipFilter={ownershipFilter}
                                currentUser={user}
                                onCopyToClipboard={copyToClipboard}
                                onDownloadAsTxt={downloadAsTxt}
                                onDeleteTemplate={handleDeleteTemplate}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}