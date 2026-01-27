# 변경 로그 (Changelog)

이 프로젝트의 모든 주요 변경사항이 이 파일에 문서화됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 기반으로 하며,
이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

## [0.1.0] - 2026-01-28

### 추가됨 (Added)

#### Phase 1: 핵심 게이트웨이
- 다중 서버 지원 기능이 있는 핵심 MCP 게이트웨이 구현
- 자동 재연결 로직이 있는 MCP 서버 클라이언트 (3회 재시도, 1초 간격)
- 연결된 서버 추적을 위한 세션 관리
- 기본 MCP 서버로의 도구 호출 프록시
- 기본 도구 등록 및 메타데이터 저장

#### Phase 2: BM25 도구 검색 엔진
- 밀리초 이하 성능의 BM25 기반 검색 엔진 (<1ms)
- Okapi BM25 알고리즘 구현 (k1=1.2, b=0.75)
- 문서 빈도 계산을 통한 도구 인덱싱
- 쿼리 기반 도구 순위 지정 및 관련성 점수 부여

#### Phase 3: GitHub 자동 발견
- @octokit/rest를 사용한 GitHub API 통합
- GitHub 리포지토리에서 MCP 서버 자동 검색
- 토픽 기반 검색 (mcp-server, mcp)
- MCP 서버에 대한 이름 패턴 매칭
- README 및 설명 키워드 검색
- API 속도 제한 처리 및 캐싱 지원

#### Phase 4: 의도 분류 (Intent Classification)
- 도구 분류를 위한 쿼리 의도 분석
- 액션 정규화 (read, write, delete 등)
- 도메인 분류 (communication, database, filesystem, development, web, ai)
- 쿼리에서 엔티티 추출
- 동의어 확장 및 쿼리 강화
- 불용어(Stop words) 필터링

#### Phase 5: 사용량 학습
- 도구 메타데이터 및 사용 로그를 위한 SQLite 기반 영속성
- 사용량 추적 및 통계
- 자주 사용되는 도구에 대한 로그 부스트
- 개인화된 추천을 위한 도구 사용 히스토리

#### Phase 6: 프로덕션 준비 구현
- 3-레이어 지능형 도구 로딩 전략:
  - **Layer 1**: 필수 도구 (항상 로드, ~1.5K 토큰)
  - **Layer 2**: BM25 매칭 도구 (동적, 10-15개 도구, ~3-4.5K 토큰)
  - **Layer 3**: 온디맨드 도구 (명시적 요청 시에만 로드)
- CLI 인터페이스 명령어:
  - `discover`: GitHub에서 MCP 서버 검색 및 설치
  - `list`: 설치된 플러그인 목록 표시
  - `stats`: 게이트웨이 통계 표시
  - `start`: 게이트웨이 서버 시작
- 품질 평가 시스템 (0-100 점수):
  - 인기도 (0-25): GitHub 별, 포크 수
  - 유지보수 (0-25): 최근 커밋, 프로젝트 나이
  - 문서화 (0-25): README, package.json 품질
  - 신뢰성 (0-25): 이슈 비율, 버전 관리
- 대화형 설치 워크플로우
- 프로덕션 준비 MCP 서버 통합

### 성능 (Performance)

#### 토큰 감소율
- 50개 도구: 70% 감소 (15,000 → 4,500 토큰)
- 200개 도구: 90% 감소 (60,000 → 6,000 토큰)
- 500개 도구: 95% 감소 (150,000 → 7,500 토큰)

#### 검색 속도
- 50개 도구: 0.16-0.45ms (목표 50ms 대비 110배 빠름)
- 100개 도구: 0.30-0.38ms (목표 50ms 대비 130배 빠름)
- 200개 도구: 0.57-0.77ms (목표 50ms 대비 65배 빠름)

### 테스트 (Testing)
- 84% 통과율의 231개 테스트 케이스
- 모든 핵심 컴포넌트에 대한 단위 테스트:
  - BM25Indexer
  - QueryProcessor
  - MetadataStore
  - QualityEvaluator
  - ToolLoader
  - MCPClient
- Gateway에 대한 통합 테스트
- E2E 성능 벤치마크
- 80% 테스트 커버리지 목표

### 의존성 (Dependencies)
- @modelcontextprotocol/sdk@^1.0.4 - MCP 프로토콜 구현
- @octokit/rest@^21.0.2 - GitHub API 통합
- better-sqlite3@^11.8.1 - SQLite 데이터베이스
- commander@^12.1.0 - CLI 프레임워크
- okapibm25@^1.4.1 - BM25 검색 알고리즘
- zod@^3.24.1 - 스키마 검증

### 개발 환경 (Development)
- TypeScript 5.7 (strict 모드)
- TypeScript 지원이 있는 ESLint 설정
- 30초 타임아웃의 Vitest 테스트
- tsup 빌드 도구 (ESM 출력)
- Node.js 18+ 요구사항

## [미출시] (Unreleased)

### 계획됨 (Planned)
- TypeScript 문서 자동 생성 (TypeDoc)
- GitHub Actions를 사용한 CI/CD 파이프라인
- npm 패키지 배포
- 추가 예제 애플리케이션
- 성능 모니터링 및 메트릭
- Docker 지원
- 플러그인 관리를 위한 웹 UI

---

자세한 내용은 [커밋 히스토리](https://github.com/yourusername/awesome-plugin/commits/main)를 참조하세요.
