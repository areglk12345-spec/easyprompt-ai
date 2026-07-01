'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ChatMessage = {
    id: number;
    user_message: string;
    agent_response: string;
    fitted_prompt: string | null;
    tone: string | null;
    created_at: string;
};

export default function SharedChatPage() {
    const params = useParams();
    const token = params.token as string;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sharedBy, setSharedBy] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSharedSession = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                // Public endpoint, no authFetch required
                const response = await fetch(`${API_URL}/api/history/shared/${token}`);
                if (!response.ok) {
                    throw new Error('ลิงก์แชร์ไม่ถูกต้องหรือหมดอายุแล้ว');
                }
                const data = await response.json();
                setMessages(data.messages);
                setSharedBy(data.shared_by);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchSharedSession();
    }, [token]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('คัดลอก Prompt แล้ว');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center space-y-4 animate-pulse">
                    <div className="text-5xl">🔗</div>
                    <div className="font-bold text-slate-500 dark:text-slate-400">กำลังโหลดแชทที่แชร์...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 border border-rose-100 dark:border-rose-900">
                    <div className="text-5xl">⚠️</div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">ไม่พบข้อมูล</h1>
                    <p className="text-rose-500 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-body-md">
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <span className="material-symbols-outlined font-bold">bolt</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-white leading-tight">EasyPrompt AI</h1>
                        <p className="text-xs text-slate-500 font-semibold">Shared Conversation</p>
                    </div>
                </div>
                {sharedBy && (
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
                        แชร์โดย: <span className="text-indigo-600 dark:text-indigo-400">{sharedBy}</span>
                    </div>
                )}
            </header>

            <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-8">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 p-4 rounded-2xl text-sm font-semibold text-center border border-indigo-100 dark:border-indigo-800/50">
                    ℹ️ นี่คือหน้าแสดงประวัติการสนทนาแบบอ่านอย่างเดียว (Read-only)
                </div>

                {messages.map((msg, index) => (
                    <div key={msg.id} className="space-y-6">
                        {/* User Message */}
                        <div className="flex justify-end">
                            <div className="bg-indigo-600 text-white px-6 py-4 rounded-3xl rounded-tr-sm max-w-[85%] shadow-md">
                                <p className="whitespace-pre-wrap">{msg.user_message}</p>
                            </div>
                        </div>

                        {/* Agent Response */}
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 px-6 py-5 rounded-3xl rounded-tl-sm max-w-[90%] shadow-sm border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                <div className="prose prose-sm dark:prose-invert prose-indigo max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.agent_response}</ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Fitted Prompt (If any) */}
                        {msg.fitted_prompt && (
                            <div className="flex justify-start pl-8 mt-2">
                                <div className="w-full max-w-[90%] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/80 p-6 rounded-3xl border border-indigo-100 dark:border-slate-700 shadow-sm relative group">
                                    <div className="absolute -top-3 -left-3 bg-white dark:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-indigo-100 dark:border-slate-600">
                                        <span className="text-xl">✨</span>
                                    </div>
                                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
                                        Fitted Prompt {msg.tone && msg.tone !== 'ทั่วไป' && <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full lowercase">tone: {msg.tone}</span>}
                                    </div>
                                    <div className="font-mono text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {msg.fitted_prompt}
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(msg.fitted_prompt!)}
                                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-600"
                                    >
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                        คัดลอก Prompt
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Call to Action Section */}
                <div className="mt-12 p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-center shadow-lg text-white space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <span className="material-symbols-outlined text-[100px]">auto_awesome</span>
                    </div>
                    <h2 className="text-2xl font-bold relative z-10">💡 อยากเขียน Prompt ให้เก่งแบบนี้บ้างไหม?</h2>
                    <p className="text-indigo-100 font-medium max-w-lg mx-auto relative z-10">
                        EasyPrompt AI ช่วยให้คุณสร้าง Prompt ที่สมบูรณ์แบบได้ง่ายๆ โดยไม่ต้องรู้เทคนิค ไม่ต้องจำศัพท์ยาก
                    </p>
                    <a 
                        href="/"
                        className="inline-block mt-4 px-8 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 relative z-10"
                    >
                        ลองใช้งาน EasyPrompt ฟรี!
                    </a>
                </div>
            </main>
        </div>
    );
}
