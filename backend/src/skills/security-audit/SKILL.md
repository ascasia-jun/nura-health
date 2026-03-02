# Security Audit Skill

이 스킬은 프로젝트의 보안 취약점을 탐지하고 hardenining 프로토콜을 제안하는 데 특화되어 있습니다.

## 지침 (Instructions)
1. `.env`, `.gitignore`, `config` 파일을 조사하여 민감한 정보(API 키 등)가 노출되어 있는지 확인하세요.
2. 인증 및 인가 로직(JWT, Session, RLS 등)의 보안성을 점검하세요.
3. 데이터베이스 쿼리나 사용자 입력 처리 부분에서 SQL Injection, XSS 위험이 있는지 분석하세요.
4. `package.json`의 보안 업데이트가 필요한 구형 종속성을 식별하세요.

## 출력 형식
- **보안 점수**: 1~100점.
- **발견된 취약점**: 등급별(High, Medium, Low) 목록.
- **조치 권고**: 구체적인 코드 수정 제안.
