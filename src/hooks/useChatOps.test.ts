/**
 * @vitest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatOps, chatService } from './useChatOps';

// Mock API Service
vi.mock('./useChatOps', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./useChatOps')>();
    return {
        ...actual,
        chatService: {
            fetchModels: vi.fn(),
            selectModel: vi.fn(),
        }
    };
});

describe('useChatOps Hook (Logic Validation)', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        (chatService.fetchModels as any).mockResolvedValue({
            models: [
                { name: 'gemini-1.5-flash', displayName: 'Flash', description: 'Fast' },
                { name: 'gemini-1.5-pro', displayName: 'Pro', description: 'Smart' }
            ],
            currentModel: 'gemini-1.5-flash'
        });
    });

    it('초기 상태 및 메시지 검증', () => {
        const { result } = renderHook(() => useChatOps());
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].role).toBe('ai');
    });

    it('모델 자동 선택 및 목록 동기화 검증', async () => {
        const { result } = renderHook(() => useChatOps('invalid-model'));
        
        await waitFor(() => {
            expect(chatService.fetchModels).toHaveBeenCalled();
            // 목록에 없는 모델일 경우 첫 번째 모델(flash)로 자동 전환 확인
            expect(result.current.currentModel).toBe('gemini-1.5-flash');
        });
    });

    it('세션 히스토리 생성 및 보존 검증', async () => {
        const { result } = renderHook(() => useChatOps());
        
        // 1. 대화 진행
        act(() => {
            result.current.setMessages([
                { role: 'ai', content: 'system message' },
                { role: 'user', content: 'test user query' }
            ]);
        });

        // 2. 새 세션 생성 버튼 클릭
        act(() => {
            result.current.createNewSession();
        });

        // 3. 검증
        expect(result.current.sessions).toHaveLength(1);
        expect(result.current.sessions[0].title).toBe('test user query');
        expect(result.current.messages).toHaveLength(1); // 초기화됨
        expect(result.current.messages[0].content).toContain('세션이 초기화되었습니다');
    });

    it('히스토리에서 세션 로드 시 상태 복구 검증', () => {
        const { result } = renderHook(() => useChatOps());
        const mockSession = {
            id: 'session-999',
            title: 'Refactored Session',
            messages: [{ role: 'user', content: 'refactoring logic' } as const],
            model: 'gemini-1.5-pro',
            timestamp: new Date()
        };

        act(() => {
            result.current.loadSession(mockSession);
        });

        expect(result.current.messages).toEqual(mockSession.messages);
        expect(result.current.currentModel).toBe('gemini-1.5-pro');
        expect(result.current.currentSessionId).toBe('session-999');
    });
});
