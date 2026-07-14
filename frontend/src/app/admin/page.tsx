'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';

type UserProfile = {
    id: number;
    username: string;
    full_name: string | null;
    role: string;
    organization: string | null;
    credits?: number;
    is_premium?: boolean;
};

type AuditLogEntry = {
    id: number;
    user_id: number | null;
    username: string | null;
    action: string;
    target_user_id: number | null;
    target_username: string | null;
    details: string | null;
    ip_address: string | null;
    created_at: string;
};

type PromptVariable = {
    id: number;
    org_name: string;
    var_key: string;
    var_value: string;
    created_at: string;
};

type AdminTemplate = {
    id: number;
    title: string;
    prompt_text: string;
    category: string;
    is_public: boolean;
    is_recommended: boolean;
    organization: string;
    likes_count: number;
};

function AdminPageContent() {
    const router = useRouter();
    const { authFetch, user, isLoggedIn, isLoading: authLoading } = useAuth();
    const { t } = useLanguage();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'users';
    const [orgModel, setOrgModel] = useState('gemini-3.1-flash-lite');

    // Audit Logs state
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    // Prompt Variables state
    const [promptVars, setPromptVars] = useState<PromptVariable[]>([]);
    const [varsLoading, setVarsLoading] = useState(false);
    const [newVarKey, setNewVarKey] = useState('');
    const [newVarValue, setNewVarValue] = useState('');

    // Admin Templates state
    const [adminTemplates, setAdminTemplates] = useState<AdminTemplate[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);

    // Credit adjustment state
    const [creditModal, setCreditModal] = useState<{userId: number; username: string} | null>(null);
    const [creditAmount, setCreditAmount] = useState(0);
    const [creditReason, setCreditReason] = useState('');

    const fetchOrgSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/org-settings`);
            if (!response.ok) {
                throw new Error('Failed to fetch org settings');
            }
            const data = await response.json();
            setOrgModel(data.ai_model);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    const handleSaveOrgSettings = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/org-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ai_model: orgModel })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถบันทึกการตั้งค่าองค์กรได้');
            }
            alert('บันทึกการตั้งค่าองค์กรเรียบร้อยแล้ว');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/users`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ดึงข้อมูลผู้ใช้ล้มเหลว');
            }
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            console.error("Fetch Users Error:", err);
            setError(err.message || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้ในขณะนี้ 😢");
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    const handleRoleChange = async (userId: number, newRole: string) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะเปลี่ยนสิทธิ์ผู้ใช้นี้เป็น ${newRole}?`)) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถเปลี่ยนสิทธิ์ได้');
            }
            
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            alert('เปลี่ยนสิทธิ์เรียบร้อยแล้ว');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteUser = async (userId: number, username: string) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบบัญชี ${username}? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถลบผู้ใช้ได้');
            }
            
            setUsers(users.filter(u => u.id !== userId));
            alert('ลบผู้ใช้เรียบร้อยแล้ว');
        } catch (err: any) {
            alert(err.message);
        }
    };



    // --- Audit Logs ---
    const fetchAuditLogs = useCallback(async () => {
        setAuditLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/audit-logs?limit=100`);
            if (response.ok) {
                const data = await response.json();
                setAuditLogs(data);
            }
        } catch (err) {
            console.error("Audit Logs Error:", err);
        } finally {
            setAuditLoading(false);
        }
    }, [authFetch]);

    const getAuditActionText = (action: string) => {
        switch (action) {
            case 'login': return '🔐 เข้าสู่ระบบ';
            case 'role_change': return '🛡️ เปลี่ยนสิทธิ์';
            case 'user_delete': return '🗑️ ลบผู้ใช้';
            case 'org_settings_change': return '⚙️ เปลี่ยนการตั้งค่า';
            case 'prompt_var_create': return '🏷️ สร้างตัวแปร';
            case 'prompt_var_update': return '✏️ แก้ไขตัวแปร';
            case 'prompt_var_delete': return '🗑️ ลบตัวแปร';
            default: return action;
        }
    };

    // --- Prompt Variables ---
    const fetchPromptVars = useCallback(async () => {
        setVarsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/prompt-variables`);
            if (response.ok) {
                const data = await response.json();
                setPromptVars(data);
            }
        } catch (err) {
            console.error("Prompt Vars Error:", err);
        } finally {
            setVarsLoading(false);
        }
    }, [authFetch]);

    // --- Admin Templates ---
    const fetchAdminTemplates = useCallback(async () => {
        setTemplatesLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/templates`);
            if (response.ok) {
                const data = await response.json();
                setAdminTemplates(data);
            }
        } catch (err) {
            console.error("Admin Templates Error:", err);
        } finally {
            setTemplatesLoading(false);
        }
    }, [authFetch]);

    const handleToggleRecommend = async (templateId: number) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/templates/${templateId}/recommend`, { method: 'PUT' });
            if (response.ok) {
                const data = await response.json();
                setAdminTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_recommended: data.is_recommended } : t));
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    // --- Credit Adjustment ---
    const handleCreditAdjust = async () => {
        if (!creditModal || creditAmount === 0) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/users/${creditModal.userId}/credits`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: creditAmount, reason: creditReason || 'Admin adjustment' })
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(prev => prev.map(u => u.id === creditModal.userId ? { ...u, credits: data.new_credits } : u));
                alert(data.message);
                setCreditModal(null);
                setCreditAmount(0);
                setCreditReason('');
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(errData.detail || 'เกิดข้อผิดพลาด');
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn || !user) {
            router.push('/login');
            return;
        }
        if (user.role !== 'admin') {
            router.push('/');
            return;
        }

        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'settings') {
            fetchOrgSettings();
        } else if (activeTab === 'audit') {
            fetchAuditLogs();
        } else if (activeTab === 'variables') {
            fetchPromptVars();
        } else if (activeTab === 'templates') {
            fetchAdminTemplates();
        }
    }, [isLoggedIn, authLoading, user, router, activeTab, fetchUsers, fetchOrgSettings, fetchAuditLogs, fetchPromptVars, fetchAdminTemplates]);
    const handleAddVariable = async () => {
        if (!newVarKey.trim() || !newVarValue.trim()) {
            alert('กรุณากรอกทั้งชื่อตัวแปรและค่า');
            return;
        }
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/prompt-variables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ var_key: newVarKey.trim(), var_value: newVarValue.trim() })
            });
            if (response.ok) {
                setNewVarKey('');
                setNewVarValue('');
                fetchPromptVars();
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(errData.detail || 'เกิดข้อผิดพลาด');
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteVariable = async (varId: number, varKey: string) => {
        if (!window.confirm(`ลบตัวแปร "${varKey}" ?`)) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            await authFetch(`${API_URL}/api/admin/prompt-variables/${varId}`, { method: 'DELETE' });
            fetchPromptVars();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const textSize = isLarge ? 'text-2xl' : 'text-base';
    const cardPadding = isLarge ? 'p-8' : 'p-6';

    if (authLoading || (isLoading && activeTab === 'users' && users.length === 0)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center space-y-3">
                    <div className="text-4xl animate-bounce">🛡️</div>
                    <div className="font-semibold text-slate-500 dark:text-slate-400 animate-pulse">กำลังโหลดข้อมูลแอดมิน...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="glass-panel max-w-md w-full p-8 rounded-3xl text-center space-y-4 border border-rose-200 dark:border-rose-900 shadow-xl bg-white/70 dark:bg-slate-800/70">
                    <div className="text-4xl">⚠️</div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">เกิดข้อผิดพลาด</h2>
                    <p className="text-rose-600 dark:text-rose-400 font-medium">{error}</p>
                    <button onClick={fetchUsers} className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm">
                        🔄 ลองใหม่อีกครั้ง
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-transparent dark:bg-slate-900 transition-all duration-300 ${textSize}`}>
            <div className="flex min-h-screen">
                <AdminSidebar activePage={activeTab as any} />

                <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-y-auto h-screen relative transition-colors duration-300">
                    {/* Top AppBar */}
                    <header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-12 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30 shrink-0">
                        <div className="flex items-center space-x-4">
                            <span className="font-headline-md text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-3xl">admin_panel_settings</span>
                                Admin Panel
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <UserMenu />
                        </div>
                    </header>

                    <div className={`p-6 md:p-12 max-w-6xl mx-auto w-full space-y-8 ${isLarge ? 'pb-32' : 'pb-20'}`}>
                        
                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
                                    <div className="space-y-1">
                                        <h1 className="font-display-lg text-4xl font-extrabold text-slate-800 dark:text-white leading-tight flex items-center gap-3">
                                            จัดการผู้ใช้งาน (User Management)
                                        </h1>
                                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            จัดการสิทธิ์และบัญชีผู้ใช้งานสำหรับองค์กร: <strong className="text-indigo-600 dark:text-indigo-400">{user?.organization}</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className={`glass-panel-heavy border border-white/40 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 shadow-sm rounded-3xl ${cardPadding} overflow-hidden`}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    <th className="pb-3 px-4">ชื่อผู้ใช้งาน</th>
                                                    <th className="pb-3 px-4">ชื่อ-สกุล</th>
                                                    <th className="pb-3 px-4">บทบาท</th>
                                                    <th className="pb-3 px-4 text-center">เครดิต 💎</th>
                                                    <th className="pb-3 px-4 text-right">การจัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-semibold text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {users.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-10 text-slate-400 dark:text-slate-500">ไม่พบข้อมูลผู้ใช้งาน</td>
                                                    </tr>
                                                ) : (
                                                    users.map((u) => (
                                                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                                            <td className="py-4 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                                                                {u.username} {u.id === user?.id && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-2">คุณ</span>}
                                                            </td>
                                                            <td className="py-4 px-4">{u.full_name || '-'}</td>
                                                            <td className="py-4 px-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                                    u.role === 'admin' 
                                                                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' 
                                                                        : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                                                                }`}>
                                                                    {u.role.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="font-black text-indigo-600 dark:text-indigo-400">{u.credits ?? 0}</span>
                                                                <button
                                                                    onClick={() => setCreditModal({ userId: u.id, username: u.username })}
                                                                    className="ml-2 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 dark:text-amber-300 transition-all"
                                                                >
                                                                    ปรับ
                                                                </button>
                                                            </td>
                                                            <td className="py-4 px-4 text-right space-x-2">
                                                                {u.id !== user?.id && (
                                                                    <>
                                                                        <button 
                                                                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                                u.role === 'admin' 
                                                                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white' 
                                                                                : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/60 dark:text-indigo-300'
                                                                            }`}
                                                                        >
                                                                            {u.role === 'admin' ? 'ลดสิทธิ์เป็น User' : 'ตั้งเป็น Admin'}
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:hover:bg-rose-800/60 dark:text-rose-300 transition-all"
                                                                        >
                                                                            ลบผู้ใช้
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Organization Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className={`glass-panel border-0 shadow-lg dark:shadow-none bg-white dark:bg-slate-800 rounded-3xl ${cardPadding} space-y-6 animate-slide-up`}>
                                <div>
                                    <h2 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'}`}>การตั้งค่าองค์กร</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">ตั้งค่ารูปแบบของ AI ให้กับพนักงานทุกคนในองค์กร <strong>{user?.organization}</strong></p>
                                </div>
                                <div className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="font-label-sm text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">โมเดล AI (AI Model)</label>
                                        <select
                                            value={orgModel}
                                            onChange={(e) => setOrgModel(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-100/60 border border-slate-200/50 focus:bg-white focus:border-primary outline-none transition-all font-body-md text-slate-800 dark:text-white"
                                        >
                                            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (ความเร็วสูงสุด, ประหยัดโควต้า)</option>
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (สมดุลความเร็ว/ความฉลาด)</option>
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (ฉลาดที่สุด, สำหรับงานซับซ้อน)</option>
                                        </select>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={handleSaveOrgSettings}
                                            disabled={isLoading}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                                        >
                                            บันทึกการตั้งค่า
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Audit Logs Tab */}
                        {activeTab === 'audit' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'}`}>📋 Audit Logs</h2>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">บันทึกกิจกรรมทั้งหมดในองค์กร <strong className="text-indigo-600 dark:text-indigo-400">{user?.organization}</strong></p>
                                    </div>
                                    <button onClick={fetchAuditLogs} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 transition-colors">
                                        🔄 Refresh
                                    </button>
                                </div>
                                
                                <div className={`glass-panel-heavy border border-white/40 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 shadow-sm rounded-3xl ${cardPadding} overflow-hidden`}>
                                    {auditLoading ? (
                                        <div className="text-center py-12 text-slate-400 animate-pulse font-semibold">กำลังโหลด Audit Logs...</div>
                                    ) : auditLogs.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-semibold">ยังไม่มี Audit Logs</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                        <th className="pb-3 px-4">วันเวลา</th>
                                                        <th className="pb-3 px-4">ผู้กระทำ</th>
                                                        <th className="pb-3 px-4">กิจกรรม</th>
                                                        <th className="pb-3 px-4">เป้าหมาย</th>
                                                        <th className="pb-3 px-4">รายละเอียด</th>
                                                        <th className="pb-3 px-4">IP</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm font-semibold text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-700/50">
                                                    {auditLogs.map(log => {
                                                        let detailsObj: any = {};
                                                        try { detailsObj = log.details ? JSON.parse(log.details) : {}; } catch {}
                                                        const detailStr = Object.entries(detailsObj).map(([k, v]) => `${k}: ${v}`).join(', ');
                                                        
                                                        return (
                                                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                                                <td className="py-3 px-4 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                                    {new Date(log.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })} {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{log.username || '-'}</td>
                                                                <td className="py-3 px-4">{getAuditActionText(log.action)}</td>
                                                                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{log.target_username || '-'}</td>
                                                                <td className="py-3 px-4 text-xs text-slate-400 max-w-[200px] truncate" title={detailStr}>{detailStr || '-'}</td>
                                                                <td className="py-3 px-4 text-xs text-slate-400 font-mono">{log.ip_address || '-'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Prompt Variables Tab */}
                        {activeTab === 'variables' && (
                            <div className="space-y-6 animate-slide-up">
                                <div>
                                    <h2 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'}`}>🏷️ ตัวแปร Prompt ขององค์กร</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                                        ตั้งค่าตัวแปรที่ระบบจะแทนที่อัตโนมัติเมื่อ AI สร้าง prompt — ใช้ <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 text-xs font-mono">{`{{var_key}}`}</code> ใน prompt ของคุณ
                                    </p>
                                </div>

                                {/* Add new variable form */}
                                <div className={`glass-panel border-0 shadow-lg dark:shadow-none bg-white dark:bg-slate-800 rounded-3xl ${cardPadding} space-y-4`}>
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">เพิ่มตัวแปรใหม่</h3>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">ชื่อตัวแปร (Key)</label>
                                            <input
                                                type="text"
                                                value={newVarKey}
                                                onChange={e => setNewVarKey(e.target.value)}
                                                placeholder="เช่น company_name"
                                                className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white font-mono"
                                            />
                                        </div>
                                        <div className="flex-[2]">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">ค่า (Value)</label>
                                            <input
                                                type="text"
                                                value={newVarValue}
                                                onChange={e => setNewVarValue(e.target.value)}
                                                placeholder="เช่น บริษัท เทสต์ จำกัด"
                                                className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-sm text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={handleAddVariable}
                                                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-sm whitespace-nowrap"
                                            >
                                                + เพิ่ม
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Variables list */}
                                <div className={`glass-panel-heavy border border-white/40 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 shadow-sm rounded-3xl ${cardPadding}`}>
                                    {varsLoading ? (
                                        <div className="text-center py-10 text-slate-400 animate-pulse font-semibold">กำลังโหลดตัวแปร...</div>
                                    ) : promptVars.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                                            <div className="text-3xl mb-2">🏷️</div>
                                            <div className="font-semibold">ยังไม่มีตัวแปร — เริ่มเพิ่มได้เลย!</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {promptVars.map(v => (
                                                <div key={v.id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <code className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-mono text-sm font-bold">
                                                            {`{{${v.var_key}}}`}
                                                        </code>
                                                        <span className="text-slate-600 dark:text-slate-400 text-sm">→</span>
                                                        <span className="text-slate-800 dark:text-white font-semibold text-sm">{v.var_value}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteVariable(v.id, v.var_key)}
                                                        className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Templates Tab */}
                        {activeTab === 'templates' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
                                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">จัดการ Template แนะนำ</h1>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">เลือก Template ที่ต้องการแนะนำให้ผู้ใช้ทุกคน</p>
                                </div>

                                {templatesLoading ? (
                                    <div className="text-center py-10 text-slate-400 animate-pulse">กำลังโหลด...</div>
                                ) : (
                                    <div className="space-y-3">
                                        {adminTemplates.map(tpl => (
                                            <div key={tpl.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${tpl.is_recommended ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        {tpl.is_recommended && <span className="text-amber-500">⭐</span>}
                                                        <span className="font-bold text-slate-800 dark:text-white truncate">{tpl.title}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{tpl.category}</span>
                                                        {tpl.is_public && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Public</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{tpl.prompt_text}</p>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-xs text-slate-400">❤️ {tpl.likes_count}</span>
                                                    <button
                                                        onClick={() => handleToggleRecommend(tpl.id)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tpl.is_recommended ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300'}`}
                                                    >
                                                        {tpl.is_recommended ? '⭐ แนะนำอยู่' : 'ตั้งเป็นแนะนำ'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Credit Adjustment Modal */}
                    {creditModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setCreditModal(null)}>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-4 border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">💎 ปรับเครดิต: {creditModal.username}</h3>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">จำนวน (+ เพิ่ม / - ลด)</label>
                                    <input type="number" value={creditAmount} onChange={e => setCreditAmount(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-lg outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">เหตุผล (Optional)</label>
                                    <input type="text" value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="เช่น Bonus, Refund" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-indigo-500" />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setCreditModal(null)} className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-600">ยกเลิก</button>
                                    <button onClick={handleCreditAdjust} className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-all">บันทึก</button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center font-semibold text-slate-500 animate-pulse">Loading Admin Panel...</div>
            </div>
        }>
            <AdminPageContent />
        </Suspense>
    );
}
