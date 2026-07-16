'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// For backward compatibility with existing components
type FontSize = 'normal' | 'large';

interface FontSizeContextType {
    fontSize: FontSize; 
    toggleFontSize: () => void; 
    fontSizeLevel: number; 
    setFontSizeLevel: (level: number) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const LEVEL_MAP: Record<number, string> = {
    1: '14px',
    2: '16px', // Default
    3: '18px',
    4: '20px',
    5: '22px'
};

export function FontSizeProvider({ children }: { children: ReactNode }) {
    const [fontSizeLevel, setFontSizeLevelState] = useState<number>(2);

    useEffect(() => {
        // Load preference
        const savedLevel = localStorage.getItem('ep_font_size_level');
        if (savedLevel) {
            setFontSizeLevelState(parseInt(savedLevel, 10));
        } else {
            // Check old format
            const oldSavedSize = localStorage.getItem('ep_font_size');
            if (oldSavedSize === 'large') {
                setFontSizeLevelState(4);
            }
        }
    }, []);

    useEffect(() => {
        // Apply to root html to scale entire UI
        const root = document.documentElement;
        const pixelSize = LEVEL_MAP[fontSizeLevel] || '16px';
        root.style.fontSize = pixelSize;
    }, [fontSizeLevel]);

    const setFontSizeLevel = (level: number) => {
        if (level >= 1 && level <= 5) {
            setFontSizeLevelState(level);
            localStorage.setItem('ep_font_size_level', level.toString());
            // Sync with old format for components still using it
            localStorage.setItem('ep_font_size', level >= 4 ? 'large' : 'normal');
        }
    };

    const toggleFontSize = () => {
        setFontSizeLevel(fontSizeLevel >= 4 ? 2 : 4);
    };

    const fontSize: FontSize = fontSizeLevel >= 4 ? 'large' : 'normal';

    return (
        <FontSizeContext.Provider value={{ fontSize, toggleFontSize, fontSizeLevel, setFontSizeLevel }}>
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
