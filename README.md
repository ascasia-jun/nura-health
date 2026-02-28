# Nura Health: AI-DLC Service

**Nura Health**는 정적인 컨셉 데모 사이트를 넘어, 실제 사용자 데이터와 상호작용하며 개인화된 AI 진단 및 처방을 제공하는 **동적 AI-DLC(Development Life-Cycle) 플랫폼**입니다.

## 🚀 주요 기능

### 1. 📊 실시간 AI 대시보드 (`Features`)
- **Diagnostic Shuffler:** 실시간으로 변동하는 AI 메트릭을 시각화합니다.
- **Telemetry Typewriter:** 백엔드 API와 연동되어 실제 진단 데이터를 스트리밍합니다.
- **Tier-based Access:** 멤버십 등급에 따라 고급 데이터 접근이 제한/해제됩니다.

### 2. 🩺 AI 진단/처방 마법사 (`Protocols`)
- 사용자가 프로젝트의 문제점을 입력하면, AI가 분석하여 맞춤형 해결 프로토콜을 제시합니다.
- **Apex** 등급 전용 기능으로, 하위 등급에서는 잠금 화면이 표시됩니다.

### 3. 💬 AI 어시스턴트 (`AICompanionChat`)
- 화면 우측 하단에 상주하는 대화형 AI 챗봇입니다.
- 프로젝트 최적화, 에러 분석 등에 대한 실시간 질의응답을 제공합니다.

### 4. 💎 동적 멤버십 시스템 (`Membership`)
- **Baseline / Performance / Apex** 3단계 등급 시스템.
- 사용자가 등급을 선택하면 즉시 전역 상태(`UserContext`)가 업데이트되어, 사이트 내 기능 접근 권한이 실시간으로 변경됩니다.

---

## 🛠️ 설치 및 실행 방법

이 프로젝트는 **Frontend(React)**와 **Backend(Node.js)**로 구성되어 있습니다. 두 서버를 모두 실행해야 정상적으로 작동합니다.

### 1. 백엔드 서버 실행 (Port: 3001)
```bash
cd backend
npm install
npm run dev
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
