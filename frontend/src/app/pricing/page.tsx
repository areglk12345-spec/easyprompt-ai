'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Check } from 'lucide-react';

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
        return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
    }

    const packageEntries = Object.entries(packages);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Pricing</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        เติมเครดิตเพื่อใช้งาน AI
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-slate-500 dark:text-slate-400 mx-auto">
                        ยอดเครดิตคงเหลือของคุณ: <strong className="text-indigo-600">{user?.credits ?? 0}</strong> เครดิต
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {packageEntries.map(([pkgId, pkg]: [string, any]) => (
                        <div key={pkgId} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white capitalize">{pkgId} Package</h3>
                            <p className="mt-4 flex items-baseline text-slate-900 dark:text-white">
                                <span className="text-5xl font-extrabold tracking-tight">฿{pkg.price}</span>
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                ได้รับ {pkg.credits} เครดิต
                            </p>
                            <ul role="list" className="mt-6 space-y-4">
                                <li className="flex space-x-3">
                                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                    <span className="text-sm text-slate-500 dark:text-slate-400">ใช้ถาม-ตอบ (1 credit/ครั้ง)</span>
                                </li>
                                <li className="flex space-x-3">
                                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Gemini Pro (5 credits/ครั้ง)</span>
                                </li>
                            </ul>
                            <button
                                onClick={() => handleTopUp(pkgId)}
                                disabled={isProcessing}
                                className="mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-xl py-3 px-4 text-center font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'กำลังดำเนินการ...' : 'ซื้อเลย'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
