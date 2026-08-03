'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';

type User = {
    id: number;
    username: string;
    email?: string | null;
    full_name: string | null;
    role: string;
    organization?: string;
    default_tone?: string;
    is_2fa_enabled?: boolean;
    credits?: number;
    is_premium?: boolean;
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
    socialLogin: (idToken: string) => Promise<void>;
    register: (username: string, password: string, fullName: string, organization?: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const [activeWorkspace, setActiveWorkspace] = useState<string>('ทั่วไป');

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const openLoginModal = React.useCallback(() => {
        setIsLoginModalOpen(true);
    }, []);
    const closeLoginModal = React.useCallback(() => {
        setIsLoginModalOpen(false);
    }, []);

    const logout = React.useCallback(() => {
        setUser(null);
        setToken(null);
        setActiveWorkspace('ทั่วไป');
        localStorage.removeItem('ep_token');
        localStorage.removeItem('ep_user');
        localStorage.removeItem('ep_onboarding_completed');
        localStorage.removeItem('ep_session_id');
    }, []);

    useEffect(() => {
        // Load token and user from localStorage on mount
        const storedToken = localStorage.getItem('ep_token');
        const storedUser = localStorage.getItem('ep_user');

        if (!storedToken || !storedUser) {
            setIsLoading(false);
            return;
        }

        setToken(storedToken);
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setActiveWorkspace(parsedUser.organization || 'ทั่วไป');
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
        }

        // The cached profile only proves we were logged in once — confirm the
        // token is still accepted by the server, otherwise every protected
        // page would keep rendering a "logged in" UI while every API call
        // silently 401s underneath it. Only a confirmed 401 forces logout;
        // network hiccups keep the cached session so the user isn't kicked
        // out just because the backend was briefly unreachable.
        api.get<any>('/api/auth/me', storedToken)
            .then((data) => {
                setUser(data);
                setActiveWorkspace(data.organization || 'ทั่วไป');
                localStorage.setItem('ep_user', JSON.stringify(data));
            })
            .catch((err: any) => {
                if (err?.status === 401) {
                    logout();
                }
            })
            .finally(() => setIsLoading(false));
    }, [logout]);

    const claimGuestSession = async (accessToken: string) => {
        if (typeof window !== 'undefined') {
            const currentSid = localStorage.getItem('ep_session_id');
            if (currentSid) {
                try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                    await fetch(`${API_URL}/api/history/session/${currentSid}/claim`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (e) {
                    console.error("Failed to claim guest session:", e);
                }
            }
        }
    };

    const login = async (username: string, password: string) => {
        const data = await api.post<any>('/api/auth/login', { username, password });

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
        localStorage.removeItem('ep_guest_usage_count');
        setIsLoginModalOpen(false);
        await claimGuestSession(data.access_token);
    };

    const login2fa = async (username: string, totpCode: string) => {
        const data = await api.post<any>('/api/auth/login/2fa', { username, totp_code: totpCode });
        setToken(data.access_token);
        setUser(data.user);
        setActiveWorkspace(data.user.organization || 'ทั่วไป');
        localStorage.setItem('ep_token', data.access_token);
        localStorage.setItem('ep_user', JSON.stringify(data.user));
        localStorage.removeItem('ep_guest_usage_count');
        setIsLoginModalOpen(false);
        await claimGuestSession(data.access_token);
    };

    const socialLogin = async (idToken: string) => {
        const data = await api.post<any>('/api/auth/social-login', { id_token: idToken });
        setToken(data.access_token);
        setUser(data.user);
        setActiveWorkspace(data.user.organization || 'ทั่วไป');
        localStorage.setItem('ep_token', data.access_token);
        localStorage.setItem('ep_user', JSON.stringify(data.user));
        localStorage.removeItem('ep_guest_usage_count');
        setIsLoginModalOpen(false);
        await claimGuestSession(data.access_token);
    };

    const register = async (username: string, password: string, fullName: string, organization: string = 'ทั่วไป') => {
        await api.post('/api/auth/register', { username, password, full_name: fullName, organization });
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

        // Add X-Workspace header for Multi-tenant isolation
        if (activeWorkspace) {
            headers.set('X-Workspace', encodeURIComponent(activeWorkspace));
        }
        
        return fetch(url, {
            ...options,
            headers
        });
    }, [token, activeWorkspace]);

    const refreshUser = async () => {
        try {
            const data = await api.get<any>('/api/auth/me');
            setUser(data);
            localStorage.setItem('ep_user', JSON.stringify(data));
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
            socialLogin,
            register,
            logout,
            refreshUser,
            authFetch,
            isLoginModalOpen,
            openLoginModal,
            closeLoginModal
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
