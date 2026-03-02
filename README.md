# RepoInsight: Dev Lifecycle Intelligence Platform

**RepoInsight**는 Git 리포지토리를 대상으로 보안 취약점, 코드 품질, 기술 부채, 진척도, 리스크를 종합 진단하는 **AI 기반 지능형 개발 생명주기 관리 플랫폼**입니다.

[![Project Level: Starter](https://img.shields.io/badge/Project%20Level-Starter-blue.svg)](https://github.com/popup-studio-ai/bkit-gemini)
[![Stack: React 19 + Node.js](https://img.shields.io/badge/Stack-React%2019%20%2B%20Node.js-orange.svg)]()

## 🚀 주요 기능 (Key Features)

### 1. 자율형 AI ChatOps
- **Multi-turn Agent Loop**: 최대 30회의 자율 사고 루프를 통해 복잡한 프로젝트 이슈를 스스로 분석하고 해결책을 제시합니다.
- **Process Node Visualization**: AI의 사고 과정을 CLI 터미널 스타일로 실시간 시각화하여 분석의 투명성을 확보했습니다.

### 2. 인터랙티브 컨텍스트 엔진
- **Context Hook**: `GEMINI.md` 등 프로젝트 가이드를 한 번의 클릭으로 AI 컨텍스트에 주입합니다.
- **Resource Attachment**: 특정 PR, Commit, 소스 코드를 배지 형태로 부착하여 정밀 타겟 분석을 수행합니다.

### 3. 도메인 특화 Skills 시스템
- `bkit-gemini` 철학을 계승한 전문 스킬셋을 장착하여 **보안 감사(Security Audit)**, **코드 리뷰**, **아키텍처 설계** 등 도메인별 최적화된 페르소나를 제공합니다.

### 4. 실시간 텔레메트리 대시보드
- 프로젝트의 핵심 지표를 시각화하고 AI가 실시간으로 건강 상태를 진단하여 최적화 프로토콜을 생성합니다.

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Animation**: GSAP (ScrollTrigger)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (Express)
- **AI Engine**: Google Gemini 1.5/2.0 API
- **Integration**: GitHub API (Octokit 스타일 커스텀 서비스)

## 📦 설치 및 실행 (Setup)

### 1. 환경 변수 설정
`backend/.env` 파일을 생성하고 다음 정보를 입력합니다.
```env
GEMINI_API_KEY=your_google_gemini_api_key
GITHUB_TOKEN=your_github_personal_access_token
PORT=3001
```

### 2. 백엔드 서버 실행
```bash
cd backend
npm install
npm run dev
```

### 3. 프론트엔드 서버 실행
```bash
npm install
npm run dev
```

## 📂 프로젝트 구조 (Structure)
- `src/`: 프론트엔드 소스 코드 (React 컴포넌트, 훅, 컨텍스트)
- `backend/`: Express 기반 백엔드 및 AI 에이전트 로직
  - `src/skills/`: 마크다운 기반의 전문 AI 스킬 정의서
- `docs/`: PDCA 방법론에 기반한 설계 및 결과 산출물
  - `01-plan/`: 기능별 기획 문서
  - `02-design/`: 아키텍처 및 UI 설계서
  - `04-report/`: 최종 완료 보고서

---
© 2026 RepoInsight Autonomous Lab. Powered by POPUP STUDIO.
