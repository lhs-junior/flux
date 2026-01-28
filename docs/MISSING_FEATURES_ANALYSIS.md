# 🔍 미흡수 기능 분석 및 개선 로드맵

> 원본 프로젝트들의 뛰어난 기능 중 아직 FLUX에 통합되지 않은 것들을 분석하고 우선순위를 정합니다.

## 📊 Executive Summary

**핵심 발견**: FLUX는 평균 **40%만 흡수**했습니다. 60%의 강력한 기능들이 아직 남아있습니다.

| 프로젝트 | 흡수율 | 미흡수 핵심 기능 | 잠재적 가치 |
|---------|-------|-----------------|-----------|
| oh-my-claudecode | 15% | Ultrapilot, Hooks, HUD | ⭐⭐⭐⭐⭐ |
| superpowers | 20% | Workflow commands | ⭐⭐⭐⭐⭐ |
| claude-mem | 40% | Lifecycle hooks, Web UI | ⭐⭐⭐⭐ |
| planning-with-files | 60% | Context recovery | ⭐⭐⭐ |
| agents | 15% | 62개 specialist types | ⭐⭐⭐ |

---

## 1. oh-my-claudecode - 가장 큰 잠재력 (흡수율: 15%)

### 현재 상태

**흡수된 것**:
- ✅ agent_spawn
- ✅ agent_status
- ✅ agent_result
- ✅ agent_terminate
- ✅ agent_list

### 미흡수 기능 상세

#### 1.1 실행 모드 (5가지)

##### 🚀 Ultrapilot Mode
- **설명**: 3-5x 병렬 실행으로 작업 속도 극대화
- **원리**: 최대 5개의 concurrent worker가 프로젝트의 다른 부분을 동시에 처리
- **예시**:
  ```bash
  User: "Build a full-stack app with auth, API, and frontend"

  Ultrapilot:
  Worker 1: Setting up backend API structure
  Worker 2: Implementing authentication
  Worker 3: Building frontend components
  Worker 4: Writing tests
  Worker 5: Setting up deployment configs

  Result: 5x faster than sequential execution
  ```
- **FLUX 통합 방법**:
  ```typescript
  // src/features/agents/execution-modes/ultrapilot.ts
  export class UltrapilotMode {
    private maxWorkers = 5;
    private workQueue: Task[];

    async execute(tasks: Task[]): Promise<Result[]> {
      const workers = Array(this.maxWorkers).fill(null).map((_, i) =>
        this.spawnWorker(i)
      );

      return Promise.all(workers.map(w => w.run()));
    }
  }
  ```
- **우선순위**: ⭐⭐⭐⭐⭐ (최고)

##### 🐝 Swarm Mode
- **설명**: N개 agent가 shared task pool에서 작업을 claim하고 실행
- **원리**: 각 agent가 atomic task를 claim → 실행 → 완료 표시 (5분 timeout)
- **예시**:
  ```bash
  Task Pool: [Fix bug #1, Add feature #2, Write test #3, ...]

  Agent A: Claims "Fix bug #1" → Working...
  Agent B: Claims "Add feature #2" → Working...
  Agent C: Waiting for available task...
  Agent A: ✅ Completed "Fix bug #1"
  Agent A: Claims "Write test #3" → Working...
  ```
- **FLUX 통합 방법**:
  ```typescript
  // src/features/agents/execution-modes/swarm.ts
  export class SwarmMode {
    private taskPool: TaskPool;
    private agents: Agent[];

    async execute(tasks: Task[]): Promise<void> {
      this.taskPool = new TaskPool(tasks);

      await Promise.all(
        this.agents.map(agent => this.runAgent(agent))
      );
    }

    private async runAgent(agent: Agent) {
      while (!this.taskPool.isEmpty()) {
        const task = this.taskPool.claim(agent.id);
        if (task) {
          await agent.execute(task);
          this.taskPool.markComplete(task.id);
        }
      }
    }
  }
  ```
- **우선순위**: ⭐⭐⭐⭐

