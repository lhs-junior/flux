# 🧬 프로젝트 흡수 시스템 가이드

> FLUX의 핵심 차별화 전략: 우수한 Claude Code 프로젝트들을 평가하고 통합하여 지속적으로 진화하는 "The Absorption Engine"

## 📋 목차

1. [흡수 시스템 개요](#흡수-시스템-개요)
2. [3대 핵심 컴포넌트](#3대-핵심-컴포넌트)
3. [사용 방법](#사용-방법)
4. [흡수 이력](#흡수-이력)
5. [재흡수(Re-absorption) 시스템](#재흡수-시스템)
6. [미흡수 기능 분석](#미흡수-기능-분석)
7. [향후 개선 계획](#향후-개선-계획)

---

## 흡수 시스템 개요

FLUX는 단순히 기능을 추가하는 것이 아니라, **검증된 오픈소스 프로젝트들을 체계적으로 평가하고 개선하여 통합**합니다.

### 핵심 철학

- **70점 이상만 흡수**: 100점 만점 평가 시스템으로 품질 보증
- **원본보다 개선**: SQLite, BM25, 시너지 통합으로 성능/UX 향상
- **충돌 자동 해결**: Merge > Namespace > Deprecate 전략
- **지속적 모니터링**: 원본 프로젝트 업데이트 추적 및 재흡수

---

## 3대 핵심 컴포넌트

### 1. QualityEvaluator - 100점 평가 시스템

**위치**: [`src/absorption/quality-evaluator.ts`](../src/absorption/quality-evaluator.ts)

프로젝트를 5가지 기준으로 평가합니다:

| 평가 항목 | 배점 | 설명 |
|---------|------|------|
| 기능 개선도 | 0-30점 | 원본보다 나은 성능/UX/API 제공 가능성 |
| 시너지 점수 | 0-30점 | 기존 Memory/Agent/Planning과 통합 가능성 |
| 충돌 위험 | -20~0점 | Tool naming, 아키텍처 충돌 (감점) |
| 유지보수성 | 0-20점 | 코드 복잡도, 의존성 수 |
| 라이센스 | 0-20점 | MIT/Apache-2.0만 만점 |

**등급 체계**:
- **A등급 (90+)**: 즉시 흡수 승인
- **B등급 (80-89)**: 승인 권장
- **C등급 (70-79)**: 신중히 검토 후 승인
- **D등급 (60-69)**: 재평가 필요
- **F등급 (60 미만)**: 흡수 거부

#### 사용 예시

```typescript
import { QualityEvaluator } from './src/absorption/quality-evaluator.js';

// 1. Evaluator 초기화
const evaluator = new QualityEvaluator({
  existingTools: ['memory_save', 'memory_recall', 'agent_spawn'], // 기존 tool 목록
  existingFeatures: ['memory', 'agent', 'planning'],              // 기존 feature 목록
  currentComplexity: 50,                                          // 현재 시스템 복잡도 (0-100)
});

// 2. 프로젝트 평가
const score = evaluator.evaluate({
  name: 'new-awesome-project',
  repo: 'owner/new-awesome-project',
  description: 'Revolutionary Claude Code tool with AI-powered automation',
  stars: 250,
  forks: 45,
  lastCommit: new Date('2026-01-15'),
  license: 'MIT',
  dependencies: ['@modelcontextprotocol/sdk', 'zod'],
  complexity: 'medium', // 'low' | 'medium' | 'high'
});

// 3. 결과 분석
console.log(`📊 평가 결과: ${score.total}/100 (${score.grade}등급)`);
console.log(`💡 권장사항: ${score.recommendation}`); // 'approve' | 'consider' | 'reject'

console.log('\n📈 세부 점수:');
console.log(`  - 기능 개선도: ${score.breakdown.functionalImprovement}/30`);
console.log(`  - 시너지: ${score.breakdown.synergyScore}/30`);
console.log(`  - 충돌 위험: ${score.breakdown.conflictRisk}/0`);
console.log(`  - 유지보수성: ${score.breakdown.maintainability}/20`);
console.log(`  - 라이센스: ${score.breakdown.license}/20`);

console.log('\n📝 평가 이유:');
score.reasons.forEach(reason => console.log(`  ${reason}`));

/*
예상 출력:
📊 평가 결과: 85/100 (B등급)
💡 권장사항: approve

📈 세부 점수:
  - 기능 개선도: 25/30
  - 시너지: 27/30
  - 충돌 위험: -3/0
  - 유지보수성: 18/20
  - 라이센스: 20/20

📝 평가 이유:
  ✅ Excellent improvement potential (25/30)
  ✅ Strong synergy with existing features (27/30)
  Minor conflicts (-3 penalty)
  ✅ Highly maintainable (18/20)
  ✅ Perfect license (MIT)
*/
```

---

### 2. ConflictResolver - 충돌 자동 해결

**위치**: [`src/absorption/conflict-resolver.ts`](../src/absorption/conflict-resolver.ts)

Tool 이름, 기능, 아키텍처 충돌을 자동으로 감지하고 해결 방안을 제시합니다.

#### 충돌 유형

1. **Naming Conflict**: Tool 이름이 중복되거나 유사한 경우
2. **Functionality Conflict**: 같은 기능을 하는 tool이 이미 존재
3. **Architecture Conflict**: 저장 방식(파일 vs SQLite), 실행 모델 충돌

#### 해결 전략 우선순위

1. **Merge (병합)** - 최우선
   - 두 tool의 기능을 하나로 통합
   - 더 나은 UX 제공
   - 예: `memory_save` + `memory_store` → `memory_save` (type 파라미터로 구분)

2. **Namespace (네임스페이스)**
   - 도메인별 접두사 추가
   - 예: `list` → `agent_list`, `memory_list`

3. **Deprecate (폐기)**
   - 기존 tool 제거, 새 tool로 교체
   - 마이그레이션 가이드 제공

#### 사용 예시

```typescript
import { ConflictResolver } from './src/absorption/conflict-resolver.js';

// 1. 기존 tool 정의
const existingTools = [
  {
    name: 'agent_list',
    description: 'List all running agents',
    domain: 'agent',
    parameters: { filter: 'string' },
  },
  {
    name: 'memory_save',
    description: 'Save data to memory',
    domain: 'memory',
    parameters: { key: 'string', value: 'string' },
  },
];

// 2. Resolver 초기화
const resolver = new ConflictResolver(existingTools);

// 3. 새로운 tool 평가
const incomingTools = [
  {
    name: 'agent_list',        // ❌ 중복!
    description: 'Show active agents',
    domain: 'agent',
    parameters: { status: 'string' },
  },
  {
    name: 'task_create',       // ✅ 충돌 없음
    description: 'Create new task',
    domain: 'planning',
    parameters: { title: 'string' },
  },
];

// 4. 충돌 해결
const resolution = resolver.resolve(incomingTools);

// 5. 결과 분석
console.log(`⚠️  ${resolution.conflicts.length}개 충돌 감지`);

resolution.conflicts.forEach(conflict => {
  console.log(`  - ${conflict.type} 충돌 (심각도: ${conflict.severity})`);
  console.log(`    ${conflict.description}`);
});

console.log(`\n🔧 추천 전략: ${resolution.strategy.type.toUpperCase()}`);
console.log(`   ${resolution.strategy.action}`);
console.log(`\n💡 이유: ${resolution.strategy.rationale}`);
console.log(`\n📋 구현 방법:\n${resolution.strategy.implementation}`);

console.log(`\n${resolution.approved ? '✅ 자동 승인' : '❌ 수동 검토 필요'}`);

resolution.notes.forEach(note => console.log(note));

/*
예상 출력:
⚠️  1개 충돌 감지
  - naming 충돌 (심각도: critical)
    Tool name "agent_list" already exists

🔧 추천 전략: NAMESPACE
   Add "incoming_" prefix to incoming tools

💡 이유: Prevent naming conflicts by using domain-specific prefix

📋 구현 방법:
Rename tools:
  - agent_list → incoming_agent_list

❌ 수동 검토 필요
⚠️  1 conflict(s) detected
  - CRITICAL: Tool name "agent_list" already exists

Recommended strategy: NAMESPACE
  Add "incoming_" prefix to incoming tools

Rationale: Prevent naming conflicts by using domain-specific prefix
*/
```

---

### 3. UpstreamMonitor - 원본 모니터링

**위치**: [`src/absorption/upstream-monitor.ts`](../src/absorption/upstream-monitor.ts)

흡수한 프로젝트의 원본 저장소를 지속적으로 모니터링하여 새 버전/기능이 나오면 자동으로 평가합니다.

#### 주요 기능

- GitHub API를 통한 릴리즈 추적
- Changelog 자동 분석 (신기능, 개선, Breaking changes)
- 70점 이상 업데이트만 재흡수 추천
- GitHub Issue 자동 생성으로 추적 관리

#### 사용 예시

```typescript
import { UpstreamMonitor } from './src/absorption/upstream-monitor.ts';

// 1. Monitor 초기화 (GitHub token 필요)
const monitor = new UpstreamMonitor(process.env.GITHUB_TOKEN);

// 2. 흡수한 프로젝트 등록
monitor.registerAbsorbedProject({
  name: 'claude-mem',
  repo: 'supermemoryai/claude-mem',
  absorbedVersion: 'v1.0.0',
  absorbedAt: new Date('2025-01-28'),
  lastSync: new Date('2025-01-28'),
  improvements: [
    'BM25 search instead of vector DB (0.2-0.7ms)',
    'SQLite instead of file storage',
    'Unified tool schema for better UX',
  ],
});

monitor.registerAbsorbedProject({
  name: 'oh-my-claudecode',
  repo: 'Yeachan-Heo/oh-my-claudecode',
  absorbedVersion: 'v0.1.0',
  absorbedAt: new Date('2025-01-28'),
  lastSync: new Date('2025-01-28'),
  improvements: [
    'Parallel async execution (not sequential)',
    'Real-time progress monitoring',
    'Background task support',
  ],
});

// 3. 모든 프로젝트 업데이트 확인
console.log('🔍 Checking for upstream updates...\n');
const updates = await monitor.checkAllUpdates();

// 4. 업데이트 분석
for (const update of updates) {
  console.log(`📦 ${update.project.name} ${update.latestVersion}`);
  console.log(`   Released: ${update.releaseDate.toISOString().split('T')[0]}`);
  console.log(`   Quality Score: ${update.qualityScore}/100`);
  console.log(`   Worth Absorbing: ${update.worthAbsorbing ? '✅ YES' : '❌ NO'}`);

  console.log(`\n   Reasons:`);
  update.reasons.forEach(reason => console.log(`     ${reason}`));

  console.log(`\n   Changelog Preview:`);
  console.log(`     ${update.changelog.substring(0, 200)}...\n`);

  // 5. 흡수 가치가 있으면 GitHub Issue 생성
  if (update.worthAbsorbing) {
    const issueUrl = await monitor.createTrackingIssue(
      update,
      'your-org/flux' // 본인 저장소
    );
    console.log(`   📝 Tracking Issue: ${issueUrl}\n`);
  }
}

// 6. Rate limit 확인
const rateLimit = await monitor.getRateLimit();
console.log(`\n⚡ GitHub API Rate Limit:`);
console.log(`   Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
console.log(`   Resets at: ${rateLimit.reset.toLocaleString()}`);

/*
예상 출력:
🔍 Checking for upstream updates...

📦 claude-mem v2.0.0
   Released: 2026-01-20
   Quality Score: 85/100
   Worth Absorbing: ✅ YES

   Reasons:
     ✅ 3 new feature(s)
     ✅ 5 improvement(s)
     ✅ Score 85/100 - Worth absorbing

   Changelog Preview:
     ## What's Changed
     - Added vector search with ChromaDB
     - Performance improvements: 2x faster queries
     - New memory categorization system...

   📝 Tracking Issue: https://github.com/your-org/flux/issues/42

⚡ GitHub API Rate Limit:
   Remaining: 4998/5000
   Resets at: 1/29/2026, 3:00:00 PM
*/
```

---

## 사용 방법

### CLI 명령어

```bash
# 흡수된 프로젝트 목록 보기
npm run cli absorbed

# 프로젝트 투표 (우선순위 결정)
npm run cli vote planning-with-files

# 투표 순위 확인
npm run cli vote
```

### 프로그래밍 방식

전체 워크플로우 예시:

```typescript
import { QualityEvaluator, ConflictResolver, UpstreamMonitor } from './src/absorption';

// Step 1: 새 프로젝트 평가
const evaluator = new QualityEvaluator({
  existingTools: [...],
  existingFeatures: [...],
  currentComplexity: 50,
});

const score = evaluator.evaluate(projectInfo);

if (score.recommendation === 'reject') {
  console.log('❌ 흡수 거부:', score.reasons);
  process.exit(1);
}

// Step 2: 충돌 감지 및 해결
const resolver = new ConflictResolver(existingTools);
const resolution = resolver.resolve(incomingTools);

if (!resolution.approved) {
  console.log('⚠️  수동 검토 필요:', resolution.conflicts);
  // 수동 검토 후 결정
}

// Step 3: 흡수 실행
console.log('✅ 흡수 승인 -', resolution.strategy.type, '전략 사용');
// ... 실제 코드 통합 작업 ...

// Step 4: 모니터링 등록
const monitor = new UpstreamMonitor(process.env.GITHUB_TOKEN);
monitor.registerAbsorbedProject({
  name: projectInfo.name,
  repo: projectInfo.repo,
  absorbedVersion: 'v1.0.0',
  absorbedAt: new Date(),
  lastSync: new Date(),
  improvements: ['개선사항 1', '개선사항 2'],
});

console.log('🎉 흡수 완료! 지속적 모니터링 시작됨');
```

---

## 흡수 이력

**현재 진행률**: 7/8 프로젝트 완료 (87.5%)

| # | 프로젝트 | 버전 | 날짜 | 점수 | 등급 | 흡수된 도구 |
|---|---------|------|------|------|------|------------|
| 1 | [claude-mem](https://github.com/supermemoryai/claude-mem) | v0.1.0 | 2025-01-28 | 95 | A | 4 tools (memory) |
| 2 | [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) | v0.1.0 | 2025-01-28 | 95 | A | 5 tools (agent) |
| 3 | [planning-with-files](https://github.com/OthmanAdi/planning-with-files) | v0.2.0 | 2026-01-28 | 86 | B+ | 3 tools (planning) |
| 4 | [superpowers](https://github.com/obra/superpowers) | v0.3.0 | 2026-01-28 | 80 | B | 4 tools (TDD) |
| 5 | [agents (wshobson)](https://github.com/wshobson/agents) | v0.4.0 | 2025-01-28 | 85 | B+ | 10 tools (specialist) |
| 6 | guide-system | v0.5.0 | 2025-01-28 | 92 | A- | 2 tools + 5 guides |
| 7 | science-tools | v0.6.0 | 2026-01-28 | 88 | B+ | 6 tools (science) |

**총 34개 도구**: 4 memory + 5 agent + 3 planning + 4 TDD + 10 specialist + 2 guide + 6 science

**평균 품질 점수**: 88.7/100

### 우리의 개선사항

각 프로젝트를 흡수하면서 원본보다 나은 점:

#### 1. claude-mem
- ✅ BM25 search (0.2-0.7ms) vs 원본 vector DB
- ✅ SQLite 통합 vs 파일 저장
- ✅ 통일된 tool schema

#### 2. oh-my-claudecode
- ✅ 병렬 비동기 실행 vs 순차 실행
- ✅ 실시간 progress 모니터링
- ✅ Background task 지원

#### 3. planning-with-files
- ✅ SQLite + 트랜잭션 vs 파일 기반
- ✅ BM25 semantic search
- ✅ Circular dependency 자동 감지
- ✅ Foreign key + cascade delete

#### 4. superpowers (TDD)
- ✅ 경고만 표시 vs 코드 강제 삭제
- ✅ 우리 Planning과 통합
- ✅ 자동 test runner 감지
- ✅ SQLite 히스토리 저장

#### 5. agents (specialist)
- ✅ Planning과 통합 (specialist에게 task 할당)
- ✅ Memory와 통합 (specialist 결과 저장)
- ✅ 병렬 실행 오케스트레이션

#### 6. guide-system
- ✅ 완전히 새로 제작 (영감만 받음)
- ✅ Memory/Agent/Planning과 완전 통합
- ✅ BM25 검색 엔진 통합
- ✅ Interactive learning paths

#### 7. science-tools
- ✅ Python venv 통합
- ✅ Memory와 결과 공유
- ✅ Planning과 workflow 통합
- ✅ Session 기반 상태 관리

---

## 재흡수 시스템

### 현재 상태: ⚠️ 미구현

`UpstreamMonitor` 클래스는 구현되어 있지만, **실제로 사용되는 곳이 없습니다**.

#### 문제점

1. **CLI 통합 없음**: `absorbed` 명령어는 하드코딩된 목록만 표시
2. **자동 실행 없음**: GitHub Actions / Cron job 설정 없음
3. **DB 저장 없음**: 흡수 이력이 SQLite에 저장되지 않음
4. **Issue 생성 미작동**: GitHub Issue 자동 생성 미테스트

#### 개선 필요 사항

아래 [향후 개선 계획](#향후-개선-계획) 섹션 참조

---

## 미흡수 기능 분석

### 🔍 발견 사항: 원본 프로젝트의 많은 기능이 흡수되지 않았습니다

#### 1. oh-my-claudecode - 흡수율: ~15%

**원본 프로젝트**:
- 31+ skills
- 5가지 실행 모드 (Autopilot, Ultrapilot, Swarm, Pipeline, Ecomode)
- 32 specialized agents
- 19 lifecycle hooks
- HUD statusline

**흡수된 것**: 5개 agent tools만 (agent_spawn, agent_status, agent_result, agent_terminate, agent_list)

**미흡수 주요 기능**:
- ❌ Ultrapilot (3-5x 병렬 실행)
- ❌ Swarm mode (shared task pool)
- ❌ Pipeline mode (sequential chain)
- ❌ 19 lifecycle hooks (SessionStart, PostToolUse 등)
- ❌ HUD statusline
- ❌ 30+ skills

#### 2. superpowers - 흡수율: ~20%

**원본 프로젝트**:
- 20+ battle-tested skills
- /superpowers:brainstorm
- /superpowers:write-plan
- /superpowers:execute-plan
- Git worktree 관리
- 완전한 TDD 워크플로우

**흡수된 것**: 4개 TDD tools만 (tdd_red, tdd_green, tdd_refactor, tdd_verify)

**미흡수 주요 기능**:
- ❌ Brainstorm 명령어
- ❌ Write-plan 명령어
- ❌ Execute-plan 명령어
- ❌ Git worktree 통합
- ❌ 20+ skills

#### 3. claude-mem - 흡수율: ~40%

**원본 프로젝트** (thedotmack/claude-mem):
- 5 Lifecycle Hooks (SessionStart → PostToolUse → Summary)
- Web viewer UI (http://localhost:37777)
- ChromaDB vector storage
- Auto-categorization (decisions, bugfixes, features)
- Endless Mode (biomimetic memory)

**흡수된 것**: 4개 memory tools만 (memory_save, memory_recall, memory_list, memory_forget)

**미흡수 주요 기능**:
- ❌ 5 Lifecycle Hooks
- ❌ Web viewer UI
- ❌ ChromaDB vector storage (BM25로 대체)
- ❌ Auto-categorization
- ❌ Endless Mode

#### 4. planning-with-files - 흡수율: ~60%

**원본 프로젝트**:
- 3개 파일 기반 planning (task_plan.md, findings.md, progress.md)
- SessionStart hook
- PostToolUse hook
- PreToolUse hook
- Context recovery system
- Cross-platform support (PowerShell)

**흡수된 것**: 3개 planning tools + SQLite 전환

**미흡수 주요 기능**:
- ❌ findings.md (연구/발견 추적)
- ❌ progress.md (세션 로그)
- ❌ Lifecycle hooks 통합
- ❌ Context recovery system

### 📊 전체 흡수율 요약

| 프로젝트 | 흡수율 | 주요 누락 |
|---------|-------|----------|
| oh-my-claudecode | ~15% | Ultrapilot, Swarm, Pipeline, Hooks, HUD |
| superpowers | ~20% | Brainstorm, Write-plan, Execute-plan, Worktrees |
| claude-mem | ~40% | Hooks, Web UI, ChromaDB, Auto-categorization |
| planning-with-files | ~60% | findings.md, progress.md, hooks, context recovery |
| agents | ~15% | 72개 중 10개만 (나머지 62개 specialist) |
| guide-system | 100% | 영감 기반 완전 재제작 ✅ |
| science-tools | 90% | 대부분 흡수 ✅ |

**평균 흡수율**: ~약 40%

---

## 향후 개선 계획

### Phase 1: 재흡수 시스템 구축 (우선순위: 높음)

#### 1.1 CLI 통합

```typescript
// src/cli.ts에 추가할 명령어

program
  .command('check-updates')
  .description('Check for upstream updates of absorbed projects')
  .option('-a, --auto-approve', 'Auto-approve updates with score >= 80')
  .action(async (options) => {
    const monitor = new UpstreamMonitor(process.env.GITHUB_TOKEN);

    // Load absorbed projects from DB
    const projects = await loadAbsorbedProjects();
    projects.forEach(p => monitor.registerAbsorbedProject(p));

    const updates = await monitor.checkAllUpdates();

    for (const update of updates) {
      console.log(`\n📦 ${update.project.name} ${update.latestVersion}`);
      console.log(`   Score: ${update.qualityScore}/100`);
      console.log(`   ${update.worthAbsorbing ? '✅' : '❌'} ${update.reasons.join(', ')}`);

      if (update.worthAbsorbing && options.autoApprove && update.qualityScore >= 80) {
        await monitor.createTrackingIssue(update, 'your-org/flux');
        console.log(`   ✅ Auto-approved! Issue created.`);
      }
    }
  });

program
  .command('sync-upstream <project>')
  .description('Manually sync with upstream project')
  .action(async (project) => {
    // Manual re-absorption workflow
  });
```

#### 1.2 Database Schema

```sql
-- src/storage/absorption-store.ts에 추가할 스키마

CREATE TABLE IF NOT EXISTS absorbed_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  repo TEXT NOT NULL,
  absorbed_version TEXT NOT NULL,
  absorbed_at DATETIME NOT NULL,
  last_sync DATETIME NOT NULL,
  quality_score INTEGER NOT NULL,
  tools_absorbed INTEGER NOT NULL,
  improvements TEXT NOT NULL -- JSON array
);

CREATE TABLE IF NOT EXISTS upstream_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  version TEXT NOT NULL,
  release_date DATETIME NOT NULL,
  quality_score INTEGER NOT NULL,
  worth_absorbing BOOLEAN NOT NULL,
  reasons TEXT NOT NULL, -- JSON array
  changelog TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES absorbed_projects(id)
);

CREATE INDEX idx_updates_project ON upstream_updates(project_id);
CREATE INDEX idx_updates_date ON upstream_updates(release_date);
```

#### 1.3 GitHub Actions (자동화)

```yaml
# .github/workflows/upstream-monitor.yml

name: Upstream Monitor

on:
  schedule:
    - cron: '0 0 * * 0' # 매주 일요일 자정
  workflow_dispatch: # 수동 실행

jobs:
  check-updates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Check upstream updates
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run cli check-updates --auto-approve

      - name: Create PR for worthy updates
        # GitHub Issue가 생성되면 자동으로 PR 생성 로직
```

### Phase 2: 미흡수 기능 통합 (우선순위: 중간)

#### 2.1 oh-my-claudecode - Lifecycle Hooks

**목표**: 19개 hooks를 FLUX에 통합

```typescript
// src/core/hooks-manager.ts (신규)

export class HooksManager {
  private hooks: Map<HookType, HookHandler[]>;

  registerHook(type: HookType, handler: HookHandler) {
    // SessionStart, PostToolUse, PreToolUse 등
  }

  async executeHooks(type: HookType, context: any) {
    // 등록된 모든 hooks 실행
  }
}

// Gateway에 통합
export class AwesomePluginGateway {
  private hooksManager: HooksManager;

  async onSessionStart() {
    await this.hooksManager.executeHooks('SessionStart', {
      timestamp: new Date(),
      userId: this.sessionId,
    });
  }

  async onPostToolUse(toolName: string, result: any) {
    await this.hooksManager.executeHooks('PostToolUse', {
      toolName,
      result,
      timestamp: new Date(),
    });
  }
}
```

#### 2.2 superpowers - Brainstorm/Plan/Execute

**목표**: 워크플로우 명령어 추가

```typescript
// src/features/workflow/workflow-manager.ts (신규)

export class WorkflowManager {
  async brainstorm(topic: string): Promise<BrainstormResult> {
    // Interactive brainstorming session
    // Memory에 저장, Planning과 연동
  }

  async writePlan(requirements: string): Promise<Plan> {
    // Create implementation plan
    // Planning system 활용
  }

  async executePlan(planId: string): Promise<ExecutionResult> {
    // Execute plan with Agent orchestration
    // TDD workflow 통합
  }
}

// Tools 정의
const workflowTools: ToolMetadata[] = [
  {
    name: 'workflow_brainstorm',
    description: 'Interactive brainstorming and design refinement',
    serverId: 'internal:workflow',
    inputSchema: BrainstormInputSchema,
  },
  {
    name: 'workflow_write_plan',
    description: 'Create detailed implementation plan',
    serverId: 'internal:workflow',
    inputSchema: WritePlanInputSchema,
  },
  {
    name: 'workflow_execute_plan',
    description: 'Execute plan with agent orchestration',
    serverId: 'internal:workflow',
    inputSchema: ExecutePlanInputSchema,
  },
];
```

#### 2.3 planning-with-files - Context Recovery

**목표**: findings.md, progress.md 개념 통합

```typescript
// src/features/planning/planning-manager.ts에 추가

export class PlanningManager {
  // 기존: planning_create, planning_update, planning_tree

  // 신규 tools
  async recordFinding(finding: {
    category: 'research' | 'decision' | 'discovery' | 'blocker';
    title: string;
    content: string;
    tags?: string[];
  }): Promise<void> {
    // findings 저장 (SQLite)
    await this.store.saveFinding(finding);

    // Memory와 자동 동기화
    await this.gateway.memoryManager.handleToolCall('memory_save', {
      key: `finding_${Date.now()}`,
      value: finding.content,
      metadata: { category: 'finding', ...finding },
    });
  }

  async recordProgress(log: {
    action: string;
    result: 'success' | 'failure' | 'partial';
    details: string;
  }): Promise<void> {
    // progress.md 개념을 SQLite로
    await this.store.saveProgressLog(log);
  }

  async recoverContext(sessionId?: string): Promise<ContextRecovery> {
    // Context window가 꽉 찼을 때 복구
    const findings = await this.store.getRecentFindings(10);
    const progress = await this.store.getProgressLogs(sessionId);
    const todos = await this.store.getInProgressTodos();

    return { findings, progress, todos };
  }
}

// Tools 정의
const contextTools: ToolMetadata[] = [
  {
    name: 'planning_record_finding',
    description: 'Record research finding, decision, or discovery',
    serverId: 'internal:planning',
    inputSchema: FindingInputSchema,
  },
  {
    name: 'planning_record_progress',
    description: 'Log session progress and actions',
    serverId: 'internal:planning',
    inputSchema: ProgressInputSchema,
  },
  {
    name: 'planning_recover_context',
    description: 'Recover context after /clear or session restart',
    serverId: 'internal:planning',
    inputSchema: RecoverContextInputSchema,
  },
];
```

### Phase 3: 추가 프로젝트 흡수 (우선순위: 낮음)

#### 3.1 후보 프로젝트

| 프로젝트 | 예상 점수 | 흡수 가치 | 이유 |
|---------|----------|----------|------|
| claude-code-vscode | 85 | 높음 | IDE 통합 |
| claude-code-hooks | 80 | 높음 | Lifecycle hooks |
| claude-context-manager | 78 | 중간 | Context 관리 |
| claude-git-tools | 75 | 중간 | Git 자동화 |

#### 3.2 평가 및 흡수 프로세스

```bash
# 1. 품질 평가
npm run cli evaluate claude-code-vscode

# 2. 충돌 분석
npm run cli analyze-conflicts claude-code-vscode

# 3. 흡수 승인
npm run cli approve-absorption claude-code-vscode

# 4. 자동 흡수 (코드 생성)
npm run cli absorb claude-code-vscode --auto-generate

# 5. 모니터링 등록
npm run cli register-upstream claude-code-vscode
```

---

## 참고 문서

- [ARCHITECTURE.md](ARCHITECTURE.md) - FLUX 전체 아키텍처
- [CHANGELOG.md](../CHANGELOG.md) - v0.1.1 Absorption Infrastructure 섹션
- [README.md](../README.md) - 흡수된 프로젝트 Acknowledgments

---

## Sources

- [oh-my-claudecode GitHub](https://github.com/Yeachan-Heo/oh-my-claudecode)
- [superpowers GitHub](https://github.com/obra/superpowers)
- [claude-mem GitHub](https://github.com/thedotmack/claude-mem)
- [planning-with-files GitHub](https://github.com/OthmanAdi/planning-with-files)

---

**📅 최종 업데이트**: 2026-01-29
**📝 작성자**: FLUX Team
**📧 문의**: [GitHub Issues](https://github.com/yourusername/flux/issues)
