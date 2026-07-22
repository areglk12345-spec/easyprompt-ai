'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AudioLines } from 'lucide-react';
import UserMenu from '../../components/UserMenu';
import Sidebar from '../../components/Sidebar';
import HelpTooltip from '../../components/HelpTooltip';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';
import { usePromptActions } from '../../hooks/usePromptActions';
import ChatBubble from '../../components/ChatBubble';
import { Button } from '../../components/ui/Button';

// 1. สร้าง Type สำหรับเก็บข้อมูลข้อความแชท
type Template = {
    id: number;
    title: string;
    prompt_text: string;
    category: string;
};

type Message = {
    role: 'user' | 'agent';
    text: string;
    fittedPrompt?: string;
    score?: number;
    explanation?: string;
    suggestedOptions?: string[];
};

function ChatContent() {
    const { authFetch, user, refreshUser } = useAuth();
    const { t } = useLanguage();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';
    const { logActivity, copyToClipboard, downloadAsTxt, downloadAsMarkdown, saveToTemplate, exportToPlatform, analyzeTextAccessibility } = usePromptActions();

    const [isReadingLevelModalOpen, setIsReadingLevelModalOpen] = useState(false);
    const [readingLevelResult, setReadingLevelResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const plusMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
                setIsPlusMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [easyLanguage, setEasyLanguage] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTone, setSelectedTone] = useState('ทั่วไป');
    const [isListening, setIsListening] = useState(false);
    const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
    const recognitionRef = useRef<any>(null);
    const hasSentQuery = useRef(false);
    
    // Auto-scroll and abort refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (user && user.default_tone) {
            setSelectedTone(user.default_tone);
        }
    }, [user]);

    // สร้าง/ดึง session_id ที่ไม่ซ้ำกันสำหรับแต่ละ session การสนทนา
    const [sessionId, setSessionId] = useState<string>('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
    const [isUploadingDocument, setIsUploadingDocument] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachFileInputRef = useRef<HTMLInputElement>(null);

    const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');
    const [attachedFiles, setAttachedFiles] = useState<{mime_type: string, data: string, name: string}[]>([]);

    const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    setAttachedFiles(prev => [...prev, {
                        name: file.name,
                        mime_type: file.type,
                        data: event.target!.result as string
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });
        if (attachFileInputRef.current) attachFileInputRef.current.value = '';
    };
    const handleAnalyzeReadingLevel = async () => {
        if (!inputText.trim()) {
            alert("กรุณาพิมพ์ข้อความก่อนวิเคราะห์ครับ");
            return;
        }
        setIsAnalyzing(true);
        setIsReadingLevelModalOpen(true);
        const result = await analyzeTextAccessibility(inputText);
        setReadingLevelResult(result);
        setIsAnalyzing(false);
    };

    const startNewChat = () => {
        const newSid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString();
        localStorage.setItem('ep_session_id', newSid);
        setSessionId(newSid);
        setInputText('');
        setIsLoading(false);
        setMessages([
            { 
                role: 'agent', 
                text: 'สวัสดีครับ! ผมคือ EasyPrompt Agent วันนี้มีอะไรให้ผมช่วยไหมครับ? เช่น อยากให้ช่วยเขียนอีเมล, สรุปบทความ, หรือวางแผนเที่ยว บอกมาได้เลยครับ',
                suggestedOptions: ['เขียนจดหมาย/อีเมล', 'สรุปบทความ', 'แปลภาษา', 'วางแผนท่องเที่ยว']
            }
        ]);
        window.history.replaceState({}, document.title, window.location.pathname);
    };

    const searchParams = useSearchParams();
    const urlSessionId = searchParams.get('session_id');

    useEffect(() => {
        let sid = localStorage.getItem('ep_session_id');
        
        if (urlSessionId) {
            sid = urlSessionId;
            localStorage.setItem('ep_session_id', sid);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (!sid) {
            sid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString();
            localStorage.setItem('ep_session_id', sid);
        }
        setSessionId(sid);
    }, [urlSessionId]);

    // ตรวจจับและส่งคำถามอัตโนมัติหากถูกส่งมาจากหน้าแรก


    // 2. สร้าง State สำหรับเก็บประวัติการสนทนา (ตั้งค่าเริ่มต้นเป็นข้อความทักทาย พร้อม Quick Actions)
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'agent', 
            text: 'สวัสดีครับ! ผมคือ EasyPrompt Agent วันนี้มีอะไรให้ผมช่วยไหมครับ? เช่น อยากให้ช่วยเขียนอีเมล, สรุปบทความ, หรือวางแผนเที่ยว บอกมาได้เลยครับ',
            suggestedOptions: ['เขียนจดหมาย/อีเมล', 'สรุปบทความ', 'แปลภาษา', 'วางแผนท่องเที่ยว']
        }
    ]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ดึงประวัติการสนทนาถ้ามี (เมื่อ sessionId เปลี่ยนและมีข้อมูล)
    useEffect(() => {
        if (!sessionId) return;
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const response = await authFetch(`${API_URL}/api/history/?session_id=${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
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
                        // Reset if no history for this session
                        setMessages([
                            { 
                                role: 'agent', 
                                text: 'สวัสดีครับ! ผมคือ EasyPrompt Agent วันนี้มีอะไรให้ผมช่วยไหมครับ? เช่น อยากให้ช่วยเขียนอีเมล, สรุปบทความ, หรือวางแผนเที่ยว บอกมาได้เลยครับ',
                                suggestedOptions: ['เขียนจดหมาย/อีเมล', 'สรุปบทความ', 'แปลภาษา', 'วางแผนท่องเที่ยว']
                            }
                        ]);
                    }
                }
            } catch (error) {
                console.error("Error fetching session history:", error);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        fetchHistory();
    }, [sessionId, authFetch]);

    const handleShareLink = async () => {
        if (!sessionId) {
            alert('กรุณาเริ่มแชทก่อนเพื่อแชร์ลิงก์');
            return;
        }
        setIsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/history/session/${sessionId}/share`, {
                method: 'POST',
            });
            if (response.ok) {
                const data = await response.json();
                const shareUrl = `${window.location.origin}/shared/${data.token}`;
                navigator.clipboard.writeText(shareUrl);
                alert(`แชร์ลิงก์สำเร็จ! คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว:\n\n${shareUrl}`);
            } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถแชร์ลิงก์ได้');
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Templates and Documents
    useEffect(() => {
        const fetchTemplatesAndDocs = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const [tplRes, docRes] = await Promise.all([
                    authFetch(`${API_URL}/api/templates`),
                    authFetch(`${API_URL}/api/knowledge`)
                ]);
                
                if (tplRes.ok) {
                    const data = await tplRes.json();
                    setTemplates(data);
                }
                if (docRes.ok) {
                    const data = await docRes.json();
                    setDocuments(data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchTemplatesAndDocs();
    }, [authFetch]);

    const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setIsUploadingDocument(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/knowledge/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const newDoc = await res.json();
                setDocuments(prev => [newDoc, ...prev]);
                setSelectedDocument(newDoc.id); // เลือกไฟล์นี้ให้อัตโนมัติ
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || 'การอัปโหลดล้มเหลว');
            }
        } catch (error) {
            alert('การอัปโหลดล้มเหลว: ' + error);
        } finally {
            setIsUploadingDocument(false);
        }
    };

    const textSize = isLarge ? 'text-2xl' : 'text-base';
    const buttonSize = isLarge ? 'px-8 py-4 text-xl' : 'px-4 py-2 text-base';

    // Speech-to-Text Setup
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);

    useEffect(() => {
        const SpeechRecognition = (typeof window !== 'undefined') && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
        if (SpeechRecognition) {
            setIsSpeechSupported(true);
            try {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'th-TH';
                
                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript.trim()) {
                        setInputText((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
                    }
                };
                recognition.onerror = (err: any) => {
                    console.warn('Speech recognition error:', err);
                    setIsListening(false);
                };
                recognition.onend = () => {
                    setIsListening(false);
                };
                recognitionRef.current = recognition;
            } catch (e) {
                console.error("Speech recognition setup failed:", e);
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('เบราว์เซอร์ของคุณยังไม่รองรับระบบเปลี่ยนเสียงเป็นข้อความ (Speech Recognition)');
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Speech start error:", e);
                setIsListening(false);
            }
        }
    };

    const stopGenerating = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    // 3. ฟังก์ชันสำหรับส่งข้อความไปยัง Backend (FastAPI)
    const sendMessage = useCallback(async (e?: React.FormEvent, customText?: string, isDirectRun: boolean = false) => {
        if (e) e.preventDefault();
        
        const messageToSend = customText !== undefined ? customText : inputText;
        if (!messageToSend.trim() || isLoading) return;

        // นำข้อความผู้ใช้ใส่เข้าไปในหน้าจอก่อน
        setMessages((prev) => [...prev, { role: 'user', text: messageToSend }]);
        if (customText === undefined) {
            setInputText('');
        }
        setIsLoading(true);

        // Reset abort controller for new request
        abortControllerRef.current = new AbortController();

        try {
            // เรียก API ไปที่ FastAPI endpoint แบบ stream
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            
            // เตรียมที่นั่ง (placeholder) สำหรับคำตอบของ AI
            setMessages((prev) => [
                ...prev,
                { role: 'agent', text: '' },
            ]);

            const payloadData: any = { 
                message: messageToSend, 
                session_id: sessionId, 
                tone: selectedTone, 
                easy_language: easyLanguage,
                document_id: selectedDocument,
                model: selectedModel,
                is_direct_run: isDirectRun
            };
            if (attachedFiles.length > 0) {
                payloadData.files = attachedFiles.map(f => ({ mime_type: f.mime_type, data: f.data }));
            }

            const response = await authFetch(`${API_URL}/api/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadData),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            }

            if (!response.body) throw new Error("No response body");
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr.trim() === '[DONE]') {
                            // Trigger an event to let Sidebar know to update recent chats
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new Event('chat_updated'));
                            }
                            setAttachedFiles([]); // Clear after sending
                            
                            // Call refine endpoint to get fitted prompt IF NOT a direct run
                            if (!isDirectRun) {
                                try {
                                    const refinePayload = {
                                        session_id: payloadData.session_id,
                                        tone: payloadData.tone,
                                        easy_language: payloadData.easy_language,
                                        document_id: payloadData.document_id,
                                        model: payloadData.model
                                    };
                                    const refineRes = await authFetch(`${API_URL}/api/chat/refine`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(refinePayload),
                                    });
                                    if (refineRes.ok) {
                                        const refineData = await refineRes.json();
                                        setMessages((prev) => {
                                            const newMessages = [...prev];
                                            newMessages[newMessages.length - 1] = {
                                                ...newMessages[newMessages.length - 1],
                                                fittedPrompt: refineData.fitted_prompt,
                                                score: refineData.prompt_fit_score,
                                                explanation: refineData.score_explanation,
                                                suggestedOptions: refineData.suggested_options
                                            };
                                            return newMessages;
                                        });
                                    }
                                } catch (e) {
                                    console.error("Error refining prompt:", e);
                                }
                            }
                            
                            // อัปเดตข้อมูล User (เพื่อดึงยอดเครดิตล่าสุด)
                            await refreshUser();
                            return;
                        } else {
                            // Restore newline
                            const actualText = dataStr.replace(/\\n/g, '\n');
                            accumulatedText += actualText;
                            
                            setMessages((prev) => {
                                const newMessages = [...prev];
                                newMessages[newMessages.length - 1] = {
                                    role: 'agent',
                                    text: accumulatedText
                                };
                                return newMessages;
                            });
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Generation aborted by user");
                // Stop UI loading state, but keep the partial response intact
                setIsLoading(false);
                return;
            }
            console.error("Error sending message:", error);
            const errMsg = error.message || 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
            setMessages((prev) => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1].role === 'agent' && newMessages[newMessages.length - 1].text === '') {
                    newMessages[newMessages.length - 1].text = errMsg;
                } else {
                    newMessages.push({ role: 'agent', text: errMsg });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading, sessionId, selectedTone, easyLanguage, authFetch, attachedFiles, selectedDocument, selectedModel, refreshUser]);

    const handleEditMessage = useCallback((index: number, newText: string) => {
        if (isLoading) return;
        setMessages((prev) => prev.slice(0, index));
        setTimeout(() => sendMessage(undefined, newText), 0);
    }, [isLoading, sendMessage]);

    const handleRegenerateMessage = useCallback((index: number) => {
        if (isLoading) return;
        setMessages((prev) => {
            let userIndex = index - 1;
            while(userIndex >= 0 && prev[userIndex].role !== 'user') userIndex--;
            if(userIndex < 0) return prev;
            
            const userMsgText = prev[userIndex].text;
            setTimeout(() => sendMessage(undefined, userMsgText), 0);
            return prev.slice(0, userIndex);
        });
    }, [isLoading, sendMessage]);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionId && !hasSentQuery.current) {
            const params = new URLSearchParams(window.location.search);
            const query = params.get('q');
            if (query) {
                hasSentQuery.current = true;
                setInputText(query);
                setTimeout(() => {
                    sendMessage(undefined, query);
                }, 150);
            }
        }
    }, [sessionId, sendMessage]);

    return (
        <div className={`min-h-[100dvh] bg-transparent transition-all duration-300 ${isLarge ? 'text-base' : 'text-sm'}`}>
            <div className="flex min-h-[100dvh]">
                <Sidebar activePage="chat" onNewChat={startNewChat} />

                <main 
                    className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden h-[100dvh] relative transition-colors duration-300"
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if(!isDragging) setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if(e.currentTarget.contains(e.relatedTarget as Node)) return;
                        setIsDragging(false);
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const files = Array.from(e.dataTransfer.files);
                        
                        const dt = new DataTransfer();
                        files.forEach(f => {
                            if(f.type === 'application/pdf' || f.type === 'text/plain') dt.items.add(f);
                        });
                        
                        if (dt.files.length > 0 && attachFileInputRef.current) {
                            attachFileInputRef.current.files = dt.files;
                            // manually trigger onChange
                            const event = new Event('change', { bubbles: true });
                            attachFileInputRef.current.dispatchEvent(event);
                        }
                    }}
                >
                    {/* Drag Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-indigo-500 m-4 rounded-3xl pointer-events-none">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                                <span className="material-symbols-outlined text-6xl text-indigo-500 mb-4 animate-bounce">upload_file</span>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">วางไฟล์ที่นี่เพื่อแนบ (PDF, TXT)</h2>
                            </div>
                        </div>
                    )}
                    {/* Top AppBar */}
                    <header className="sticky top-0 z-30 flex justify-between items-center pl-16 pr-4 md:px-12 w-full h-auto min-h-[5rem] py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30 shrink-0 gap-2 flex-wrap">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="font-bold text-primary dark:text-indigo-400 hover:text-primary-dark transition-colors flex items-center gap-1">
                                &larr; <span className="hidden sm:inline">{t('menu.home')}</span>
                            </Link>
                            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700"></span>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white shadow-sm border border-white/20">
                                    <span className="text-lg leading-none">👻</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800 dark:text-white hidden md:inline">พรอมพ์ตี้ · ผู้ช่วยเขียน Prompt</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                            {sessionId && messages.length > 0 && (
                                <button
                                    onClick={handleShareLink}
                                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/50"
                                >
                                    <span className="material-symbols-outlined text-sm">share</span>
                                    Share
                                </button>
                            )}
                            <div className="flex items-center gap-2 mr-2">
                                <span className={`hidden xl:inline text-slate-600 dark:text-slate-400 font-semibold ${isLarge ? 'text-lg' : 'text-sm'}`}>{t('home.easy_mode')}</span>
                                <HelpTooltip 
                                    title="โหมดภาษาง่าย (Easy Mode)" 
                                    content="เมื่อเปิดใช้งาน ระบบจะพยายามตอบกลับด้วยภาษาที่เข้าใจง่าย ไม่ใช้ศัพท์เทคนิคซับซ้อน เหมาะสำหรับผู้เริ่มต้น"
                                    align="right"
                                    position="bottom"
                                />
                                <button
                                    onClick={() => setEasyLanguage(!easyLanguage)}
                                    className={`w-12 h-6 rounded-full flex items-center transition-colors shadow-inner ${easyLanguage ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${easyLanguage ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            
                            {/* Document Selector */}
                            {documents.length > 0 && (
                                <div className="flex items-center gap-2 mr-2">
                                    <span className="material-symbols-outlined text-slate-400 text-sm">folder_special</span>
                                    <select
                                        value={selectedDocument || ''}
                                        onChange={(e) => setSelectedDocument(e.target.value ? Number(e.target.value) : null)}
                                        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-primary text-slate-600 dark:text-slate-300 max-w-[150px] truncate"
                                    >
                                        <option value="">-- ไม่แนบเอกสาร --</option>
                                        {documents.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.filename}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                        </div>
                    </header>

                    {/* Chat History Area */}
                    <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/50">
                        {isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center mt-12 mb-8 h-64">
                                <div className="dot-flashing"></div>
                                <p className="text-slate-400 text-sm mt-4">กำลังโหลดประวัติแชท...</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, index) => {
                                    const isLatest = index === messages.length - 1;
                                    return (
                                        <ChatBubble
                                            key={index}
                                            index={index}
                                            role={msg.role}
                                            text={msg.text}
                                            fittedPrompt={msg.fittedPrompt}
                                            suggestedOptions={msg.suggestedOptions}
                                            isLarge={isLarge}
                                            isLatest={isLatest}
                                            onSaveToTemplate={saveToTemplate}
                                            onCopyToClipboard={copyToClipboard}
                                            onDownloadAsTxt={downloadAsTxt}
                                            onDownloadAsMarkdown={downloadAsMarkdown}
                                            onSendOption={(option) => sendMessage(undefined, option, false)}
                                            onRunPrompt={(prompt) => sendMessage(undefined, prompt, true)}
                                            onExportToPlatform={exportToPlatform}
                                            onEdit={msg.role === 'user' ? (newText) => handleEditMessage(index, newText) : undefined}
                                            onRegenerate={msg.role === 'agent' ? () => handleRegenerateMessage(index) : undefined}
                                        />
                                    );
                                })}

                                {messages.length === 1 && (
                                    <div className="flex flex-col items-center justify-center mt-12 mb-8 animate-fade-in-up text-center px-4">
                                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800/50">
                                            <span className="material-symbols-outlined text-3xl text-indigo-500">forum</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">เริ่มบทสนทนาใหม่</h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">
                                            พิมพ์คำสั่งของคุณในช่องด้านล่าง หรือใช้ไมโครโฟนเพื่อพูดคำสั่ง<br/>
                                            คุณสามารถอัปโหลดเอกสารเพื่อใช้อ้างอิงได้
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {messages.length === 1 && templates.length > 0 && (
                            <div className="flex flex-col items-center mt-4 mb-4 animate-fade-in-up">
                                <span className={`text-slate-500 font-semibold mb-4 flex items-center gap-1.5 ${isLarge ? 'text-xl' : 'text-sm'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                    </svg>
                                    เลือกใช้งานเทมเพลตเริ่มต้น
                                </span>
                                <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
                                    {templates.slice(0, 4).map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setInputText(t.prompt_text)}
                                            className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-indigo-500/50 hover:shadow-premium hover:-translate-y-1 active:scale-95 text-slate-700 dark:text-slate-300 rounded-2xl transition-all duration-300 flex flex-col items-start text-left group ${isLarge ? 'p-5 w-64' : 'p-4 w-56'}`}
                                        >
                                            <span className={`font-bold text-primary dark:text-indigo-400 group-hover:text-primary-dark ${isLarge ? 'text-xl mb-2' : 'text-sm mb-1'}`}>{t.title}</span>
                                            <span className={`text-slate-500 dark:text-slate-400 line-clamp-2 ${isLarge ? 'text-lg' : 'text-xs'}`}>{t.prompt_text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="glass-panel-heavy rounded-2xl rounded-tl-none p-5 shadow-sm flex items-center gap-1.5 min-w-[90px] justify-center">
                                    <div className="dot-flashing"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </main>

                    {/* Bottom Input Bar */}
                    <footer className="p-4 pb-6 md:p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent dark:from-[#020617] dark:via-[#020617]/90 shrink-0 sticky bottom-0 z-20 pointer-events-none">
                        {/* Active Listening Indicator */}
                        {isListening && (
                            <div className="max-w-4xl mx-auto mb-2 pointer-events-auto flex items-center justify-center animate-fade-in-up">
                                <div className="px-4 py-2 bg-rose-500 text-white rounded-full text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 animate-pulse">
                                    <AudioLines className="w-4 h-4" />
                                    <span>กำลังฟังเสียงของคุณ (Speech Input Active)... พูดแล้วกดส่งได้เลย</span>
                                    <button 
                                        type="button" 
                                        onClick={toggleListening}
                                        className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-full text-xs"
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-2 items-center bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/50 pointer-events-auto relative focus-within:ring-2 focus-within:ring-primary/40 focus-within:shadow-ai-glow transition-all duration-300">
                            {/* Stop Generating Button */}
                            {isLoading && (
                                <div className="absolute left-1/2 -top-14 -translate-x-1/2">
                                    <button
                                        type="button"
                                        onClick={stopGenerating}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full flex items-center gap-2 text-sm shadow-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 pointer-events-auto transition-all hover-spring animate-fade-in-up"
                                    >
                                        <span className="material-symbols-outlined text-[16px] text-rose-500">stop_circle</span>
                                        หยุดสร้าง (Stop)
                                    </button>
                                </div>
                            )}

                            {/* Plus Menu (More Actions) */}
                            <div className="relative flex items-center" ref={plusMenuRef}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                                    title="เครื่องมือเพิ่มเติม"
                                    className={`rounded-full transition-all shrink-0 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover-spring ${isLarge ? 'w-14 h-14' : 'w-11 h-11 md:w-10 md:h-10'} ${isPlusMenuOpen ? 'rotate-45 bg-slate-200 dark:bg-slate-700' : ''}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={isLarge ? 'w-7 h-7' : 'w-5 h-5'}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </Button>

                                {/* Dropdown Menu */}
                                {isPlusMenuOpen && (
                                    <div className="absolute bottom-full mb-3 left-0 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col p-1 animate-fade-in-up z-50">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                attachFileInputRef.current?.click();
                                                setIsPlusMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-500">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                            </svg>
                                            แนบไฟล์ (PDF, TXT)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsTemplateModalOpen(true);
                                                setIsPlusMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                            </svg>
                                            เลือกเทมเพลต
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleAnalyzeReadingLevel();
                                                setIsPlusMenuOpen(false);
                                            }}
                                            disabled={isAnalyzing || !inputText.trim()}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isAnalyzing ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-500">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                                </svg>
                                            )}
                                            วิเคราะห์การอ่าน
                                        </button>
                                    </div>
                                )}
                            </div>

                            <input
                                id="chat-input"
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={isLoading}
                                placeholder={isListening ? t('chat.placeholder_listening') : t('chat.placeholder')}
                                aria-label={t('chat.placeholder')}
                                aria-invalid={false}
                                className={`flex-1 bg-transparent border-none rounded-full px-4 focus:outline-none focus:ring-0 disabled:opacity-50 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${isLarge ? 'py-4 text-xl' : 'py-3'}`}
                            />
                            
                            <input 
                                type="file" 
                                accept=".txt,.pdf" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleQuickUpload}
                            />
                            <input 
                                type="file" 
                                multiple
                                className="hidden" 
                                ref={attachFileInputRef} 
                                onChange={handleAttachFile}
                            />


                            {/* Speech-to-Text Button */}
                            {recognitionRef.current && (
                                <Button
                                    id="mic-btn"
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleListening}
                                    disabled={isLoading}
                                    title={isListening ? 'หยุดฟัง' : 'กดพูดแทนพิมพ์ (ภาษาไทย)'}
                                    aria-label={isListening ? 'หยุดฟัง' : 'พูดด้วยเสียง'}
                                    aria-pressed={isListening}
                                    className={`rounded-full transition-all shrink-0 cursor-pointer hover-spring ${isLarge ? 'w-14 h-14' : 'w-11 h-11 md:w-10 md:h-10'} ${
                                        isListening
                                            ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200 dark:shadow-rose-900/50'
                                            : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <AudioLines className={isLarge ? 'w-8 h-8' : 'w-5 h-5'} />
                                </Button>
                            )}
                            <Button
                                id="send-btn"
                                type="submit"
                                variant="primary"
                                disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
                                className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-md shadow-indigo-100 dark:shadow-indigo-900/30 disabled:opacity-50 !border-none hover-spring ${isLarge ? 'w-14 h-14 px-4' : 'w-11 h-11 md:w-10 md:h-10 px-2'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mx-auto">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                                </svg>
                            </Button>
                        </form>
                    </footer>
                </main>
            </div>
            
            {/* Template Modal */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in px-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-scale-up">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <h2 className={`font-bold text-slate-800 dark:text-white flex items-center gap-2 ${isLarge ? 'text-3xl' : 'text-xl'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={isLarge ? 'w-8 h-8 text-blue-600' : 'w-6 h-6 text-blue-600'}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                                เลือกเทมเพลตคำสั่ง
                            </h2>
                            <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={isLarge ? 'w-8 h-8' : 'w-6 h-6'}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-900/30 custom-scrollbar">
                            {templates.length === 0 ? (
                                <div className="text-center text-slate-500 py-10">ไม่พบเทมเพลตในระบบ</div>
                            ) : (
                                <div className="grid gap-4">
                                    {templates.map((t) => (
                                        <div key={t.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`font-bold text-primary dark:text-indigo-400 ${isLarge ? 'text-2xl' : 'text-lg'}`}>{t.title}</h3>
                                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2 py-1 rounded-md">{t.category}</span>
                                            </div>
                                            <p className={`text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 ${isLarge ? 'text-xl' : 'text-sm'}`}>{t.prompt_text}</p>
                                            <button 
                                                onClick={() => {
                                                    setInputText(t.prompt_text);
                                                    setIsTemplateModalOpen(false);
                                                }}
                                                className={`w-full py-2 bg-blue-50 dark:bg-indigo-950/40 hover:bg-blue-100 dark:hover:bg-indigo-900/40 text-blue-600 dark:text-indigo-400 font-bold rounded-xl transition-colors ${isLarge ? 'text-xl' : 'text-sm'}`}
                                            >
                                                ใช้เทมเพลตนี้
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reading Level Modal */}
            {isReadingLevelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in px-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scale-up border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <h2 className={`font-bold text-slate-800 dark:text-white flex items-center gap-2 ${isLarge ? 'text-3xl' : 'text-xl'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-indigo-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                                ผลวิเคราะห์ความยากง่าย
                            </h2>
                            <button onClick={() => { setIsReadingLevelModalOpen(false); setReadingLevelResult(null); }} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={isLarge ? 'w-8 h-8' : 'w-6 h-6'}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 flex-1 bg-slate-50/30 dark:bg-slate-900/30 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                    <div className="dot-flashing"></div>
                                    <div className="text-sm font-semibold text-slate-500">AI กำลังวิเคราะห์ข้อความของคุณ...</div>
                                </div>
                            ) : readingLevelResult ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${readingLevelResult.reading_level_score >= 80 ? 'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : readingLevelResult.reading_level_score >= 50 ? 'text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-900/20'}`}>
                                            <span className="text-3xl font-black">{readingLevelResult.reading_level_score}</span>
                                            <span className="text-[10px] font-bold uppercase">Score</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white mb-1">
                                                {readingLevelResult.reading_level_score >= 80 ? 'อ่านง่ายมาก (Plain Language)' : readingLevelResult.reading_level_score >= 50 ? 'อ่านยากปานกลาง' : 'อ่านยากและซับซ้อน'}
                                            </h3>
                                            <p className="text-xs text-slate-500 leading-relaxed">คะแนนยิ่งสูง ยิ่งหมายความว่าข้อความของคุณอ่านและเข้าใจได้ง่าย เหมาะกับคนทุกกลุ่ม</p>
                                        </div>
                                    </div>

                                    {readingLevelResult.is_complex && (
                                        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-800/50">
                                            <div className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">warning</span> 
                                                ข้อความนี้มีความซับซ้อนเกินกว่าระดับทั่วไป
                                            </div>
                                            {readingLevelResult.complex_words && readingLevelResult.complex_words.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="text-xs font-semibold text-rose-600/70 dark:text-rose-400/70 mb-2">คำศัพท์ที่อาจเข้าใจยาก:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {readingLevelResult.complex_words.map((word: string, i: number) => (
                                                            <span key={i} className="px-2 py-1 bg-white/60 dark:bg-rose-950/40 rounded-md text-xs font-medium text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50">{word}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {readingLevelResult.suggestions && readingLevelResult.suggestions.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">คำแนะนำเพื่อให้อ่านง่ายขึ้น:</div>
                                            {readingLevelResult.suggestions.map((sug: string, i: number) => (
                                                <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <span className="text-indigo-500 font-bold shrink-0">{i+1}.</span>
                                                    <span>{sug}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-rose-500 py-10 font-medium">ไม่สามารถวิเคราะห์ได้ กรุณาลองใหม่อีกครั้ง</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ChatPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ChatContent />
        </React.Suspense>
    );
}