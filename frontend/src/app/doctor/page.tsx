'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Brain, Sparkles, Code } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '../../components/UserMenu';
import Sidebar from '../../components/Sidebar';
import HelpTooltip from '../../components/HelpTooltip';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';
import { usePromptActions } from '../../hooks/usePromptActions';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

type DiagnosticResult = {
    prompt_fit_score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    fitted_prompt: string;
};

export default function DoctorPage() {
    const { authFetch, user } = useAuth();
    const { t } = useLanguage();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';
    const { logActivity, copyToClipboard, downloadAsTxt, downloadAsMarkdown, saveToTemplate, exportToPlatform } = usePromptActions();
    const router = useRouter();

    const [promptText, setPromptText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DiagnosticResult | null>(null);
    const [easyLanguage, setEasyLanguage] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const textSize = isLarge ? 'text-2xl' : 'text-base';
    const headingSize = isLarge ? 'text-4xl' : 'text-3xl';
    const buttonSize = isLarge ? 'px-8 py-4 text-xl' : 'px-6 py-3 text-base';

    const handleDiagnose = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptText.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/doctor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt_text: promptText, easy_language: easyLanguage }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            console.error("Diagnosis Error:", err);
            setError(err.message || t('doctor.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const sendToChat = () => {
        if (!result?.fitted_prompt) return;
        router.push(`/chat?q=${encodeURIComponent(result.fitted_prompt)}`);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 border-emerald-500 bg-emerald-50/80 shadow-md shadow-emerald-100/50';
        if (score >= 50) return 'text-amber-600 border-amber-500 bg-amber-50/80 shadow-md shadow-amber-100/50';
        return 'text-rose-600 border-rose-500 bg-rose-50/80 shadow-md shadow-rose-100/50';
    };

    // Quick helpers to append chips to textarea
    const insertChip = (prefix: string) => {
        setPromptText(prev => {
            if (prev.trim()) {
                return `${prefix} ${prev}`;
            }
            return prefix;
        });
    };

    return (
        <div className={`min-h-screen bg-transparent transition-all duration-300 ${isLarge ? 'text-lg' : 'text-sm'}`}>
            <div className="flex min-h-screen">
                <Sidebar activePage="doctor" />

                <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-y-auto h-screen relative custom-scrollbar transition-colors duration-300">
                    {/* Glass Header */}
                    <header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-12 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30 shrink-0">
                        <div className="flex items-center space-x-4">
                            <span className="font-headline-md text-xl md:text-2xl font-bold text-primary dark:text-indigo-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-3xl">medical_services</span>
                                {t('doctor.title')}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px]">BETA</span>
                                <HelpTooltip 
                                    title="หมอพร้อมพ์ (Dr. Prompt)" 
                                    content="ระบบช่วยวิเคราะห์และปรับปรุงคำสั่ง Prompt ของคุณให้ดีขึ้น ชัดเจนขึ้น และมีประสิทธิภาพมากขึ้น เพื่อให้ AI ทำงานได้ตรงใจคุณที่สุด"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className={`text-slate-600 dark:text-slate-400 font-semibold ${isLarge ? 'text-lg' : 'text-sm'}`}>โหมดภาษาง่าย</span>
                                <button
                                    onClick={() => setEasyLanguage(!easyLanguage)}
                                    className={`w-12 h-6 rounded-full flex items-center transition-colors shadow-inner ${easyLanguage ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${easyLanguage ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 py-12 space-y-12 animate-slide-up">
                        {/* Hero Header */}
                        <section className="max-w-3xl space-y-2">
                            <h2 className="font-display-lg text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">{t('doctor.hero_title')}</h2>
                            <p className="font-body-lg text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed">
                                {t('doctor.hero_subtitle')}
                            </p>
                        </section>

                        {/* 12-Column Grid splitting Input & Results */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            
                            {/* Left Column (Input Area) - Span 7 */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="glass-panel-heavy p-8 rounded-[24px] border border-white/40 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 shadow-sm space-y-6">
                                    <div className="flex justify-between items-center">
                                        <label className="font-label-sm text-sm font-bold text-primary dark:text-indigo-400 uppercase tracking-wider">{t('doctor.input_label')}</label>
                                        <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">{promptText.length} / 2000 {t('doctor.chars')}</span>
                                    </div>
                                    
                                    <form onSubmit={handleDiagnose} className="space-y-6">
                                        <Textarea
                                            label={t('doctor.placeholder')}
                                            hideLabel={true}
                                            value={promptText}
                                            onChange={(e) => setPromptText(e.target.value)}
                                            disabled={isLoading}
                                            placeholder={t('doctor.placeholder')}
                                            rows={8}
                                            error={error || undefined}
                                            className={`!bg-slate-50 dark:!bg-slate-900/50 !border-none !rounded-xl p-6 font-body-md text-slate-800 dark:text-slate-200 focus:!ring-2 focus:!ring-primary/20 transition-all placeholder:text-slate-400/80 dark:placeholder:text-slate-500 resize-none ${isLarge ? 'text-2xl placeholder:text-xl' : 'text-base'}`}
                                        />

                                        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                                            {/* Quick insert helper chips */}
                                            <div className="flex space-x-2">
                                                <div className="flex items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => insertChip("Act as a professional [role].")}
                                                        className="px-4 py-2 rounded-full border border-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-indigo-400 transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">psychology</span>
                                                        <span>Role-play</span>
                                                    </button>
                                                    <HelpTooltip title="สวมบทบาท (Role-play)" content="สั่งให้ AI สวมบทบาทเป็นผู้เชี่ยวชาญในด้านนั้นๆ เช่น 'ทำตัวเป็นนักการตลาด' เพื่อให้ได้คำตอบที่ลึกซึ้งและตรงสายงานมากขึ้น" />
                                                </div>
                                                <div className="flex items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => insertChip("Output in a clean markdown table structure.")}
                                                        className="px-4 py-2 rounded-full border border-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-indigo-400 transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                                                        <span>Structured</span>
                                                    </button>
                                                    <HelpTooltip title="จัดโครงสร้าง (Structured)" content="สั่งให้ AI จัดรูปแบบคำตอบให้เป็นระเบียบ เช่น ทำเป็นตาราง (Table) หรือหัวข้อย่อย เพื่อให้อ่านและนำไปใช้งานต่อได้ง่าย" />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={isLoading || !promptText.trim()}
                                                className={`bg-gradient-to-r from-primary to-tertiary text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 !border-none flex items-center gap-2 ${buttonSize}`}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        {t('doctor.analyzing')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{t('doctor.diagnose')}</span>
                                                        <span className="material-symbols-outlined">bolt</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>

                                {/* Quotes/Advice block */}
                                <div className="relative p-8 rounded-[24px] bg-slate-100/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-center">
                                    <div className="max-w-md space-y-2">
                                        <span className="material-symbols-outlined text-3xl text-primary/40 dark:text-indigo-400/40">auto_awesome</span>
                                        <p className="font-semibold text-slate-500 dark:text-slate-400 text-xs md:text-sm italic">
                                            &quot;The difference between a good prompt and a great one is the level of specific constraints and clear target audiences provided.&quot;
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (Results Panel) - Span 5 */}
                            <div className="lg:col-span-5 space-y-6">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-[24px] text-center font-semibold shadow-sm">
                                        {error}
                                    </div>
                                )}

                                {!result && !isLoading && !error && (
                                    <div className="glass-panel-heavy p-8 rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 shadow-sm text-center py-20 space-y-3">
                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">analytics</span>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-lg">{t('doctor.empty_title')}</h4>
                                        <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                                            {t('doctor.empty_subtitle')}
                                        </p>
                                    </div>
                                )}

                                {result && (
                                    <>
                                        {/* Diagnosis/Analysis Card */}
                                        <div className="glass-panel-heavy p-8 rounded-[24px] border-l-4 border-l-primary dark:border-l-indigo-500 shadow-sm space-y-6 bg-white/70 dark:bg-slate-800/70">
                                            <h3 className="font-headline-md text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary dark:text-indigo-400">analytics</span>
                                                <span>{t('doctor.analysis_title')}</span>
                                            </h3>
                                            
                                            <div className="flex items-center gap-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
                                                <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${getScoreColor(result.prompt_fit_score)}`}>
                                                    <span className="text-2xl font-extrabold">{result.prompt_fit_score}</span>
                                                    <span className="text-[9px] font-bold uppercase">Fit Score</span>
                                                </div>
                                                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                    {result.prompt_fit_score >= 80 
                                                        ? "Prompt ยอดเยี่ยม ชัดเจน สื่อสารตรงเป้าหมาย" 
                                                        : result.prompt_fit_score >= 50 
                                                        ? "ความชัดเจนระดับปานกลาง ขาดข้อมูลแวดล้อมบางส่วน" 
                                                        : "ต้องการการปรับแต่งอย่างมากเพื่อผลลัพธ์ที่ดี"}
                                                </div>
                                            </div>

                                            <div className="space-y-4 text-sm">
                                                {result.weaknesses.map((weak, idx) => (
                                                    <div key={idx} className="flex items-start space-x-3">
                                                        <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 border border-rose-100">
                                                            <span className="material-symbols-outlined text-xs font-bold">priority_high</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white">จุดเด่นที่ยังบกพร่อง</p>
                                                            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed">{weak}</p>
                                                        </div>
                                                    </div>
                                                ))}

                                                {result.suggestions.map((sug, idx) => (
                                                    <div key={idx} className="flex items-start space-x-3">
                                                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                                                            <span className="material-symbols-outlined text-xs">info</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white">คำแนะนำการแก้ไข</p>
                                                            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed">{sug}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Prescription Card */}
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[24px] border border-slate-200/60 dark:border-slate-700 shadow-sm relative overflow-hidden group space-y-6">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                                                <span className="material-symbols-outlined text-8xl text-slate-800 dark:text-white">prescriptions</span>
                                            </div>

                                            <h3 className="font-headline-md text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary dark:text-indigo-400">healing</span>
                                                <span>{t('doctor.prescription')}</span>
                                            </h3>

                                            <div className="p-5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner max-h-60 overflow-y-auto custom-scrollbar">
                                                {result.fitted_prompt}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="primary"
                                                    onClick={sendToChat}
                                                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg rounded-xl font-bold flex items-center justify-center space-x-2"
                                                >
                                                    <span className="material-symbols-outlined text-base">send</span>
                                                    <span>Send to Chat</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => copyToClipboard(result.fitted_prompt, 'doctor')}
                                                    className="flex-1 py-3.5 border-2 border-primary dark:border-indigo-500 text-primary dark:text-indigo-400 hover:bg-primary/5 dark:hover:bg-indigo-500/10 rounded-xl font-bold flex items-center justify-center space-x-2"
                                                >
                                                    <span className="material-symbols-outlined text-base">content_copy</span>
                                                    <span>Apply & Copy</span>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => saveToTemplate(result.fitted_prompt, "Prompt ที่ปรับปรุงแล้ว", "doctor")}
                                                    className="px-4 py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                                                    title="บันทึกเป็นเทมเพลต"
                                                    aria-label="บันทึกเป็นเทมเพลต"
                                                >
                                                    <span className="material-symbols-outlined text-base">save</span>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => downloadAsTxt(result.fitted_prompt, "polished_prompt")}
                                                    className="px-4 py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                                                    title="ดาวน์โหลด .txt"
                                                    aria-label="ดาวน์โหลดเป็นไฟล์ข้อความ"
                                                >
                                                    <span className="material-symbols-outlined text-base">download</span>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => downloadAsMarkdown(result.fitted_prompt, "polished_prompt")}
                                                    className="px-4 py-3.5 bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-800/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold"
                                                    title="ดาวน์โหลด .md"
                                                    aria-label="ดาวน์โหลดเป็น Markdown"
                                                >
                                                    <span className="material-symbols-outlined text-base">download</span> .md
                                                </Button>
                                            </div>

                                            {/* Export to external AI platforms */}
                                            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">power</span>
                                                    <span>ส่งออกด่วน 1-Click (Quick Export)</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => exportToPlatform('chatgpt', result.fitted_prompt, 'doctor')}
                                                        className="py-2.5 px-3 bg-slate-900/5 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent shadow-sm"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" /> ChatGPT
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => exportToPlatform('claude', result.fitted_prompt, 'doctor')}
                                                        className="py-2.5 px-3 bg-slate-900/5 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent shadow-sm"
                                                    >
                                                        <Brain className="w-3.5 h-3.5" /> Claude
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => exportToPlatform('gemini', result.fitted_prompt, 'doctor')}
                                                        className="py-2.5 px-3 bg-slate-900/5 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent shadow-sm"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" /> Gemini
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => exportToPlatform('copilot', result.fitted_prompt, 'doctor')}
                                                        className="py-2.5 px-3 bg-slate-900/5 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent shadow-sm"
                                                    >
                                                        <Code className="w-3.5 h-3.5" /> Copilot
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Insights (Pro Tip) */}
                                        <div className="p-8 rounded-[24px] bg-primary text-white shadow-lg shadow-primary/20 space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="material-symbols-outlined text-secondary-fixed">tips_and_updates</span>
                                                <span className="font-bold uppercase tracking-wider text-xs text-slate-200">Pro Tip</span>
                                            </div>
                                            <p className="font-body-md text-sm opacity-90 leading-relaxed font-semibold">
                                                การเติมข้อความ &quot;Think step-by-step&quot; หรือ &quot;คิดทีละขั้นตอนอย่างเป็นเหตุเป็นผล&quot; ไว้ที่ท้ายคำสั่ง Prompt จะช่วยเพิ่มความแม่นยำในการคำนวณของ AI ได้มากถึง 40% ในการทำงานที่ซับซ้อน!
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
