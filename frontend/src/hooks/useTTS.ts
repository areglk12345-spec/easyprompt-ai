'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { 
        isTTSOn, 
        isAutoSpeakOn, 
        ttsRate, 
        ttsPitch, 
        preferredVoiceURI 
    } = useAccessibility();

    const stop = useCallback(() => {
        // Stop HTML5 audio player
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        // Stop browser Web Speech API fallback
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    const speak = useCallback(async (text: string, customVoiceURI?: string) => {
        if (!text || !text.trim()) return;

        // Stop any currently playing audio
        stop();

        const NEURAL_VOICES = ['th-TH-PremwadeeNeural', 'th-TH-NiwatNeural', 'en-US-AvaNeural', 'en-US-AndrewNeural'];
        const voiceToUse = customVoiceURI || preferredVoiceURI || (typeof window !== 'undefined' ? localStorage.getItem('preferred_voice') : null) || 'th-TH-PremwadeeNeural';
        const isNeuralVoice = NEURAL_VOICES.includes(voiceToUse);

        // 1. Try Neural AI Audio Stream from FastAPI Backend (/api/tts) — only when a Neural preset is selected.
        // A browser voiceURI selected in Settings should go straight to the Web Speech API fallback below.
        if (isNeuralVoice) {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

                const response = await fetch(`${API_URL}/api/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text,
                        voice: voiceToUse,
                        rate: ttsRate || 1.0,
                        pitch: ttsPitch || 1.0
                    })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const audioUrl = URL.createObjectURL(blob);
                    const audio = new Audio(audioUrl);
                    audioRef.current = audio;

                    audio.onplay = () => setIsSpeaking(true);
                    audio.onended = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(audioUrl);
                        audioRef.current = null;
                    };
                    audio.onerror = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(audioUrl);
                        audioRef.current = null;
                    };

                    await audio.play();
                    return; // Successfully played Neural audio!
                }
            } catch (error) {
                console.warn("Neural TTS backend failed, falling back to Web Speech API:", error);
            }
        }

        // 2. Web Speech API Fallback
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        const cleanText = text
            .replace(/[*#_`~]/g, '') 
            .replace(/([a-zA-Z])([ก-๙])/g, '$1 $2') 
            .replace(/([ก-๙])([a-zA-Z])/g, '$1 $2');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        const targetVoiceURI = customVoiceURI || preferredVoiceURI || (typeof window !== 'undefined' ? localStorage.getItem('preferred_voice') : null);
        if (targetVoiceURI) {
            selectedVoice = voices.find(v => v.voiceURI === targetVoiceURI);
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
            utterance.lang = 'th-TH';
        }
        utterance.rate = ttsRate || 0.85; 
        utterance.pitch = ttsPitch || 1.0; 

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [ttsRate, ttsPitch, preferredVoiceURI, stop]);

    const previewVoice = useCallback((voiceURI?: string, testText: string = 'สวัสดีครับ นี่คือระบบทดสอบอ่านออกเสียง Neural AI จาก IZPrompt ช่วยสร้างคำสั่งการตลาดบน Facebook ได้อย่างไหลลื่น') => {
        speak(testText, voiceURI);
    }, [speak]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return { speak, previewVoice, stop, isSpeaking, isTTSOn, isAutoSpeakOn, ttsRate, ttsPitch };
}
