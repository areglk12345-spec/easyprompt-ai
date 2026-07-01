'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Save, Copy, Download, MessageSquare, Brain, Sparkles, Code, Activity, RefreshCw } from 'lucide-react';
import { usePromptActions } from '../hooks/usePromptActions';
import TTSButton from './TTSButton';

interface ChatBubbleProps {
    index: number;
    role: 'user' | 'agent';
    text: string;
    fittedPrompt?: string;
    score?: number;
    explanation?: string;
    suggestedOptions?: string[];
    isLarge: boolean;
    isLatest: boolean;
    onSaveToTemplate?: (promptText: string) => void;
    onCopyToClipboard?: (promptText: string) => void;
    onDownloadAsTxt?: (promptText: string) => void;
    onDownloadAsMarkdown?: (promptText: string) => void;
    onSendOption?: (option: string) => void;
    onExportToPlatform?: (platform: 'chatgpt' | 'claude' | 'copilot' | 'gemini', promptText: string) => void;
}

export default function ChatBubble({
    index,
    role,
    text,
    fittedPrompt,
    score,
    explanation,
    suggestedOptions,
    isLarge,
    isLatest,
    onSaveToTemplate,
    onCopyToClipboard,
    onDownloadAsTxt,
    onDownloadAsMarkdown,
    onSendOption,
    onExportToPlatform,
}: ChatBubbleProps) {
    const { logActivity } = usePromptActions();
    const [displayPrompt, setDisplayPrompt] = useState(fittedPrompt);

    useEffect(() => {
        setDisplayPrompt(fittedPrompt);
    }, [fittedPrompt]);

    return (
        <div className="flex flex-col gap-2 animate-slide-up">
            <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={`max-w-[85%] md:max-w-[70%] flex flex-col gap-3 ${
                        isLarge ? 'p-6' : 'p-4'
                    } rounded-2xl ${
                        role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-none shadow-md shadow-blue-100 dark:shadow-blue-950'
                            : 'glass-panel-heavy text-slate-800 dark:text-slate-200 rounded-tl-none border border-white/40 shadow-sm'
                    }`}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="leading-relaxed">{text}</div>
                        {role === 'agent' && (
                            <TTSButton text={displayPrompt ? `${text} ${displayPrompt}` : text} className="shrink-0 mt-1" />
                        )}
                    </div>

                    {fittedPrompt && (
                        <div className="mt-2 bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl border border-blue-100 dark:border-slate-600 text-sm shadow-sm">
                            {score !== undefined && (
                                <div className="mb-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Prompt Fit Score</div>
                                        {explanation && <div className="text-xs text-indigo-600/80 dark:text-indigo-400/80">{explanation}</div>}
                                    </div>
                                    <div className={`text-2xl font-black ${score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                        {score}
                                    </div>
                                </div>
                            )}
                            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs md:text-sm border border-slate-800 shadow-inner max-w-full overflow-x-auto whitespace-pre-wrap">
                                {displayPrompt}
                            </div>

                            <div className="flex gap-2 flex-wrap mt-4">
                                {onSaveToTemplate && (
                                    <button
                                        id={`save-template-btn-${index}`}
                                        type="button"
                                        onClick={() => onSaveToTemplate(displayPrompt!)}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer text-xs md:text-sm"
                                    >
                                        <Save className="w-4 h-4" /> บันทึกเป็น Template
                                    </button>
                                )}
                                {onCopyToClipboard && (
                                    <button
                                        id={`copy-prompt-btn-${index}`}
                                        type="button"
                                        onClick={() => onCopyToClipboard(displayPrompt!)}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-600 text-xs md:text-sm"
                                    >
                                        <Copy className="w-4 h-4" /> คัดลอก
                                    </button>
                                )}
                                {onDownloadAsTxt && (
                                    <button
                                        id={`download-txt-btn-${index}`}
                                        type="button"
                                        onClick={() => onDownloadAsTxt(displayPrompt!)}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer text-xs md:text-sm"
                                    >
                                        <Download className="w-4 h-4" /> ดาวน์โหลด .txt
                                    </button>
                                )}
                                {onDownloadAsMarkdown && (
                                    <button
                                        id={`download-md-btn-${index}`}
                                        type="button"
                                        onClick={() => onDownloadAsMarkdown(displayPrompt!)}
                                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer text-xs md:text-sm"
                                    >
                                        <Download className="w-4 h-4" /> ดาวน์โหลด .md
                                    </button>
                                )}

                            </div>

                            {/* Export to external AI platforms */}
                            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-600/50 space-y-2">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">power</span>
                                    <span>ส่งออกด่วน 1-Click (Quick Export)</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('chatgpt', displayPrompt!) : window.open(`https://chatgpt.com/?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="py-2 px-3 bg-slate-900/5 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent shadow-sm"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" /> ChatGPT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('claude', displayPrompt!) : window.open(`https://claude.ai/new?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="py-2 px-3 bg-slate-900/5 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent shadow-sm"
                                    >
                                        <Brain className="w-3.5 h-3.5" /> Claude
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('gemini', displayPrompt!) : window.open(`https://gemini.google.com/app?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="py-2 px-3 bg-slate-900/5 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent shadow-sm"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" /> Gemini
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('copilot', displayPrompt!) : window.open(`https://copilot.microsoft.com/?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="py-2 px-3 bg-slate-900/5 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent shadow-sm"
                                    >
                                        <Code className="w-3.5 h-3.5" /> Copilot
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isLatest && role === 'agent' && suggestedOptions && suggestedOptions.length > 0 && onSendOption && (
                <div
                    className={`flex flex-wrap gap-2 justify-start ${
                        isLarge ? 'max-w-[95%] gap-4 mt-2' : 'max-w-[85%] gap-2 mt-1'
                    }`}
                >
                    {suggestedOptions.map((option, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => onSendOption(option)}
                            className={`rounded-xl border border-blue-100 dark:border-indigo-800 bg-white/70 dark:bg-slate-800/70 text-primary dark:text-indigo-400 hover:bg-blue-50 dark:hover:bg-indigo-950/40 hover:border-blue-300 dark:hover:border-indigo-600 transition-all font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 duration-200 flex items-center justify-center text-center cursor-pointer ${
                                isLarge ? 'px-6 py-4 text-xl border-2' : 'px-4 py-2 text-sm'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
