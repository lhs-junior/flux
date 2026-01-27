# Awesome MCP Meta Plugin 기여 가이드

Awesome MCP Meta Plugin에 기여해 주셔서 감사합니다! 이 문서는 프로젝트에 기여하기 위한 가이드라인과 지침을 제공합니다.

## 📋 목차

- [행동 강령](#행동-강령)
- [시작하기](#시작하기)
- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조](#프로젝트-구조)
- [코드 스타일](#코드-스타일)
- [테스트](#테스트)
- [Pull Request 프로세스](#pull-request-프로세스)
- [커밋 메시지 가이드라인](#커밋-메시지-가이드라인)
- [문서화](#문서화)
- [이슈 보고](#이슈-보고)

## 🤝 행동 강령

이 프로젝트는 모든 기여자를 환영하는 환경을 보장하기 위해 행동 강령을 따릅니다:

- 존중하고 포용적으로 행동하기
- 건설적인 비판을 우아하게 받아들이기
- 커뮤니티에 가장 좋은 것에 집중하기
- 다른 커뮤니티 구성원에게 공감하기

## 🚀 시작하기

### 필수 요구사항

- **Node.js** 18.0.0 이상
- **npm** 7.0.0 이상
- **Git** 2.0.0 이상
- TypeScript 및 MCP 프로토콜에 대한 기본 지식

### Fork 및 Clone

1. GitHub에서 리포지토리 Fork
2. 로컬에 Clone:

```bash
git clone https://github.com/YOUR-USERNAME/awesome-pulgin.git
cd awesome-pulgin
```

3. 원본 리포지토리를 upstream으로 추가:

```bash
git remote add upstream https://github.com/yourusername/awesome-pulgin.git
```

## 🛠️ 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 프로젝트 빌드

```bash
npm run build
```

TypeScript 파일이 `dist/` 디렉토리로 컴파일됩니다.

### 3. 테스트 실행

```bash
# 모든 테스트 실행
npm test

# Watch 모드로 테스트 실행
npm run test:watch

# Lint 실행
npm run lint

# 타입 체크 실행
npm run typecheck
```

### 4. 개발 모드

```bash
# Watch 모드 (변경 시 자동 재빌드)
npm run dev
```

## 📂 프로젝트 구조

```
awesome-pulgin/
├── src/
│   ├── core/               # 핵심 게이트웨이 및 MCP 클라이언트
│   │   ├── gateway.ts      # 메인 MCP 게이트웨이
│   │   ├── mcp-client.ts   # MCP 서버 클라이언트
│   │   ├── session-manager.ts
│   │   └── tool-loader.ts  # 3-레이어 도구 로딩
│   ├── search/             # 검색 및 분류
│   │   ├── bm25-indexer.ts # BM25 검색 엔진
│   │   └── query-processor.ts
│   ├── storage/            # 데이터 영속성
│   │   └── metadata-store.ts
│   ├── discovery/          # 플러그인 발견
│   │   ├── github-explorer.ts
│   │   ├── quality-evaluator.ts
│   │   └── plugin-installer.ts
│   ├── cli.ts              # CLI 인터페이스
│   └── index.ts            # 메인 exports
├── tests/                  # 테스트 파일
│   ├── unit/               # 단위 테스트
│   ├── integration/        # 통합 테스트
│   └── e2e/                # End-to-end 테스트
├── docs/                   # 문서
└── examples/               # 예제 코드
```

## 🎨 코드 스타일

### TypeScript 가이드라인

1. **Strict 모드**: 모든 코드는 TypeScript strict 모드 검사를 통과해야 합니다
2. **타입 안전성**: `any` 타입 사용 금지; 구체적인 타입 또는 `unknown` 사용
3. **네이밍 규칙**:
   - 클래스: `PascalCase`
   - 함수/변수: `camelCase`
   - 상수: `UPPER_SNAKE_CASE`
   - 인터페이스: `PascalCase` (`I` 접두사 없음)
   - Private 멤버: `private` 키워드 사용

### ESLint 규칙

프로젝트의 ESLint 설정을 따르세요:

```bash
npm run lint              # 문제 확인
npm run lint -- --fix    # 자동 수정
```

주요 규칙:
- 사용하지 않는 변수 금지 (`_`로 시작하는 변수 제외)
- `let`보다 `const` 선호
- 콜백에 화살표 함수 사용
- 세미콜론 필수
- 문자열에 작은따옴표 사용

### 코드 주석

- 모든 public 클래스와 메서드에 JSDoc 주석 추가
- 복잡한 로직에 인라인 주석 사용
- 코드 변경 시 주석도 최신 상태로 유지

예시:
```typescript
/**
 * BM25 알고리즘을 사용하여 도구 검색
 * @param query - 검색 쿼리 문자열
 * @param options - 검색 옵션
 * @returns 관련성 순으로 정렬된 매칭 도구 배열
 */
async searchTools(query: string, options?: SearchOptions): Promise<ToolMetadata[]> {
  // 구현
}
```

## 🧪 테스트

### 테스트 요구사항

- 모든 새 기능에는 테스트가 포함되어야 합니다
- 버그 수정에는 회귀 테스트가 포함되어야 합니다
- 최소 80% 테스트 커버리지 유지
- PR 제출 전 모든 테스트 통과 필요

### 테스트 유형

1. **단위 테스트** (`tests/unit/`):
   - 개별 컴포넌트를 독립적으로 테스트
   - 외부 의존성 Mock 처리
   - 빠른 실행 (테스트당 <100ms)

2. **통합 테스트** (`tests/integration/`):
   - 컴포넌트 간 상호작용 테스트
   - 실제 SQLite 데이터베이스 사용 가능
   - 중간 실행 시간 (테스트당 <1s)

3. **E2E 테스트** (`tests/e2e/`):
   - 완전한 워크플로우 테스트
   - 실제 MCP 서버 연결 가능
   - 긴 실행 시간 (테스트당 <10s)

### 테스트 작성

Vitest를 사용하여 테스트 작성:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BM25Indexer } from '../src/search/bm25-indexer.js';

describe('BM25Indexer', () => {
  let indexer: BM25Indexer;

  beforeEach(() => {
    indexer = new BM25Indexer();
  });

  it('도구를 올바르게 인덱싱해야 함', () => {
    indexer.addDocument({ name: 'read_file', description: '파일 읽기' });
    const results = indexer.search('read file');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('read_file');
  });
});
```

### 특정 테스트 실행

```bash
# 특정 테스트 파일 실행
npx vitest tests/unit/bm25-indexer.test.ts

# 패턴에 맞는 테스트 실행
npx vitest --grep "BM25"
```

## 📬 Pull Request 프로세스

### 1. Feature 브랜치 생성

```bash
git checkout -b feature/your-feature-name
```

브랜치 네이밍:
- `feature/` - 새 기능
- `fix/` - 버그 수정
- `docs/` - 문서 변경
- `test/` - 테스트 추가/변경
- `refactor/` - 코드 리팩토링

### 2. 변경사항 작성

- 깔끔하고 유지보수 가능한 코드 작성
- 새 기능에 대한 테스트 추가
- 필요에 따라 문서 업데이트
- 코드 스타일 가이드라인 준수

### 3. 변경사항 커밋

```bash
git add .
git commit -m "feat: 새 기능 추가"
```

아래의 [커밋 메시지 가이드라인](#커밋-메시지-가이드라인)을 참조하세요.

### 4. Fork에 Push

```bash
git push origin feature/your-feature-name
```

### 5. Pull Request 생성

1. GitHub의 원본 리포지토리로 이동
2. "New Pull Request" 클릭
3. Fork와 브랜치 선택
4. PR 템플릿 작성:
   - **Description**: 이 PR이 무엇을 하는가?
   - **Motivation**: 왜 이 변경이 필요한가?
   - **Testing**: 어떻게 테스트했는가?
   - **Screenshots**: 해당되는 경우
   - **Related Issues**: 관련 이슈 링크

### 6. 리뷰 프로세스

- 메인테이너가 PR 리뷰
- 요청된 변경사항 반영
- 승인되면 PR이 병합됩니다

## 📝 커밋 메시지 가이드라인

[Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/) 규격을 따릅니다:

### 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입

- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 스타일 변경 (포매팅 등)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가 또는 수정
- `chore`: 유지보수 작업
- `perf`: 성능 개선

### 예시

```bash
feat(search): BM25 검색 알고리즘 추가

도구 순위 지정을 위한 Okapi BM25 알고리즘 구현.
문서 빈도 계산 및 관련성 점수 부여 포함.

Closes #123

fix(gateway): 연결 오류를 우아하게 처리

MCP 서버 연결을 위한 재시도 로직 및 오류 콜백 추가.

docs: 새 메서드로 API 레퍼런스 업데이트

test(indexer): 엣지 케이스에 대한 테스트 추가
```

### 규칙

- 명령형 사용 ("추가" not "추가함" 또는 "추가했음")
- 첫 줄 ≤ 72자
- Footer에 이슈 참조 (예: "Closes #123")
- 어떻게가 아닌 무엇과 왜를 설명

## 📚 문서화

### 문서 업데이트가 필요한 경우

- 새 public API 추가
- 기존 동작 변경
- 새 기능 추가
- 사용에 영향을 주는 버그 수정

### 문서 위치

- **API 레퍼런스**: `docs/api-reference-ko.md`
- **예제**: `docs/examples/`
- **README**: `README.md`
- **코드 주석**: 소스 파일의 JSDoc

### 문서 작성 가이드라인

- 명확하고 간결한 언어 사용
- 코드 예제 포함
- 예제를 최신 상태로 유지
- 관련 문서에 링크 추가

## 🐛 이슈 보고

### 보고 전 확인사항

1. 기존 이슈 검색
2. [FAQ](docs/faq-ko.md) 확인
3. [문제 해결 가이드](docs/troubleshooting-ko.md) 읽기

### 이슈 템플릿

포함할 내용:
- **Description**: 이슈에 대한 명확한 설명
- **재현 단계**: 최소 재현 단계
- **예상 동작**: 어떻게 동작해야 하는가
- **실제 동작**: 실제로 어떻게 동작하는가
- **환경**:
  - Node.js 버전
  - OS 및 버전
  - 패키지 버전
- **추가 컨텍스트**: 로그, 스크린샷 등

### 이슈 라벨

- `bug`: 작동하지 않는 것
- `enhancement`: 새 기능 요청
- `documentation`: 문서 개선
- `good first issue`: 초보자에게 좋음
- `help wanted`: 추가 관심 필요

## 🎯 기여 가능 영역

### 높은 우선순위

- 엣지 케이스에 대한 추가 단위 테스트
- 성능 최적화
- 문서 개선
- 버그 수정

### 기능 아이디어

- 추가 MCP 서버 통합
- 플러그인 관리를 위한 웹 UI
- 향상된 쿼리 처리
- Docker 지원
- CI/CD 파이프라인 개선

### 문서 필요사항

- 더 많은 사용 예제
- 비디오 튜토리얼
- API 레퍼런스 확장
- 다른 언어로 번역

## 💡 개발 팁

### 디버깅

디버그 모드 활성화:
```bash
export DEBUG=awesome-plugin:*
node your-script.js
```

### 로컬 MCP 서버로 테스트

```bash
# 터미널 1: MCP 서버 시작
node your-mcp-server.js

# 터미널 2: 테스트 설정으로 게이트웨이 실행
node dist/cli.mjs start
```

### 데이터베이스 검사

```bash
# SQLite 데이터베이스 열기
sqlite3 ./data/plugins.db

# 테이블 보기
.tables

# 도구 쿼리
SELECT * FROM tools;
```

## 🙏 인정

기여자는 다음과 같이 인정받습니다:
- 릴리스 노트에 나열
- GitHub 기여자 페이지에 추가
- 프로젝트 문서에 언급 (중요한 기여의 경우)

## 📧 도움 받기

- **GitHub Discussions**: 질문과 토론
- **GitHub Issues**: 버그 리포트 및 기능 요청
- **문서**: [docs/](docs/) 디렉토리 확인

Awesome MCP Meta Plugin에 기여해 주셔서 감사합니다! 🚀
