import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpTooltipProps {
    content: React.ReactNode;
    title?: string;
    align?: 'center' | 'left' | 'right';
    position?: 'top' | 'bottom';
}

export default function HelpTooltip({ content, title, align = 'center', position = 'top' }: HelpTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    let alignClass = 'left-1/2 -translate-x-1/2';
    let pointerAlignClass = 'left-1/2 -translate-x-1/2';
    if (align === 'right') {
        alignClass = 'right-0';
        pointerAlignClass = 'right-3';
    } else if (align === 'left') {
        alignClass = 'left-0';
        pointerAlignClass = 'left-3';
    }

    const isTop = position === 'top';
    const positionClass = isTop ? 'bottom-full mb-2' : 'top-full mt-2';
    
    // For bottom position, the pointer goes at the top of the tooltip pointing up
    const pointerPositionClass = isTop 
        ? '-bottom-2 border-t-[8px] border-t-white dark:border-t-slate-800' 
        : '-top-2 border-b-[8px] border-b-white dark:border-b-slate-800';

    return (
        <div className="relative inline-flex items-center ml-2" ref={tooltipRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
                title="คลิกเพื่อดูคำอธิบาย"
            >
                <HelpCircle className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute ${alignClass} ${positionClass} w-64 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100] text-sm text-slate-600 dark:text-slate-300 pointer-events-auto`}
                    >
                        {title && <div className="font-bold text-slate-800 dark:text-white mb-1">{title}</div>}
                        <div>{content}</div>
                        {/* Triangle pointer */}
                        <div className={`absolute ${pointerAlignClass} ${pointerPositionClass} w-0 h-0 border-l-[8px] border-r-[8px] border-l-transparent border-r-transparent drop-shadow-sm`}></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
