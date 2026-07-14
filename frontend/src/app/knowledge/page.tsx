'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../context/AuthContext';
import { useFontSize } from '../../context/FontSizeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';

type Document = {
    id: number;
    filename: string;
    created_at: string;
};

export default function KnowledgePage() {
    const { authFetch } = useAuth();
    const { fontSize } = useFontSize();
    const { t } = useLanguage();
    const isLarge = fontSize === 'large';

    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = useCallback(async () => {
        try {
            setIsLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/knowledge`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Error fetching docs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'txt' && ext !== 'pdf') {
            alert('รองรับเฉพาะไฟล์ .txt และ .pdf เท่านั้น');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsUploading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/knowledge/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                fetchDocuments();
                if (fileInputRef.current) fileInputRef.current.value = '';
                alert('อัปโหลดเอกสารสำเร็จ!');
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || 'การอัปโหลดล้มเหลว');
            }
        } catch (error) {
            alert('การอัปโหลดล้มเหลว: ' + error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่? (AI จะไม่สามารถใช้เอกสารนี้อ้างอิงได้อีก)')) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/knowledge/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setDocuments(prev => prev.filter(d => d.id !== id));
            } else {
                alert('ลบเอกสารไม่สำเร็จ');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการลบเอกสาร');
        }
    };

    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 transition-all duration-300 ${isLarge ? 'text-lg' : 'text-sm'}`}>
            <div className="flex h-screen overflow-hidden">
                <Sidebar activePage="knowledge" />

                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Top AppBar */}
                    <header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-12 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30 shrink-0">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="font-bold text-primary dark:text-indigo-400 hover:text-primary-dark transition-colors flex items-center gap-1">
                                &larr; {t('menu.home')}
                            </Link>
                            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700"></span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">Knowledge Base</span>
                        </div>
                        <UserMenu />
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-4xl' : 'text-2xl'} mb-2`}>
                                        📚 ฐานข้อมูลส่วนตัว
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                        อัปโหลดเอกสาร กฎระเบียบ หรือนโยบายบริษัท เพื่อให้ AI ใช้อ้างอิงและแต่ง Prompt ได้ตรงกับบริบทของคุณมากที่สุด
                                    </p>
                                </div>
                                <input 
                                    type="file" 
                                    accept=".txt,.pdf" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload}
                                />
                                <Button 
                                    variant="primary" 
                                    className="rounded-full font-bold shadow-md shadow-primary/20"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                            กำลังอัปโหลด...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[20px]">upload_file</span>
                                            อัปโหลดเอกสาร (.txt, .pdf)
                                        </span>
                                    )}
                                </Button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {isLoading ? (
                                    <div className="p-10 text-center text-slate-500">
                                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                                        กำลังโหลดเอกสาร...
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                                        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">description</span>
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">ยังไม่มีเอกสารในฐานข้อมูล</h3>
                                        <p className="text-sm max-w-md">กดปุ่มอัปโหลดด้านบนเพื่อเพิ่มไฟล์อ้างอิงของคุณได้เลยครับ ระบบรองรับไฟล์ .txt และ .pdf ขนาดไม่เกิน 10MB</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400">ชื่อไฟล์</th>
                                                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 w-48">วันที่อัปโหลด</th>
                                                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 w-32 text-center">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {documents.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${doc.filename.endsWith('.pdf') ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                                <span className="material-symbols-outlined text-xl">
                                                                    {doc.filename.endsWith('.pdf') ? 'picture_as_pdf' : 'text_snippet'}
                                                                </span>
                                                            </div>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.filename}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                                        {new Date(doc.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button 
                                                            onClick={() => handleDelete(doc.id)}
                                                            className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="ลบเอกสาร"
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
