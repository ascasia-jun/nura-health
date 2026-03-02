import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

/**
 * 사용자 정보 인터페이스
 */
export interface User {
    id: string;
    username: string;
    name: string;
    tier?: 'Baseline' | 'Performance' | 'Apex';
}

interface UserContextType {
    user: User | null;
    isLoggedIn: boolean;
    tier: 'Baseline' | 'Performance' | 'Apex';
    login: (username: string, pw: string) => Promise<boolean>;
    logout: () => void;
    updateTier: (newTier: 'Baseline' | 'Performance' | 'Apex') => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tier, setTier] = useState<'Baseline' | 'Performance' | 'Apex'>('Baseline');

    // 세션 유지 (Local Storage)
    useEffect(() => {
        const savedUser = localStorage.getItem('repoinsight_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            const savedTier = localStorage.getItem('repoinsight_tier');
            if (savedTier) setTier(savedTier as any);
        }
    }, []);

    const login = async (username: string, pw: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: pw })
            });

            if (res.ok) {
                const data = await res.json();
                const userData: User = { 
                    ...data.user, 
                    tier: 'Apex' // 기본적으로 모든 기능을 사용할 수 있도록 고정 (또는 DB에서 가져옴)
                };
                setUser(userData);
                setTier('Apex');
                localStorage.setItem('repoinsight_user', JSON.stringify(userData));
                localStorage.setItem('repoinsight_tier', 'Apex');
                return true;
            }
            return false;
        } catch (e) {
            console.error('Login error:', e);
            return false;
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

    const isLoggedIn = !!user;

    return (
        <UserContext.Provider value={{ user, isLoggedIn, tier, login, logout, updateTier }}>
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
