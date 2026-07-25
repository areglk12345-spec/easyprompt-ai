'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-extrabold">404</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          ไม่พบหน้าที่คุณค้นหา
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          หน้าที่คุณกำลังพยายามเข้าถึงอาจถูกย้าย ลบออก หรือไม่มีอยู่จริงในระบบ
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
          <Link
            href="/chat"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ไปยังหน้าแชท
          </Link>
        </div>
      </div>
    </div>
  );
}
