'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type FontSize = 'normal' | 'large';

interface FontSizeContextType {
    fontSize: FontSize;
    toggleFontSize: () => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: ReactNode }) {
    const [fontSize, setFontSize] = useState<FontSize>('normal');

    useEffect(() => {
        const savedSize = localStorage.getItem('ep_font_size') as FontSize | null;
        if (savedSize === 'large' || savedSize === 'normal') {
            setFontSize(savedSize);
        }
    }, []);

    const toggleFontSize = () => {
        setFontSize((prevSize) => {
            const nextSize = prevSize === 'normal' ? 'large' : 'normal';
            localStorage.setItem('ep_font_size', nextSize);
            return nextSize;
        });
    };

    return (
        <FontSizeContext.Provider value={{ fontSize, toggleFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
}

export function useFontSize() {
    const context = useContext(FontSizeContext);
    if (context === undefined) {
        throw new Error('useFontSize must be used within a FontSizeProvider');
    }
    return context;
}
