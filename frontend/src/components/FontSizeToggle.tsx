'use client';

import React from 'react';

interface FontSizeToggleProps {
    isLarge: boolean;
    onToggle: () => void;
    size?: 'sm' | 'md';
}

export default function FontSizeToggle({ isLarge, onToggle, size = 'sm' }: FontSizeToggleProps) {
    if (size === 'md') {
        return (
            <button
                type="button"
                onClick={onToggle}
                role="switch"
                aria-checked={isLarge}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isLarge ? 'bg-primary' : 'bg-slate-300'
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isLarge ? 'translate-x-6' : 'translate-x-0'
                    }`}
                />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`w-12 h-6 rounded-full flex items-center transition-colors shadow-inner shrink-0 ${
                isLarge ? 'bg-primary' : 'bg-slate-300'
            }`}
        >
            <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    isLarge ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}
