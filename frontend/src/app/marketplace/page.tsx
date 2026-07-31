'use client';

import React, { useEffect } from 'react';

export default function MarketplacePage() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.location.replace('/templates?filter=recommended');
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );
}
