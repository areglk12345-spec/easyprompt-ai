'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export type MascotMood = 'idle' | 'thinking' | 'doctor' | 'senior_mode' | 'happy';

interface MascotAgentProps {
  mood?: MascotMood;
  customTip?: string;
  className?: string;
  onMascotClick?: () => void;
}

const DEFAULT_TIPS_TH = [
  "สวัสดีครับ! ผม EZ-Bot พร้อมช่วยเปลี่ยนความคิดเป็น Prompt สุดเจ๋งครับ ✨",
  "ลองเปิด 'โหมดภาษาง่าย' ดูสิครับ อ่านสบายตา ไม่ซับซ้อนเลย 😊",
  "อยากเช็คคุณภาพ Prompt? ส่งมาให้ผมตรวจใน Prompt Doctor ได้เลย! 🩺",
  "พิมพ์คำพูดประจำวันธรรมดาๆ มาได้เลย เดี๋ยวผมเกลาเป็น Prompt มืออาชีพให้ครับ 🚀",
  "คลิกที่ตัวผมได้เสมอนะครับ เดี๋ยวผมเปลี่ยนคำแนะนำดีๆ ให้ฟัง!"
];

const DEFAULT_TIPS_EN = [
  "Hi! I'm EZ-Bot, ready to transform your ideas into perfect Prompts! ✨",
  "Try 'Easy Language Mode' for simplified, friendly explanations! 😊",
  "Want to check prompt quality? Let's analyze it with Prompt Doctor! 🩺",
  "Just type everyday thoughts, and I'll tailor a professional prompt for you! 🚀",
  "Click on me anytime for quick helpful tips!"
];

