'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

type Language = 'th' | 'en';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState<Language>('th');

    useEffect(() => {
        const savedLang = localStorage.getItem('ep_language') as Language;
        if (savedLang === 'th' || savedLang === 'en') {
            setLanguage(savedLang);
        }
    }, []);

    const toggleLanguage = () => {
        const nextLang = language === 'th' ? 'en' : 'th';
        setLanguage(nextLang);
        localStorage.setItem('ep_language', nextLang);
    };

    const t = (key: string): string => {
        const dict = translations[language];
        // If key exists, return it, otherwise fallback to the key string
        // Need to assert type because TypeScript doesn't know the exact keys dynamically
        return (dict as any)[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
