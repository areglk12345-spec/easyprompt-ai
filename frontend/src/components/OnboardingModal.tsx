'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFontSize } from '../context/FontSizeContext';
import TextSizeSlider from './TextSizeSlider';

export default function OnboardingModal() {
    const { isLoggedIn } = useAuth();
    const { fontSize, toggleFontSize } = useFontSize();
    
    const [show, setShow] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && isLoggedIn) {
            const isCompleted = localStorage.getItem('ep_onboarding_completed');
            if (!isCompleted) {
                setShow(true);
            }
        }
    }, [isMounted, isLoggedIn]);

    if (!show) return null;

    const handleComplete = () => {
        localStorage.setItem('ep_onboarding_completed', 'true');
        setShow(false);
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                <div className="text-center space-y-3 mb-8">
                    <div className="w-16 h-16 bg-primary/10 text-primary mx-auto rounded-2xl flex items-center justify-center mb-4 ring-8 ring-primary/5">
                        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>text_fields</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">ยินดีต้อนรับสู่ EasyPrompt!</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">มาเริ่มต้นด้วยการตั้งค่าขนาดตัวอักษรที่คุณอ่านสบายตาที่สุดกันก่อนครับ</p>
                </div>

                <div className="mb-10 px-4">
                    <TextSizeSlider />
                </div>

                <button
                    onClick={handleComplete}
                    className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:brightness-110 transition-all shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
                >
                    เริ่มใช้งานกันเลย!
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">คุณสามารถเปลี่ยนการตั้งค่านี้ได้ภายหลังในหน้า Settings</p>
            </div>
        </div>
    );
}