##### 🔗 Pipeline Mode
- **설명**: Agent들을 순차적으로 체인, 각 단계의 출력이 다음 단계의 입력
- **원리**: Built-in preset (review → implement → debug → refactor)
- **예시**:
  ```bash
  Pipeline: review → implement → debug → refactor

  Stage 1 (Review): Analyze requirements → Output: Design document
  Stage 2 (Implement): Code from design → Output: Initial code
  Stage 3 (Debug): Run tests, fix errors → Output: Working code
  Stage 4 (Refactor): Clean up, optimize → Output: Production code
  ```
- **FLUX 통합 방법**:
  ```typescript
  // src/features/agents/execution-modes/pipeline.ts
  export class PipelineMode {
    async execute(stages: Stage[], input: any): Promise<any> {
      let currentInput = input;

      for (const stage of stages) {
        console.log(`🔗 Running stage: ${stage.name}`);
        currentInput = await this.runStage(stage, currentInput);
      }

      return currentInput;
    }
  }

  // Preset pipelines
  const PRESETS = {
    development: ['review', 'implement', 'debug', 'refactor'],
    deployment: ['test', 'build', 'deploy', 'verify'],
    refactor: ['analyze', 'plan', 'refactor', 'test'],
  };
  ```
- **우선순위**: ⭐⭐⭐⭐

##### 💰 Ecomode
- **설명**: 비용 최적화된 병렬 실행 (작은 agent, 엄격한 budget)
- **원리**: Haiku model + tight budget control로 30-50% 비용 절감
- **예시**:
  ```bash
  Budget: $0.50
  Model: Haiku (cheap, fast)
  Workers: 2 (reduced from 5)

  Cost tracking: $0.12 / $0.50 used
  ```
- **FLUX 통합 방법**:
  ```typescript
  // src/features/agents/execution-modes/ecomode.ts
  export class EcoMode {
    private budget: number;
    private spent: number = 0;

    async execute(tasks: Task[]): Promise<Result[]> {
      const workers = 2; // Reduced workers
      const model = 'haiku'; // Cheaper model

      // Monitor budget
      const results = [];
      for (const task of tasks) {
        if (this.spent >= this.budget) break;

        const cost = await this.estimateCost(task, model);
        if (this.spent + cost > this.budget) break;

        const result = await this.executeTask(task, model);
        this.spent += cost;
        results.push(result);
      }

      return results;
    }
  }
  ```
- **우선순위**: ⭐⭐⭐

#### 1.2 Lifecycle Hooks (19개)

**현재 FLUX**: 0개 hooks

**oh-my-claudecode**: 19개 hooks로 모든 이벤트 커버

| Hook | 설명 | 사용 예시 |
|------|------|----------|
| SessionStart | 세션 시작 시 | Context 복구, 환경 설정 |
| SessionEnd | 세션 종료 시 | 정리, 로그 저장 |
| UserPromptSubmit | 사용자 입력 후 | 입력 전처리, validation |
| PostToolUse | Tool 실행 후 | 결과 기록, 다음 작업 제안 |
| PreToolUse | Tool 실행 전 | 권한 확인, 사전 조건 체크 |
| ErrorOccurred | 에러 발생 시 | 복구 시도, 로그 |
| ContextFull | Context 초과 시 | 자동 요약, 파일 저장 |
| ... | 12개 더 | ... |

**통합 방법**:
```typescript
// src/core/hooks-manager.ts (신규)
export type HookType =
  | 'SessionStart'
  | 'SessionEnd'
  | 'UserPromptSubmit'
  | 'PostToolUse'
  | 'PreToolUse'
  | 'ErrorOccurred'
  | 'ContextFull'
  | ... // 19 types total

export interface HookContext {
  type: HookType;
  timestamp: Date;
  data: any;
  gateway: AwesomePluginGateway;
}

export type HookHandler = (context: HookContext) => Promise<void>;

export class HooksManager {
  private hooks = new Map<HookType, HookHandler[]>();

  register(type: HookType, handler: HookHandler): void {
    if (!this.hooks.has(type)) {
      this.hooks.set(type, []);
    }
    this.hooks.get(type)!.push(handler);
  }

  async execute(type: HookType, data: any): Promise<void> {
    const handlers = this.hooks.get(type) || [];

    const context: HookContext = {
      type,
      timestamp: new Date(),
      data,
      gateway: this.gateway,
    };

    for (const handler of handlers) {
      try {
        await handler(context);
      } catch (error) {
        logger.error(`Hook ${type} failed:`, error);
      }
    }
  }
}

// Gateway 통합
export class AwesomePluginGateway {
  private hooksManager: HooksManager;

  async start(): Promise<void> {
    await this.hooksManager.execute('SessionStart', {
      sessionId: this.sessionId,
      userId: this.userId,
    });

    // ... existing start logic
  }

  async handleToolCall(serverId: string, toolName: string, args: any) {
    // PreToolUse hook
    await this.hooksManager.execute('PreToolUse', {
      serverId,
      toolName,
      args,
    });

    const result = await this.executeToolCall(serverId, toolName, args);

    // PostToolUse hook
    await this.hooksManager.execute('PostToolUse', {
      serverId,
      toolName,
      args,
      result,
    });

    return result;
  }
}

// Example: Auto-update planning on tool use
hooksManager.register('PostToolUse', async (context) => {
  if (['Write', 'Edit'].includes(context.data.toolName)) {
    // Remind to update task_plan.md
    logger.info('💡 Don\'t forget to update your planning!');
  }
});
```

