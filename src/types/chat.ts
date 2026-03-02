/**
 * 채팅 시스템 공통 타입 정의
 */

export interface ChatPart {
    type: 'text' | 'thought' | 'tool_result';
    content: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    parts: ChatPart[];
    timestamp: Date;
    model?: string;
    // [v3.4] UI 시각화를 위한 메타데이터 추가
    meta?: {
        activeSkillId?: string | null;
        selectedHooks?: string[];
        attachedResources?: any[];
    };
}

export interface AIModel {
    name: string;
    displayName: string;
    description: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    model: string;
    timestamp: Date;
    draftInput?: string;
    isLoading?: boolean;
}

// [중요] Vite 모듈 시스템에서 이 파일이 '타입 전용'이 아님을 명시하기 위한 구체적인 값 내보내기
export const CHAT_MODULE_LOADED = true;
