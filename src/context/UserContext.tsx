import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

/**
 * 사용자 정보 인터페이스 (v3.8 확장 필드 포함)
 */
export interface User {
    id: string;
    username: string;
    name: string;
    email?: string;
    department?: string;
    role: 'admin' | 'user';
    tier?: 'Baseline' | 'Performance' | 'Apex';
}

interface UserContextType {
    user: User | null;
    isLoggedIn: boolean;
    tier: 'Baseline' | 'Performance' | 'Apex';
    login: (username: string, pw: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateTier: (newTier: 'Baseline' | 'Performance' | 'Apex') => void;
    updateLocalUser: (data: Partial<User>) => void; // [추가] 로컬 상태 갱신용
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tier, setTier] = useState<'Baseline' | 'Performance' | 'Apex'>('Baseline');

    useEffect(() => {
        const savedUser = localStorage.getItem('repoinsight_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            const savedTier = localStorage.getItem('repoinsight_tier');
            if (savedTier) setTier(savedTier as any);
        }
    }, []);

    const login = async (username: string, pw: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: pw })
            });

            const data = await res.json();

            if (res.ok) {
                const userData: User = { 
                    ...data.user, 
                    tier: 'Apex' 
                };
                setUser(userData);
                setTier('Apex');
                localStorage.setItem('repoinsight_user', JSON.stringify(userData));
                localStorage.setItem('repoinsight_tier', 'Apex');
                return { success: true };
            }
            return { success: false, error: data.error || '로그인에 실패했습니다.' };
        } catch (e) {
            return { success: false, error: '서버 연결에 실패했습니다.' };
        }
    };

    const logout = () => {
        setUser(null);
        setTier('Baseline');
        localStorage.removeItem('repoinsight_user');
        localStorage.removeItem('repoinsight_tier');
    };

    const updateTier = (newTier: 'Baseline' | 'Performance' | 'Apex') => {
        setTier(newTier);
        localStorage.setItem('repoinsight_tier', newTier);
    };

    const updateLocalUser = (data: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem('repoinsight_user', JSON.stringify(updated));
    };

    const isLoggedIn = !!user;

    return (
        <UserContext.Provider value={{ user, isLoggedIn, tier, login, logout, updateTier, updateLocalUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
