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
}: TemplateListProps) {
    const filteredTemplates = templates.filter((t) => {
        if (ownershipFilter === 'mine') return !t.is_public;
        if (ownershipFilter === 'public') return t.is_public;
        if (ownershipFilter === 'favorites') return t.is_favorite;
        return true;
    });

    if (filteredTemplates.length === 0) {
        let emptyMessage = 'ไม่พบเทมเพลตที่ตรงกับหมวดหมู่ที่เลือก';
        if (ownershipFilter === 'mine') emptyMessage = 'ยังไม่มีเทมเพลตส่วนตัวที่คุณเซฟไว้ครับ ลองเซฟเก็บไว้ดูนะ!';
        if (ownershipFilter === 'favorites') emptyMessage = 'ยังไม่มีเทมเพลตในรายการโปรด กดดาว (⭐) เพื่อบันทึกได้เลย!';
        
        return (
            <div className="text-center glass-panel-heavy rounded-3xl p-10 shadow-sm text-slate-500 font-semibold border border-slate-200/30">
                {emptyMessage}
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
