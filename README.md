# RepoInsight: Dev Lifecycle Intelligence Platform

**RepoInsight**는 Git 리포지토리를 기반으로 보안 취약점, 코드 품질, 기술 부채, 개발 진척도 및 프로젝트 리스크를 자율적으로 진단하고 최적화 프로토콜을 제안하는 **AI 기반 지능형 개발 생명주기 관리 플랫폼**입니다.

[![Project Level: Starter](https://img.shields.io/badge/Project%20Level-Starter-blue.svg)](https://github.com/popup-studio-ai/bkit-gemini)
[![Stack: React 19 + Node.js](https://img.shields.io/badge/Stack-React%2019%20%2B%20Node.js-orange.svg)]()
[![Engine: Gemini 2.5 Flash](https://img.shields.io/badge/Engine-Gemini%202.5%20Flash-red.svg)]()

---

## 🚀 주요 기능 (Core Features)

### 1. 자율형 AI ChatOps (Autonomous Agent)
- **Multi-turn reasoning**: 최대 30회의 자율 사고 루프를 통해 복잡한 프로젝트 이슈를 스스로 추적하고 해결책을 도출합니다.
- **Process Node Visualization**: AI의 사고 과정(Thought)과 도구 실행(MCP Tool calls) 상태를 실시간으로 시각화하며, 분석 완료 시 비핵심 노드를 자동으로 숨겨 가독성을 높였습니다.
- **Final Analysis Report**: 루프가 종료된 최종 결과물에 전용 배지와 애니메이션을 부여하여 신뢰도 높은 결론을 제공합니다.

### 2. 표준화된 스킬 시스템 (Standardized Skill Engine)
- **Gemini CLI Spec 준수**: 폴더 기반의 스킬 구조(`skills/[id]/SKILL.md`)를 채택하여 전문 지침과 메타데이터를 체계적으로 관리합니다.
- **메시지 기반 자동 활성화 (Auto-trigger)**: 사용자의 질문 키워드를 분석하여 31종의 전문 스킬(보안 감사, 코드 리뷰, 아키텍처 설계 등)을 자동으로 로드합니다.
- **지능형 미리보기 (Content Preview)**: 도구 선택 전, 해당 스킬의 상세 지침이나 문서 내용을 팝업으로 즉시 확인할 수 있습니다.

### 3. 강력한 GitHub MCP 도구셋 (Advanced Toolchain)
- **자율 탐색 및 검색**:
    - `grep_search`: 리포지토리 전역에서 특정 코드 패턴이나 취약점 키워드를 초고속 검색.
    - `glob`: 와일드카드 패턴을 이용한 특정 파일 그룹 식별.
    - `read_many_files`: 최대 10개의 파일을 병렬로 동시 로드하여 분석 속도 극대화.
- **인터랙티브 컨텍스트 바**: 현재 선택된 스킬, 훅, PR, 커밋, 폴더 등 모든 분석 재료를 입력창 상단에 실시간 배지로 시각화합니다.

### 4. 고도화된 리포지토리 브라우저 (Interactive File Tree)
- **계층형 정렬 알고리즘**: 폴더 우선 정렬 및 계층 기반 네이밍 정렬을 통해 IDE 수준의 탐색 경험을 제공합니다.
- **재귀적 폴더 제어**: 깊은 계층의 폴더도 자유롭게 접고 펼칠 수 있으며, 조상 폴더 상태에 따른 연쇄적 가시성 제어를 지원합니다.
- **폴더 단위 분석 부착**: 파일 개별 선택 없이 폴더 전체를 분석 리소스로 지정할 수 있습니다.

### 5. 리포트 자산화 및 협업 (Export & Collaboration)
- **Word Export**: 분석 결과를 마크다운 서식이 유지된 `.doc` 문서로 즉시 내보낼 수 있습니다.
- **Email Sharing**: 리포트 내용을 본문에 담아 동료에게 즉시 이메일로 전송하는 기능을 지원합니다.

### 6. 실시간 시스템 헬스 모니터링
- **Infrastructure Sync**: 백엔드 서버 가동 상태 및 Google Gemini 엔진 연결 상태를 푸터에서 실시간으로 시각화(Online/Offline)합니다.

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4 (Custom Dark Theme)
- **Animation**: GSAP (ScrollTrigger, Flip)
- **Icons**: Lucide React
- **State**: React Context & Custom Hooks (`useChatOps`)

### Backend
- **Runtime**: Node.js (Express with TypeScript)
- **AI API**: Google Gemini 1.5 Pro / 2.0 & 2.5 Flash
- **Integration**: GitHub REST API v3

---

## 📦 설치 및 실행 (Setup)

### 1. 환경 변수 설정
`nura-health/backend/.env` 파일을 생성하고 다음 정보를 입력합니다.
```env
GEMINI_API_KEY=your_google_gemini_api_key
GITHUB_TOKEN=your_github_personal_access_token
PORT=3001
```

### 2. 백엔드 서버 실행
```bash
cd nura-health/backend
npm install
npm run dev
```

### 3. 프론트엔드 서버 실행
```bash
cd nura-health
npm install
npm run dev
```

---

## 📂 프로젝트 구조 (Structure)
- `src/components/Chat/`: 공통 채팅 UI 및 모달 컴포넌트
- `src/hooks/useChatOps.ts`: 비즈니스 로직 및 에이전트 통신 제어
- `backend/src/skills/`: 마크다운 기반의 전문 지식 베이스 (31종)
- `backend/src/services/`: AI 및 GitHub 연동 핵심 서비스
- `docs/`: PDCA 방법론에 기반한 프로젝트 설계 및 결과 산출물

---
© 2026 **RepoInsight Autonomous Lab**. Empowering AI-native development.
