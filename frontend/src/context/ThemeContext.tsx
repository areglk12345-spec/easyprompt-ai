'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
    isDarkMode: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [mounted, setMounted] = useState(false);

    // Resolve the effective dark mode based on themeMode
    const resolveEffectiveDark = (mode: ThemeMode): boolean => {
        if (mode === 'dark') return true;
        if (mode === 'light') return false;
        // system
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    };

    useEffect(() => {
        setMounted(true);
        // Load saved theme mode
        const savedMode = localStorage.getItem('ep_theme_mode') as ThemeMode | null;
        
        if (savedMode && ['system', 'light', 'dark'].includes(savedMode)) {
            setThemeModeState(savedMode);
            setIsDarkMode(resolveEffectiveDark(savedMode));
        } else {
            // Legacy fallback: check old ep_dark_mode key
            const legacyDark = localStorage.getItem('ep_dark_mode');
            if (legacyDark !== null) {
                const mode: ThemeMode = legacyDark === 'true' ? 'dark' : 'light';
                setThemeModeState(mode);
                setIsDarkMode(legacyDark === 'true');
                localStorage.setItem('ep_theme_mode', mode);
            } else {
                // Default to system
                setThemeModeState('system');
                setIsDarkMode(resolveEffectiveDark('system'));
            }
        }
    }, []);

    // Listen for OS theme changes when in 'system' mode
    useEffect(() => {
        if (!mounted) return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (themeMode === 'system') {
                setIsDarkMode(e.matches);
            }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themeMode, mounted]);

    // Apply/remove dark class on <html> whenever isDarkMode changes
    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDarkMode, mounted]);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        setIsDarkMode(resolveEffectiveDark(mode));
        localStorage.setItem('ep_theme_mode', mode);
        // Also set legacy key for backward compatibility
        localStorage.setItem('ep_dark_mode', String(resolveEffectiveDark(mode)));
    };

    const toggleDarkMode = () => {
        // When toggling, cycle: if system -> dark, if dark -> light, if light -> dark
        const next = !isDarkMode;
        const mode: ThemeMode = next ? 'dark' : 'light';
        setThemeMode(mode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
