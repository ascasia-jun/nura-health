import React, { createContext, useContext, useState, type ReactNode } from 'react';

// 멤버십 등급 타입 정의
export type Tier = 'Free' | 'Baseline' | 'Performance' | 'Apex';

// UserContext의 상태 인터페이스 정의
interface UserContextType {
    tier: Tier; // 현재 사용자의 멤버십 등급
    setTier: (tier: Tier) => void; // 멤버십 등급을 변경하는 함수
    login: (id: string, pw: string) => boolean; // 로그인 함수
    logout: () => void; // 로그아웃 함수
    isLoggedIn: boolean; // 로그인 여부
}

// Context 생성 (초기값은 undefined)
const UserContext = createContext<UserContextType | undefined>(undefined);

// UserProvider 컴포넌트: 앱 전체에 사용자 상태를 공급합니다.
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 초기 상태는 'Free'로 설정하여 기능 잠금 상태를 시뮬레이션합니다.
    const [tier, setTier] = useState<Tier>('Free');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const login = (id: string, pw: string) => {
        // 간단한 하드코딩 인증 로직 (데모용)
        if (id === 'admin' && pw === 'admin') {
            setIsLoggedIn(true);
            setTier('Apex'); // 로그인 시 최고 등급 부여
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsLoggedIn(false);
        setTier('Free');
    };

    return (
        <UserContext.Provider value={{ tier, setTier, login, logout, isLoggedIn }}>
            {children}
        </UserContext.Provider>
    );
};

// useUser 커스텀 훅: UserContext를 쉽게 사용할 수 있도록 합니다.
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};