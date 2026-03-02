# GEMINI.md - RepoInsight (Dev Lifecycle Intelligence Platform)

이 파일은 RepoInsight 프로젝트의 구조, 기술 스택, 개발 컨벤션 및 실행 방법을 정의합니다. 모든 AI 에이전트는 이 지침을 최우선으로 준수해야 합니다.

## 1. 프로젝트 개요 (Project Overview)

**RepoInsight**는 단순한 정적 데모를 넘어, 실제 사용자 데이터와 상호작용하며 개인화된 AI 진단 및 처방을 제공하는 **동적 AI-DLC(Development Life-Cycle) 플랫폼**입니다.

- **목표:** 개발 생명주기 전반에 걸쳐 AI 기반의 통찰력과 최적화 프로토콜을 제공.
- **주요 기능:**
    - **실시간 AI 대시보드:** AI 메트릭 시각화 및 실제 진단 데이터 스트리밍.
    - **AI 진단/처방 마법사:** 프로젝트 이슈 분석 및 맞춤형 해결 프로토콜 생성.
    - **AI 어시스턴트:** 실시간 질의응답 및 프로젝트 최적화 가이드를 제공하는 챗봇.
    - **동적 멤버십 시스템:** 등급(Baseline, Performance, Apex)에 따른 차별화된 기능 접근 권한.

## 2. 기술 스택 (Tech Stack)

### 프론트엔드 (Frontend)
- **Framework:** React 19 (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 (`@tailwindcss/vite`)
- **Animation:** GSAP, `@gsap/react`
- **Icons:** Lucide React

### 백엔드 (Backend)
- **Runtime:** Node.js (현재 기본), Python (데이터 분석 및 향후 확장용)
- **Framework:** Express (Node.js), FastAPI/Flask (Python 제안)
- **AI Integration:** Google Gemini API (현재 서비스 레이어에서 Mock 데이터 활용 중)
- **Visualization (Python):** Matplotlib, **koreanize-matplotlib** (한글 폰트 지원 필수)
- **Tools:** Nodemon, ts-node, dotenv, cors

## 3. 빌드 및 실행 (Building and Running)

프로젝트는 프론트엔드와 백엔드가 분리되어 있으며, 두 서버를 모두 실행해야 정상적으로 작동합니다.

### 백엔드 서버 실행 (Port: 3001)
```bash
cd repoinsight/backend
npm install
npm run dev
```

### 프론트엔드 서버 실행 (Port: 5173 - 기본값)
```bash
cd repoinsight
npm install
npm run dev
```

### 빌드 및 배포
- **Frontend:** `npm run build` (결과물: `dist/`)
- **Backend:** `npm run build` (결과물: `backend/dist/`)

## 4. 개발 컨벤션 (Development Conventions)

### 언어 및 주석 (Language & Comments)
- **모든 소통은 한국어:** 응답, 로직 설명, 구조 제안은 반드시 **한국어**로 작성합니다.
- **코드 주석:** 모든 코드의 주석은 **한국어**로 작성하여 가독성을 높입니다.
- **명명 규칙:** 변수 및 함수명은 영문 표준(CamelCase)을 따릅니다.
- **데이터 시각화 (Python):** Matplotlib을 사용하여 그래프나 차트를 생성할 경우, 한글 깨짐 방지를 위해 반드시 `import koreanize_matplotlib`을 포함하여 설정을 자동화합니다.

### 7단계 자동화 프로세스 (7-Step Automation Flow)
모든 변경 사항은 아래 순서를 엄격히 따릅니다.
1. **지시 내리기:** 사용자로부터 명령 수신.
2. **매뉴얼 자동 전달:** `GEMINI.md` 및 관련 컨텍스트 로딩.
3. **AI 작업 수행:** 코드 생성 및 수정.
4. **파일 자동 기록:** `plan.md`, `context_notes.md`, `checklist.md` 업데이트.
5. **오류 자동 검사:** Lint 및 Type 체크 수행.
6. **셀프체크 리마인더:** 보안 및 예외 처리 최종 점검.
7. **AI 바로 수정:** 경미한 결함 자가 수정 후 최종 제출.

### 맥락 관리 (Context Management)
구현 시작 전 다음 3가지 파일을 작성/업데이트하여 작업의 맥락을 고정합니다.
- **`plan.md`:** 전체적인 작업 로드맵 및 단계별 이정표.
- **`context_notes.md`:** 참조 코드 및 구현 시 주의해야 할 배경 지식.
- **`checklist.md`:** 개발 완료 후 검증해야 할 전수 조사 항목.

### 에러 핸들링 (Error Handling)
- **자가 수정:** 단순 오타나 경미한 컨벤션 미준수는 AI가 즉시 수정합니다.
- **전문 수리 추천:** 아키텍처 결함이나 복잡한 로직 충돌 시 억지로 수정하지 않고, 원인 분석 결과와 함께 개발자(사용자)에게 보고합니다.

## 5. 주요 파일 구조 (Key Directory Structure)

- `repoinsight/`
    - `backend/src/`
        - `server.ts`: 백엔드 진입점.
        - `routes/api.ts`: API 엔드포인트 정의.
        - `services/geminiService.ts`: Gemini API 연동 로직.
    - `src/`
        - `App.tsx`: 프론트엔드 메인 컴포넌트 및 라우팅.
        - `components/`: UI 컴포넌트 (AI 어시스턴트, 마법사 등).
        - `sections/`: 랜딩 페이지 섹션별 컴포넌트.
        - `context/`: 전역 상태 관리 (`UserContext`).
    - `dev_guide.md`: 상세 AI 개발 가이드라인.
    - `gemini-instruction.md`: 서비스 고도화 제안 및 컨셉 문서.
