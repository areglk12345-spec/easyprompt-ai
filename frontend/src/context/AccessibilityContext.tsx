'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
    isHighContrast: boolean;
    isSimplifiedUI: boolean;
    isTTSOn: boolean;
    isAutoSpeakOn: boolean;
    ttsRate: number;
    ttsPitch: number;
    preferredVoiceURI: string;
    toggleHighContrast: () => void;
    toggleSimplifiedUI: () => void;
    toggleTTS: () => void;
    toggleAutoSpeak: () => void;
    setTTSRate: (rate: number) => void;
    setTTSPitch: (pitch: number) => void;
    setPreferredVoiceURI: (uri: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [isSimplifiedUI, setIsSimplifiedUI] = useState(false);
    const [isTTSOn, setIsTTSOn] = useState(false);
    const [isAutoSpeakOn, setIsAutoSpeakOn] = useState(false);
    const [ttsRate, setTtsRateState] = useState(0.85);
    const [ttsPitch, setTtsPitchState] = useState(1.0);
    const [preferredVoiceURI, setPreferredVoiceURIState] = useState('');

    useEffect(() => {
        // Load saved preferences
        const savedHighContrast = localStorage.getItem('ep_high_contrast') === 'true';
        const savedSimplifiedUI = localStorage.getItem('ep_simplified_ui') === 'true';
        const savedTTSOn = localStorage.getItem('ep_tts_on') === 'true';
        const savedAutoSpeak = localStorage.getItem('ep_auto_speak') === 'true';
        const savedRate = localStorage.getItem('ep_tts_rate');
        const savedPitch = localStorage.getItem('ep_tts_pitch');
        const savedVoice = localStorage.getItem('preferred_voice');
        
        setIsHighContrast(savedHighContrast);
        setIsSimplifiedUI(savedSimplifiedUI);
        setIsTTSOn(savedTTSOn);
        setIsAutoSpeakOn(savedAutoSpeak);
        if (savedRate) setTtsRateState(parseFloat(savedRate) || 0.85);
        if (savedPitch) setTtsPitchState(parseFloat(savedPitch) || 1.0);
        if (savedVoice) setPreferredVoiceURIState(savedVoice);
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

    const toggleAutoSpeak = () => {
        setIsAutoSpeakOn((prev) => {
            const next = !prev;
            localStorage.setItem('ep_auto_speak', String(next));
            return next;
        });
    };

    const setTTSRate = (rate: number) => {
        setTtsRateState(rate);
        localStorage.setItem('ep_tts_rate', String(rate));
    };

    const setTTSPitch = (pitch: number) => {
        setTtsPitchState(pitch);
        localStorage.setItem('ep_tts_pitch', String(pitch));
    };

    const setPreferredVoiceURI = (uri: string) => {
        setPreferredVoiceURIState(uri);
        localStorage.setItem('preferred_voice', uri);
    };

    return (
        <AccessibilityContext.Provider value={{
            isHighContrast,
            isSimplifiedUI,
            isTTSOn,
            isAutoSpeakOn,
            ttsRate,
            ttsPitch,
            preferredVoiceURI,
            toggleHighContrast,
            toggleSimplifiedUI,
            toggleTTS,
            toggleAutoSpeak,
            setTTSRate,
            setTTSPitch,
            setPreferredVoiceURI
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
