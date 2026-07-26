'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Moon, Sun, Monitor, Menu, X, Sparkles, Plus, Search, PanelLeft, MessageSquare, Stethoscope, Grid, BookOpen, Trash2, Pin, FolderPlus, ShieldCheck, Settings, Volume2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useFontSize } from '../context/FontSizeContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import UserMenu from './UserMenu';

interface SidebarProps {
    activePage?: 'chat' | 'templates' | 'doctor' | 'history' | 'admin' | 'home' | 'settings' | 'dashboard' | 'marketplace' | 'knowledge' | 'pricing';
    onNewChat?: () => void;
}

type ChatItem = { id: string; title: string; is_pinned?: boolean; folder_id?: number | null };
type FolderItem = { id: number; name: string; color: string };

export default function Sidebar({ activePage, onNewChat }: SidebarProps) {
    const { t, language, toggleLanguage } = useLanguage();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';
    const { isDarkMode, themeMode, setThemeMode } = useTheme();
    const { authFetch, isLoggedIn, user } = useAuth();
    const { isHighContrast, isTTSOn, toggleHighContrast, toggleTTS } = useAccessibility();
    
    const activeClass = "flex items-center gap-3 py-2.5 px-3.5 bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold transition-all text-sm shadow-sm";
    const inactiveClass = "flex items-center gap-3 py-2.5 px-3.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-2xl font-medium transition-all text-sm hover:text-slate-900 dark:hover:text-white";

    const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
    const [pinnedChats, setPinnedChats] = useState<ChatItem[]>([]);
    const [allSessions, setAllSessions] = useState<ChatItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [expandedFolder, setExpandedFolder] = useState<number | null>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [contextMenu, setContextMenu] = useState<{x: number; y: number; chatId: string; isPinned: boolean} | null>(null);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchRecent = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const response = await authFetch(`${API_URL}/api/history/`);
                if (response.ok) {
                    const data = await response.json();
                    const sessions: ChatItem[] = [];
                    const seen = new Set();
                    data.forEach((msg: any) => {
                        if (!seen.has(msg.session_id) && msg.user_message) {
                            seen.add(msg.session_id);
                            sessions.push({
                                id: msg.session_id,
                                title: msg.user_message,
                                is_pinned: msg.is_pinned || false,
                                folder_id: msg.folder_id || null
                            });
                        }
                    });
                    setAllSessions(sessions);
                    setPinnedChats(sessions.filter(c => c.is_pinned).slice(0, 5));
                    setRecentChats(sessions.filter(c => !c.is_pinned).slice(0, 10));
                }
            } catch(e) {}
        };
        fetchRecent();

        const fetchFolders = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const response = await authFetch(`${API_URL}/api/history/folders`);
                if (response.ok) {
                    const data = await response.json();
                    setFolders(data);
                }
            } catch(e) {}
        };
        fetchFolders();

        const handleChatUpdate = () => {
            fetchRecent();
            fetchFolders();
        };

        window.addEventListener('chat_updated', handleChatUpdate);
        return () => window.removeEventListener('chat_updated', handleChatUpdate);
    }, [isLoggedIn, authFetch]);

    // Close context menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteChat = async (e: React.MouseEvent, sessionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(t('sidebar.confirm_delete'))) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/history/session/${sessionId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setRecentChats(prev => prev.filter(c => c.id !== sessionId));
                setPinnedChats(prev => prev.filter(c => c.id !== sessionId));
                setAllSessions(prev => prev.filter(c => c.id !== sessionId));
                window.dispatchEvent(new Event('chat_updated'));
                
                if (typeof window !== 'undefined' && localStorage.getItem('ep_session_id') === sessionId) {
                    localStorage.removeItem('ep_session_id');
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleTogglePin = async (sessionId: string, currentPinned: boolean) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/history/session/${sessionId}/pin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_pinned: !currentPinned })
            });
            if (res.ok) {
                window.dispatchEvent(new Event('chat_updated'));
            }
        } catch (e) { console.error(e); }
        setContextMenu(null);
    };

    const handleMoveToFolder = async (sessionId: string, folderId: number | null) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            await authFetch(`${API_URL}/api/history/session/${sessionId}/folder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder_id: folderId })
            });
            window.dispatchEvent(new Event('chat_updated'));
        } catch (e) { console.error(e); }
        setContextMenu(null);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/history/folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName.trim() })
            });
            if (res.ok) {
                setNewFolderName('');
                setShowNewFolder(false);
                window.dispatchEvent(new Event('chat_updated'));
            }
        } catch (e) { console.error(e); }
    };

    const handleContextMenu = (e: React.MouseEvent, chat: ChatItem) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            chatId: chat.id,
            isPinned: chat.is_pinned || false
        });
    };

    const renderChatItem = (chat: ChatItem, showPin = false) => (
        <div 
            key={chat.id} 
            className="group relative flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            onContextMenu={(e) => handleContextMenu(e, chat)}
        >
            <Link 
                href={`/chat?session_id=${chat.id}`}
                className="flex-1 truncate pr-5 font-medium block hover:text-slate-900 dark:hover:text-white"
                title={chat.title}
            >
                {showPin && <span className="mr-1 text-amber-500">📌</span>}
                {chat.title}
            </Link>
            <button 
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-all shrink-0"
                title={t('sidebar.delete_chat')}
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );

    return (
        <>
            {/* Desktop Hamburger Toggle (When Collapsed) */}
            <button
                onClick={() => setIsDesktopCollapsed(false)}
                className={`hidden md:block fixed top-4 left-4 z-40 p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all hover-spring ${isDesktopCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
                aria-label="Open Sidebar"
            >
                <PanelLeft className="w-5 h-5" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                aria-label="Toggle Menu"
            >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Backdrop Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed md:sticky top-0 h-screen bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-800/60 shrink-0 z-40 transition-all duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'} ${isDesktopCollapsed ? 'md:-translate-x-full md:w-0 md:border-r-0' : 'md:translate-x-0 md:w-64'} overflow-hidden`}>
                <div className="w-64 px-4 py-5 h-full flex flex-col justify-between">
                    
                    {/* Upper Container */}
                    <div className="flex-1 flex flex-col min-h-0">
                        
                        {/* Header: Logo & Collapse Button */}
                        <div className="flex items-center justify-between px-2 mb-4 shrink-0">
                            <Link href="/" className="flex items-center gap-2.5 group">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                                    <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                                </div>
                                <div>
                                    <h1 className="text-base font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1">
                                        EasyPrompt <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">AI</span>
                                    </h1>
                                </div>
                            </Link>

                            <button
                                onClick={() => setIsDesktopCollapsed(true)}
                                className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                title="ยุบแถบข้าง (Collapse Sidebar)"
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                        </div>

                        {/* New Chat Pill Button (Gemini/ChatGPT Style) */}
                        <div className="shrink-0 mb-3">
                            {onNewChat ? (
                                <button 
                                    onClick={onNewChat} 
                                    className="w-full py-3 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full font-bold flex items-center gap-3 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-sm cursor-pointer text-sm hover:scale-[1.01] active:scale-95"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>{t('sidebar.new_chat')}</span>
                                </button>
                            ) : (
                                <Link 
                                    href="/chat" 
                                    onClick={() => { if(typeof window !== 'undefined') localStorage.removeItem('ep_session_id'); }} 
                                    className="w-full py-3 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full font-bold flex items-center gap-3 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-sm cursor-pointer text-sm hover:scale-[1.01] active:scale-95"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>{t('sidebar.new_chat')}</span>
                                </Link>
                            )}
                        </div>

                        {/* Search Bar */}
                        {isLoggedIn && (
                            <div className="shrink-0 mb-4 px-1">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={t('sidebar.search_chats')}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-200/50 dark:bg-slate-800/60 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 rounded-full text-xs outline-none text-slate-800 dark:text-slate-200 transition-colors placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Core Navigation Section */}
                        <nav className="space-y-1 shrink-0 px-1 border-b border-slate-200/60 dark:border-slate-800/60 pb-3 mb-3">
                            <Link href="/chat" className={activePage === 'chat' ? activeClass : inactiveClass}>
                                <MessageSquare className="w-4 h-4 shrink-0" />
                                <span className="whitespace-nowrap truncate">{t('menu.chat')}</span>
                            </Link>
                            <Link href="/doctor" title="ระบบช่วยตรวจและปรับปรุง Prompt (Prompt Doctor)" className={activePage === 'doctor' ? activeClass : inactiveClass}>
                                <Stethoscope className="w-4 h-4 shrink-0 text-amber-500" />
                                <span className="whitespace-nowrap truncate">{t('menu.doctor')}</span>
                            </Link>
                            <Link href="/templates" className={activePage === 'templates' ? activeClass : inactiveClass}>
                                <Grid className="w-4 h-4 shrink-0 text-indigo-500" />
                                <span className="whitespace-nowrap truncate">{t('sidebar.templates')}</span>
                            </Link>
                            <Link href="/knowledge" className={activePage === 'knowledge' ? activeClass : inactiveClass}>
                                <BookOpen className="w-4 h-4 shrink-0 text-emerald-500" />
                                <span className="whitespace-nowrap truncate">{t('sidebar.knowledge')}</span>
                            </Link>
                            <Link href="/pricing" className={activePage === 'pricing' ? activeClass : inactiveClass}>
                                <span className="material-symbols-outlined text-base shrink-0 text-amber-500">sell</span>
                                <span className="whitespace-nowrap truncate">ราคาแพ็กเกจ</span>
                            </Link>
                        </nav>

                        {/* Notebook / Recent History Scrollable List */}
                        <div className="flex-1 overflow-y-auto px-1 custom-scrollbar space-y-4">
                            {isLoggedIn && searchTerm ? (
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">{t('sidebar.search_results')}</div>
                                    <div className="space-y-1">
                                        {allSessions.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                                            allSessions.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map(chat => renderChatItem(chat))
                                        ) : (
                                            <div className="px-2 py-2 text-xs text-slate-400 text-center">{t('sidebar.no_results')}</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Pinned Chats */}
                                    {isLoggedIn && pinnedChats.length > 0 && (
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2 flex items-center gap-1">
                                                <Pin className="w-3 h-3 text-amber-500" />
                                                <span>{t('sidebar.pinned')}</span>
                                            </div>
                                            <div className="space-y-0.5">
                                                {pinnedChats.map(chat => renderChatItem(chat, true))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Folders */}
                                    {isLoggedIn && folders.length > 0 && (
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">{t('sidebar.folders')}</div>
                                            <div className="space-y-0.5">
                                                {folders.map(folder => (
                                                    <div key={folder.id}>
                                                        <button 
                                                            onClick={() => setExpandedFolder(expandedFolder === folder.id ? null : folder.id)}
                                                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }}></span>
                                                                <span className="font-semibold text-xs">{folder.name}</span>
                                                            </div>
                                                        </button>
                                                        
                                                        {expandedFolder === folder.id && (
                                                            <div className="pl-3 mt-1 border-l border-slate-200 dark:border-slate-800 ml-3 space-y-0.5">
                                                                {allSessions.filter(c => c.folder_id === folder.id).length > 0 ? (
                                                                    allSessions.filter(c => c.folder_id === folder.id).map(chat => renderChatItem(chat))
                                                                ) : (
                                                                    <div className="text-[10px] text-slate-400 py-1 pl-2 italic">ไม่มีแชทในโฟลเดอร์นี้</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent Chats */}
                                    {isLoggedIn && recentChats.length > 0 && (
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">{t('sidebar.recent')}</div>
                                            <div className="space-y-0.5">
                                                {recentChats.map(chat => renderChatItem(chat))}
                                            </div>
                                            
                                            <div className="pt-2">
                                                <Link 
                                                    href="/history" 
                                                    className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 px-2 py-1 transition-colors font-semibold"
                                                >
                                                    <span>{t('sidebar.view_all')}</span>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Context Menu */}
                    {contextMenu && (
                        <div
                            ref={contextMenuRef}
                            className="fixed z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 min-w-[180px] animate-scale-up"
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                        >
                            <button
                                onClick={() => handleTogglePin(contextMenu.chatId, contextMenu.isPinned)}
                                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                            >
                                <span>📌</span>
                                <span>{contextMenu.isPinned ? t('sidebar.unpin') : t('sidebar.pin_top')}</span>
                            </button>
                            {folders.length > 0 && (
                                <>
                                    <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                    <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('sidebar.move_to_folder')}</div>
                                    {folders.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => handleMoveToFolder(contextMenu.chatId, f.id)}
                                            className="w-full px-4 py-1.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                                        >
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }}></span>
                                            {f.name}
                                        </button>
                                    ))}
                                </>
                            )}
                            <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                            <button
                                onClick={(e) => { handleDeleteChat(e as any, contextMenu.chatId); setContextMenu(null); }}
                                className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t('sidebar.delete_chat')}
                            </button>
                        </div>
                    )}

                    {/* Lower Container / Profile Footer */}
                    <div className="shrink-0 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                        {/* Admin Link */}
                        {isLoggedIn && user?.role === 'admin' && (
                            <Link 
                                href="/dashboard" 
                                className="flex items-center gap-2 w-full py-2 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold border border-indigo-100 dark:border-indigo-800/40 text-xs transition-all"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>{t('sidebar.admin')}</span>
                            </Link>
                        )}

                        {/* Utility Bar (Language & Accessibility) */}
                        <div className="flex items-center justify-between px-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
                            <button
                                onClick={toggleLanguage}
                                title="สลับภาษา"
                                className="p-1.5 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 font-bold"
                            >
                                <span>{language === 'th' ? '🇹🇭 TH' : '🇺🇸 EN'}</span>
                            </button>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleHighContrast}
                                    className={`p-1.5 rounded-lg transition-colors ${isHighContrast ? 'bg-primary text-white' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                    title="สลับโหมดสีตัดกันสูง"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={toggleTTS}
                                    className={`p-1.5 rounded-lg transition-colors ${isTTSOn ? 'bg-primary text-white' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                    title="สลับระบบอ่านออกเสียง"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* User Menu Profile Card */}
                        <div className="pt-1">
                            <UserMenu />
                        </div>
                    </div>

                </div>
            </aside>
        </>
    );
}