**우선순위**: ⭐⭐⭐⭐⭐ (최고)

#### 1.3 HUD Statusline

**설명**: 실시간 상태 표시 (진행 중인 작업, 토큰 사용량, 비용 등)

**예시**:
```
╔══════════════════════════════════════════════════════════╗
║ FLUX Status                                              ║
║ Active Tasks: 3/5 | Tokens: 1.2K/8K | Cost: $0.05       ║
║ ● Worker 1: Implementing auth (45%)                      ║
║ ● Worker 2: Writing tests (80%)                          ║
║ ● Worker 3: Setting up DB (20%)                          ║
╚══════════════════════════════════════════════════════════╝
```

**통합 방법**:
```typescript
// src/core/hud-statusline.ts (신규)
export class HUDStatusline {
  private stats = {
    activeTasks: 0,
    totalTasks: 0,
    tokensUsed: 0,
    tokensLimit: 8000,
    cost: 0,
  };

  update(stats: Partial<typeof this.stats>): void {
    Object.assign(this.stats, stats);
    this.render();
  }

  private render(): void {
    const bar = this.generateProgressBar();
    console.log('\n' + '═'.repeat(60));
    console.log(`Active: ${this.stats.activeTasks}/${this.stats.totalTasks}`);
    console.log(`Tokens: ${this.stats.tokensUsed}/${this.stats.tokensLimit}`);
    console.log(`Cost: $${this.stats.cost.toFixed(2)}`);
    console.log(bar);
    console.log('═'.repeat(60) + '\n');
  }
}
```

**우선순위**: ⭐⭐⭐

#### 1.4 31+ Skills

**현재**: 34개 tools (memory 4 + agent 5 + planning 3 + TDD 4 + specialist 10 + guide 2 + science 6)

**oh-my-claudecode**: 31+ additional skills
- 코드 리뷰 자동화
- Git 작업 자동화
- 문서 생성
- 성능 분석
- 보안 스캔
- ...

**우선순위**: ⭐⭐ (낮음, 이미 많은 tool 보유)

---

## 2. superpowers - 워크플로우 자동화 (흡수율: 20%)

### 현재 상태

**흡수된 것**:
- ✅ tdd_red
- ✅ tdd_green
- ✅ tdd_refactor
- ✅ tdd_verify

### 미흡수 기능 상세

#### 2.1 Workflow Commands

##### /superpowers:brainstorm

**설명**: 대화형 brainstorming + 디자인 정제

**예시**:
```bash
User: /superpowers:brainstorm "User authentication system"

Claude: Let's explore this together. What type of authentication?
1. Email/Password
2. OAuth (Google, GitHub)
3. Magic Link
4. Multi-factor

User: 1 and 2

Claude: Great! Let's discuss security...
- Password hashing: bcrypt or argon2?
- Session management: JWT or session cookies?
- Rate limiting on login attempts?

[30 minutes of interactive refinement]

Result:
✅ Design document saved to memory
✅ 15 findings recorded
✅ Implementation plan drafted
```

