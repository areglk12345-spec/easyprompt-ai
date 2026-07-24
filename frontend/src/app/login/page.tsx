'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, OAuthProvider } from 'firebase/auth';

export default function LoginPage() {
    const router = useRouter();
    const { login, register, socialLogin } = useAuth();
    
    const [step, setStep] = useState<'email' | 'password' | 'register_details'>('email');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [organization, setOrganization] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSocialLogin = async (provider: string) => {
        try {
            setError('');
            setLoading(true);
            let result;
            
            if (provider === 'Google') {
                if (!auth || !googleProvider) {
                    setError('Firebase Authentication ยังไม่ได้ตั้งค่าหรือเกิดข้อผิดพลาดในการโหลด');
                    setLoading(false);
                    return;
                }
                result = await signInWithPopup(auth, googleProvider);
            } else if (provider === 'Apple') {
                if (!auth) {
                    setError('Firebase Authentication ยังไม่ได้ตั้งค่าหรือเกิดข้อผิดพลาดในการโหลด');
                    setLoading(false);
                    return;
                }
                const appleProvider = new OAuthProvider('apple.com');
                result = await signInWithPopup(auth, appleProvider);
            } else if (provider === 'โทรศัพท์') {
                alert('ระบบ Login ด้วยเบอร์โทรศัพท์ ต้องมีการตั้งค่า SMS และ Recaptcha เพิ่มเติม');
                setLoading(false);
                return;
            }

            if (result && result.user) {
                const idToken = await result.user.getIdToken();
                // Send token to backend
                await socialLogin(idToken);
                setSuccess(`เข้าสู่ระบบด้วย ${provider} สำเร็จ! กำลังนำคุณเข้าสู่ระบบ...`);
                setTimeout(() => {
                    router.push('/dashboard');
                    router.refresh();
                }, 1000);
            }
        } catch (err: any) {
            console.error("Social login error", err);
            setError(`เกิดข้อผิดพลาดในการเชื่อมต่อ ${provider}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username.trim()) {
            setError('กรุณากรอกอีเมลหรือเบอร์โทรศัพท์');
            return;
        }
        setStep('password');
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!password) {
            setError('กรุณากรอกรหัสผ่าน');
            return;
        }

        setLoading(true);
        try {
            await login(username, password);
            setSuccess('เข้าสู่ระบบสำเร็จ! กำลังนำคุณเข้าสู่ระบบ...');
            setTimeout(() => {
                router.push('/dashboard');
                router.refresh();
            }, 1000);
        } catch (err: any) {
            if (err.message === '2FA_REQUIRED') {
                sessionStorage.setItem('ep_2fa_pending', err.pendingUsername);
                router.push('/login/verify-2fa');
            } else if (err.message === 'Incorrect username or password' || err.message?.includes('401')) {
                setError('ไม่พบบัญชีหรือรหัสผ่านไม่ถูกต้อง (หากคุณเป็นผู้ใช้ใหม่ กรุณาสร้างบัญชี)');
                setStep('register_details');
            } else {
                setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!fullName) {
            setError('กรุณากรอกชื่อผู้ใช้จริง');
            return;
        }

        setLoading(true);
        try {
            await register(username, password, fullName, organization || 'ทั่วไป');
            setSuccess('สมัครสมาชิกสำเร็จแล้ว! กำลังเข้าสู่ระบบ...');
            setTimeout(async () => {
                await login(username, password);
                router.push('/dashboard');
                router.refresh();
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div 
                className="w-full max-w-[440px] bg-white dark:bg-slate-800 rounded-[32px] p-8 md:p-10 shadow-premium dark:shadow-premium-dark border border-slate-100 dark:border-slate-700 mx-4 my-8 flex flex-col transition-all duration-300"
            >
                {/* Brand Logo */}
                <div className="flex justify-center mb-6 mt-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800/50 ai-glow-border">
                        <span className="material-symbols-outlined !font-bold text-2xl">bolt</span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-sm text-center font-medium">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm text-center font-medium">
                        {success}
                    </div>
                )}

                {step === 'email' && (
                    <div className="transition-all duration-200">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold mb-2 tracking-tight text-slate-800 dark:text-white">เข้าสู่ระบบ / สมัครบัญชี</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-[14px] leading-relaxed font-medium px-2">
                                เชื่อมต่อเพื่อรับคำตอบที่ฉลาดขึ้น สร้างสรรค์ Prompt และจัดการคอลเล็กชันส่วนตัว
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <button 
                                onClick={() => handleSocialLogin('Google')}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-[14px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover-spring"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                ดำเนินการต่อด้วย Google
                            </button>
                            
                            <button 
                                onClick={() => handleSocialLogin('Apple')}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-[14px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover-spring"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-black dark:text-white"><path d="M16.365 1.488a6.529 6.529 0 01-1.503 4.673 6.326 6.326 0 01-4.48 2.274c-.114-1.743.606-3.486 1.764-4.596C13.204 2.658 14.858 1.6 16.365 1.488zm-5.748 6.57c-1.895-.084-3.568 1.09-4.542 1.09s-2.316-1.037-3.924-1.006c-2.083.031-4.004 1.21-5.064 3.062-2.158 3.753-.553 9.317 1.547 12.368 1.032 1.493 2.234 3.167 3.824 3.104 1.528-.063 2.115-.992 3.96-.992 1.832 0 2.378.992 3.961.96 1.624-.031 2.66-1.524 3.66-3.02 1.157-1.69 1.636-3.328 1.658-3.411-.036-.016-3.197-1.226-3.23-4.908-.031-3.08 2.508-4.558 2.62-4.622-1.442-2.107-3.66-2.383-4.47-2.457z"/></svg>
                                ดำเนินการต่อด้วย Apple
                            </button>

                            <button 
                                onClick={() => handleSocialLogin('โทรศัพท์')}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-[14px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover-spring"
                            >
                                <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-300">phone_iphone</span>
                                ดำเนินการต่อด้วยโทรศัพท์
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700"></div>
                            <span className="text-slate-400 dark:text-slate-500 text-[13px] font-semibold">หรือใช้บัญชี</span>
                            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700"></div>
                        </div>

                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                                    placeholder="อีเมล หรือ เบอร์โทรศัพท์"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-[15px] placeholder-slate-400 text-slate-800 dark:text-white"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-[15px] shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] hover-spring"
                            >
                                ดำเนินการต่อ
                            </button>
                        </form>
                    </div>
                )}

                {step === 'password' && (
                    <div className="transition-all duration-200">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold mb-3 tracking-tight text-slate-800 dark:text-white">ป้อนรหัสผ่าน</h1>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full text-[14px]">
                                <span className="text-slate-700 dark:text-slate-200 font-semibold">{username}</span>
                                <button 
                                    onClick={() => setStep('email')} 
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                >
                                    แก้ไข
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="รหัสผ่าน"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-[15px] placeholder-slate-400 text-slate-800 dark:text-white"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-[15px] shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 hover-spring"
                            >
                                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'register_details' && (
                    <div className="transition-all duration-200">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold mb-3 tracking-tight text-slate-800 dark:text-white">สร้างบัญชีใหม่</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-[14px] px-2 font-medium">
                                ดูเหมือนคุณจะเป็นผู้ใช้ใหม่ กรุณากรอกข้อมูลเพิ่มเติม
                            </p>
                        </div>

                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">badge</span>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="ชื่อจริง หรือ ชื่อเรียก"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-[15px] placeholder-slate-400 text-slate-800 dark:text-white"
                                    autoFocus
                                />
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">corporate_fare</span>
                                <input
                                    type="text"
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    placeholder="หน่วยงาน (ไม่บังคับ)"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-[15px] placeholder-slate-400 text-slate-800 dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-[15px] shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] mt-2 disabled:opacity-50 hover-spring"
                            >
                                {loading ? 'กำลังลงทะเบียน...' : 'สมัครสมาชิก'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