export default function MascotAgent({
  mood: externalMood,
  customTip,
  className = '',
  onMascotClick
}: MascotAgentProps) {
  const { language, t } = useLanguage();
  const [internalMood, setInternalMood] = useState<MascotMood>('idle');
  const [tipIndex, setTipIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  // Active mood prioritizes external prop or falls back to internal state
  const activeMood = externalMood || internalMood;
  const tipsList = language === 'en' ? DEFAULT_TIPS_EN : DEFAULT_TIPS_TH;
  const currentTip = customTip || tipsList[tipIndex % tipsList.length];

  // Rotate tips automatically every 12 seconds
  useEffect(() => {
    if (customTip) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tipsList.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [customTip, tipsList.length]);

  const handleMascotClick = () => {
    if (onMascotClick) {
      onMascotClick();
    } else {
      // Cycle through moods & tips on click
      setInternalMood('happy');
      setTipIndex((prev) => (prev + 1) % tipsList.length);
      setTimeout(() => setInternalMood('idle'), 2500);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentTip);
      utterance.lang = 'th-TH';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (isMinimized) {
    return (
      <div className="mascot-container mascot-interactive">
        <button
          onClick={() => setIsMinimized(false)}
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/40 dark:border-slate-700/60"
          title="เปิด EZ-Bot มาสคอตผู้ช่วย"
        >
          <span className="material-symbols-outlined text-2xl animate-pulse">smart_toy</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`mascot-container mascot-interactive ${className}`}>
      {/* Speech Bubble */}
      {showSpeechBubble && (
        <div className="bubble-appear mb-3 max-w-[280px] sm:max-w-[320px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl shadow-indigo-500/10 border border-indigo-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative group transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>EZ-Bot AI</span>
              {activeMood === 'doctor' && (
                <span className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Prompt Doctor</span>
              )}
              {activeMood === 'senior_mode' && (
                <span className="bg-amber-500/10 text-amber-600 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Senior Mode</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleSpeak}
                className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors ${
                  isSpeaking ? 'text-indigo-600 animate-pulse' : ''
                }`}
                title="ฟังเสียงสปีกเกอร์"
              >
                <span className="material-symbols-outlined text-base">volume_up</span>
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                title="พับเก็บมาสคอต"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
            {currentTip}
          </p>

          {/* Speech Bubble Tail Arrow */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white/95 dark:bg-slate-900/95 rotate-45 border-r border-b border-indigo-100 dark:border-slate-800"></div>
        </div>
      )}

      {/* Mascot SVG Robot Character */}
      <div
        onClick={handleMascotClick}
        className={`cursor-pointer relative group transition-transform duration-300 ${
          activeMood === 'happy' ? 'mascot-happy-anim' : 'mascot-float-anim'
        }`}
        title="คลิกทักทาย EZ-Bot"
      >
        {/* Outer Aura Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-cyan-500/30 blur-xl mascot-aura"></div>

        <svg
          width="96"
          height="96"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative drop-shadow-2xl hover:scale-105 transition-transform duration-300"
        >
          <defs>
            {/* Robot Head & Body Gradients */}
            <linearGradient id="ezbot-head-grad" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            <linearGradient id="ezbot-visor-grad" x1="20" y1="30" x2="80" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            <linearGradient id="ezbot-body-grad" x1="20" y1="60" x2="80" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>

            <linearGradient id="ezbot-gem-grad" x1="45" y1="5" x2="55" y2="15" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <filter id="glow-light" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Energy Orbit Ring */}
          <ellipse
            cx="50"
            cy="78"
            rx="32"
            ry="8"
            fill="none"
            stroke="url(#ezbot-gem-grad)"
            strokeWidth="2"
            strokeDasharray="6 4"
            className="ring-rotate opacity-75"
          />

          {/* Antenna */}
          <line x1="50" y1="22" x2="50" y2="12" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="10" r="5" fill="url(#ezbot-gem-grad)" className="antenna-light" filter="url(#glow-light)" />

          {/* Floating Robot Body */}
          <rect x="30" y="60" width="40" height="26" rx="13" fill="url(#ezbot-body-grad)" />
          {/* Core Power Heart/Chest */}
          <circle cx="50" cy="73" r="6" fill="#ffffff" opacity="0.9" filter="url(#glow-light)" />
          <circle cx="50" cy="73" r="3" fill="#38bdf8" />

          {/* Floating Robotic Arms */}
          <rect x="18" y="64" width="8" height="14" rx="4" fill="#6366f1" className={activeMood === 'happy' ? 'animate-bounce' : ''} />
          <rect x="74" y="64" width="8" height="14" rx="4" fill="#6366f1" />

          {/* Head Capsule */}
          <rect x="18" y="22" width="64" height="42" rx="21" fill="url(#ezbot-head-grad)" stroke="#c7d2fe" strokeWidth="1.5" />
          
          {/* Head Ear Pads */}
          <rect x="13" y="32" width="6" height="20" rx="3" fill="#4338ca" />
          <rect x="81" y="32" width="6" height="20" rx="3" fill="#4338ca" />

          {/* Glass Visor Screen */}
          <rect x="24" y="28" width="52" height="30" rx="14" fill="url(#ezbot-visor-grad)" stroke="#312e81" strokeWidth="1" />

          {/* Eye & Facial Expressions based on Active Mood */}
          {activeMood === 'idle' && (
            <g className="eye-blink-anim">
              {/* Left Eye */}
              <circle cx="38" cy="42" r="5" fill="#38bdf8" filter="url(#glow-light)" />
              <circle cx="39" cy="40" r="2" fill="#ffffff" />
              {/* Right Eye */}
              <circle cx="62" cy="42" r="5" fill="#38bdf8" filter="url(#glow-light)" />
              <circle cx="63" cy="40" r="2" fill="#ffffff" />
              {/* Smile Mouth */}
              <path d="M 44 48 Q 50 52 56 48" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {activeMood === 'thinking' && (
            <g>
              {/* Rotating Orbit Dots for Thinking */}
              <circle cx="38" cy="42" r="4" fill="#c084fc" filter="url(#glow-light)" />
              <circle cx="62" cy="42" r="4" fill="#c084fc" filter="url(#glow-light)" />
              <path d="M 42 49 H 58" stroke="#c084fc" strokeWidth="2" strokeDasharray="2 2" />
            </g>
          )}

          {activeMood === 'doctor' && (
            <g>
              {/* Doctor Visor Glasses Scanner */}
              <rect x="30" y="36" width="40" height="12" rx="4" fill="#10b981" opacity="0.25" />
              <circle cx="38" cy="42" r="4" fill="#34d399" filter="url(#glow-light)" />
              <circle cx="62" cy="42" r="4" fill="#34d399" filter="url(#glow-light)" />
              {/* Diagnostic Pulse Line Mouth */}
              <path d="M 42 49 L 46 47 L 50 51 L 54 48 L 58 49" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}

          {activeMood === 'senior_mode' && (
            <g>
              {/* Senior Mode Cute Oversized Glasses */}
              <circle cx="38" cy="42" r="8" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="62" cy="42" r="8" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <line x1="46" y1="42" x2="54" y2="42" stroke="#f59e0b" strokeWidth="2" />
              {/* Warm Smile */}
              <path d="M 43 51 Q 50 55 57 51" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {activeMood === 'happy' && (
            <g>
              {/* Cheerful Happy Star Eyes */}
              <path d="M 38 37 L 40 42 L 44 42 L 41 45 L 42 49 L 38 46 L 34 49 L 35 45 L 32 42 L 36 42 Z" fill="#fbbf24" filter="url(#glow-light)" />
              <path d="M 62 37 L 64 42 L 68 42 L 65 45 L 66 49 L 62 46 L 58 49 L 59 45 L 56 42 L 60 42 Z" fill="#fbbf24" filter="url(#glow-light)" />
              {/* Big Smile */}
              <path d="M 42 48 Q 50 56 58 48 Z" fill="#fbbf24" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
