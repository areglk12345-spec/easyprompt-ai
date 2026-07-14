'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, Sun, Monitor, Menu, X } from 'lucide-react';
import FontSizeToggle from './FontSizeToggle';
import { useLanguage } from '../context/LanguageContext';
import { useFontSize } from '../context/FontSizeContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useState, useEffect, useRef } from 'react';

interface SidebarProps {
    activePage?: 'chat' | 'templates' | 'doctor' | 'history' | 'admin' | 'home' | 'settings' | 'dashboard' | 'marketplace' | 'knowledge';
    onNewChat?: () => void;
}

type ChatItem = { id: string; title: string; is_pinned?: boolean; folder_id?: number | null };
type FolderItem = { id: number; name: string; color: string };

export default function Sidebar({ activePage, onNewChat }: SidebarProps) {
    const { t } = useLanguage();
    const { fontSize, toggleFontSize } = useFontSize();
    const { isDarkMode, themeMode, setThemeMode } = useTheme();
    const { authFetch, isLoggedIn, user } = useAuth();
    const { isSimplifiedUI } = useAccessibility();
    const activeClass = "flex items-center gap-4 py-3 px-4 bg-primary/5 dark:bg-primary/10 text-primary dark:text-indigo-400 rounded-xl font-bold transition-all hover-spring";
    const inactiveClass = "flex items-center gap-4 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-xl font-semibold transition-all hover-spring";

    const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
    const [pinnedChats, setPinnedChats] = useState<ChatItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{x: number; y: number; chatId: string; isPinned: boolean} | null>(null);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchRecent = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const response = await authFetch(`${API_URL}/api/history`);
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
        if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบประวัติการสนทนานี้?")) return;
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
                alert("ลบแชทล้มเหลว");
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
                title="ลบแชท"
            >
                <span className="material-symbols-outlined text-[16px] block">delete</span>
            </button>
        </div>
    );

    const themeIcon = themeMode === 'system' ? <Monitor className="w-4 h-4" /> : isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
    const themeLabel = themeMode === 'system' ? 'Auto' : isDarkMode ? 'Dark' : 'Light';

    return (
        <>
            {/* Mobile Hamburger Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-5 left-4 z-50 p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-indigo-400 transition-colors hover-spring"
                aria-label="Toggle Menu"
            >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Backdrop Overlay */}
            {isMobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`fixed md:sticky top-0 h-screen py-8 px-6 bg-white/95 dark:bg-slate-900/95 md:bg-white/60 md:dark:bg-slate-900/40 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 ${fontSize === 'large' ? 'w-80' : 'w-72'} shrink-0 z-40 transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
                <div className="flex items-center space-x-3 px-2 mb-10 mt-6 md:mt-0">
                <Link href="/" className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-indigo-400">
                        <span className="material-symbols-outlined !font-bold text-2xl">bolt</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">EasyPrompt</h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">Minimal Assistant</p>
                    </div>
                </Link>
            </div>
            
            {onNewChat ? (
                <button onClick={onNewChat} className="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all hover-spring cursor-pointer">
                    <span className="material-symbols-outlined !wght-500">add</span>
                    New Chat
                </button>
            ) : (
                <Link href="/chat" onClick={() => { if(typeof window !== 'undefined') localStorage.removeItem('ep_session_id'); }} className="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all hover-spring cursor-pointer">
                    <span className="material-symbols-outlined !wght-500">add</span>
                    New Chat
                </Link>
            )}
            
            <nav className="flex-1 space-y-2 mt-8">
                <Link href="/chat" className={activePage === 'chat' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">chat_bubble</span>
                    <span className="text-[15px]">{t('menu.chat')}</span>
                </Link>
                <Link href="/templates" className={activePage === 'templates' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">grid_view</span>
                    <span className="text-[15px]">{t('sidebar.templates')}</span>
                </Link>
                <Link href="/marketplace" className={activePage === 'marketplace' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">storefront</span>
                    <span className="text-[15px]">Marketplace</span>
                </Link>
                <Link href="/doctor" className={activePage === 'doctor' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">health_and_safety</span>
                    <span className="text-[15px]">{t('menu.doctor')}</span>
                </Link>
                <Link href="/knowledge" className={activePage === 'knowledge' as any ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">folder_special</span>
                    <span className="text-[15px]">Knowledge Base</span>
                </Link>
                <Link href="/history" className={activePage === 'history' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">history</span>
                    <span className="text-[15px]">{t('sidebar.history')}</span>
                </Link>
                <Link href="/settings" className={activePage === 'settings' ? activeClass : inactiveClass}>
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-[15px]">{t('menu.settings') || 'Settings'}</span>
                </Link>
            </nav>

            {/* Pinned Chats */}
            {pinnedChats.length > 0 && (
                <div className="mt-4 mb-1 space-y-1">
                    <div className="text-xs font-bold text-amber-500 dark:text-amber-400 mb-2 px-2 uppercase tracking-wider flex items-center gap-1">
                        📌 Pinned
                    </div>
                    {pinnedChats.map(chat => renderChatItem(chat, true))}
                </div>
            )}

            {/* Folders */}
            {folders.length > 0 && (
                <div className="mt-2 mb-1 space-y-1">
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 px-2 uppercase tracking-wider">Folders</div>
                    {folders.map(folder => (
                        <div key={folder.id} className="px-3 py-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }}></span>
                            {folder.name}
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Chats */}
            {recentChats.length > 0 && (
                <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar pr-2 space-y-1">
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 px-2 uppercase tracking-wider">Recent Chats</div>
                    {recentChats.map(chat => renderChatItem(chat))}
                </div>
            )}

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
                        placeholder="Folder name"
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
                    New Folder
                </button>
            )}
            {isLoggedIn && user?.role === 'admin' && (
                <div className="mt-4 mb-2 mx-2">
                    <Link 
                        href="/dashboard" 
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">shield_person</span>
                        โหมดแอดมิน
                    </Link>
                </div>
            )}
            
            <div className="pt-6 mt-auto border-t border-outline-variant/30 dark:border-slate-700/50 space-y-3">
                {/* Dark Mode Toggle with Auto-Sync */}
                <div className="flex items-center justify-between px-2 py-3">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm flex items-center gap-2">
                        {themeIcon}
                        {themeLabel} Mode
                    </span>
                    <div className="flex items-center gap-1">
                        {/* 3-way segmented control */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
                            <button
                                onClick={() => setThemeMode('light')}
                                className={`p-1.5 rounded-md transition-all ${themeMode === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                                title="Light"
                            >
                                <Sun className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            <button
                                onClick={() => setThemeMode('system')}
                                className={`p-1.5 rounded-md transition-all ${themeMode === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                                title="System (Auto)"
                            >
                                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <button
                                onClick={() => setThemeMode('dark')}
                                className={`p-1.5 rounded-md transition-all ${themeMode === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                                title="Dark"
                            >
                                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                            </button>
                        </div>
                    </div>
                </div>
                {/* Font Size Toggle */}
                <div className="flex items-center justify-between px-2 py-3">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Text Size</span>
                    <FontSizeToggle isLarge={fontSize === 'large'} onToggle={toggleFontSize} />
                </div>
            </div>
        </aside>
        </>
    );
}
