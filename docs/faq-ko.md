# 자주 묻는 질문 (FAQ)

Awesome MCP Meta Plugin에 관한 자주 묻는 질문입니다.

전체 영문 FAQ: [faq.md](faq.md)

## 목차

- [일반 질문](#일반-질문)
- [설치 및 설정](#설치-및-설정)
- [사용법](#사용법)
- [성능](#성능)
- [고급 주제](#고급-주제)

---

## 일반 질문

### Q: Awesome Plugin이 정확히 무엇인가요?

**A:** MCP(Model Context Protocol) 메타플러그인으로, "토큰 낭비" 문제를 해결합니다. 모든 MCP 서버의 모든 도구를 로드하는 대신(500개 도구 = 75,000+ 토큰), BM25 검색을 사용하여 관련 도구만 지능적으로 선택하여 토큰 사용량을 70-97% 줄입니다.

또한 GitHub에서 MCP 서버를 자동 발견하고 품질 평가를 제공하여 고품질 플러그인을 쉽게 찾고 설치할 수 있습니다.

### Q: 기존 MCP 서버와 어떻게 다른가요?

**A:** 

**기존 MCP:** Claude가 연결된 모든 서버의 모든 도구를 매번 로드 → 토큰 낭비

**Awesome Plugin:**
1. 여러 MCP 서버에 연결
2. 모든 도구를 BM25로 인덱싱
3. 쿼리에 따라 관련 도구만 로드 (Layer 2)
4. 필수 도구는 항상 사용 가능 (Layer 1)
5. 나머지 도구는 온디맨드로 제공 (Layer 3)

### Q: 프로덕션에서 사용할 수 있나요?

**A:** 네! 버전 0.1.0이 모든 6개 개발 단계를 완료했습니다:
- 231개 테스트 케이스 (84% 통과율)
- 성능 벤치마크 (<1ms 검색 시간)
- 프로덕션 MCP 서버 통합
- CLI 인터페이스

자세한 테스트 결과는 [TEST-REPORT-KO.md](../TEST-REPORT-KO.md)를 참조하세요.

---

## 설치 및 설정

### Q: 어떻게 설치하나요?

**A:**

```bash
git clone https://github.com/yourusername/awesome-pulgin.git
cd awesome-pulgin
npm install
npm run build
```

### Q: Claude Desktop에서 어떻게 설정하나요?

**A:** 

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "node",
      "args": ["/절대/경로/awesome-pulgin/dist/index.mjs"]
    }
  }
}
```

그런 다음 Claude Desktop을 완전히 재시작하세요.

### Q: GitHub 토큰이 꼭 필요한가요?

**A:** 선택사항이지만 강력히 권장합니다:

- **토큰 없이:** 시간당 60 요청
- **토큰 사용:** 시간당 5,000 요청

설정 방법:
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

---

## 사용법

### Q: Layer 1, 2, 3가 무엇인가요?

**A:**

**Layer 1 (필수 도구):**
- 항상 로드됨 (~1.5K 토큰)
- 가장 자주 사용하는 도구
- 예: `read_file`, `write_file`, `bash`

**Layer 2 (BM25 매칭 도구):**
- 쿼리에 따라 동적으로 로드 (~3-4.5K 토큰)
- 가장 관련성 높은 10-15개 도구
- 예: "slack 메시지 보내기" → Slack 도구 로드

**Layer 3 (온디맨드 도구):**
- 명시적으로 요청할 때까지 로드하지 않음
- 사용 가능하지만 토큰 소비하지 않음

### Q: 도구를 어떻게 검색하나요?

**A:**

**프로그래밍 방식:**
```typescript
const tools = await gateway.searchTools('read file', { limit: 5 });
```

**Claude Desktop에서:**
자연스럽게 물어보면 Awesome Plugin이 자동으로 관련 도구를 로드합니다:
```
"설정 파일을 읽어야 해"     → 파일 읽기 도구 로드
"Slack에 메시지 보내기"     → Slack 도구 로드
"GitHub PR 생성"            → GitHub 도구 로드
```

### Q: 새로운 MCP 서버는 어떻게 찾나요?

**A:**

**CLI:**
```bash
node dist/cli.mjs discover --limit 20 --min-score 75
```

**프로그래밍 방식:**
```typescript
import { GitHubExplorer, QualityEvaluator } from 'awesome-plugin';

const explorer = new GitHubExplorer({ githubToken: process.env.GITHUB_TOKEN });
const evaluator = new QualityEvaluator({ minScore: 75 });

const repos = await explorer.searchMCPServers({ minStars: 50 });
const evaluated = evaluator.evaluateAll(repos);
```

---

## 성능

### Q: 검색 속도는 얼마나 빠른가요?

**A:** 매우 빠릅니다!

| 도구 수 | 검색 시간 | 목표 |
|---------|----------|------|
| 50      | 0.16-0.45ms | <50ms |
| 100     | 0.30-0.38ms | <50ms |
| 200     | 0.57-0.77ms | <50ms |

목표 대비 65-130배 빠릅니다!

### Q: 메모리 사용량은 얼마나 되나요?

**A:**

- **인메모리 데이터베이스:** ~2-5 MB + 도구 메타데이터
- **파일 기반 데이터베이스:** 100개 도구당 ~1-2 MB
- **연결된 서버당:** ~5-10 MB

일반적인 사용(3-5개 서버, 100-200개 도구): **총 ~50-100 MB**

### Q: 토큰을 얼마나 절약하나요?

**A:**

| 도구 수 | 기존 방식 | Awesome Plugin | 절감률 |
|---------|----------|----------------|--------|
| 50      | 15,000   | 4,500         | 70%    |
| 200     | 60,000   | 6,000         | 90%    |
| 500     | 150,000  | 7,500         | 95%    |

### Q: 성능을 튜닝할 수 있나요?

**A:** 네! 다음 파라미터를 조정하세요:

**토큰 절감 (Layer 2 도구 줄이기):**
```typescript
const gateway = new AwesomePluginGateway({
  maxLayer2Tools: 10,  // 기본값: 15
});
```

**검색 관련성 개선:**
```typescript
const indexer = new BM25Indexer({
  k1: 1.5,  // 높을수록 용어 빈도 중요도 증가
  b: 0.5,   // 낮을수록 길이 정규화 감소
});
```

---

## 고급 주제

### Q: 프로그래밍 방식으로 사용할 수 있나요?

**A:** 네! [API 레퍼런스](api-reference.md)를 참조하세요.

기본 예제:
```typescript
import { AwesomePluginGateway } from 'awesome-plugin';

const gateway = new AwesomePluginGateway({
  dbPath: './data/plugins.db',
});

await gateway.connectToServer({ /* ... */ });
const tools = await gateway.searchTools('query');
await gateway.stop();
```

### Q: BM25 검색은 어떻게 작동하나요?

**A:** BM25(Okapi BM25)는 다음 기준으로 문서 점수를 매기는 확률적 순위 함수입니다:

1. **용어 빈도:** 검색어가 도구 설명에 나타나는 빈도
2. **문서 길이:** 설명 길이로 정규화
3. **코퍼스 통계:** IDF(역문서 빈도) 사용

파라미터:
- `k1` (기본값 1.2): 용어 빈도 포화
- `b` (기본값 0.75): 길이 정규화

### Q: 품질 평가는 어떻게 작동하나요?

**A:** 리포지토리를 4개 차원에서 0-100점으로 평가 (각 25점):

1. **인기도 (0-25):** GitHub 별, 포크 수
2. **유지보수 (0-25):** 최근 커밋, 프로젝트 나이
3. **문서화 (0-25):** README, package.json 품질
4. **신뢰성 (0-25):** 이슈 비율, 버전 관리

**등급:**
- A (90-100): 적극 권장
- B (80-89): 권장
- C (70-79): 수용 가능
- D (60-69): 주의해서 사용
- F (<60): 권장하지 않음

---

## 문제 해결

### Q: Claude Desktop에서 도구가 표시되지 않아요

**A:** 다음을 확인하세요:

1. 설정 파일 위치 및 문법
2. 절대 경로 사용
3. Claude Desktop 완전 재시작
4. 로그 확인: `~/Library/Logs/Claude/mcp*.log` (macOS)

[문제 해결 가이드](troubleshooting-ko.md#claude-desktop-통합-문제)를 참조하세요.

### Q: 검색 결과가 없어요

**A:** 더 넓은 검색어 사용:

```typescript
// 너무 구체적
await gateway.searchTools('read_file_from_filesystem');

// 더 나음
await gateway.searchTools('read file');
```

### Q: "GitHub API 요청 한도 초과" 오류

**A:** GitHub 토큰 추가:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

---

## 더 궁금하신 점이 있나요?

- **영문 FAQ:** [faq.md](faq.md)
- **문제 해결:** [troubleshooting-ko.md](troubleshooting-ko.md)
- **API 레퍼런스:** [api-reference.md](api-reference.md)
- **GitHub Issues:** https://github.com/yourusername/awesome-plugin/issues
