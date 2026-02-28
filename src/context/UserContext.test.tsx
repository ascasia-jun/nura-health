/*
// 테스트를 실행하려면 다음 패키지를 설치해야 합니다: npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
// import { render, screen, fireEvent } from '@testing-library/react';
import { UserProvider, useUser } from './UserContext';
// import { describe, it, expect } from 'vitest';

// 테스트용 컴포넌트
const TestComponent = () => {
    const { tier, setTier } = useUser();
    return (
        <div>
            <span data-testid="current-tier">{tier}</span>
            <button onClick={() => setTier('Apex')}>Upgrade to Apex</button>
        </div>
    );
};

describe('UserContext', () => {
    it('기본 등급은 Free여야 합니다', () => {
        render(
            <UserProvider>
                <TestComponent />
            </UserProvider>
        );
        expect(screen.getByTestId('current-tier').textContent).toBe('Free');
    });

    it('등급을 변경할 수 있어야 합니다', () => {
        render(
            <UserProvider>
                <TestComponent />
            </UserProvider>
        );
        
        const button = screen.getByText('Upgrade to Apex');
        fireEvent.click(button);
        
        expect(screen.getByTestId('current-tier').textContent).toBe('Apex');
    });
});
*/