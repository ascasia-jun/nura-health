# GEMINI.md - RepoInsight (Dev Lifecycle Intelligence)

이 파일은 **RepoInsight** 프로젝트의 구조, 기술 스택, 개발 컨벤션 및 AI 에이전트 협업 가이드를 정의합니다. 모든 AI 에이전트는 이 지침을 최우선으로 준수해야 합니다.

## 1. 프로젝트 개요 (Project Overview)

**RepoInsight**는 Git 기반 리포지토리를 정밀 분석하여 프로젝트의 건강 상태를 진단하고 최적화 프로토콜을 제공하는 **자율형 AI-DLC 플랫폼**입니다.

- **미션**: 개발 생명주기 전반에 걸쳐 데이터 기반의 통찰력을 제공하여 기술 부채를 줄이고 품질을 극대화함.
- **핵심 모듈**:
    - **자율형 에이전트**: 최대 30회의 반복 사고(Iteration)를 통한 심층 분석.
    - **Skills 시스템**: 전문화된 도메인 지식(보안, 리팩토링 등)을 동적으로 로드.
    - **인터랙티브 컨텍스트**: PR, 커밋, 파일을 배지 형태로 부착하여 정밀 분석 요청.

## 2. 기술 스택 (Tech Stack)

### 프론트엔드 (Frontend)
- **Framework**: React 19 (Vite)
- **State Management**: React Context (`UserContext`), Custom Hooks (`useChatOps`)
- **Styling**: Tailwind CSS 4 (`@tailwindcss/vite`)
- **Animation**: GSAP, `@gsap/react`

### 백엔드 (Backend)
- **Runtime**: Node.js
- **Framework**: Express (TypeScript)
- **AI Engine**: Google Gemini API (Vertex AI 규격 준수)
- **Skills Storage**: `backend/src/skills/*.md` (Markdown 기반 지식 베이스)

## 3. 개발 컨벤션 (Conventions)

### 언어 및 주석
- **소통 및 주석**: 모든 소통, 로직 설명, 코드 주석은 반드시 **한국어**로 작성합니다.
- **명명 규칙**: 변수 및 함수명은 영문 표준(CamelCase)을 따릅니다.

### PDCA 워크플로우 (Core Methodology)
모든 신규 기능 추가 및 버그 수정은 아래 순서를 엄격히 따릅니다.
1. **Plan**: `docs/01-plan/`에 기획 문서 작성.
2. **Design**: `docs/02-design/`에 아키텍처 및 UI 설계서 작성.
3. **Do**: 실제 코드 구현 및 테스트.
4. **Check**: `gap-detector` 에이전트를 통한 설계-구현 일치도 분석.
5. **Act (Iterate)**: 매치율 90% 미만 시 자동 개선 루프 실행.
6. **Report**: `docs/04-report/`에 최종 완료 보고서 생성.

### 방어적 프로그래밍 (Defensive Coding)
- 메시지 데이터(`parts` 배열) 접근 시 반드시 옵셔널 체이닝(`?.`) 및 널 체크를 적용하여 백화 현상을 방지합니다.
- 스트리밍 수신 시 `lineBuffer` 시스템을 사용하여 불완전한 청크 데이터 유실을 차단합니다.

## 4. 주요 파일 구조 (Key Directory Structure)

- `src/`: 프론트엔드 소스
    - `components/Chat/`: 공통 채팅 UI 컴포넌트 (`ProcessNode`, `MarkdownRenderer` 등)
    - `hooks/`: 비즈니스 로직 훅 (`useChatOps`)
    - `types/`: 전역 타입 정의 (`chat.ts`)
- `backend/src/`: 백엔드 소스
    - `routes/api.ts`: API 엔드포인트 및 에이전트 루프 제어
    - `services/`: 외부 연동 서비스 (`geminiService`, `githubService`)
    - `skills/`: 전문 지식 마크다운 저장소
- `docs/`: 프로젝트 PDCA 산출물 전용 저장소

---
*Powered by bkit Methodology & RepoInsight Autonomous Lab.*
