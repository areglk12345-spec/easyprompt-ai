'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useFontSize } from '../../context/FontSizeContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, register } = useAuth();
    
    const { fontSize, toggleFontSize } = useFontSize();
    const isLarge = fontSize === 'large';
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [organization, setOrganization] = useState('ทั่วไป');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Sync Senior Mode with localStorage


    // Senior Mode sizing variables
    const textSize = isLarge ? 'text-2xl' : 'text-base';
    const labelSize = isLarge ? 'text-xl font-bold' : 'text-sm font-semibold';
    const inputSize = isLarge ? 'h-16 text-xl' : 'h-14 text-base';
    const buttonSize = isLarge ? 'py-5 text-2xl font-bold' : 'py-3 text-base font-bold';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!username || !password) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }

        setLoading(true);
        try {
            await login(username, password);
            setSuccess('เข้าสู่ระบบสำเร็จ! กำลังนำคุณเข้าสู่ระบบ...');
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 1000);
        } catch (err: any) {
            if (err.message === '2FA_REQUIRED') {
                // Save pending username and redirect to 2FA verification page
                sessionStorage.setItem('ep_2fa_pending', err.pendingUsername);
                router.push('/login/verify-2fa');
            } else {
                setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!username || !password || !fullName) {
            setError('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        setLoading(true);
        try {
            await register(username, password, fullName, organization);
            setSuccess('สมัครสมาชิกสำเร็จแล้ว! กรุณาเข้าสู่ระบบ');
            setActiveTab('login');
            setPassword('');
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 bg-slate-50 dark:bg-slate-900 text-on-surface dark:text-white font-body-md antialiased ${isLarge ? 'text-lg' : 'text-sm'}`}>
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Main Login Canvas */}
            <main className="relative z-10 w-full max-w-[440px] px-6 md:px-0">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-8 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-lg transform rotate-3">
                        <span className="material-symbols-outlined text-white text-4xl">auto_awesome</span>
                    </div>
                    <h1 className="font-display-lg text-4xl font-extrabold text-primary dark:text-indigo-400 text-center">EasyPrompt AI</h1>
                    <p className="font-body-md text-slate-500 dark:text-slate-400 text-center px-4">Experience the next generation of intelligent creative assistance.</p>
                </div>

                {/* Login Card */}
                <div className="glass-panel-heavy p-8 md:p-10 rounded-[32px] shadow-sm flex flex-col space-y-6 bg-white/70 dark:bg-slate-800/70 border border-white/40 dark:border-slate-700">
                    

                    {/* Tab Switcher */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                            className={`flex-1 pb-3 text-center border-b-2 font-bold transition-all cursor-pointer ${
                                activeTab === 'login'
                                    ? 'border-primary dark:border-indigo-500 text-primary dark:text-indigo-400'
                                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                            } ${isLarge ? 'text-2xl' : 'text-base'}`}
                        >
                            🔒 เข้าสู่ระบบ
                        </button>
                        <button
                            onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
                            className={`flex-1 pb-3 text-center border-b-2 font-bold transition-all cursor-pointer ${
                                activeTab === 'register'
                                    ? 'border-primary dark:border-indigo-500 text-primary dark:text-indigo-400'
                                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                            } ${isLarge ? 'text-2xl' : 'text-base'}`}
                        >
                            👤 สมัครสมาชิก
                        </button>
                    </div>

                    {/* Error/Success Alert Box */}
                    {error && (
                        <div className={`p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-medium text-center ${textSize}`}>
                            ⚠️ {error}
                        </div>
                    )}
                    {success && (
                        <div className={`p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 font-medium text-center ${textSize}`}>
                            ✅ {success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-4">
                        {activeTab === 'register' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className={labelSize}>ชื่อผู้ใช้จริง / ชื่อเล่น:</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">badge</span>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="เช่น นายประเสริฐ หรือ พี่น้อย"
                                            className={`w-full pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-slate-800 dark:text-slate-200 ${inputSize}`}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className={labelSize}>หน่วยงาน / องค์กรที่สังกัด:</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">corporate_fare</span>
                                        <input
                                            type="text"
                                            value={organization}
                                            onChange={(e) => setOrganization(e.target.value)}
                                            placeholder="เช่น โรงพยาบาล A หรือ ทั่วไป"
                                            className={`w-full pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-slate-800 dark:text-slate-200 ${inputSize}`}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-1.5">
                            <label className={labelSize}>ชื่อผู้ใช้ (Username):</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                                    placeholder="เช่น prasert99"
                                    className={`w-full pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-slate-800 dark:text-slate-200 ${inputSize}`}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className={labelSize}>รหัสผ่าน (Password):</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-slate-800 dark:text-slate-200 ${inputSize}`}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-primary to-tertiary text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${buttonSize}`}
                        >
                            <span>{loading ? '⏳ กำลังบันทึกข้อมูล...' : activeTab === 'login' ? 'เข้าสู่ระบบเลย 🚀' : 'ลงทะเบียนเลย 🎉'}</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </form>
                </div>

                {/* Secondary Navigation */}
                <div className="mt-8 flex items-center justify-center space-x-6">
                    <Link href="/" className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors font-semibold">
                        <span className="material-symbols-outlined text-lg">home</span>
                        <span>กลับสู่หน้าหลัก</span>
                    </Link>
                </div>
            </main>

            {/* Footer Identity */}
            <footer className="absolute bottom-8 w-full text-center px-4">
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">© {new Date().getFullYear()} EasyPrompt AI. High-Tech Accessibility.</p>
            </footer>
        </main>
    );
}