**통합 방법**:
```typescript
// src/features/workflow/brainstorm.ts
export class BrainstormSession {
  async start(topic: string): Promise<BrainstormResult> {
    const session = {
      topic,
      questions: this.generateQuestions(topic),
      decisions: [],
      findings: [],
    };

    // Interactive Q&A
    for (const question of session.questions) {
      const answer = await this.askUser(question);
      session.decisions.push({ question, answer });
    }

    // Generate design doc
    const design = await this.synthesize(session);

    // Save to memory
    await this.gateway.memoryManager.save({
      key: `brainstorm_${topic}`,
      value: design,
      metadata: { type: 'design', session },
    });

    // Create planning tasks
    await this.gateway.planningManager.createFromDesign(design);

    return { design, session };
  }
}

// Tool definition
{
  name: 'workflow_brainstorm',
  description: 'Interactive brainstorming and design refinement',
  serverId: 'internal:workflow',
  inputSchema: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Topic to brainstorm' },
      duration: { type: 'number', description: 'Session duration (minutes)' },
    },
    required: ['topic'],
  },
}
```

**우선순위**: ⭐⭐⭐⭐⭐

##### /superpowers:write-plan

**설명**: 상세한 구현 계획 생성

**예시**:
```bash
User: /superpowers:write-plan "Build user auth system"

Claude: Analyzing requirements...

Plan Generated:

Phase 1: Database Setup (2 hours)
  ✓ Create users table
  ✓ Add password_hash column
  ✓ Create sessions table

Phase 2: Backend API (4 hours)
  ✓ POST /auth/register
  ✓ POST /auth/login
  ✓ POST /auth/logout
  ✓ GET /auth/me

Phase 3: Frontend (3 hours)
  ✓ Login form component
  ✓ Register form component
  ✓ Auth context provider

Phase 4: Testing (2 hours)
  ✓ Unit tests for auth service
  ✓ Integration tests for API
  ✓ E2E tests for login flow

Estimated Total: 11 hours

✅ Plan saved to Planning system
✅ 12 TODO tasks created
✅ Dependencies configured
```

**통합 방법**:
```typescript
// src/features/workflow/write-plan.ts
export class PlanWriter {
  async writePlan(requirements: string): Promise<Plan> {
    // Analyze complexity
    const complexity = await this.analyzeComplexity(requirements);

    // Break into phases
    const phases = await this.breakIntoPhases(requirements, complexity);

    // Estimate effort
    const estimates = phases.map(p => this.estimateEffort(p));

    // Generate plan
    const plan: Plan = {
      title: requirements,
      phases,
      estimates,
      totalHours: estimates.reduce((sum, e) => sum + e.hours, 0),
    };

    // Save to Planning
    for (const phase of phases) {
      await this.planningManager.create({
        content: phase.title,
        tags: ['plan', 'phase'],
        metadata: { estimate: phase.estimate },
      });

      for (const task of phase.tasks) {
        await this.planningManager.create({
          content: task,
          parentId: phase.id,
          tags: ['task'],
        });
      }
    }

    return plan;
  }
}
```

**우선순위**: ⭐⭐⭐⭐⭐

##### /superpowers:execute-plan

**설명**: 계획을 agent orchestration으로 실행

**예시**:
```bash
User: /superpowers:execute-plan plan_12345

Claude: Executing plan...

Batch 1 (Parallel):
  ● Agent A: Creating users table
  ● Agent B: Setting up test framework

Batch 1 Complete ✅ (2 min)

Batch 2 (Sequential):
  ● Agent C: Implementing /auth/register
  ● Wait for completion...
  ● Agent C: Implementing /auth/login

Batch 2 Complete ✅ (15 min)

...

Plan Execution Complete! ✅
  Duration: 45 minutes
  Tasks completed: 12/12
  Tests passing: 28/28
```

**통합 방법**:
```typescript
// src/features/workflow/execute-plan.ts
export class PlanExecutor {
  async execute(planId: string): Promise<ExecutionResult> {
    const plan = await this.planningManager.get(planId);
    const tasks = await this.planningManager.getChildren(planId);

    // Group into batches (parallel vs sequential)
    const batches = this.groupIntoBatches(tasks);

    for (const batch of batches) {
      if (batch.mode === 'parallel') {
        // Use Ultrapilot for parallel execution
        await this.ultrapilot.execute(batch.tasks);
      } else {
        // Sequential execution
        for (const task of batch.tasks) {
          await this.executeTask(task);
        }
      }
    }

    // Run tests
    await this.tddManager.verify();

    return { success: true, duration: elapsed };
  }
}
```

