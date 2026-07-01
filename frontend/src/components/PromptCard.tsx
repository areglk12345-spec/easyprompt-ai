'use client';

import React from 'react';
import { Globe, User, Copy, Download, Pin, Briefcase, BookOpen, Palette, Star } from 'lucide-react';

interface PromptCardProps {
    id: number;
    title: string;
    promptText: string;
    category?: string;
    isPublic?: boolean;
    isLarge: boolean;
    canDelete?: boolean;
    isFavorite?: boolean;
    onCopyToClipboard: (promptText: string) => void;
    onDownloadAsTxt: (promptText: string, title: string) => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void;
}

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

export default function PromptCard({
    id,
    title,
    promptText,
    category = 'ทั่วไป',
    isPublic = false,
    isLarge,
    canDelete = false,
    isFavorite = false,
    onCopyToClipboard,
    onDownloadAsTxt,
    onDelete,
    onToggleFavorite,
}: PromptCardProps) {
    const badgeClass = CATEGORY_COLORS[category] || CATEGORY_COLORS['ทั่วไป'];
    const IconComponent = CATEGORY_ICONS[category] || Pin;
    const cardPadding = isLarge ? 'p-8' : 'p-6';

    return (
        <div
            className={`glass-panel-heavy glass-card-hover border border-white/40 shadow-sm rounded-3xl ${cardPadding} flex flex-col bg-white/60 dark:bg-slate-800/60`}
        >
            {/* Title + Category Badge */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                        <h2 className="font-extrabold text-xl text-slate-800 dark:text-white">{title}</h2>
                        {onToggleFavorite && (
                            <button onClick={onToggleFavorite} className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer" title={isFavorite ? "เลิกบันทึก" : "บันทึกเป็นรายการโปรด"}>
                                <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'}`} />
                            </button>
                        )}
                    </div>
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block w-max ${
                            isPublic
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                        }`}
                    >
                        {isPublic ? <><Globe className="w-3 h-3 inline-block mr-1" /> ส่วนกลาง</> : <><User className="w-3 h-3 inline-block mr-1" /> ส่วนตัว</>}
                    </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass} shrink-0`}>
                    <IconComponent className="w-3 h-3 inline-block mr-1" /> {category}
                </span>
            </div>
            <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-850 dark:border-slate-700 font-mono text-sm flex-1 mb-4 whitespace-pre-wrap leading-relaxed shadow-inner">
                {promptText}
            </div>
            <div className="flex gap-2 flex-wrap">
                <button
                    id={`copy-tpl-${id}`}
                    type="button"
                    onClick={() => onCopyToClipboard(promptText)}
                    className={`flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        isLarge ? 'py-4 text-xl' : 'py-3 text-sm'
                    }`}
                >
                    <Copy className="w-4 h-4 inline-block mr-1" /> คัดลอก
                </button>
                <button
                    id={`download-tpl-${id}`}
                    type="button"
                    onClick={() => onDownloadAsTxt(promptText, title)}
                    className={`flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${
                        isLarge ? 'py-4 text-xl' : 'py-3 text-sm'
                    }`}
                >
                    <Download className="w-4 h-4 inline-block mr-1" /> ดาวน์โหลด
                </button>

                {canDelete && onDelete && (
                    <button
                        onClick={onDelete}
                        className={`flex-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-800/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
                            isLarge ? 'py-4 text-xl' : 'py-3 text-sm'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">delete</span> ลบ
                    </button>
                )}
            </div>
        </div>
    );
}
