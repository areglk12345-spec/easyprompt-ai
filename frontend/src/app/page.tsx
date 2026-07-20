'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const { isDarkMode } = useTheme();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-300 font-sans selection:bg-indigo-500/30">
            {/* Top Navigation */}
            <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined !font-bold">bolt</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">EasyPrompt</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
                        <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">ฟีเจอร์</a>
                        <a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">แพ็กเกจราคา</a>
                        <a href="#faq" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">คำถามที่พบบ่อย</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Link 
                                href="/chat" 
                                className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:scale-105 transition-transform shadow-lg"
                            >
                                ไปที่แอป (Go to App)
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="hidden md:block font-bold text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    เข้าสู่ระบบ
                                </Link>
                                <Link 
                                    href="/login" 
                                    className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                                >
                                    เริ่มใช้งานฟรี <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section (OpenAI Style) */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden flex flex-col items-center text-center">
                    {/* Background glow effects */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-sm font-bold border border-indigo-100 dark:border-indigo-500/20 mb-4 animate-fade-in-up">
                            <Sparkles className="w-4 h-4" />
                            <span>แพลตฟอร์มจัดการคำสั่ง AI ที่ดีที่สุดของไทย</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            สั่งงาน AI ให้ได้ดั่งใจด้วย <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500 dark:from-indigo-400 dark:to-purple-400">
                                EasyPrompt
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            รวมสุดยอดเทมเพลตคำสั่ง (Prompt) พร้อมระบบ <strong>Dr. Prompt</strong> ช่วยปรับแต่งคำสั่งให้คมชัด ทำงานเสร็จไวขึ้น 10 เท่าในคลิกเดียว
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2">
                                ทดลองใช้งานฟรี
                            </Link>
                            <a href="#video-demo" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                                <Play className="w-5 h-5 fill-current" /> ดูการทำงาน
                            </a>
                        </div>
                    </div>

                    {/* Promo Video */}
                    <div id="video-demo" className="relative z-10 w-full max-w-5xl mx-auto mt-20 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-200/50 dark:border-white/10">
                            <video
                                className="w-full aspect-video bg-black"
                                controls
                                preload="metadata"
                                poster=""
                            >
                                <source src="/promo-video.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </section>

                {/* Pricing Section (Gemini Style) */}
                <section id="pricing" className="py-24 bg-white dark:bg-[#0b0f19] px-6">
                    <div className="max-w-7xl mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                แพ็กเกจที่ตอบโจทย์ทุกการใช้งาน
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                                เลือกแพ็กเกจที่ใช่ เพื่อยกระดับการทำงานด้วย AI ของคุณ
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                            {/* Basic Tier */}
                            <div className="rounded-3xl p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <div className="space-y-4 mb-8">
                                    <h3 className="text-2xl font-bold">Basic</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm h-12">เหมาะสำหรับผู้เริ่มต้นใช้งาน AI และอยากทดลองใช้เทมเพลตพื้นฐาน</p>
                                    <div className="pt-4">
                                        <span className="text-4xl font-bold">฿0</span>
                                        <span className="text-slate-500 dark:text-slate-400"> / เดือน</span>
                                    </div>
                                </div>
                                
                                <Link href="/login" className="w-full py-3 rounded-full border border-slate-300 dark:border-slate-700 font-bold text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-8">
                                    เริ่มต้นใช้งานฟรี
                                </Link>
                                
                                <ul className="space-y-4 mt-auto">
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>แชทถาม-ตอบกับ AI พื้นฐาน</span>
                                    </li>
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>เข้าถึงคลังเทมเพลตส่วนกลาง (Public)</span>
                                    </li>
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>เก็บประวัติการสนทนาย้อนหลัง 3 วัน</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Pro Tier (Highlighted) */}
                            <div className="rounded-3xl p-8 border-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-500/10">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    คุ้มค่าที่สุด
                                </div>
                                <div className="space-y-4 mb-8">
                                    <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Pro</h3>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm h-12">สำหรับมือโปรที่ต้องการเพิ่มประสิทธิภาพด้วย Dr. Prompt และเทมเพลตส่วนตัว</p>
                                    <div className="pt-4">
                                        <span className="text-4xl font-bold">฿199</span>
                                        <span className="text-slate-500 dark:text-slate-400"> / เดือน</span>
                                    </div>
                                </div>
                                
                                <Link href="/login" className="w-full py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center transition-colors mb-8 shadow-md">
                                    สมัครแพ็กเกจ Pro
                                </Link>
                                
                                <ul className="space-y-4 mt-auto">
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-200 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>สร้างและบันทึกเทมเพลตส่วนตัวได้ไม่จำกัด</span>
                                    </li>
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-200 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>เข้าถึง Dr. Prompt วิเคราะห์คำสั่ง</span>
                                    </li>
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-200 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>เก็บประวัติการสนทนาได้ตลอดชีพ</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Business Tier */}
                            <div className="rounded-3xl p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <div className="space-y-4 mb-8">
                                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">Business</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm h-12">ออกแบบมาสำหรับองค์กร เพื่อใช้งานและแชร์ Prompt ร่วมกันในทีม</p>
                                    <div className="pt-4">
                                        <span className="text-4xl font-bold">฿990</span>
                                        <span className="text-slate-500 dark:text-slate-400"> / เดือน</span>
                                    </div>
                                </div>
                                
                                <Link href="/login" className="w-full py-3 rounded-full border border-slate-300 dark:border-slate-700 font-bold text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-8">
                                    ติดต่อทีมขาย
                                </Link>
                                
                                <ul className="space-y-4 mt-auto">
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>สร้าง Workspace เฉพาะขององค์กรได้</span>
                                    </li>
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>เพิ่มสมาชิกในทีมได้ 5 คน</span>
                                    </li>
                                    <li className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span>Dashboard ดูสถิติการใช้งานของทีม</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 bg-slate-50 dark:bg-[#0b0f19]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined !font-bold text-lg">bolt</span>
                        </div>
                        <span className="font-bold text-lg text-slate-800 dark:text-white">EasyPrompt</span>
                    </div>
                    
                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                        &copy; {new Date().getFullYear()} EasyPrompt AI. All rights reserved.
                    </div>
                    
                    <div className="flex gap-6 text-sm font-medium">
                        <a href="#" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}