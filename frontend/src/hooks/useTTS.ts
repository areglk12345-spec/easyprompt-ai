'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const { isTTSOn } = useAccessibility();

    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        // Stop any currently playing audio
        window.speechSynthesis.cancel();

        // Clean up text for clearer pronunciation (Remove markdown, add spaces between Thai/English)
        const cleanText = text
            .replace(/[*#_`~]/g, '') 
            .replace(/([a-zA-Z])([ก-๙])/g, '$1 $2') 
            .replace(/([ก-๙])([a-zA-Z])/g, '$1 $2');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Try to find a specific Thai voice (Google or Microsoft natural voices), otherwise fallback
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (typeof window !== 'undefined') {
            const savedVoiceURI = localStorage.getItem('preferred_voice');
            if (savedVoiceURI) {
                selectedVoice = voices.find(v => v.voiceURI === savedVoiceURI);
            }
        }

        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('th')) 
                || voices.find(v => v.name.includes('Pattara') || v.name.includes('Premwadee')) 
                || voices.find(v => v.lang.includes('th'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = 'th-TH'; // Default to Thai
        }
        utterance.rate = 0.85; // Slightly slower (0.85) for clear articulation
        utterance.pitch = 1.0; // Standard pitch

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    return { speak, stop, isSpeaking, isTTSOn };
}
