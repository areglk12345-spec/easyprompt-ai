'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '../../components/UserMenu';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';

type Template = {
    id: number;
    title: string;
    prompt_text: string;
    category: string;
    organization: string;
    is_favorite: boolean;
    likes_count: number;
};

export default function MarketplacePage() {
    const { authFetch } = useAuth();
    const { t } = useLanguage();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';
    
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
    const [sortBy, setSortBy] = useState<'likes' | 'newest'>('likes');

    useEffect(() => {
        const fetchMarketplace = async () => {
            setIsLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const response = await authFetch(`${API_URL}/api/templates/marketplace?category=${encodeURIComponent(categoryFilter)}&sort_by=${sortBy}`);
                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data);
                }
            } catch (error) {
                console.error("Error fetching marketplace:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMarketplace();
    }, [categoryFilter, sortBy, authFetch]);

    const handleCopyTemplate = async (templateId: number, promptText: string) => {
        try {
            navigator.clipboard.writeText(promptText);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            await authFetch(`${API_URL}/api/templates/${templateId}/copy`, {
                method: 'POST'
            });
            alert("คัดลอก Prompt สำเร็จ และบันทึกเข้าคอลเล็กชันของคุณเรียบร้อยแล้ว!");
        } catch (error) {
            alert("คัดลอก Prompt แล้ว!");
        }
    };

    const handleRunInChat = (promptText: string) => {
        localStorage.setItem('ep_pending_prompt', promptText);
        window.location.href = '/chat';
    };

    const handleToggleFavorite = async (templateId: number) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/templates/${templateId}/favorite`, {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                setTemplates(templates.map(t => {
                    if (t.id === templateId) {
                        return {
                            ...t,
                            is_favorite: data.is_favorite,
                            likes_count: data.is_favorite ? t.likes_count + 1 : Math.max(0, t.likes_count - 1)
                        };
                    }
                    return t;
                }));
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const filteredTemplates = templates.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.prompt_text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 transition-all duration-300 ${isLarge ? 'text-lg' : 'text-sm'}`}>
            <div className="flex min-h-screen">
                <Sidebar activePage="marketplace" />

                <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                    <header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-12 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/30 shrink-0">
                        <div className="flex items-center gap-4">
                            <h1 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-xl">
                                🛒 Prompt Marketplace (คลังเทมเพลตชุมชน)
                            </h1>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        <div className="max-w-6xl mx-auto space-y-8">
                            
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <input
                                    type="text"
                                    placeholder="ค้นหา Prompt ในตลาด..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    <select 
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="ทั้งหมด">หมวดหมู่ทั้งหมด</option>
                                        <option value="ทั่วไป">ทั่วไป (General)</option>
                                        <option value="โหมดทำงาน">โหมดทำงาน (Work)</option>
                                        <option value="โหมดเรียนรู้">โหมดเรียนรู้ (Learning)</option>
                                        <option value="โหมดสร้างสรรค์">โหมดสร้างสรรค์ (Creative)</option>
                                    </select>
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as 'likes' | 'newest')}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                    >
                                        <option value="likes">🔥 ยอดนิยม (Most Liked)</option>
                                        <option value="newest">✨ ใหม่ล่าสุด (Newest)</option>
                                    </select>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTemplates.map((t) => (
                                        <div key={t.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700 flex flex-col h-full group">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-2">{t.title}</h3>
                                                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap">{t.category}</span>
                                            </div>
                                            
                                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1 line-clamp-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                {t.prompt_text}
                                            </p>
                                            
                                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                                                <button 
                                                    onClick={() => handleToggleFavorite(t.id)}
                                                    className={`flex items-center gap-1.5 transition-colors ${t.is_favorite ? 'text-rose-500 hover:text-rose-600' : 'text-slate-400 hover:text-rose-500'}`}
                                                    title="ถูกใจ"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={t.is_favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                                    </svg>
                                                    <span className="text-sm font-semibold">{t.likes_count || 0}</span>
                                                </button>
                                                
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => handleRunInChat(t.prompt_text)}
                                                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                                                        ใช้ในแชท
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCopyTemplate(t.id, t.prompt_text)}
                                                        className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                                                    >
                                                        คัดลอก
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredTemplates.length === 0 && (
                                        <div className="col-span-full text-center py-20 text-slate-500">
                                            ไม่พบ Prompt ที่คุณค้นหา
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