**우선순위**: ⭐⭐⭐⭐⭐

#### 2.2 Git Worktree Integration

**설명**: 각 feature를 isolated git branch에서 작업

**예시**:
```bash
User: "Start new feature: user-profile"

Superpowers:
  ✓ git worktree add features/user-profile
  ✓ cd features/user-profile
  ✓ Start TDD cycle

  ... work in isolation ...

  ✓ Tests pass
  ✓ git commit
  ✓ Return to main worktree
```

**통합 방법**:
```typescript
// src/features/workflow/git-worktree.ts
export class GitWorktreeManager {
  async startFeature(name: string): Promise<void> {
    await this.exec(`git worktree add features/${name}`);
    process.chdir(`features/${name}`);

    // Track in planning
    await this.planningManager.create({
      content: name,
      tags: ['feature', 'worktree'],
      metadata: { path: `features/${name}` },
    });
  }

  async finishFeature(name: string): Promise<void> {
    // Run tests
    await this.tddManager.verify();

    // Commit
    await this.exec('git add .');
    await this.exec(`git commit -m "feat: ${name}"`);

    // Return to main
    process.chdir('../..');
    await this.exec(`git worktree remove features/${name}`);
  }
}
```

**우선순위**: ⭐⭐⭐

---

## 3. claude-mem - Context 관리 (흡수율: 40%)

### 미흡수 기능

#### 3.1 Lifecycle Hooks (5개)

**설명**: SessionStart → PostToolUse → Summary → SessionEnd

이미 [1.2 Lifecycle Hooks](#12-lifecycle-hooks-19개)에서 설명됨.

**우선순위**: ⭐⭐⭐⭐⭐

#### 3.2 Web Viewer UI

**설명**: http://localhost:37777 에서 memory 탐색

**예시**:
```
┌─────────────────────────────────────────┐
│ Claude Memory Viewer                    │
├─────────────────────────────────────────┤
│ Search: [_______________] 🔍            │
│                                         │
│ Categories:                             │
│ ● Decisions (23)                        │
│ ● Bugfixes (45)                         │
│ ● Features (67)                         │
│ ● Discoveries (12)                      │
│                                         │
│ Recent Memories:                        │
│ [2026-01-29] User auth system design    │
│ [2026-01-28] Fixed memory leak in...    │
│ [2026-01-27] Discovered BM25 is 10x...  │
└─────────────────────────────────────────┘
```

**통합 방법**:
```typescript
// src/features/memory/web-viewer/server.ts
import express from 'express';

export class MemoryWebViewer {
  private app = express();

  async start(port = 37777): Promise<void> {
    this.app.get('/api/memories', async (req, res) => {
      const memories = await this.memoryManager.list({
        limit: 100,
        category: req.query.category,
      });
      res.json(memories);
    });

    this.app.get('/api/search', async (req, res) => {
      const results = await this.memoryManager.recall({
        query: req.query.q,
        limit: 50,
      });
      res.json(results);
    });

    this.app.listen(port, () => {
      console.log(`📊 Memory Viewer: http://localhost:${port}`);
    });
  }
}
```

**우선순위**: ⭐⭐⭐

#### 3.3 Auto-Categorization

**설명**: Memory를 자동으로 분류 (decisions, bugfixes, features, discoveries)

**통합 방법**:
```typescript
// src/features/memory/categorizer.ts
export class MemoryCategorizer {
  categorize(content: string): Category {
    const lower = content.toLowerCase();

    if (lower.includes('decide') || lower.includes('choose')) {
      return 'decision';
    }
    if (lower.includes('fix') || lower.includes('bug')) {
      return 'bugfix';
    }
    if (lower.includes('feature') || lower.includes('implement')) {
      return 'feature';
    }
    if (lower.includes('discover') || lower.includes('found')) {
      return 'discovery';
    }

    return 'general';
  }
}

// Auto-apply in memory_save
async save(input: MemorySaveInput) {
  const category = this.categorizer.categorize(input.value);

  await this.store.save({
    ...input,
    metadata: {
      ...input.metadata,
      category, // Auto-added
    },
  });
}
```

**우선순위**: ⭐⭐⭐

---

## 4. planning-with-files - Context Recovery (흡수율: 60%)

### 미흡수 기능

#### 4.1 findings.md 개념

**설명**: 연구, 발견, 결정을 별도 추적

**예시**:
```markdown
# Findings

