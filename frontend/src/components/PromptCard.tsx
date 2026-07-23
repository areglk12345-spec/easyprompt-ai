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
    onTogglePublish?: () => void;
    onRunInChat?: (promptText: string) => void;
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
    onTogglePublish,
    onRunInChat
}: PromptCardProps) {
    const badgeClass = CATEGORY_COLORS[category] || CATEGORY_COLORS['ทั่วไป'];
    const IconComponent = CATEGORY_ICONS[category] || Pin;

    return (
        <div
            className={`glass-panel-heavy glass-card-hover border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-white/60 dark:bg-slate-800/60 transition-all group`}
        >
            {/* Title & Badges */}
            <div className="flex flex-col gap-2 min-w-[200px] max-w-[250px]">
                <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-base text-slate-800 dark:text-white truncate" title={title}>{title}</h2>
                    {onToggleFavorite && (
                        <button onClick={onToggleFavorite} className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer shrink-0" title={isFavorite ? "เลิกบันทึก" : "บันทึกเป็นรายการโปรด"}>
                            <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'}`} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass} shrink-0 flex items-center`}>
                        <IconComponent className="w-3 h-3 inline-block mr-1" /> {category}
                    </span>
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center w-max ${
                            isPublic
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                        }`}
                    >
                        {isPublic ? <><Globe className="w-3 h-3 mr-1" /> ส่วนกลาง</> : <><User className="w-3 h-3 mr-1" /> ส่วนตัว</>}
                    </span>
                </div>
            </div>

            {/* Prompt Text (Truncated) */}
            <div 
                className="flex-1 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 font-mono text-xs w-full lg:w-auto overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={promptText}
                onClick={() => onCopyToClipboard(promptText)}
            >
                {promptText}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end mt-2 lg:mt-0">
                {onRunInChat && (
                    <button
                        type="button"
                        onClick={() => onRunInChat(promptText)}
                        title="นำไปใช้ในแชท"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                        ใช้ในแชท
                    </button>
                )}
                {onTogglePublish && (
                    <button
                        type="button"
                        onClick={onTogglePublish}
                        title={isPublic ? "ยกเลิกเผยแพร่" : "แชร์สู่ Marketplace"}
                        className={`p-2 rounded-lg text-xs font-bold transition-all hover:scale-105 border ${
                            isPublic
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                    </button>
                )}
                <button
                    id={`copy-tpl-${id}`}
                    type="button"
                    onClick={() => onCopyToClipboard(promptText)}
                    title="คัดลอก"
                    className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                >
                    <Copy className="w-4 h-4" />
                </button>
                <button
                    id={`download-tpl-${id}`}
                    type="button"
                    onClick={() => onDownloadAsTxt(promptText, title)}
                    title="ดาวน์โหลด"
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                </button>

                {canDelete && onDelete && (
                    <button
                        onClick={onDelete}
                        title="ลบ"
                        className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-800/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                )}
            </div>
        </div>
    );
}
