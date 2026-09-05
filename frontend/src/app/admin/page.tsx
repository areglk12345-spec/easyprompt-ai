'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { 
    Lock, Shield, Trash2, Settings, Tag, Edit2, ClipboardList, 
    BarChart3, TrendingUp, Sparkles, Inbox, Key, AlertTriangle, 
    RefreshCw, Star, Heart, FileText, Search, ThumbsUp, ThumbsDown 
} from 'lucide-react';

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
    const { authFetch, user, isLoggedIn, isLoading: authLoading, openLoginModal } = useAuth();
    const { t } = useLanguage();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'users';
    const [orgModel, setOrgModel] = useState('gemini-3.1-flash-lite');
    const [apiPoolStatus, setApiPoolStatus] = useState<{total_keys: number; estimated_rpm: number; estimated_rpd: number; model: string} | null>(null);

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

    // Analytics state
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Pending Templates Queue state
    const [pendingTemplates, setPendingTemplates] = useState<any[]>([]);
    const [pendingLoading, setPendingLoading] = useState(false);

    // Prompt Insights state
    const [insightsData, setInsightsData] = useState<any>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    const fetchOrgSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const [settingsRes, poolRes] = await Promise.all([
                authFetch(`${API_URL}/api/admin/org-settings`),
                authFetch(`${API_URL}/api/admin/api-pool-status`).catch(() => null)
            ]);
            if (!settingsRes.ok) {
                const errData = await settingsRes.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถโหลดการตั้งค่าองค์กรได้');
            }
            const data = await settingsRes.json();
            setOrgModel(data.ai_model);
            if (poolRes && poolRes.ok) {
                const poolData = await poolRes.json();
                setApiPoolStatus(poolData);
            }
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
            setError(err.message || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้ในขณะนี้");
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
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถโหลด Audit Logs ได้');
            }
            const data = await response.json();
            setAuditLogs(data);
        } catch (err: any) {
            console.error("Audit Logs Error:", err);
            setError(err.message || 'ไม่สามารถโหลด Audit Logs ได้');
        } finally {
            setAuditLoading(false);
        }
    }, [authFetch]);

    const getAuditActionBadge = (action: string) => {
        switch (action) {
            case 'login':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Lock className="w-3.5 h-3.5 text-blue-500" />
                        เข้าสู่ระบบ
                    </span>
                );
            case 'role_change':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <Shield className="w-3.5 h-3.5 text-purple-500" />
                        เปลี่ยนสิทธิ์
                    </span>
                );
            case 'user_delete':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        ลบผู้ใช้
                    </span>
                );
            case 'org_settings_change':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Settings className="w-3.5 h-3.5 text-amber-500" />
                        เปลี่ยนการตั้งค่า
                    </span>
                );
            case 'prompt_var_create':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                        สร้างตัวแปร
                    </span>
                );
            case 'prompt_var_update':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                        แก้ไขตัวแปร
                    </span>
                );
            case 'prompt_var_delete':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        ลบตัวแปร
                    </span>
                );
            default:
                return <span className="text-xs text-slate-500 font-medium">{action}</span>;
        }
    };

    // --- Prompt Variables ---
    const fetchPromptVars = useCallback(async () => {
        setVarsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/prompt-variables`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถโหลดตัวแปร Prompt ได้');
            }
            const data = await response.json();
            setPromptVars(data);
        } catch (err: any) {
            console.error("Prompt Vars Error:", err);
            setError(err.message || 'ไม่สามารถโหลดตัวแปร Prompt ได้');
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
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถโหลด Template ได้');
            }
            const data = await response.json();
            setAdminTemplates(data);
        } catch (err: any) {
            console.error("Admin Templates Error:", err);
            setError(err.message || 'ไม่สามารถโหลด Template ได้');
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

    // --- Analytics ---
    const fetchAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/analytics`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถโหลดข้อมูล Analytics ได้');
            }
            const data = await response.json();
            setAnalyticsData(data);
        } catch (err: any) {
            console.error("Analytics Error:", err);
            setError(err.message || 'ไม่สามารถโหลดข้อมูล Analytics ได้');
        } finally {
            setAnalyticsLoading(false);
        }
    }, [authFetch]);

    // --- Pending Templates Queue ---
    const fetchPendingTemplates = useCallback(async () => {
        setPendingLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/pending-templates`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถโหลดคิวรออนุมัติได้');
            }
            const data = await response.json();
            setPendingTemplates(data);
        } catch (err: any) {
            console.error("Pending Templates Error:", err);
            setError(err.message || 'ไม่สามารถโหลดคิวรออนุมัติได้');
        } finally {
            setPendingLoading(false);
        }
    }, [authFetch]);

    // --- Prompt Insights ---
    const fetchInsights = useCallback(async () => {
        setInsightsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/prompt-insights`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'ไม่สามารถโหลดข้อมูล Prompt Insights ได้');
            }
            const data = await response.json();
            setInsightsData(data);
        } catch (err: any) {
            console.error("Prompt Insights Error:", err);
            setError(err.message || 'ไม่สามารถโหลดข้อมูล Prompt Insights ได้');
        } finally {
            setInsightsLoading(false);
        }
    }, [authFetch]);

    const [exportingInsights, setExportingInsights] = useState(false);
    const handleExportInsights = async () => {
        setExportingInsights(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/prompt-insights/export`);
            if (!response.ok) throw new Error('ไม่สามารถ export ข้อมูลได้');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prompt_insights_export.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Export Insights Error:", err);
            setError(err.message || 'ไม่สามารถ export ข้อมูลได้');
        } finally {
            setExportingInsights(false);
        }
    };

    const handleApproveTemplate = async (templateId: number, action: 'approve' | 'reject') => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/admin/approve-template/${templateId}?action=${action}`, {
                method: 'POST'
            });
            if (response.ok) {
                fetchPendingTemplates();
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.detail || 'เกิดข้อผิดพลาด');
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn || !user) {
            openLoginModal();
            router.push('/');
            return;
        }
        if (user.role !== 'admin') {
            router.push('/');
            return;
        }

        setError(null);
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
        } else if (activeTab === 'analytics') {
            fetchAnalytics();
        } else if (activeTab === 'pending') {
            fetchPendingTemplates();
        } else if (activeTab === 'insights') {
            fetchInsights();
        }
    }, [isLoggedIn, user, authLoading, router, openLoginModal, activeTab, fetchUsers, fetchOrgSettings, fetchAuditLogs, fetchPromptVars, fetchAdminTemplates, fetchAnalytics, fetchPendingTemplates, fetchInsights]);

    const retryCurrentTab = () => {
        switch (activeTab) {
            case 'users': fetchUsers(); break;
            case 'settings': fetchOrgSettings(); break;
            case 'audit': fetchAuditLogs(); break;
            case 'variables': fetchPromptVars(); break;
            case 'templates': fetchAdminTemplates(); break;
            case 'analytics': fetchAnalytics(); break;
            case 'pending': fetchPendingTemplates(); break;
            case 'insights': fetchInsights(); break;
            default: fetchUsers();
        }
    };

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
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                        <Shield className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="font-semibold text-slate-500 dark:text-slate-400 animate-pulse">กำลังโหลดข้อมูลแอดมิน...</div>
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
                    <header className="sticky top-0 z-30 flex justify-between items-center pl-16 pr-6 md:px-12 w-full min-h-[5rem] py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/30 shrink-0 flex-wrap gap-2">
                        <div className="flex items-center space-x-4">
                            <span className="font-headline-md text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-3xl">admin_panel_settings</span>
                                Admin Panel
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                        </div>
                    </header>

                    <div className={`p-6 md:p-12 max-w-6xl mx-auto w-full space-y-8 ${isLarge ? 'pb-32' : 'pb-20'}`}>

                        {/* Inline error banner — stays scoped to the current tab so the sidebar/nav remain usable */}
                        {error && (
                            <div className="glass-panel max-w-2xl w-full p-6 rounded-3xl text-center space-y-3 border border-rose-200 dark:border-rose-900 shadow-sm bg-white/70 dark:bg-slate-800/70 mx-auto animate-slide-up">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mx-auto">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">เกิดข้อผิดพลาด</h2>
                                <p className="text-rose-600 dark:text-rose-400 font-medium text-sm">{error}</p>
                                <button onClick={retryCurrentTab} className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm text-sm">
                                    <RefreshCw className="w-4 h-4" />
                                    <span>ลองใหม่อีกครั้ง</span>
                                </button>
                            </div>
                        )}

                        {/* Users Tab */}
                        {!error && activeTab === 'users' && (
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
                                                    <th className="pb-3 px-4 text-center">
                                                        <span className="inline-flex items-center justify-center gap-1">
                                                            <span>เครดิต</span>
                                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                        </span>
                                                    </th>
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
                        {!error && activeTab === 'settings' && (
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
                                            <option value="gemini-3.1-flash-lite">⭐ Gemini 3.1 Flash Lite (แนะนำ — เร็ว, ฉลาด, ประหยัดโควต้า)</option>
                                            <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (ความเร็วสูง, ประหยัดโควต้า)</option>
                                            <option value="gemini-3.6-flash">Gemini 3.6 Flash (ใหม่ล่าสุด, ฉลาดมาก — 5 RPM)</option>
                                            <option value="gemini-3.5-flash">Gemini 3.5 Flash (ฉลาด — 5 RPM)</option>
                                            <option value="gemini-3-flash">Gemini 3 Flash (สมดุล — 5 RPM)</option>
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (เสถียร — 5 RPM)</option>
                                            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (ประหยัด — 10 RPM)</option>
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

                                {/* API Pool Status Card */}
                                {apiPoolStatus && (
                                    <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-700/30">
                                        <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                                            <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            <span>API Key Pool Status</span>
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-3 text-center">
                                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{apiPoolStatus.total_keys}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">API Keys</div>
                                            </div>
                                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-3 text-center">
                                                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{apiPoolStatus.estimated_rpm}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">RPM (req/min)</div>
                                            </div>
                                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-3 text-center">
                                                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{apiPoolStatus.estimated_rpd.toLocaleString()}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">RPD (req/day)</div>
                                            </div>
                                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-3 text-center">
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{apiPoolStatus.model}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Default Model</div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/50 mt-3">ระบบจะวนสลับ API Key อัตโนมัติ (Round-Robin) พร้อม Fallback เมื่อ key ใดถูก rate limit</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Audit Logs Tab */}
                        {!error && activeTab === 'audit' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'} flex items-center gap-2.5`}>
                                            <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            <span>Audit Logs</span>
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">บันทึกกิจกรรมทั้งหมดในองค์กร <strong className="text-indigo-600 dark:text-indigo-400">{user?.organization}</strong></p>
                                    </div>
                                    <button onClick={fetchAuditLogs} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 transition-colors">
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Refresh</span>
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
                                                                <td className="py-3 px-4">{getAuditActionBadge(log.action)}</td>
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
                        {!error && activeTab === 'variables' && (
                            <div className="space-y-6 animate-slide-up">
                                <div>
                                    <h2 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'} flex items-center gap-2.5`}>
                                        <Tag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        <span>ตัวแปร Prompt ขององค์กร</span>
                                    </h2>
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
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                                                <Tag className="w-6 h-6" />
                                            </div>
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
                        {!error && activeTab === 'templates' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
                                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">จัดการ Template แนะนำ</h1>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">เลือก Template ที่ต้องการแนะนำให้ผู้ใช้ทุกคน</p>
                                </div>

                                {templatesLoading ? (
                                    <div className="text-center py-10 text-slate-400 animate-pulse">กำลังโหลด...</div>
                                ) : adminTemplates.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="font-semibold">ยังไม่มี Template ในองค์กรนี้</div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {adminTemplates.map(tpl => (
                                            <div key={tpl.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${tpl.is_recommended ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        {tpl.is_recommended && <Star className="w-4 h-4 text-amber-500 fill-amber-400" />}
                                                        <span className="font-bold text-slate-800 dark:text-white truncate">{tpl.title}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{tpl.category}</span>
                                                        {tpl.is_public && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Public</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{tpl.prompt_text}</p>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                                                        <span>{tpl.likes_count}</span>
                                                    </span>
                                                    <button
                                                        onClick={() => handleToggleRecommend(tpl.id)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tpl.is_recommended ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300'}`}
                                                    >
                                                        {tpl.is_recommended ? (
                                                            <span className="flex items-center gap-1">
                                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                                <span>แนะนำอยู่</span>
                                                            </span>
                                                        ) : (
                                                            <span>ตั้งเป็นแนะนำ</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Analytics Tab */}
                        {!error && activeTab === 'analytics' && (
                            <div className="space-y-6 animate-slide-up">
                                <div>
                                    <h2 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'} flex items-center gap-2.5`}>
                                        <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        <span>Analytics Report</span>
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">สถิติการใช้งาน AI ในองค์กร <strong className="text-indigo-600 dark:text-indigo-400">{user?.organization}</strong> (7 วันล่าสุด)</p>
                                </div>
                                
                                {analyticsLoading || !analyticsData ? (
                                    <div className="flex justify-center items-center h-40">
                                        <div className="dot-flashing"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <span className="material-symbols-outlined text-3xl">chat</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Prompts Generated</div>
                                                    <div className="text-3xl font-black text-slate-800 dark:text-white">{analyticsData.summary?.total_prompts || 0}</div>
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                    <span className="material-symbols-outlined text-3xl">target</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg Fit Score</div>
                                                    <div className="text-3xl font-black text-slate-800 dark:text-white">{analyticsData.summary?.avg_score || 0}<span className="text-lg text-slate-400">/100</span></div>
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                    <span className="material-symbols-outlined text-3xl">group</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Users (30d)</div>
                                                    <div className="text-3xl font-black text-slate-800 dark:text-white">{analyticsData.summary?.active_users || 0}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bar Chart */}
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                                <span>การสร้าง Prompt รายวัน (7 วันล่าสุด)</span>
                                            </h3>
                                            <div className="h-72 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={analyticsData.chart_data || []}
                                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                                        <RechartsTooltip 
                                                            cursor={{ fill: 'transparent' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-prose-body)' }}
                                                        />
                                                        <Bar dataKey="prompts" fill="#6366f1" radius={[6, 6, 0, 0]} name="Prompts" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Prompt Insights Tab */}
                        {!error && activeTab === 'insights' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <h2 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'} flex items-center gap-2.5`}>
                                            <Search className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            <span>Prompt Insights</span>
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                                            Prompt Doctor ที่ได้ Fit Score ต่ำสุดในองค์กร <strong className="text-indigo-600 dark:text-indigo-400">{user?.organization}</strong> รวมถึง Guest — ใช้ดู pattern เพื่อปรับปรุง prompt ของระบบ
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleExportInsights}
                                        disabled={exportingInsights}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-base">download</span>
                                        <span>{exportingInsights ? 'กำลัง Export...' : 'Export CSV'}</span>
                                    </button>
                                </div>

                                {insightsLoading || !insightsData ? (
                                    <div className="flex justify-center items-center h-40">
                                        <div className="dot-flashing"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Feedback Summary */}
                                        {insightsData.feedback_summary && (
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                    <ThumbsUp className="w-5 h-5 text-indigo-500" />
                                                    <span>Feedback จากผู้ใช้</span>
                                                </h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                                                        <div className="text-2xl font-black text-emerald-600">{insightsData.feedback_summary.up}</div>
                                                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
                                                            <ThumbsUp className="w-3.5 h-3.5" />
                                                            <span>ช่วยได้</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-center">
                                                        <div className="text-2xl font-black text-rose-600">{insightsData.feedback_summary.down}</div>
                                                        <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1 flex items-center justify-center gap-1">
                                                            <ThumbsDown className="w-3.5 h-3.5" />
                                                            <span>ไม่ช่วย</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                                                        <div className="text-2xl font-black text-slate-400">{insightsData.feedback_summary.none}</div>
                                                        <div className="text-xs text-slate-400 mt-1">ยังไม่ให้ feedback</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Category Breakdown */}
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Fit Score เฉลี่ยตามหมวดหมู่</h3>
                                            {insightsData.category_breakdown?.length === 0 ? (
                                                <p className="text-slate-400 text-sm">ยังไม่มีข้อมูลเพียงพอ</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {insightsData.category_breakdown?.map((c: any) => (
                                                        <div key={c.category} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.category}</div>
                                                            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{c.avg_score}<span className="text-sm text-slate-400">/100</span></div>
                                                            <div className="text-xs text-slate-400 mt-1">{c.count} รายการ</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Lowest scoring prompts */}
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Prompt ที่ได้คะแนนต่ำสุด (20 รายการล่าสุด)</h3>
                                            {insightsData.low_score_prompts?.length === 0 ? (
                                                <p className="text-slate-400 text-sm">ยังไม่มีข้อมูลเพียงพอ</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {insightsData.low_score_prompts?.map((p: any) => (
                                                        <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold text-xs">
                                                                        Score: {p.score}/100
                                                                    </span>
                                                                    {p.is_guest && (
                                                                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-xs">
                                                                            Guest
                                                                        </span>
                                                                    )}
                                                                    {p.feedback === 'up' && <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />}
                                                                    {p.feedback === 'down' && <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />}
                                                                </div>
                                                                <span className="text-xs text-slate-400">{p.category}</span>
                                                            </div>
                                                            <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">{p.raw_prompt}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pending Templates Tab */}
                        {!error && activeTab === 'pending' && (
                            <div className="space-y-6 animate-slide-up">
                                <div>
                                    <h2 className={`font-bold text-slate-800 dark:text-white ${isLarge ? 'text-3xl' : 'text-xl'} flex items-center gap-2.5`}>
                                        <Inbox className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        <span>คิวรออนุมัติเทมเพลตสาธารณะ</span>
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">รายการ Prompt ที่ผู้ใช้ส่งเข้ามาเพื่อขอเผยแพร่สู่คลังสาธารณะ</p>
                                </div>

                                {pendingLoading ? (
                                    <div className="text-center py-12 text-slate-400">กำลังโหลดรายการรออนุมัติ...</div>
                                ) : pendingTemplates.length === 0 ? (
                                    <div className="glass-panel text-center py-16 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                                            <Sparkles className="w-7 h-7" />
                                        </div>
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">ไม่มีเทมเพลตที่รอการอนุมัติในขณะนี้</h3>
                                        <p className="text-slate-400 text-xs mt-1">รายการใหม่จะแสดงขึ้นมาเมื่อมีผู้ใช้กด &quot;ส่งคลังสาธารณะ&quot;</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pendingTemplates.map(tpl => (
                                            <div key={tpl.id} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] uppercase">
                                                            {tpl.category || 'ทั่วไป'}
                                                        </span>
                                                        <span className="text-xs text-slate-400">User ID: #{tpl.user_id}</span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 dark:text-white text-base">{tpl.title}</h3>
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300 line-clamp-4 whitespace-pre-wrap">
                                                        {tpl.prompt_text}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                                    <button
                                                        onClick={() => handleApproveTemplate(tpl.id, 'approve')}
                                                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                                        <span>อนุมัติ (Approve)</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveTemplate(tpl.id, 'reject')}
                                                        className="flex-1 py-2 px-3 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">cancel</span>
                                                        <span>ปฏิเสธ (Reject)</span>
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
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <span>ปรับเครดิต: {creditModal.username}</span>
                                </h3>
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
