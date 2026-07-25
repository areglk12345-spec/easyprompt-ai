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
import TTSButton from '../../components/TTSButton';
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
    const { authFetch, user, isLoggedIn, openLoginModal } = useAuth();
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

    // Guest Trial State
    const [guestUsageCount, setGuestUsageCount] = useState<number>(0);
    const [isGuestLimitModalOpen, setIsGuestLimitModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = parseInt(localStorage.getItem('ep_guest_usage_count') || '0', 10);
            setGuestUsageCount(isNaN(saved) ? 0 : saved);
        }
    }, []);

    const textSize = isLarge ? 'text-2xl' : 'text-base';
    const headingSize = isLarge ? 'text-4xl' : 'text-3xl';
    const buttonSize = isLarge ? 'px-8 py-4 text-xl' : 'px-6 py-3 text-base';

    const handleDiagnose = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptText.trim() || isLoading) return;

        // Guest Trial Quota Enforcement (Limit to 3 successful prompt generations for unauthenticated users)
        if (!isLoggedIn && !user) {
            const currentCount = parseInt(localStorage.getItem('ep_guest_usage_count') || '0', 10);
            if (currentCount >= 3) {
                setIsGuestLimitModalOpen(true);
                return;
            }
        }

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

            // Increment guest trial usage ONLY when fitted prompt is successfully generated
            if (data.fitted_prompt && !isLoggedIn && !user) {
                const currentCount = parseInt(localStorage.getItem('ep_guest_usage_count') || '0', 10);
                const newCount = currentCount + 1;
                localStorage.setItem('ep_guest_usage_count', String(newCount));
                setGuestUsageCount(newCount);
            }
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
                                    title="EZ-Bot Prompt Doctor" 
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

                    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 py-8 space-y-8 animate-slide-up">
                        {/* Hero Header */}
                        <section className="space-y-2">
                            <h2 className="font-display-lg text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">{t('doctor.hero_title')}</h2>
                            <p className="font-body-lg text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                                {t('doctor.hero_subtitle')} — วิเคราะห์และขยายความคำสั่งของคุณให้ครอบคลุมและเป็นมืออาชีพขึ้นในคลิกเดียว
                            </p>
                        </section>

                        {/* 12-Column Grid splitting Input & Results */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            
                            {/* Left Column (Input Area) - Span 6 */}
                            <div className="lg:col-span-6 space-y-5">
                                {/* Guest Trial Banner */}
                                {!isLoggedIn && !user && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm shadow-sm">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">stars</span>
                                            <span>สิทธิ์ทดลองฟรีคงเหลือ <strong className="text-amber-600 dark:text-amber-400 font-extrabold text-base">{Math.max(0, 3 - guestUsageCount)}</strong> / 3 ครั้ง</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openLoginModal}
                                            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-transform hover:scale-105 shadow-sm text-xs shrink-0"
                                        >
                                            เข้าสู่ระบบฟรี
                                        </button>
                                    </div>
                                )}

                                <div className="glass-panel-heavy p-6 md:p-7 rounded-[24px] border border-slate-200/60 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 shadow-sm space-y-5">
                                    <div className="flex justify-between items-center">
                                        <label className="font-label-sm text-xs font-bold text-primary dark:text-indigo-400 uppercase tracking-wider">{t('doctor.input_label')}</label>
                                        <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">{promptText.length} / 2000 {t('doctor.chars')}</span>
                                    </div>
                                    
                                    <form onSubmit={handleDiagnose} className="space-y-5">
                                        <Textarea
                                            label={t('doctor.placeholder')}
                                            hideLabel={true}
                                            value={promptText}
                                            onChange={(e) => setPromptText(e.target.value)}
                                            disabled={isLoading}
                                            placeholder={t('doctor.placeholder')}
                                            rows={7}
                                            error={error || undefined}
                                            className={`!bg-slate-50 dark:!bg-slate-900/50 !border-slate-200/60 dark:!border-slate-700 !rounded-2xl p-4 md:p-5 font-body-md text-slate-800 dark:text-slate-200 focus:!ring-2 focus:!ring-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none ${isLarge ? 'text-xl' : 'text-sm'}`}
                                        />

                                        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                                            {/* Quick insert helper chips */}
                                            <div className="flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => insertChip("Act as a professional [role].")}
                                                    className="px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all text-xs font-bold cursor-pointer flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm text-primary">psychology</span>
                                                    <span>Role-play</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => insertChip("Output in a clean markdown table structure.")}
                                                    className="px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all text-xs font-bold cursor-pointer flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm text-indigo-500">format_list_bulleted</span>
                                                    <span>Structured</span>
                                                </button>
                                            </div>

                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={isLoading || !promptText.trim()}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 !border-none flex items-center justify-center gap-2 py-3 px-6 text-sm"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>{t('doctor.analyzing')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{t('doctor.diagnose')}</span>
                                                        <span className="material-symbols-outlined text-base">bolt</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Right Column (Results Panel) - Span 6 */}
                            <div className="lg:col-span-6 space-y-5">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-center font-semibold text-sm shadow-sm">
                                        {error}
                                    </div>
                                )}

                                {!result && !isLoading && !error && (
                                    <div className="glass-panel-heavy p-8 rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 shadow-sm text-center py-16 space-y-3">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-slate-700 text-indigo-500 flex items-center justify-center mx-auto">
                                            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                                        </div>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">{t('doctor.empty_title')}</h4>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
                                            {t('doctor.empty_subtitle')}
                                        </p>
                                    </div>
                                )}

                                {result && (
                                    <div className="glass-panel-heavy p-6 md:p-7 rounded-[24px] border border-slate-200/60 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-md space-y-5">
                                        {/* Result Header & Score */}
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-2xl">healing</span>
                                                <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-white">
                                                    Prompt ที่ปรับแต่งสมบูรณ์ (Prescription)
                                                </h3>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${getScoreColor(result.prompt_fit_score)}`}>
                                                <span>Fit Score: {result.prompt_fit_score}/100</span>
                                            </div>
                                        </div>

                                        {/* Fitted Prompt Code Box */}
                                        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner max-h-64 overflow-y-auto custom-scrollbar relative">
                                            {result.fitted_prompt}
                                        </div>

                                        {/* Action Bar (Main Actions) */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="primary"
                                                    onClick={sendToChat}
                                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-base">send</span>
                                                    <span>Send to Chat</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => copyToClipboard(result.fitted_prompt, 'doctor')}
                                                    className="flex-1 py-3 border-2 border-primary text-primary hover:bg-primary/5 dark:hover:bg-indigo-500/10 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-base">content_copy</span>
                                                    <span>คัดลอก Prompt</span>
                                                </Button>
                                                <TTSButton text={result.fitted_prompt} className="!p-2.5" />
                                            </div>

                                            {/* Secondary Actions (Grouped Export & Save) */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => saveToTemplate(result.fitted_prompt, "Prompt ที่ปรับปรุงแล้ว", "doctor")}
                                                    className="py-2 px-3 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-sm">bookmark</span>
                                                    <span>บันทึกเทมเพลต</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => exportToPlatform('chatgpt', result.fitted_prompt, 'doctor')}
                                                    className="py-2 px-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-200/50"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" /> ChatGPT
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => exportToPlatform('claude', result.fitted_prompt, 'doctor')}
                                                    className="py-2 px-3 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-orange-200/50"
                                                >
                                                    <Brain className="w-3.5 h-3.5" /> Claude
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => downloadAsMarkdown(result.fitted_prompt, "polished_prompt")}
                                                    className="py-2 px-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-indigo-200/50"
                                                >
                                                    <span className="material-symbols-outlined text-sm">download</span>
                                                    <span>.md</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Compact Accordion for Analysis & Suggestions */}
                                        <details className="group border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
                                            <summary className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 cursor-pointer list-none select-none">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-sm">analytics</span>
                                                    <span>ดูรายละเอียดการวิเคราะห์จุดบกพร่อง & คำแนะนำ</span>
                                                </span>
                                                <span className="material-symbols-outlined text-base group-open:rotate-180 transition-transform">expand_more</span>
                                            </summary>
                                            <div className="mt-3 space-y-3 text-xs pt-2">
                                                {result.weaknesses.map((weak, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 bg-rose-50/60 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                                        <span className="material-symbols-outlined text-rose-500 text-sm mt-0.5">priority_high</span>
                                                        <p className="text-slate-700 dark:text-slate-300 font-medium">{weak}</p>
                                                    </div>
                                                ))}
                                                {result.suggestions.map((sug, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 bg-blue-50/60 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                                        <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">info</span>
                                                        <p className="text-slate-700 dark:text-slate-300 font-medium">{sug}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Guest Trial Limit Reached Modal */}
            {isGuestLimitModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-scale-up">
                        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
                            <span className="material-symbols-outlined text-4xl">lock_open</span>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">ทดลองสร้าง Prompt ฟรีครบ 3 ครั้งแล้ว 🎉</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                สมัครสมาชิกหรือเข้าสู่ระบบฟรี เพื่อรับเพิ่มอีก 100 เครดิต ใช้งานวิเคราะห์และเกลา Prompt ใน Prompt Doctor ได้แบบไม่จำกัด!
                            </p>
                        </div>

                        <div className="pt-2 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsGuestLimitModalOpen(false);
                                    openLoginModal();
                                }}
                                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">login</span>
                                <span>เข้าสู่ระบบ / สมัครสมาชิกฟรี</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsGuestLimitModalOpen(false)}
                                className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-colors text-sm"
                            >
                                ปิดหน้าต่างนี้
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
