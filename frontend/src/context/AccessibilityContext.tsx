'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
    isHighContrast: boolean;
    isSimplifiedUI: boolean;
    isTTSOn: boolean;
    toggleHighContrast: () => void;
    toggleSimplifiedUI: () => void;
    toggleTTS: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [isSimplifiedUI, setIsSimplifiedUI] = useState(false);
    const [isTTSOn, setIsTTSOn] = useState(false);

    useEffect(() => {
        // Load saved preferences
        const savedHighContrast = localStorage.getItem('ep_high_contrast') === 'true';
        const savedSimplifiedUI = localStorage.getItem('ep_simplified_ui') === 'true';
        const savedTTSOn = localStorage.getItem('ep_tts_on') === 'true';
        
        setIsHighContrast(savedHighContrast);
        setIsSimplifiedUI(savedSimplifiedUI);
        setIsTTSOn(savedTTSOn);
    }, []);

    // Apply high contrast class to html root
    useEffect(() => {
        const root = document.documentElement;
        if (isHighContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
    }, [isHighContrast]);

    const toggleHighContrast = () => {
        setIsHighContrast((prev) => {
            const next = !prev;
            localStorage.setItem('ep_high_contrast', String(next));
            return next;
        });
    };

    const toggleSimplifiedUI = () => {
        setIsSimplifiedUI((prev) => {
            const next = !prev;
            localStorage.setItem('ep_simplified_ui', String(next));
            return next;
        });
    };

    const toggleTTS = () => {
        setIsTTSOn((prev) => {
            const next = !prev;
            localStorage.setItem('ep_tts_on', String(next));
            return next;
        });
    };

    return (
        <AccessibilityContext.Provider value={{
            isHighContrast,
            isSimplifiedUI,
            isTTSOn,
            toggleHighContrast,
            toggleSimplifiedUI,
            toggleTTS
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}
