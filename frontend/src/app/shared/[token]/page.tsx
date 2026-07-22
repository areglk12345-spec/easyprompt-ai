'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Sparkles, MessageSquare, ArrowLeft } from 'lucide-react';
import ChatBubble from '../../../components/ChatBubble';

type Message = {
    role: 'user' | 'agent';
    text: string;
    fittedPrompt?: string;
};

export default function SharedChatPage() {
    const params = useParams();
    const token = params?.token as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        const fetchSharedChat = async () => {
            setIsLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const res = await fetch(`${API_URL}/api/history/share/${token}`);
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || 'ไม่พบการสนทนานี้ หรือลิงก์หมดอายุแล้ว');
                }
                const data = await res.json();
                if (data && data.length > 0) {
                    const ascData = [...data].reverse();
                    const loadedMessages: Message[] = [];
                    ascData.forEach((item: any) => {
                        loadedMessages.push({ role: 'user', text: item.user_message });
                        loadedMessages.push({
                            role: 'agent',
                            text: item.agent_response,
                            fittedPrompt: item.fitted_prompt || undefined
                        });
                    });
                    setMessages(loadedMessages);
                } else {
                    setError('ไม่มีข้อมูลในแชทนี้');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSharedChat();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white flex flex-col font-sans">
            {/* Top Navigation */}
            <header className="bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/chat" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        <span>กลับไปที่แอป</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">EasyPrompt Shared Chat</span>
                    </div>

                    <Link 
                        href="/chat"
                        className="px-4 py-2 rounded-full bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-md"
                    >
                        ลองใช้งาน EasyPrompt
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-semibold text-slate-500">กำลังโหลดการสนทนา...</p>
                    </div>
                ) : error ? (
                    <div className="max-w-md mx-auto my-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-6 rounded-2xl text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold">!</div>
                        <h3 className="font-bold text-lg text-rose-800 dark:text-rose-300 mb-2">ไม่สามารถดึงข้อมูลได้</h3>
                        <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{error}</p>
                        <Link href="/chat" className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors">
                            ไปหน้าสร้าง Prompt ใหม่
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6 pb-12">
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-4 rounded-2xl flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <div className="text-xs md:text-sm text-indigo-900 dark:text-indigo-200">
                                    คุณกำลังรับชมประวัติการสนทนาที่มีผู้แชร์ผ่าน <strong>EasyPrompt AI</strong>
                                </div>
                            </div>
                        </div>

                        {messages.map((msg, idx) => (
                            <ChatBubble
                                key={idx}
                                index={idx}
                                role={msg.role}
                                text={msg.text}
                                fittedPrompt={msg.fittedPrompt}
                                isLarge={false}
                                isLatest={idx === messages.length - 1}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
