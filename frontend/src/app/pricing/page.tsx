'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Check, Zap, Sparkles, ArrowLeft } from 'lucide-react';

export default function PricingPage() {
    const router = useRouter();
    const { authFetch, user, refreshUser } = useAuth();
    const [packages, setPackages] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const res = await authFetch(`${API_URL}/api/payment/packages`);
                if (res.ok) {
                    const data = await res.json();
                    setPackages(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, [authFetch]);

    const handleTopUp = async (packageId: string) => {
        setIsProcessing(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/payment/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ package_id: packageId })
            });
            if (res.ok) {
                await refreshUser();
                alert('เติมเงินสำเร็จ! เครดิตของคุณถูกเพิ่มแล้ว');
                router.push('/chat');
            } else {
                alert('เกิดข้อผิดพลาดในการทำรายการ');
            }
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                <div className="dot-flashing"></div>
            </div>
        );
    }

    const packageEntries = Object.entries(packages);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับหน้าหลัก
                    </Link>
                </div>

                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Verbaqo Credits & Pricing
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        อัตราค่าบริการและเติมเครดิต AI
                    </h1>
                    <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400 mx-auto">
                        ยอดเครดิตคงเหลือปัจจุบันของคุณ: <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-xl">{user?.credits ?? 0}</strong> เครดิต
                    </p>
                </div>

                {/* Top-up Credit Packages */}
                <div className="mt-12">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        เติมเครดิตรายครั้ง (Pay-as-you-go)
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {packageEntries.map(([pkgId, pkg]: [string, any]) => (
                            <div key={pkgId} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{pkgId} Package</h3>
                                        {pkgId === 'pro' && (
                                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full">ยอดนิยม</span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline text-slate-900 dark:text-white mb-2">
                                        <span className="text-4xl font-extrabold tracking-tight">฿{pkg.price}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
                                        ได้รับ {pkg.credits} เครดิต
                                    </p>
                                    <ul role="list" className="space-y-3 mb-8">
                                        <li className="flex space-x-3 text-sm text-slate-600 dark:text-slate-300">
                                            <Check className="flex-shrink-0 h-5 w-5 text-emerald-500" />
                                            <span>ใช้ถาม-ตอบ และเกลา Prompt (1 เครดิต/ครั้ง)</span>
                                        </li>
                                        <li className="flex space-x-3 text-sm text-slate-600 dark:text-slate-300">
                                            <Check className="flex-shrink-0 h-5 w-5 text-emerald-500" />
                                            <span>โมเดลขั้นสูง Gemini Pro (5 เครดิต/ครั้ง)</span>
                                        </li>
                                        <li className="flex space-x-3 text-sm text-slate-600 dark:text-slate-300">
                                            <Check className="flex-shrink-0 h-5 w-5 text-emerald-500" />
                                            <span>ไม่มีวันหมดอายุ ใช้ได้ต่อเนื่อง</span>
                                        </li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => handleTopUp(pkgId)}
                                    disabled={isProcessing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl py-3 px-4 text-center transition-colors shadow-md disabled:opacity-50"
                                >
                                    {isProcessing ? 'กำลังดำเนินการ...' : 'เติมเครดิตเลย'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subscription Plans Summary Banner */}
                <div className="mt-16 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-2xl font-bold">ต้องการสมัครสมาชิกรายเดือน/รายปี?</h3>
                        <p className="text-slate-300 text-sm max-w-xl">
                            แพ็กเกจ Pro (฿149-199/เดือน) และ Business (฿790-990/เดือน) มาพร้อมกับการใช้งานสร้างเทมเพลตส่วนตัวไม่จำกัด และ Workspace องค์กร
                        </p>
                    </div>
                    <Link
                        href="/#pricing"
                        className="px-6 py-3 rounded-full bg-white text-indigo-950 font-bold hover:bg-slate-100 transition-colors shrink-0 shadow-lg text-sm"
                    >
                        ดูแพ็กเกจรายเดือนที่หน้าหลัก
                    </Link>
                </div>
            </div>
        </div>
    );
}