## 2026-01-29: Database Choice
**Decision**: PostgreSQL over MongoDB
**Reason**: Need ACID compliance for financial data
**Impact**: High - affects entire architecture

## 2026-01-28: Performance Discovery
**Finding**: BM25 is 10x faster than ChromaDB for our use case
**Evidence**: Benchmark results in /benchmarks
**Action**: Migrate to BM25
```

**통합 방법**:
```typescript
// src/features/planning/findings.ts
export class FindingsTracker {
  async recordFinding(finding: {
    type: 'decision' | 'discovery' | 'blocker' | 'research';
    title: string;
    content: string;
    impact: 'high' | 'medium' | 'low';
    evidence?: string;
  }): Promise<void> {
    // Save to SQLite
    await this.store.saveFinding(finding);

    // Auto-save to Memory
    await this.memoryManager.save({
      key: `finding_${Date.now()}`,
      value: finding.content,
      metadata: { type: 'finding', ...finding },
    });
  }

  async getRecentFindings(limit = 10): Promise<Finding[]> {
    return this.store.getFindings({ limit, orderBy: 'created_at DESC' });
  }
}

// Tool
{
  name: 'planning_record_finding',
  description: 'Record important finding, decision, or discovery',
  serverId: 'internal:planning',
}
```

**우선순위**: ⭐⭐⭐⭐

#### 4.2 progress.md 개념

**설명**: 세션 로그, 실행 결과 추적

**예시**:
```markdown
# Progress Log

## Session 2026-01-29 14:30

✅ Implemented user registration endpoint
   - POST /auth/register
   - Tests: 5/5 passing
   - Duration: 15 minutes

❌ Failed: Email validation
   - Error: Invalid regex pattern
   - Fixed: Updated to RFC 5322 standard
   - Tests: 2/2 passing now

⚠️  Partial: Password strength check
   - Implemented basic check
   - TODO: Add zxcvbn library for better checking
```

**통합 방법**:
```typescript
// src/features/planning/progress.ts
export class ProgressTracker {
  async recordProgress(log: {
    action: string;
    result: 'success' | 'failure' | 'partial';
    details: string;
    duration?: number;
  }): Promise<void> {
    await this.store.saveProgressLog({
      ...log,
      sessionId: this.sessionId,
      timestamp: new Date(),
    });
  }

  async getSessionProgress(sessionId?: string): Promise<ProgressLog[]> {
    return this.store.getProgressLogs({
      sessionId: sessionId || this.sessionId,
      orderBy: 'timestamp DESC',
    });
  }
}

// Tool
{
  name: 'planning_record_progress',
  description: 'Log progress, actions, and results',
  serverId: 'internal:planning',
}
```

**우선순위**: ⭐⭐⭐

#### 4.3 Context Recovery System

**설명**: Context window 초과 시 자동 복구

**예시**:
```bash
User: /clear (context window full)

# Next session
Claude: 🔄 Recovering context...

Loaded from storage:
  ✓ 5 in-progress tasks
  ✓ 12 recent findings
  ✓ Last 20 progress logs
  ✓ 3 active agent sessions

Context recovered! You can continue where you left off.
```

**통합 방법**:
```typescript
// src/core/context-recovery.ts
export class ContextRecovery {
  async recoverContext(): Promise<RecoveredContext> {
    // Load from Planning
    const todos = await this.planningManager.getInProgressTodos();
    const findings = await this.findingsTracker.getRecentFindings(10);
    const progress = await this.progressTracker.getSessionProgress();

    // Load from Memory
    const recentMemories = await this.memoryManager.list({ limit: 20 });

    // Load from Agents
    const activeAgents = await this.agentOrchestrator.listActiveAgents();

    return {
      todos,
      findings,
      progress,
      recentMemories,
      activeAgents,
    };
  }
}

