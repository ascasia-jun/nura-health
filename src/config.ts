/**
 * config.ts
 * 
 * 프론트엔드 전역 설정을 관리합니다.
 * API 주소 및 기타 환경 변수들을 통합하여 관리하기 위한 파일입니다.
 */

// 백엔드 API 서버 주소
// [v3.7] 외부 접속 지원: localhost 대신 현재 브라우저의 호스트 주소를 동적으로 사용하거나 환경 변수를 따릅니다.
const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    
    // 브라우저 환경에서 현재 호스트의 IP를 기반으로 백엔드 주소 생성
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:3001`;
    }
    
    return 'http://localhost:3001';
};

export const API_URL = getApiUrl();

// API 엔드포인트 상수화
export const API_ENDPOINTS = {
    METRICS: `${API_URL}/api/metrics`,
    DIAGNOSE: `${API_URL}/api/diagnose`,
    CHAT: `${API_URL}/api/chat`,
    CHAT_STREAM: `${API_URL}/api/chat/stream`,
};
