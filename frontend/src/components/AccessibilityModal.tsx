import React, { useEffect, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useFontSize } from '../context/FontSizeContext';
import { useTheme } from '../context/ThemeContext';
import TextSizeSlider from './TextSizeSlider';
import { Monitor, Moon, Sun, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccessibilityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccessibilityModal({ isOpen, onClose }: AccessibilityModalProps) {
    const { isHighContrast, isSimplifiedUI, toggleHighContrast, toggleSimplifiedUI } = useAccessibility();
    const { themeMode, setThemeMode } = useTheme();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                ref={modalRef}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">visibility</span>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Accessibility & Display</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Text Size */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">ขนาดตัวอักษร (Text Size)</label>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <TextSizeSlider />
                        </div>
                    </div>

                    {/* Theme Mode */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">ธีมสี (Theme)</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setThemeMode('light')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themeMode === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <Sun className="w-5 h-5" />
                                <span className="text-xs font-semibold">Light</span>
                            </button>
                            <button
                                onClick={() => setThemeMode('dark')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themeMode === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <Moon className="w-5 h-5" />
                                <span className="text-xs font-semibold">Dark</span>
                            </button>
                            <button
                                onClick={() => setThemeMode('system')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themeMode === 'system' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <Monitor className="w-5 h-5" />
                                <span className="text-xs font-semibold">System</span>
                            </button>
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800 dark:text-white">โหมดสีคอนทราสต์สูง</span>
                                <span className="text-xs text-slate-500">ช่วยให้ผู้ที่มีความบกพร่องทางสายตาอ่านได้ง่ายขึ้น</span>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isHighContrast ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <input type="checkbox" className="sr-only" checked={isHighContrast} onChange={toggleHighContrast} />
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isHighContrast ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800 dark:text-white">ลดแอนิเมชัน (Simplified UI)</span>
                                <span className="text-xs text-slate-500">ลดการเคลื่อนไหวสำหรับผู้ที่มีอาการวิงเวียนง่าย</span>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSimplifiedUI ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <input type="checkbox" className="sr-only" checked={isSimplifiedUI} onChange={toggleSimplifiedUI} />
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSimplifiedUI ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                        </label>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
