'use client';

import React from 'react';
import { useTTS } from '../hooks/useTTS';

interface TTSButtonProps {
    text: string;
    className?: string;
}

export default function TTSButton({ text, className = '' }: TTSButtonProps) {
    const { speak, stop, isSpeaking } = useTTS();

    const handleClick = () => {
        if (isSpeaking) {
            stop();
        } else {
            speak(text);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                isSpeaking 
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700'
            } ${className}`}
            title={isSpeaking ? 'หยุดอ่าน' : 'อ่านข้อความ'}
            aria-label={isSpeaking ? 'Stop reading' : 'Read text aloud'}
        >
            <span className="material-symbols-outlined text-sm md:text-base">
                {isSpeaking ? 'stop_circle' : 'volume_up'}
            </span>
        </button>
    );
}
