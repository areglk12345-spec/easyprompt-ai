'use client';

import React from 'react';
import { useFontSize } from '../context/FontSizeContext';

export default function TextSizeSlider() {
    const { fontSizeLevel, setFontSizeLevel } = useFontSize();

    return (
        <div className="w-full space-y-6 py-4">
            <div className="flex justify-between items-end px-2">
                <div className="text-center">
                    <span className="block text-sm font-bold text-slate-500">กขค</span>
                    <span className="text-xs font-normal text-slate-400">เล็กสุด</span>
                </div>
                <div className="text-center">
                    <span className="block text-base font-bold text-slate-700 dark:text-slate-300">กขค</span>
                    <span className="text-xs font-normal text-slate-400">มาตรฐาน</span>
                </div>
                <div className="text-center">
                    <span className="block text-2xl font-bold text-primary">กขค</span>
                    <span className="text-xs font-bold text-primary">ใหญ่สุด</span>
                </div>
            </div>
            
            <div className="relative px-2">
                <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1"
                    value={fontSizeLevel}
                    onChange={(e) => setFontSizeLevel(parseInt(e.target.value, 10))}
                    className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                    style={{
                        background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(fontSizeLevel - 1) * 25}%, #e2e8f0 ${(fontSizeLevel - 1) * 25}%, #e2e8f0 100%)`
                    }}
                />
                
                <div className="flex justify-between mt-3 text-xs font-bold text-slate-400 px-1">
                    <span className={fontSizeLevel === 1 ? 'text-primary' : ''}>1</span>
                    <span className={fontSizeLevel === 2 ? 'text-primary' : ''}>2</span>
                    <span className={fontSizeLevel === 3 ? 'text-primary' : ''}>3</span>
                    <span className={fontSizeLevel === 4 ? 'text-primary' : ''}>4</span>
                    <span className={fontSizeLevel === 5 ? 'text-primary' : ''}>5</span>
                </div>
            </div>
        </div>
    );
}
