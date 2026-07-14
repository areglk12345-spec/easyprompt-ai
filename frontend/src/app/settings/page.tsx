'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserMenu from '../../components/UserMenu';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import FontSizeToggle from '../../components/FontSizeToggle';
import { useFontSize } from '../../context/FontSizeContext';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function SettingsPage() {
    const { user, authFetch, refreshUser } = useAuth();
    const { fontSize, toggleFontSize } = useFontSize();
    const { isHighContrast, isSimplifiedUI, toggleHighContrast, toggleSimplifiedUI } = useAccessibility();
    const isLarge = fontSize === 'large';
    
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [defaultTone, setDefaultTone] = useState('ทั่วไป');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [voiceControl, setVoiceControl] = useState(true);
    const [biometric, setBiometric] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [weeklyReports, setWeeklyReports] = useState(true);
    
    // 2FA State
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [qrCodeBase64, setQrCodeBase64] = useState('');
    const [totpSecret, setTotpSecret] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [disableCode, setDisableCode] = useState('');
    const [showDisable2FA, setShowDisable2FA] = useState(false);
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFAMessage, setTwoFAMessage] = useState('');
    const [twoFAError, setTwoFAError] = useState('');

    // TTS Voice State
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');

    // Preferences loading state
    const [prefsLoaded, setPrefsLoaded] = useState(false);
    
    // Save banner visibility tracking
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setEmail(user.email || '');
            setDefaultTone(user.default_tone || 'ทั่วไป');
            setIs2FAEnabled(user.is_2fa_enabled || false);
        }
    }, [user]);

    // Load TTS Voices
    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            const filteredVoices = availableVoices.filter(v => v.lang.includes('th') || v.lang.includes('en'));
            setVoices(filteredVoices);
            
            const savedVoice = localStorage.getItem('preferred_voice');
            if (savedVoice) setSelectedVoiceURI(savedVoice);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Load notification preferences from backend
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const res = await authFetch(`${API_URL}/api/auth/preferences`);
                if (res.ok) {
                    const data = await res.json();
                    setVoiceControl(data.voice_control);
                    setEmailNotifications(data.email_notifications);
                    setPushNotifications(data.push_notifications);
                    setWeeklyReports(data.weekly_reports);
                }
            } catch (e) {
                console.error("Failed to load preferences:", e);
            } finally {
                setPrefsLoaded(true);
            }
        };
        if (user) loadPreferences();
    }, [user, authFetch]);

    // Keep track of modifications to trigger save banner
    const handleFieldChange = (setter: Function, value: any) => {
        setter(value);
        setHasUnsavedChanges(true);
    };

    // Save notification preferences to backend
    const savePreference = async (key: string, value: boolean) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            await authFetch(`${API_URL}/api/auth/preferences`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value }),
            });
        } catch (e) {
            console.error(`Failed to save preference ${key}:`, e);
        }
    };

    // Toggle handlers that save immediately to backend
    const handleTogglePreference = (key: string, setter: Function, currentValue: boolean) => {
        const newValue = !currentValue;
        setter(newValue);
        savePreference(key, newValue);
    };

    const handleSave = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/auth/me/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName, email: email, default_tone: defaultTone })
            });
            
            if (!res.ok) {
                const data = await res.json();
                alert(data.detail || 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์');
                return;
            }
            
            await refreshUser();
            setHasUnsavedChanges(false);
            alert('💾 บันทึกการตั้งค่าระบบและโปรไฟล์เรียบร้อยแล้ว!');
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        }
    };

    const handleDiscard = () => {
        if (user) {
            setFullName(user.full_name || '');
            setEmail(user.email || '');
            setDefaultTone(user.default_tone || 'ทั่วไป');
        }

        setHasUnsavedChanges(false);
    };

    const handlePasswordSave = async () => {
        if (newPassword !== confirmPassword) {
            alert('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
            return;
        }
        
        setIsUpdatingPassword(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/auth/me/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
            });
            
            const data = await res.json();
            if (!res.ok) {
                alert(data.detail || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
            } else {
                alert('🔑 เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    // --- 2FA Functions ---
    const handleSetup2FA = async () => {
        setTwoFALoading(true);
        setTwoFAError('');
        setTwoFAMessage('');
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/auth/2fa/setup`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                setTwoFAError(data.detail || 'ไม่สามารถตั้งค่า 2FA ได้');
                return;
            }
            setQrCodeBase64(data.qr_code_base64);
            setTotpSecret(data.secret);
            setShow2FASetup(true);
        } catch (e) {
            setTwoFAError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setTwoFALoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (verifyCode.length !== 6) {
            setTwoFAError('กรุณากรอกรหัส 6 หลัก');
            return;
        }
        setTwoFALoading(true);
        setTwoFAError('');
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/auth/2fa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verifyCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setTwoFAError(data.detail || 'รหัสไม่ถูกต้อง');
                return;
            }
            setIs2FAEnabled(true);
            setShow2FASetup(false);
            setVerifyCode('');
            setTwoFAMessage('✅ เปิดใช้งาน 2FA สำเร็จ!');
            await refreshUser();
        } catch (e) {
            setTwoFAError('เกิดข้อผิดพลาด');
        } finally {
            setTwoFALoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (disableCode.length !== 6) {
            setTwoFAError('กรุณากรอกรหัส 6 หลัก');
            return;
        }
        setTwoFALoading(true);
        setTwoFAError('');
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await authFetch(`${API_URL}/api/auth/2fa/disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: disableCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setTwoFAError(data.detail || 'รหัสไม่ถูกต้อง');
                return;
            }
            setIs2FAEnabled(false);
            setShowDisable2FA(false);
            setDisableCode('');
            setTwoFAMessage('ปิดการใช้งาน 2FA เรียบร้อยแล้ว');
            await refreshUser();
        } catch (e) {
            setTwoFAError('เกิดข้อผิดพลาด');
        } finally {
            setTwoFALoading(false);
        }
    };

    const textSize = isLarge ? 'text-2xl' : 'text-base';
    const titleSize = isLarge ? 'text-4xl' : 'text-3xl';
    const headingSize = isLarge ? 'text-3xl font-extrabold' : 'text-xl font-bold';

    return (
        <div className={`min-h-screen bg-transparent transition-all duration-300 ${textSize}`}>
            <div className="flex min-h-screen">
                <Sidebar activePage="settings" />

                <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900 overflow-y-auto h-screen relative custom-scrollbar transition-colors duration-300">
                    {/* Top AppBar */}
                    <header className="sticky top-0 z-30 flex justify-between items-center pl-16 pr-4 md:px-12 w-full h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-700/30 shrink-0">
                        <div className="flex items-center space-x-4">
                            <span className="font-headline-md text-xl md:text-2xl font-bold text-primary dark:text-indigo-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-3xl">settings</span>
                                Settings
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <UserMenu />
                        </div>
                    </header>

                    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 space-y-12 animate-slide-up">
                        {/* Welcome Header */}
                        <section className="space-y-2">
                            <h2 className="font-display-lg text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">Manage Your Account</h2>
                            <p className="font-body-lg text-slate-500 dark:text-slate-400 leading-relaxed text-base">
                                Customize your EasyPrompt experience to match your unique workflow and accessibility needs.
                            </p>
                        </section>

                        {/* Profile Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                                <h3 className={`${headingSize} text-slate-800 dark:text-white`}>Profile</h3>
                            </div>
                            <div className="glass-panel-heavy p-8 rounded-3xl space-y-8 shadow-sm">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative group shrink-0">
                                        <Image 
                                            alt="Profile Large"
                                            className="w-32 h-32 rounded-3xl object-cover shadow-xl group-hover:opacity-85 transition-opacity"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrW-GAMoz4mQlSKchVGH5TICEz0Fr5EVg3oNcqHNbWMTx00u4j9vOLIirm76JdmtVavy3sz23fRj24IRuk926F2BPlBVzYWcDW0GvsOdf0GRarwfefXUf_8VZ-zJ2M5AxDzcvahET7adTE-6s8LduRglPC9SPxVzKLtszdXBxPpXih1qD_pd-udlcF8gyZxt6OUggtTSUxPM4U88hA3blUN1FCLi2J-4Iq0Sl3G5LjyzWtWwl1D1JdVXgHClMEiCvKvWaL-82M48g"
                                            width={128}
                                            height={128}
                                        />
                                        <button className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                    </div>
                                    <div className="flex-1 w-full space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="font-label-sm text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => handleFieldChange(setFullName, e.target.value)}
                                                    className="w-full h-12 px-4 rounded-xl bg-slate-100/60 border border-slate-200/50 focus:bg-white focus:border-primary outline-none transition-all font-body-md text-slate-800 dark:text-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label-sm text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => handleFieldChange(setEmail, e.target.value)}
                                                    className="w-full h-12 px-4 rounded-xl bg-slate-100/60 border border-slate-200/50 focus:bg-white focus:border-primary outline-none transition-all font-body-md text-slate-800 dark:text-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="font-label-sm text-xs font-bold text-slate-500 uppercase tracking-wider">Default Tone</label>
                                                <select
                                                    value={defaultTone}
                                                    onChange={(e) => handleFieldChange(setDefaultTone, e.target.value)}
                                                    className="w-full h-12 px-4 rounded-xl bg-slate-100/60 border border-slate-200/50 focus:bg-white focus:border-primary outline-none transition-all font-body-md text-slate-800 dark:text-white"
                                                >
                                                    <option value="ทั่วไป">ทั่วไป (General)</option>
                                                    <option value="ทางการ">ทางการ (Formal)</option>
                                                    <option value="เป็นกันเอง">เป็นกันเอง (Casual)</option>
                                                    <option value="สนุกสนาน">สนุกสนาน (Fun)</option>
                                                    <option value="กระชับ">กระชับ (Concise)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Password Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                <h3 className={`${headingSize} text-slate-800 dark:text-white`}>Change Password</h3>
                            </div>
                            <div className="glass-panel-heavy p-8 rounded-3xl space-y-6 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="font-label-sm text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full md:w-1/2 h-12 px-4 rounded-xl bg-slate-100/60 border border-slate-200/50 focus:bg-white focus:border-primary outline-none transition-all font-body-md text-slate-800 dark:text-white block"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-label-sm text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-100/60 border border-slate-200/50 focus:bg-white focus:border-primary outline-none transition-all font-body-md text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-label-sm text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-100/60 border border-slate-200/50 focus:bg-white focus:border-primary outline-none transition-all font-body-md text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handlePasswordSave}
                                        disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                                        className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:brightness-110 hover-spring disabled:opacity-50 transition-all shadow-md"
                                    >
                                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Accessibility Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                                <h3 className={`${headingSize} text-slate-800 dark:text-white`}>Accessibility</h3>
                            </div>
                            <div className="glass-panel-heavy p-8 rounded-3xl space-y-8 shadow-sm">
                                
                                {/* Font Size Toggle */}
                                <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                    <div className="space-y-1">
                                        <p className="font-body-lg font-bold text-primary dark:text-indigo-400">Large Text (ขนาดตัวอักษรใหญ่)</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">ปรับขนาดตัวอักษรทั้งหมดในระบบให้มีขนาดใหญ่ขึ้นเพื่อให้อ่านง่าย</p>
                                    </div>
                                    <FontSizeToggle isLarge={isLarge} onToggle={toggleFontSize} size="md" />
                                </div>

                                {/* Voice Navigation */}
                                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-800 dark:text-white">Voice Control (ควบคุมด้วยเสียง)</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">เปิดใช้งานไมโครโฟนสำหรับการป้อนข้อมูลและค้นหาเซสชันคำสั่งด้วยเสียงพูด</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePreference('voice_control', setVoiceControl, voiceControl)}
                                        role="switch" aria-checked={voiceControl}
                                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none hover-spring ${voiceControl ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${voiceControl ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* TTS Voice Selection */}
                                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-800 dark:text-white">Reading Voice (เสียงอ่านข้อความ)</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">เลือกเสียงสำหรับระบบอ่านออกเสียงอัตโนมัติ (TTS)</p>
                                    </div>
                                    <select
                                        value={selectedVoiceURI}
                                        onChange={(e) => {
                                            setSelectedVoiceURI(e.target.value);
                                            localStorage.setItem('preferred_voice', e.target.value);
                                        }}
                                        className="w-48 h-10 px-3 rounded-xl bg-slate-100/60 border border-slate-200/50 focus:bg-white focus:border-primary outline-none transition-all font-body-md text-slate-800 dark:text-white"
                                    >
                                        <option value="">-- เลือกเสียง --</option>
                                        {voices.map(voice => (
                                            <option key={voice.voiceURI} value={voice.voiceURI}>
                                                {voice.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* High Contrast Toggle */}
                                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-800 dark:text-white">High Contrast (สีตัดกันสูง)</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">เพิ่มความชัดเจนของข้อความและปุ่ม ลดความล้าของสายตา</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleHighContrast}
                                        role="switch" aria-checked={isHighContrast}
                                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isHighContrast ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isHighContrast ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Simplified UI Toggle */}
                                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-800 dark:text-white">Simplified UI (ซ่อนเมนูขั้นสูง)</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">แสดงเฉพาะฟังก์ชันที่จำเป็นและลดความซับซ้อนของหน้าจอ</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleSimplifiedUI}
                                        role="switch" aria-checked={isSimplifiedUI}
                                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isSimplifiedUI ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSimplifiedUI ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Security Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                                <h3 className={`${headingSize} text-slate-800 dark:text-white`}>Security</h3>
                            </div>
                            <div className="glass-panel-heavy p-8 rounded-3xl space-y-6 shadow-sm">
                                
                                {/* 2FA Messages */}
                                {twoFAMessage && (
                                    <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-slide-up">
                                        <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{twoFAMessage}</p>
                                        <button onClick={() => setTwoFAMessage('')} className="ml-auto text-emerald-400 hover:text-emerald-600">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                )}
                                {twoFAError && (
                                    <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl animate-slide-up">
                                        <span className="material-symbols-outlined text-rose-500">error</span>
                                        <p className="text-rose-600 dark:text-rose-400 font-semibold text-sm">{twoFAError}</p>
                                        <button onClick={() => setTwoFAError('')} className="ml-auto text-rose-400 hover:text-rose-600">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                )}

                                {/* Two-Factor Authentication */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${is2FAEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                                <span className="material-symbols-outlined">{is2FAEnabled ? 'verified_user' : 'password'}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 dark:text-white">Two-Factor Authentication (2FA)</p>
                                                    {is2FAEnabled && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">Active</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm">เพิ่มชั้นความปลอดภัยด้วย Google Authenticator หรือ Authy</p>
                                            </div>
                                        </div>
                                        {!is2FAEnabled && !show2FASetup && (
                                            <button
                                                type="button"
                                                onClick={handleSetup2FA}
                                                disabled={twoFALoading}
                                                className="px-5 py-2 rounded-xl transition-all font-bold text-sm border bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-50 cursor-pointer hover-spring"
                                            >
                                                {twoFALoading ? 'Loading...' : 'เปิดใช้งาน'}
                                            </button>
                                        )}
                                        {is2FAEnabled && !showDisable2FA && (
                                            <button
                                                type="button"
                                                onClick={() => setShowDisable2FA(true)}
                                                className="px-5 py-2 rounded-xl transition-all font-bold text-sm border bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 cursor-pointer hover-spring"
                                            >
                                                ปิดการใช้งาน
                                            </button>
                                        )}
                                    </div>

                                    {/* 2FA Setup Flow — QR Code */}
                                    {show2FASetup && !is2FAEnabled && (
                                        <div className="mt-4 p-6 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 space-y-5 animate-slide-up">
                                            <div className="flex flex-col items-center gap-4">
                                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
                                                    สแกน QR Code ด้วย Google Authenticator หรือ Authy
                                                </p>
                                                {qrCodeBase64 && (
                                                    <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                                                        <Image src={qrCodeBase64} alt="2FA QR Code" className="w-48 h-48" width={192} height={192} unoptimized={true} />
                                                    </div>
                                                )}
                                                <div className="w-full max-w-sm space-y-2">
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center">หรือกรอก Secret Key ด้วยตนเอง:</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all text-center border border-slate-200 dark:border-slate-700">
                                                            {totpSecret}
                                                        </code>
                                                        <button
                                                            onClick={() => { navigator.clipboard.writeText(totpSecret); }}
                                                            className="shrink-0 p-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                            title="คัดลอก"
                                                        >
                                                            <span className="material-symbols-outlined text-sm text-slate-600 dark:text-slate-400">content_copy</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">กรอกรหัส 6 หลักเพื่อยืนยัน:</p>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        value={verifyCode}
                                                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="000000"
                                                        className="w-40 h-12 text-center text-xl font-bold tracking-[0.5em] rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 focus:border-primary outline-none transition-all text-slate-800 dark:text-white"
                                                    />
                                                    <button
                                                        onClick={handleVerify2FA}
                                                        disabled={twoFALoading || verifyCode.length !== 6}
                                                        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-md cursor-pointer hover-spring"
                                                    >
                                                        {twoFALoading ? '...' : 'ยืนยัน'}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => { setShow2FASetup(false); setVerifyCode(''); setTwoFAError(''); }}
                                                    className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    ยกเลิก
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2FA Disable Flow */}
                                    {showDisable2FA && is2FAEnabled && (
                                        <div className="mt-4 p-6 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/50 dark:border-rose-800/50 space-y-4 animate-slide-up">
                                            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">กรอกรหัส 6 หลักจาก Authenticator เพื่อยืนยันการปิด 2FA:</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={disableCode}
                                                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="000000"
                                                    className="w-40 h-12 text-center text-xl font-bold tracking-[0.5em] rounded-xl bg-white dark:bg-slate-800 border-2 border-rose-200 dark:border-rose-700 focus:border-rose-500 outline-none transition-all text-slate-800 dark:text-white"
                                                />
                                                <button
                                                    onClick={handleDisable2FA}
                                                    disabled={twoFALoading || disableCode.length !== 6}
                                                    className="px-6 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all shadow-md cursor-pointer hover-spring"
                                                >
                                                    {twoFALoading ? '...' : 'ปิด 2FA'}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => { setShowDisable2FA(false); setDisableCode(''); setTwoFAError(''); }}
                                                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Biometric Authentication (UI placeholder) */}
                                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100">
                                            <span className="material-symbols-outlined">fingerprint</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">Biometric Authentication</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">ใช้งาน TouchID หรือ FaceID สำหรับเข้าสู่ระบบด่วน</p>
                                            <p className="text-amber-500 text-xs font-semibold mt-0.5">⚠️ ต้องใช้ HTTPS — จะเปิดใช้เมื่อ Deploy ระบบจริง</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled
                                        className="px-5 py-2 rounded-xl transition-all font-bold text-sm border bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 cursor-not-allowed opacity-60"
                                    >
                                        Requires HTTPS
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Notifications Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                                <h3 className={`${headingSize} text-slate-800 dark:text-white`}>Notifications</h3>
                            </div>
                            <div className="glass-panel-heavy p-8 rounded-3xl space-y-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">Email updates for new AI models</p>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePreference('email_notifications', setEmailNotifications, emailNotifications)}
                                        role="switch" aria-checked={emailNotifications}
                                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none hover-spring ${emailNotifications ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailNotifications ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">Desktop push notifications</p>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePreference('push_notifications', setPushNotifications, pushNotifications)}
                                        role="switch" aria-checked={pushNotifications}
                                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none hover-spring ${pushNotifications ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pushNotifications ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">Weekly performance reports</p>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePreference('weekly_reports', setWeeklyReports, weeklyReports)}
                                        role="switch" aria-checked={weeklyReports}
                                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none hover-spring ${weeklyReports ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${weeklyReports ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sticky Save Banner */}
                    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 md:left-[calc(50%+128px)] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-8 transition-all duration-500 z-50 ${
                        hasUnsavedChanges ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'
                    }`}>
                        <p className="font-body-md text-sm whitespace-nowrap font-semibold">You have unsaved changes</p>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleDiscard}
                                className="px-4 py-2 text-xs font-bold hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            >
                                Discard
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 shadow-lg active:scale-95 transition-all cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Footer Component */}
                    <footer className="flex flex-col md:flex-row justify-between items-center w-full py-8 px-6 md:px-12 bg-white dark:bg-slate-900 border-t border-outline-variant/20 dark:border-slate-800 gap-6 mt-auto shrink-0">
                        <p className="text-slate-400 text-xs font-semibold">© {new Date().getFullYear()} EasyPrompt AI. High-Tech Accessibility.</p>
                        <div className="flex flex-wrap justify-center gap-8 text-xs font-bold text-slate-500">
                            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-primary transition-colors">Accessibility Statement</a>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
