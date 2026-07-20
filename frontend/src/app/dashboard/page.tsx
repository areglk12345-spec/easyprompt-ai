'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../components/AdminSidebar';
import Sidebar from '../../components/Sidebar';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';
import { BarChart3, TrendingUp, AlertCircle, Lightbulb, Users, MessageSquare, Files, CreditCard, Crown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function DashboardPage() {
    const { authFetch, user } = useAuth();
    const { t } = useLanguage();
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';

    const [stats, setStats] = useState<any>(null);
    const [trends, setTrends] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                
                const statsRes = await authFetch(`${API_URL}/api/dashboard/stats`);
                if (statsRes.ok) setStats(await statsRes.json());
                
                const trendsRes = await authFetch(`${API_URL}/api/dashboard/trends`);
                if (trendsRes.ok) setTrends(await trendsRes.json());
                
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) fetchDashboardData();
    }, [user, authFetch]);

    const statCardStyle = "bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md";

    return (
        <div className={`min-h-screen bg-transparent transition-all duration-300 ${isLarge ? 'text-lg' : 'text-sm'}`}>
            <div className="flex min-h-screen">
                {user?.role === 'admin' ? (
                    <AdminSidebar activePage="dashboard" />
                ) : (
                    <Sidebar activePage="dashboard" />
                )}

                <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-y-auto h-screen relative custom-scrollbar transition-colors duration-300">
                    <header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-12 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30 shrink-0">
                        <div className="flex items-center space-x-4">
                            <span className="font-headline-md text-xl md:text-2xl font-bold text-primary dark:text-indigo-400 flex items-center gap-2">
                                <BarChart3 className="w-6 h-6" />
                                {t('menu.dashboard') || 'Dashboard'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                        </div>
                    </header>

                    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 py-10 space-y-8 animate-slide-up">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="dot-flashing"></div>
                            </div>
                        ) : (
                            <>
                                {/* Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className={statCardStyle}>
                                        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Prompts Created</div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats?.total_prompts || 0}</div>
                                        </div>
                                    </div>
                                    <div className={statCardStyle}>
                                        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <Files className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Templates</div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats?.total_templates || 0}</div>
                                        </div>
                                    </div>
                                    {user?.role === 'admin' ? (
                                        <div className={statCardStyle}>
                                            <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Users in Org</div>
                                                <div className="text-3xl font-black text-slate-800 dark:text-white">{stats?.total_users || 0}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={statCardStyle}>
                                            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                                <span className="material-symbols-outlined !font-bold text-2xl">bolt</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">AI Credits</div>
                                                <div className="text-3xl font-black text-slate-800 dark:text-white">{stats?.total_credits?.toLocaleString() || 0}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Credit Stats (Admin Only) */}
                                {user?.role === 'admin' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={statCardStyle}>
                                            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Credits in System</div>
                                                <div className="text-3xl font-black text-slate-800 dark:text-white">{stats?.total_credits?.toLocaleString() || 0} 💎</div>
                                            </div>
                                        </div>
                                        <div className={statCardStyle}>
                                            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                <Crown className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Premium Users</div>
                                                <div className="text-3xl font-black text-slate-800 dark:text-white">{stats?.premium_users || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Daily Usage Line Chart */}
                                {stats?.line_chart && stats.line_chart.length > 0 && (
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">📈 การใช้งานรายวัน (7 วันล่าสุด)</h3>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={stats.line_chart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                    <defs>
                                                        <linearGradient id="colorPrompts" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Area type="monotone" dataKey="prompts" stroke="#6366f1" strokeWidth={3} fill="url(#colorPrompts)" name="Prompts" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Charts Row */}
                                {(stats?.pie_chart || stats?.bar_chart) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                        {/* Pie Chart */}
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">สัดส่วนเทมเพลตตามหมวดหมู่</h3>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={stats.pie_chart}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        >
                                                            {stats.pie_chart?.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Bar Chart */}
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">ความนิยมของโหมด (Tone) ในการสร้าง Prompt</h3>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={stats.bar_chart}
                                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                        <YAxis axisLine={false} tickLine={false} />
                                                        <Tooltip 
                                                            cursor={{ fill: 'transparent' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        />
                                                        <Bar dataKey="prompts" fill="#6366f1" radius={[4, 4, 0, 0]} name="จำนวน (ครั้ง)" barSize={40} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Trends Section */}
                                {trends && (
                                    <div className="space-y-8">
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                                ภาพรวมการใช้งาน (AI Summary)
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                                                {trends.summary}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                                    หัวข้อยอดฮิต (Popular Topics)
                                                </h3>
                                                <div className="space-y-4">
                                                    {trends.popular_topics?.map((topic: any, idx: number) => (
                                                        <div key={idx} className="space-y-2">
                                                            <div className="flex justify-between text-sm font-bold">
                                                                <span className="text-slate-700 dark:text-slate-300">{topic.topic}</span>
                                                                <span className="text-indigo-600 dark:text-indigo-400">{topic.percentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${topic.percentage}%` }}></div>
                                                            </div>
                                                            <p className="text-xs text-slate-500">{topic.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <AlertCircle className="w-5 h-5 text-rose-500" />
                                                    ข้อผิดพลาดที่พบบ่อย (Common Mistakes)
                                                </h3>
                                                <div className="space-y-3">
                                                    {trends.common_mistakes?.map((mistake: string, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-3 bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl text-rose-800 dark:text-rose-300 text-sm font-semibold border border-rose-100 dark:border-rose-900/50">
                                                            <span className="shrink-0 mt-0.5">•</span>
                                                            <span>{mistake}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {trends.training_suggestions && trends.training_suggestions.length > 0 && (
                                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-indigo-900/20 p-8 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm space-y-6">
                                                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                                    <span className="material-symbols-outlined">school</span>
                                                    หลักสูตรที่แนะนำ (Training Suggestions)
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {trends.training_suggestions.map((course: any, idx: number) => (
                                                        <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                            <div className="font-bold text-lg text-slate-800 dark:text-white mb-2">{course.course_title}</div>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{course.reason}</p>
                                                            <div className="space-y-1">
                                                                {course.syllabus?.map((item: string, sIdx: number) => (
                                                                    <div key={sIdx} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                                                                        {item}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
