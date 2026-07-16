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
    onRunPrompt?: (promptText: string) => void;
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
    onRunPrompt,
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
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Prompt Fit Score</div>
                                        {explanation && <div className="text-sm text-indigo-700 dark:text-indigo-200 mt-1">{explanation}</div>}
                                    </div>
                                    <div className={`text-2xl font-black ${score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                        {score}
                                    </div>
                                </div>
                            )}
                            <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden font-mono text-xs md:text-sm border border-slate-800 shadow-xl max-w-full">
                                <div className="bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                                        <span className="ml-2 text-slate-400 text-[10px] uppercase font-bold tracking-widest">Optimized Prompt</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {onSaveToTemplate && (
                                            <button onClick={() => onSaveToTemplate(displayPrompt!)} className="text-slate-500 hover:text-emerald-400 transition-colors p-1" title="Save as Template">
                                                <Save className="w-4 h-4" />
                                            </button>
                                        )}
                                        {onCopyToClipboard && (
                                            <button onClick={() => onCopyToClipboard(displayPrompt!)} className="text-slate-500 hover:text-white transition-colors p-1" title="Copy">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 overflow-x-auto whitespace-pre-wrap">
                                    {displayPrompt}
                                </div>
                            </div>

                            {/* Export to external AI platforms */}
                            <div className="mt-3 flex items-center gap-3">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">power</span>
                                    <span>Quick Export:</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('chatgpt', displayPrompt!) : window.open(`https://chatgpt.com/?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                        title="ChatGPT"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('claude', displayPrompt!) : window.open(`https://claude.ai/new?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                        title="Claude"
                                    >
                                        <Brain className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('gemini', displayPrompt!) : window.open(`https://gemini.google.com/app?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="Gemini"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onExportToPlatform ? onExportToPlatform('copilot', displayPrompt!) : window.open(`https://copilot.microsoft.com/?q=${encodeURIComponent(displayPrompt!)}`, '_blank')}
                                        className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
                                        title="Copilot"
                                    >
                                        <Code className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onRunPrompt && displayPrompt) {
                                                onRunPrompt(displayPrompt);
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        <span>ใช้ Prompt นี้เลย</span>
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
