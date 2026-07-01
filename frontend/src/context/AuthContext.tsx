'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
    id: number;
    username: string;
    email?: string | null;
    full_name: string | null;
    role: string;
    organization?: string;
    default_tone?: string;
    is_2fa_enabled?: boolean;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    activeWorkspace: string;
    switchWorkspace: (workspace: string) => void;
    login: (username: string, password: string) => Promise<void>;
    login2fa: (username: string, totpCode: string) => Promise<void>;
    register: (username: string, password: string, fullName: string, organization?: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeWorkspace, setActiveWorkspace] = useState<string>('ทั่วไป');

    useEffect(() => {
        // Load token and user from localStorage on mount
        const storedToken = localStorage.getItem('ep_token');
        const storedUser = localStorage.getItem('ep_user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setActiveWorkspace(parsedUser.organization || 'ทั่วไป');
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || 'เข้าสู่ระบบล้มเหลว กรุณาตรวจสอบชื่อผู้ใช้หรือรหัสผ่าน');
        }

        const data = await response.json();

        // Check if 2FA is required
        if (data.requires_2fa) {
            const err = new Error('2FA_REQUIRED');
            (err as any).pendingUsername = data.pending_username;
            throw err;
        }

        setToken(data.access_token);
        setUser(data.user);
        setActiveWorkspace(data.user.organization || 'ทั่วไป');
        localStorage.setItem('ep_token', data.access_token);
        localStorage.setItem('ep_user', JSON.stringify(data.user));
    };

    const login2fa = async (username: string, totpCode: string) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${API_URL}/api/auth/login/2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, totp_code: totpCode }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || 'รหัสยืนยัน 2FA ไม่ถูกต้อง');
        }

        const data = await response.json();
        setToken(data.access_token);
        setUser(data.user);
        setActiveWorkspace(data.user.organization || 'ทั่วไป');
        localStorage.setItem('ep_token', data.access_token);
        localStorage.setItem('ep_user', JSON.stringify(data.user));
    };

    const register = async (username: string, password: string, fullName: string, organization: string = 'ทั่วไป') => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, full_name: fullName, organization }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || 'ลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง');
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setActiveWorkspace('ทั่วไป');
        localStorage.removeItem('ep_token');
        localStorage.removeItem('ep_user');
    };

    const switchWorkspace = (workspace: string) => {
        setActiveWorkspace(workspace);
    };

    const authFetch = React.useCallback(async (url: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers || {});
        
        // Use token from state if available, fallback to localStorage
        const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('ep_token') : null);
        
        if (activeToken) {
            headers.set('Authorization', `Bearer ${activeToken}`);
        }
        
        return fetch(url, {
            ...options,
            headers
        });
    }, [token]);

    const refreshUser = async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        try {
            const response = await authFetch(`${API_URL}/api/auth/me`);
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                localStorage.setItem('ep_user', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Failed to refresh user", e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoggedIn: !!user,
            isLoading,
            activeWorkspace,
            switchWorkspace,
            login,
            login2fa,
            register,
            logout,
            refreshUser,
            authFetch
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