// SessionStart hook
hooksManager.register('SessionStart', async () => {
  const context = await contextRecovery.recoverContext();

  console.log('🔄 Context Recovered:');
  console.log(`  ✓ ${context.todos.length} in-progress tasks`);
  console.log(`  ✓ ${context.findings.length} recent findings`);
  console.log(`  ✓ ${context.activeAgents.length} active agents`);
});
```

**우선순위**: ⭐⭐⭐⭐

---

## 5. agents (wshobson) - Specialist Types (흡수율: 15%)

### 현재 상태

**흡수된 것**: 10개 specialist types
- specialist_researcher
- specialist_analyst
- specialist_strategist
- specialist_designer
- specialist_coder
- specialist_teacher
- specialist_writer
- specialist_debugger
- specialist_reviewer
- specialist_optimizer

### 미흡수 기능

**원본 프로젝트**: 72개 specialist types 제공

**미흡수**: 62개 types (DevOps, Security, Data Science, ML, Product Manager 등)

**우선순위**: ⭐⭐⭐ (중간 - 이미 10개 보유, 더 추가는 선택적)

---

## 🎯 우선순위 통합 로드맵

### Phase 1: 핵심 인프라 (Q1 2026)

**목표**: 가장 큰 가치를 제공하는 기능 먼저

| 기능 | 우선순위 | 예상 기간 | 예상 가치 |
|-----|---------|----------|----------|
| Lifecycle Hooks (19개) | ⭐⭐⭐⭐⭐ | 2주 | 전 시스템 이벤트 커버 |
| Workflow Commands | ⭐⭐⭐⭐⭐ | 3주 | 자동화 10x 개선 |
| Ultrapilot Mode | ⭐⭐⭐⭐⭐ | 2주 | 실행 속도 5x |
| Context Recovery | ⭐⭐⭐⭐ | 1주 | UX 크게 개선 |

**총 예상 기간**: 8주

### Phase 2: 실행 모드 확장 (Q2 2026)

| 기능 | 우선순위 | 예상 기간 |
|-----|---------|----------|
| Swarm Mode | ⭐⭐⭐⭐ | 1주 |
| Pipeline Mode | ⭐⭐⭐⭐ | 1주 |
| findings.md 통합 | ⭐⭐⭐⭐ | 1주 |
| Ecomode | ⭐⭐⭐ | 1주 |

**총 예상 기간**: 4주

### Phase 3: 고급 기능 (Q3 2026)

| 기능 | 우선순위 | 예상 기간 |
|-----|---------|----------|
| Web Viewer UI | ⭐⭐⭐ | 2주 |
| Auto-Categorization | ⭐⭐⭐ | 1주 |
| progress.md 통합 | ⭐⭐⭐ | 1주 |
| Git Worktree | ⭐⭐⭐ | 1주 |
| HUD Statusline | ⭐⭐⭐ | 1주 |

**총 예상 기간**: 6주

### Phase 4: 선택적 기능 (Q4 2026)

| 기능 | 우선순위 | 예상 기간 |
|-----|---------|----------|
| 추가 Specialist Types | ⭐⭐ | 2주 |
| oh-my-claudecode Skills | ⭐⭐ | 3주 |

**총 예상 기간**: 5주

---

## 📈 예상 효과

### 통합 완료 시 (2026 Q4)

**흡수율 향상**:
- oh-my-claudecode: 15% → 85% (+70%)
- superpowers: 20% → 90% (+70%)
- claude-mem: 40% → 85% (+45%)
- planning-with-files: 60% → 95% (+35%)

**평균 흡수율**: 40% → **88%** (+48%)

**기능 확장**:
- 현재: 34 tools
- 예상: 50+ tools (+47%)
- 실행 모드: 1개 → 5개 (5x)
- Hooks: 0개 → 19개 (완전한 lifecycle 커버)

**성능 향상**:
- 병렬 실행: 5x faster (Ultrapilot)
- Context 관리: 무한 확장 (Recovery system)
- 자동화: 10x (Workflow commands)

---

## Sources

- [oh-my-claudecode GitHub](https://github.com/Yeachan-Heo/oh-my-claudecode)
- [oh-my-claudecode Website](https://yeachan-heo.github.io/oh-my-claudecode-website/)
- [superpowers GitHub](https://github.com/obra/superpowers)
- [claude-mem GitHub](https://github.com/thedotmack/claude-mem)
- [planning-with-files GitHub](https://github.com/OthmanAdi/planning-with-files)

---

**📅 최종 업데이트**: 2026-01-29
