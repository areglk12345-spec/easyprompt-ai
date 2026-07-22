'use client';

import React from 'react';
import PromptCard from './PromptCard';

type Template = {
    id: number;
    title: string;
    prompt_text: string;
    category?: string;
    is_public?: boolean;
    user_id?: number | null;
    is_favorite?: boolean;
};

interface TemplateListProps {
    templates: Template[];
    isLarge: boolean;
    ownershipFilter: 'all' | 'mine' | 'public' | 'favorites';
    currentUser?: any;
    onCopyToClipboard: (promptText: string) => void;
    onDownloadAsTxt: (promptText: string, title: string) => void;
    onDeleteTemplate?: (id: number) => void;
    onToggleFavorite?: (id: number) => void;
    onCreateNew?: () => void;
}

export default function TemplateList({
    templates,
    isLarge,
    ownershipFilter,
    currentUser,
    onCopyToClipboard,
    onDownloadAsTxt,
    onDeleteTemplate,
    onToggleFavorite,
    onCreateNew,
}: TemplateListProps) {
    const filteredTemplates = templates.filter((t) => {
        if (ownershipFilter === 'mine') return !t.is_public;
        if (ownershipFilter === 'public') return t.is_public;
        if (ownershipFilter === 'favorites') return t.is_favorite;
        return true;
    });

    if (filteredTemplates.length === 0) {
        let emptyTitle = 'ไม่พบเทมเพลต';
        let emptyMessage = 'ยังไม่มีเทมเพลตที่ตรงกับหมวดหมู่ที่เลือก';
        let icon = 'search_off';
        
        if (ownershipFilter === 'mine') {
            emptyTitle = 'เทมเพลตส่วนตัวของคุณ';
            emptyMessage = 'คุณยังไม่ได้สร้างเทมเพลตส่วนตัวใดๆ ลองสร้างเทมเพลตแรกเพื่อประหยัดเวลาการทำงานของคุณดูสิ!';
            icon = 'edit_document';
        }
        if (ownershipFilter === 'favorites') {
            emptyTitle = 'ยังไม่มีรายการโปรด';
            emptyMessage = 'กดไอคอนรูปดาว (⭐) ที่เทมเพลตที่คุณชื่นชอบเพื่อบันทึกไว้ใช้งานอย่างรวดเร็วในครั้งหน้า';
            icon = 'star';
        }
        
        return (
            <div className="flex flex-col items-center justify-center glass-panel-heavy rounded-[32px] p-16 shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
                    <span className="material-symbols-outlined text-5xl">{icon}</span>
                </div>
                <div className="space-y-2 max-w-sm">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{emptyTitle}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{emptyMessage}</p>
                </div>
                {ownershipFilter === 'mine' && onCreateNew && (
                    <button
                        onClick={onCreateNew}
                        className="mt-4 px-8 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">add</span>
                        สร้างเทมเพลตแรกของคุณ
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {filteredTemplates.map((tpl) => {
                const canDelete = currentUser && (tpl.user_id === currentUser.id || currentUser.role === 'admin');
                return (
                    <PromptCard
                        key={tpl.id}
                        id={tpl.id}
                        title={tpl.title}
                        promptText={tpl.prompt_text}
                        category={tpl.category}
                        isPublic={tpl.is_public}
                        isLarge={isLarge}
                        canDelete={canDelete}
                        isFavorite={tpl.is_favorite}
                        onCopyToClipboard={onCopyToClipboard}
                        onDownloadAsTxt={onDownloadAsTxt}
                        onDelete={() => onDeleteTemplate?.(tpl.id)}
                        onToggleFavorite={() => onToggleFavorite?.(tpl.id)}
                    />
                );
            })}
        </div>
    );
}
