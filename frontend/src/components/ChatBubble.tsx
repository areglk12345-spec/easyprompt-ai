'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Save, Copy, Download, MessageSquare, Brain, Sparkles, Code, Activity, RefreshCw } from 'lucide-react';
import { usePromptActions } from '../hooks/usePromptActions';
import TTSButton from './TTSButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { motion } from 'framer-motion';

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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-2"
        >
            <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={`max-w-[85%] md:max-w-[75%] flex flex-col gap-3 ${
                        isLarge ? 'p-5' : 'p-4'
                    } ${
                        role === 'user'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl rounded-tr-sm shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                            : 'bg-transparent text-slate-800 dark:text-slate-200 rounded-3xl rounded-tl-sm'
                    }`}
                >
                    <div className="flex items-start justify-between gap-4 w-full">
                        <div className="leading-relaxed w-full overflow-x-auto min-w-0">
                            {role === 'agent' ? (
                                <div className="prose dark:prose-invert prose-sm md:prose-base max-w-none break-words">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({node, inline, className, children, ...props}: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <div className="rounded-md overflow-hidden my-4 border border-slate-700/50">
                                                        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800 text-slate-300 text-xs">
                                                            <span>{match[1]}</span>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                                }}
                                                                className="hover:text-white flex items-center gap-1 transition-colors"
                                                            >
                                                                <Copy className="w-3 h-3" /> Copy
                                                            </button>
                                                        </div>
                                                        <SyntaxHighlighter
                                                            {...props}
                                                            style={vscDarkPlus as any}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            customStyle={{ margin: 0, border: 'none', borderRadius: 0, backgroundColor: '#0f172a' }}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                ) : (
                                                    <code {...props} className={`${className} bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm text-pink-600 dark:text-pink-400 font-mono`}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {text}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap">{text}</div>
                            )}
                        </div>
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
                            <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden font-mono text-xs md:text-sm border border-slate-800 shadow-xl max-w-full">
                                <div className="bg-slate-800/80 px-4 py-2 flex items-center gap-2 border-b border-slate-700/50">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                                    <span className="ml-2 text-slate-400 text-[10px] uppercase font-bold tracking-widest">Optimized Prompt</span>
                                </div>
                                <div className="p-4 overflow-x-auto whitespace-pre-wrap">
                                    {displayPrompt}
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap mt-4">
                                {onSaveToTemplate && (
                                    <button
                                        id={`save-template-btn-${index}`}
                                        type="button"
                                        onClick={() => onSaveToTemplate(displayPrompt!)}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm transition-all hover-spring flex items-center gap-2 cursor-pointer text-xs md:text-sm"
                                    >
                                        <Save className="w-4 h-4" /> บันทึกเป็น Template
                                    </button>
                                )}
                                {onCopyToClipboard && (
                                    <button
                                        id={`copy-prompt-btn-${index}`}
                                        type="button"
                                        onClick={() => onCopyToClipboard(displayPrompt!)}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-all hover-spring flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-600 text-xs md:text-sm"
                                    >
                                        <Copy className="w-4 h-4" /> คัดลอก
                                    </button>
                                )}
                                {onDownloadAsTxt && (
                                    <button
                                        id={`download-txt-btn-${index}`}
                                        type="button"
                                        onClick={() => onDownloadAsTxt(displayPrompt!)}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm transition-all hover-spring flex items-center gap-2 cursor-pointer text-xs md:text-sm"
                                    >
                                        <Download className="w-4 h-4" /> ดาวน์โหลด .txt
                                    </button>
                                )}
                                {onDownloadAsMarkdown && (
                                    <button
                                        id={`download-md-btn-${index}`}
                                        type="button"
                                        onClick={() => onDownloadAsMarkdown(displayPrompt!)}
                                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-sm transition-all hover-spring flex items-center gap-2 cursor-pointer text-xs md:text-sm"
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
                                        className="py-2 px-3 bg-slate-900/5 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover-spring cursor-pointer border border-transparent shadow-sm"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" /> ChatGPT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('claude', displayPrompt!) : window.open(`https://claude.ai/new?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="py-2 px-3 bg-slate-900/5 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover-spring cursor-pointer border border-transparent shadow-sm"
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
        </motion.div>
    );
}
