'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, Sun, Monitor, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useFontSize } from '../context/FontSizeContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useState, useEffect, useRef } from 'react';
import UserMenu from './UserMenu';
import AccessibilityModal from './AccessibilityModal';
import HelpTooltip from './HelpTooltip';

interface SidebarProps {
    activePage?: 'chat' | 'templates' | 'doctor' | 'history' | 'admin' | 'home' | 'settings' | 'dashboard' | 'marketplace' | 'knowledge';
    onNewChat?: () => void;
}

type ChatItem = { id: string; title: string; is_pinned?: boolean; folder_id?: number | null };
type FolderItem = { id: number; name: string; color: string };

export default function Sidebar({ activePage, onNewChat }: SidebarProps) {
    const { t, language, toggleLanguage } = useLanguage();
    const { fontSize, toggleFontSize } = useFontSize();
    const isLarge = fontSize === 'large';
    const { isDarkMode, themeMode, setThemeMode } = useTheme();
    const { authFetch, isLoggedIn, user } = useAuth();
    const { isSimplifiedUI, isHighContrast, isTTSOn, toggleHighContrast, toggleTTS } = useAccessibility();
    const activeClass = "flex items-center gap-4 py-3 px-4 bg-primary/5 dark:bg-primary/10 text-primary dark:text-indigo-400 rounded-xl font-bold transition-all hover-spring";
    const inactiveClass = "flex items-center gap-4 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-xl font-semibold transition-all hover-spring";

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
    const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
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
                    setRecentChats(sessions.filter(c => !c.is_pinned).slice(0, 5));
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
        if (!window.confirm(t('sidebar.delete_confirm'))) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/history/session/${sessionId}`, { method: 'DELETE' });
            if (res.ok) {
                setRecentChats(prev => prev.filter(c => c.id !== sessionId));
                setPinnedChats(prev => prev.filter(c => c.id !== sessionId));
                window.dispatchEvent(new Event('chat_updated'));
                
                // If current session is deleted, optionally clear local storage
                if (typeof window !== 'undefined' && localStorage.getItem('ep_session_id') === sessionId) {
                    localStorage.removeItem('ep_session_id');
                }
            } else {
                alert(t('sidebar.delete_failed'));
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
        <div key={chat.id} className="group relative flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all hover-spring"
            onContextMenu={(e) => handleContextMenu(e, chat)}
        >
            <Link 
                href={`/chat?session_id=${chat.id}`}
                className="flex-1 text-[13px] text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 truncate pr-6 block"
                title={chat.title}
            >
                {showPin && <span className="mr-1 text-amber-500">📌</span>}
                {chat.title}
            </Link>
            <button 
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-all"
                title={t('sidebar.delete_chat')}
            >
                <span className="material-symbols-outlined text-[16px] block">delete</span>
            </button>
        </div>
    );

    const themeIcon = themeMode === 'system' ? <Monitor className="w-4 h-4" /> : isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
    const themeLabel = themeMode === 'system' ? 'Auto' : isDarkMode ? 'Dark' : 'Light';

    return (
        <>
            {/* Desktop Hamburger Toggle (When Collapsed) */}
            <button
                onClick={() => setIsDesktopCollapsed(false)}
                className={`hidden md:block fixed top-5 left-4 z-40 p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-indigo-400 transition-all hover-spring ${isDesktopCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
                aria-label="Open Sidebar"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-5 left-4 z-50 p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-indigo-400 transition-colors hover-spring"
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

            <aside className={`fixed md:sticky top-0 h-screen bg-white/95 dark:bg-slate-900/95 md:bg-white/60 md:dark:bg-slate-900/40 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 shrink-0 z-40 transition-all duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'} ${isDesktopCollapsed ? 'md:-translate-x-full md:w-0 md:border-r-0' : 'md:translate-x-0 md:w-64'} overflow-hidden`}>
                <div className="w-64 px-6 py-8 h-full flex flex-col">
                <div className="flex items-center justify-between px-2 mb-10 mt-6 md:mt-0">
                <Link href="/" className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-indigo-400">
                        <span className="material-symbols-outlined !font-bold text-2xl">bolt</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">EZPrompt</h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">Minimal Assistant</p>
                    </div>
                </Link>
                
                {/* Desktop Collapse Button */}
                <button
                    onClick={() => setIsDesktopCollapsed(true)}
                    className="hidden md:flex p-1.5 text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    aria-label="Collapse Sidebar"
                >
                    <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_left</span>
                </button>
            </div>
            
            {onNewChat ? (
                <button onClick={onNewChat} className="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all hover-spring cursor-pointer whitespace-nowrap">
                    <span className="material-symbols-outlined !wght-500">add</span>
                    New Chat
                </button>
            ) : (
                <Link href="/chat" onClick={() => { if(typeof window !== 'undefined') localStorage.removeItem('ep_session_id'); }} className="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all hover-spring cursor-pointer whitespace-nowrap">
                    <span className="material-symbols-outlined !wght-500">add</span>
                    New Chat
                </Link>
            )}

            {isLoggedIn && (
                <div className="mt-4 px-2">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาแชท..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] outline-none focus:border-primary text-slate-700 dark:text-slate-300 transition-colors"
                        />
                    </div>
                </div>
            )}

            <nav className="flex-1 space-y-2 mt-8 overflow-x-hidden">
                <Link href="/chat" className={activePage === 'chat' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined shrink-0">chat_bubble</span>
                    <span className="text-[15px] whitespace-nowrap truncate">{t('menu.chat')}</span>
                </Link>
                <Link href="/templates" className={activePage === 'templates' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined shrink-0">grid_view</span>
                    <span className="text-[15px] whitespace-nowrap truncate">{t('sidebar.templates')}</span>
                </Link>
                <Link href="/doctor" title="ระบบช่วยตรวจและปรับปรุง Prompt ของคุณให้ดีขึ้น (Dr. Prompt)" className={activePage === 'doctor' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined shrink-0">health_and_safety</span>
                    <span className="text-[15px] whitespace-nowrap truncate">{t('menu.doctor')}</span>
                </Link>
            </nav>

            <div className="flex-1 overflow-y-auto mt-4 px-2 custom-scrollbar">
                {isLoggedIn && searchTerm ? (
                    <div className="mb-6">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">ผลการค้นหา</div>
                        <div className="space-y-1">
                            {allSessions.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                                allSessions.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map(chat => renderChatItem(chat))
                            ) : (
                                <div className="px-3 py-2 text-xs text-slate-400 text-center">ไม่พบผลลัพธ์</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Pinned Chats */}
                        {isLoggedIn && pinnedChats.length > 0 && (
                            <div className="mb-6">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">push_pin</span>
                                    {t('sidebar.pinned')}
                                </div>
                                <div className="space-y-1">
                                    {pinnedChats.map(chat => renderChatItem(chat, true))}
                                </div>
                            </div>
                        )}

                        {/* Folders */}
                        {isLoggedIn && folders.length > 0 && (
                            <div className="mb-6">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">{t('sidebar.folders')}</div>
                                <div className="space-y-1">
                                    {folders.map(folder => (
                                        <div key={folder.id}>
                                            <button 
                                                onClick={() => setExpandedFolder(expandedFolder === folder.id ? null : folder.id)}
                                                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }}></span>
                                                    <span className="font-semibold text-[13px]">{folder.name}</span>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200" style={{ transform: expandedFolder === folder.id ? 'rotate(90deg)' : 'rotate(0)' }}>
                                                    chevron_right
                                                </span>
                                            </button>
                                            
                                            {/* Folder Contents (Expanded) */}
                                            {expandedFolder === folder.id && (
                                                <div className="pl-4 mt-1 border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-1 animate-fade-in-up">
                                                    {allSessions.filter(c => c.folder_id === folder.id).length > 0 ? (
                                                        allSessions.filter(c => c.folder_id === folder.id).map(chat => renderChatItem(chat))
                                                    ) : (
                                                        <div className="text-[11px] text-slate-400 py-1 pl-2 italic">ไม่มีแชทในโฟลเดอร์นี้</div>
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
                            <div className="mb-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">{t('sidebar.recent')}</div>
                                <div className="space-y-1">
                                    {recentChats.map(chat => renderChatItem(chat))}
                                </div>
                                
                                {/* View All History Link */}
                                <div className="pt-2 pb-1">
                                    <Link 
                                        href="/history" 
                                        className="text-[13px] text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-indigo-400 flex items-center justify-center gap-1 py-1.5 transition-colors font-semibold whitespace-nowrap"
                                    >
                                        {t('sidebar.view_all') || 'ดูทั้งหมด'}
                                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 min-w-[180px] animate-scale-up"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        onClick={() => handleTogglePin(contextMenu.chatId, contextMenu.isPinned)}
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                        <span className="text-base">{contextMenu.isPinned ? '📌' : '📌'}</span>
                        {contextMenu.isPinned ? 'Unpin' : 'Pin to top'}
                    </button>
                    {folders.length > 0 && (
                        <>
                            <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                            <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Move to folder</div>
                            {folders.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => handleMoveToFolder(contextMenu.chatId, f.id)}
                                    className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                                >
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }}></span>
                                    {f.name}
                                </button>
                            ))}
                            <button
                                onClick={() => handleMoveToFolder(contextMenu.chatId, null)}
                                className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Remove from folder
                            </button>
                        </>
                    )}
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                    <button
                        onClick={(e) => { handleDeleteChat(e as any, contextMenu.chatId); setContextMenu(null); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Delete chat
                    </button>
                </div>
            )}

            {/* New Folder Input */}
            {showNewFolder && (
                <div className="px-2 mt-2 flex gap-1">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder={t('sidebar.new_folder')}
                        className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-primary"
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                        autoFocus
                    />
                    <button onClick={handleCreateFolder} className="text-primary text-xs font-bold px-2">+</button>
                </div>
            )}
            
            {isLoggedIn && (
                <button
                    onClick={() => setShowNewFolder(!showNewFolder)}
                    className="mx-2 mt-2 text-xs text-slate-400 hover:text-primary font-semibold flex items-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">create_new_folder</span>
                    {t('sidebar.new_folder')}
                </button>
            )}

            {isLoggedIn && user?.role === 'admin' && (
                <div className="mt-4 mb-2 mx-2 space-y-2">
                    <Link 
                        href="/dashboard" 
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-[18px]">shield_person</span>
                        {t('sidebar.admin')}
                    </Link>
                </div>
            )}

            {/* Bottom Utilities Row */}
            <div className="mt-auto pt-4 pb-2 px-4 flex items-center justify-around text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    title="Change Language"
                    className="p-2 hover:text-primary dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center font-bold text-xs"
                >
                    <span className="material-symbols-outlined text-lg mr-1">language</span>
                    {language === 'th' ? 'TH' : 'EN'}
                </button>

                {/* Eye Icon (Accessibility) */}
                <div className="group relative flex justify-center">
                    <button
                        onClick={toggleHighContrast}
                        className={`p-2 rounded-xl transition-all flex items-center justify-center ${isHighContrast ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg shadow-xl z-50">
                        {isHighContrast ? 'ปิดโหมดสีตัดกันสูง' : 'เปิดโหมดสีตัดกันสูง'}
                    </div>
                </div>

                {/* Ear Icon (Voice) */}
                <div className="group relative flex justify-center">
                    <button
                        onClick={toggleTTS}
                        className={`p-2 rounded-xl transition-all flex items-center justify-center ${isTTSOn ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <span className="material-symbols-outlined text-lg">hearing</span>
                    </button>
                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg shadow-xl z-50">
                        {isTTSOn ? 'ปิดระบบอ่านออกเสียง' : 'เปิดระบบอ่านออกเสียง'}
                    </div>
                </div>
            </div>

            {/* Credits System Display */}
            {isLoggedIn && user?.role !== 'admin' && (
                <div className="mx-2 mb-2">
                    <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 border border-amber-100 dark:border-amber-800/50 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-[20px]">bolt</span>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">AI Credits</span>
                        </div>
                        <span className="font-black text-amber-600 dark:text-amber-300">{user?.credits?.toLocaleString() || 0}</span>
                    </div>
                </div>
            )}
            
            {/* User Profile / Menu at the bottom */}
            <div className="pb-2 px-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                <button onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)} className="p-2 mb-2 w-full text-left text-[10px] text-slate-400 uppercase font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                    {isDesktopCollapsed ? 'Expand' : 'Collapse'}
                </button>
                <UserMenu />
            </div>
            </div>
            </aside>
        </>
    );
}
