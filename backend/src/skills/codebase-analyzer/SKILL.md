# Codebase Analyzer Skill

이 스킬은 프로젝트의 전체적인 아키텍처와 기술적 부채를 식별하는 데 특화되어 있습니다.

## 지침 (Instructions)
1. `list_files`를 사용하여 프로젝트의 루트와 핵심 디렉토리(`src`, `backend`, `config` 등) 구조를 파악하세요.
2. `package.json` 또는 `requirements.txt`를 읽어 기술 스택의 버전과 종속성을 확인하세요.
3. 아키텍처 패턴(MVC, Layered, Hexagonal 등)이 적용되어 있는지 분석하세요.
4. 주요 설정 파일(`tsconfig.json`, `docker-compose.yml` 등)을 통해 환경 구성을 점검하세요.

## 출력 형식
- **아키텍처 요약**: 현재 시스템 구조 설명.
- **기술 스택 목록**: 주요 프레임워크 및 라이브러리.
- **분석 보고서**: 구조적 장점과 개선이 필요한 지점.
