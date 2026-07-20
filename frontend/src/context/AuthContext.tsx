'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
    const [activeWorkspace, setActiveWorkspace] = useState<string>('ทั่วไป');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

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
    };

    const login2fa = async (username: string, totpCode: string) => {
        const data = await api.post<any>('/api/auth/login/2fa', { username, totp_code: totpCode });
        setToken(data.access_token);
        setUser(data.user);
        setActiveWorkspace(data.user.organization || 'ทั่วไป');
        localStorage.setItem('ep_token', data.access_token);
        localStorage.setItem('ep_user', JSON.stringify(data.user));
    };

    const socialLogin = async (idToken: string) => {
        const data = await api.post<any>('/api/auth/social-login', { id_token: idToken });
        setToken(data.access_token);
        setUser(data.user);
        setActiveWorkspace(data.user.organization || 'ทั่วไป');
        localStorage.setItem('ep_token', data.access_token);
        localStorage.setItem('ep_user', JSON.stringify(data.user));
    };

    const register = async (username: string, password: string, fullName: string, organization: string = 'ทั่วไป') => {
        await api.post('/api/auth/register', { username, password, full_name: fullName, organization });
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setActiveWorkspace('ทั่วไป');
        localStorage.removeItem('ep_token');
        localStorage.removeItem('ep_user');
        localStorage.removeItem('ep_onboarding_completed');
        localStorage.removeItem('ep_session_id');
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
