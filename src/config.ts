/**
 * config.ts
 * 
 * 프론트엔드 전역 설정을 관리합니다.
 * API 주소 및 기타 환경 변수들을 통합하여 관리하기 위한 파일입니다.
 */

// 백엔드 API 서버 주소
// 개발 시에는 http://localhost:3001을 사용하며, 배포 시 환경 변수(VITE_API_URL)로 대체 가능합니다.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API 엔드포인트 상수화
export const API_ENDPOINTS = {
    METRICS: `${API_URL}/api/metrics`,
    DIAGNOSE: `${API_URL}/api/diagnose`,
    CHAT: `${API_URL}/api/chat`,
    CHAT_STREAM: `${API_URL}/api/chat/stream`, // 스트리밍 대화 엔드포인트 추가
};
