# Plan: Smart Chat UI Implementation

## 1단계: 백엔드 상태 메시지 세분화
- [ ] `api.ts`의 에이전트 루프 내 `thought` 이벤트 추가
- [ ] 도구별 실행 전후 상세 메시지 정의 (예: "GitHub 데이터 조회 중...", "파일 내용 분석 중...")

## 2단계: 프론트엔드 데이터 모델 변경
- [ ] `Message` 타입을 `text` 중심에서 `parts` 기반으로 리팩토링
- [ ] 스트리밍 파서에서 `type`별 분기 처리 로직 구현

## 3단계: CLI 스타일 UI 구현
- [ ] `ChatOpsPage.tsx`에서 메시지 렌더링 로직 수정
- [ ] `ThinkingBlock` (CLI 스타일 작업 로그) 컴포넌트 추가
- [ ] 이전 사고 과정 접기/펼치기 기능 구현
