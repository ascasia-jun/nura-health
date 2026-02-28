# 개발 맥락 노트 (context_notes.md)

이 문서는 Nura Health AI-DLC 서비스 개발 프로젝트의 주요 기술적 맥락과 주의사항을 기록합니다.

## 1. 핵심 목표
*   **From:** 시각적 컨셉을 소개하는 '정적 데모(Static Demo)' 웹사이트
*   **To:** 실제 사용자 데이터와 상호작용하여 개인화된 가치를 제공하는 '동적 서비스(Live Service)'
*   **원칙:** `dev_guide.md`에 명시된 7단계 자동화 프로세스와 개발 원칙을 모든 과정에서 준수한다.

## 2. 주요 수정 대상 파일 (Frontend)
*   `src/sections/Features.tsx`: 정적 애니메이션을 제거하고, 백엔드 API와 연동하여 실시간 데이터를 표시하도록 대대적인 수정이 필요합니다. (완료: `DiagnosticShufflerCard`, `TelemetryTypewriterCard` API 연동됨)
*   `src/sections/Protocols.tsx`: 기존의 스크롤 기반 정적 카드 UI는 'AI 진단/처방' 기능을 시작하는 UI(Wizard)를 보여주는 역할로 변경되거나 대체됩니다.
*   `src/sections/Membership.tsx`: 각 등급의 '신청' 버튼이 실제 기능 접근 권한과 연동되도록 사용자 인증 상태에 따른 조건부 렌더링 로직이 추가되어야 합니다.
*   `src/App.tsx`: 사용자 로그인 상태 및 라우팅(필요시) 관리를 위한 로직이 추가될 수 있습니다.

## 3. 주요 신규 생성 파일
*   `src/components/ProtocolGeneratorWizard.tsx`: 사용자가 AI에게 프로젝트 문제를 설명하는 다단계 입력 UI 컴포넌트. (완료: API 연동 및 결과 렌더링 구현)
*   `src/components/AICompanionChat.tsx`: 사용자와 대화형으로 상호작용하는 플로팅 챗봇 UI 컴포넌트. (완료: 파일 경로 수정 및 정상 배치)
*   `backend/` (신규 디렉토리): Node.js 또는 Python 기반의 백엔드 서버 관련 파일 일체.
    *   `backend/src/services/geminiService.ts`: Gemini API와 직접 통신하는 로직 담당.
    *   `backend/src/routes/api.ts`: 프론트엔드와 통신할 API 엔드포인트 정의.

## 4. 기술 스택 (Tech Stack)
*   **Frontend (기존):** React, TypeScript, Vite, GSAP, Tailwind CSS
*   **Backend (신규 도입 필요):**
    *   **언어/프레임워크:** Node.js with Express/Fastify 또는 Python with FastAPI
    *   **데이터베이스:** PostgreSQL, MySQL, 또는 MongoDB (프로젝트 성격에 따라 선택)
*   **AI:** Google Gemini API

## 5. 주요 의존성 (Dependencies)
*   **상태 관리:** 복잡해질 클라이언트 상태(사용자 정보, API 응답 등)를 효율적으로 관리하기 위해 `Zustand` 또는 `Recoil` 도입을 적극 고려합니다.
*   **데이터 페칭:** API 통신을 위해 `axios` 또는 `react-query` 사용을 표준으로 합니다.

## 6. 진행 상황 (Progress Log)
*   **Phase 2:** `Features.tsx` 대시보드 컴포넌트가 백엔드 API(`/api/metrics`, `/api/diagnose`)와 연동되어 실시간 데이터를 표시하도록 수정됨.
*   **Phase 3:** `ProtocolGeneratorWizard.tsx` 컴포넌트가 사용자 입력을 받아 API로 전송하고, AI 진단 결과를 화면에 표시하는 기능 구현 완료.
*   **Phase 4:** `AICompanionChat.tsx` 컴포넌트 구현 완료. (백엔드 서버 실행 시 정상 동작 확인 가능)
*   **Phase 5:** 전역 상태(`UserContext`) 도입 완료. 멤버십 등급에 따른 기능 잠금(Lock) 및 해제 로직이 `Features`, `AICompanionChat`, `ProtocolGeneratorWizard`에 모두 적용됨.
*   **완료:** 모든 Phase 개발 완료 및 최종 점검 종료.
*   **추가:** 로그인 기능(`LoginModal`, `UserContext` 업데이트) 및 ChatOps 연동 구현 완료.
