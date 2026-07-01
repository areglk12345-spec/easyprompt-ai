'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useFontSize } from '../../../context/FontSizeContext';

export default function Verify2FAPage() {
    const router = useRouter();
    const { login2fa } = useAuth();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';

    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const pendingUsername = typeof window !== 'undefined' ? sessionStorage.getItem('ep_2fa_pending') : null;

    useEffect(() => {
        // If no pending username, redirect back to login
        if (typeof window !== 'undefined' && !sessionStorage.getItem('ep_2fa_pending')) {
            router.push('/login');
        }
        // Focus first input
        inputRefs.current[0]?.focus();
    }, [router]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newCode = [...code];
        newCode[index] = value.slice(-1); // Take only last digit
        setCode(newCode);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits filled
        if (newCode.every(d => d !== '') && newCode.join('').length === 6) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newCode = pasted.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
            handleSubmit(pasted);
        }
    };

    const handleSubmit = async (totpCode: string) => {
        if (!pendingUsername) return;
        setLoading(true);
        setError('');

        try {
            await login2fa(pendingUsername, totpCode);
            setSuccess(true);
            sessionStorage.removeItem('ep_2fa_pending');
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'รหัสยืนยันไม่ถูกต้อง');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 px-4">
            <div className="w-full max-w-md animate-slide-up">
                {/* Card */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-100/50 dark:shadow-black/30 border border-white/60 dark:border-slate-700/60 p-8 md:p-10 space-y-8">
                    
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-950 mx-auto mb-2">
                            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                security
                            </span>
                        </div>
                        <h1 className={`font-extrabold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-2xl'}`}>
                            ยืนยันตัวตน 2 ขั้นตอน
                        </h1>
                        <p className={`text-slate-500 dark:text-slate-400 ${isLarge ? 'text-lg' : 'text-sm'}`}>
                            กรอกรหัส 6 หลักจาก Authenticator App ของคุณ
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-2 md:gap-3" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleChange(index, e.target.value)}
                                onKeyDown={e => handleKeyDown(index, e)}
                                disabled={loading || success}
                                className={`
                                    ${isLarge ? 'w-14 h-16 text-3xl' : 'w-12 h-14 text-2xl'}
                                    text-center font-extrabold rounded-2xl border-2 outline-none transition-all duration-200
                                    ${digit 
                                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300' 
                                        : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white'}
                                    focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40
                                    disabled:opacity-60 disabled:cursor-not-allowed
                                `}
                                aria-label={`Digit ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl animate-slide-up">
                            <span className="material-symbols-outlined text-rose-500 text-xl">error</span>
                            <p className={`text-rose-600 dark:text-rose-400 font-semibold ${isLarge ? 'text-lg' : 'text-sm'}`}>{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-slide-up">
                            <span className="material-symbols-outlined text-emerald-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            <p className={`text-emerald-600 dark:text-emerald-400 font-semibold ${isLarge ? 'text-lg' : 'text-sm'}`}>
                                ยืนยันตัวตนสำเร็จ! กำลังเข้าสู่ระบบ...
                            </p>
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex justify-center">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Help text */}
                    <div className="text-center space-y-2">
                        <p className="text-slate-400 dark:text-slate-500 text-xs">
                            เปิดแอป Google Authenticator หรือ Authy แล้วกรอกรหัสที่แสดงอยู่
                        </p>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('ep_2fa_pending');
                                router.push('/login');
                            }}
                            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-bold transition-colors"
                        >
                            ← กลับไปหน้าเข้าสู่ระบบ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
