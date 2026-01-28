# Fusion System - Developer Guide

Fusion is the intelligent coordination layer that enables automatic, seamless integration between FLUX features through smart event-driven hooks and context recovery.

> **Fusion = 똑똑한 협력** (Smart Cooperation), not parallelism or code merging. One cohesive workflow emerges from coordinated features.

## What is Fusion?

Fusion automatically connects features so they work together intelligently. When one feature completes a task, the next feature automatically starts with the context it needs—without manual coordination.

**Example flow**:
```
User creates TODO → Automatically spawns Agent → Agent finishes → Automatically runs Tests → Tests complete → Automatically saves to Memory

All without the user typing commands between each step!
```

## Why Fusion?

### 1. Token Savings
By automatically coordinating features, Fusion eliminates redundant context passing and reduces the total conversation needed.

**Example**: Without Fusion, a workflow might be:
```
User: "Create a TODO to add authentication"                    [500 tokens]
Claude: "TODO created. Now spawn an agent to implement it?"
User: "Spawn coder agent to implement authentication"          [1200 tokens]
Claude: "Agent spawned. Now run tests?"
User: "Run tests on auth implementation"                       [800 tokens]
Total: 2500+ tokens
```

With Fusion:
```
User: "Create a TODO to add authentication"                    [500 tokens]
Claude: All steps execute automatically via fusion hooks
Total: 500 tokens (80% reduction!)
```

### 2. Automatic Connections
Features automatically trigger each other through hooks. No need to manually remember which features to call next or pass context between them—Fusion handles it.

### 3. Better User Experience
Users describe *what they want to accomplish*, not how to sequence tool calls. The system figures out the optimal workflow automatically.

## Fusion Levels (0-4)

Fusion levels describe the depth of integration between features:

### Level 0: No Integration
Features work independently with no awareness of each other.
```
Memory → (no connection) → Agents
Planning → (no connection) → TDD
```

### Level 1: Basic Integration
Simple data passing in one direction. Features know about each other but don't automatically trigger.
```
Planning creates TODO → [manual] → Agent picks up TODO
Data flows one way, manual triggering
```

### Level 2: Medium Integration
Shared context and automatic triggers. One feature completes, the next automatically starts with needed context.
```
Planning creates TODO
  ↓ (automatic hook)
Agent receives TODO with context
  ↓ (automatic hook)
TDD receives agent output
```

### Level 3: Advanced Integration
Deep hooks, bidirectional data flow, state synchronization across features.
```
Planning ←→ (bidirectional hooks) ←→ Agents
  ↓                                      ↓
Memory ←→ (bidirectional) ←→ TDD
Shared state across all features
```

### Level 4: Full Fusion
Seamless unified experience where features merge into a cohesive workflow that feels like a single system.
```
User input → Unified Workflow Engine
  ├─ Auto-routes through features
  ├─ Auto-coordinates execution
  ├─ Auto-passes context
  ├─ Auto-manages state recovery
  └─ Returns unified result
```

**FLUX currently implements**: Level 3 (Advanced Integration) with the Fusion System.

## Implemented Fusions

### 1. Lifecycle Hooks Fusion
**Location**: `src/fusion/implementations/lifecycle-hooks-fusion.ts`

**What it does**: Provides event-based automatic connections between all features through lifecycle hooks.

**Hook Types**:
- `SessionStart` - Session begins, restore previous context
- `SessionEnd` - Session ends, save state
- `UserPromptSubmit` - User submits input
- `PreToolUse` / `PostToolUse` - Tool execution hooks
- `PlanningCompleted` - Planning creates TODOs
- `AgentStarted` / `AgentCompleted` - Agent lifecycle
- `TDDCycleStarted` / `TDDCycleCompleted` - TDD phases
- `MemorySaved` / `MemoryRecalled` - Memory events
- And more...

**How to use**:
```typescript
import { getGlobalHooksManager, LifecycleHookType } from '@/fusion/implementations/lifecycle-hooks-fusion.js';

const hooksManager = getGlobalHooksManager();

// Register a custom hook
hooksManager.registerHook(
  LifecycleHookType.AgentCompleted,
  async (context) => {
    console.log('Agent finished! Context:', context.data);
  },
  { priority: 50, description: 'My custom handler' }
);

// Execute hooks manually
await hooksManager.executeHooks(LifecycleHookType.PlanningCompleted, {
  data: { todoId: '123', task: 'Implement feature' }
});
```

**Built-in Hooks**:
- `PostToolUse → Memory`: Auto-saves important tool results
- `AgentCompleted → Planning`: Auto-marks associated TODOs as completed
- `TestCompleted → TDD`: Updates test history
- `ContextFull → Memory`: Saves context snapshot when approaching limit
- `SessionStart → All`: Restores previous session state

**Token Savings Example**:
```
Without hooks:
User: "Save this result and mark TODO completed"            [200 tokens]

With hooks:
Tool automatically triggers on completion, no extra message needed
[0 tokens of extra overhead]
```

---

### 2. Context Recovery Fusion
**Location**: `src/fusion/implementations/context-recovery-fusion.ts`

**What it does**: Automatically saves and restores complete session context across `/clear` or restarts, enabling infinite context extension.

**Saves/Restores**:
- Memory entries (with metadata)
- Planning TODOs (with hierarchy)
- Agent execution history
- TDD test results
- Science experiments

**How to use**:
```typescript
import { ContextRecoveryManager } from '@/fusion/implementations/context-recovery-fusion.js';

const recovery = new ContextRecoveryManager('./data/contexts.db', {
  memoryManager,
  planningManager,
  agentOrchestrator,
  tddManager,
  scienceManager
});

// Capture and save current state
const sessionId = 'session_abc123';
await recovery.saveContext(sessionId, undefined, {
  user: 'alice',
  project: 'auth-system',
  description: 'Implementing JWT authentication'
});

// Restore from previous session
const result = await recovery.restoreContext(sessionId);
console.log(`Restored ${result.restored.memories} memories`);
console.log(`Restored ${result.restored.todos} todos`);

// List available sessions
const sessions = recovery.getAvailableSessions({ limit: 10 });
sessions.forEach(s => {
  console.log(`Session: ${s.sessionId} (${s.memoriesCount} memories)`);
});

recovery.close();
```

**Hook Integration**:
```typescript
const hooks = recovery.registerHooks();

// Automatically save context when session ends
hooksManager.registerHook(LifecycleHookType.SessionEnd, hooks.sessionEnd);

// Automatically restore context when session starts
hooksManager.registerHook(LifecycleHookType.SessionStart, hooks.sessionStart);

// Automatically compress when context is full
hooksManager.registerHook(LifecycleHookType.ContextFull, hooks.contextFull);
```

**Token Savings Example**:
```
Without recovery:
User loses all context on /clear
Next session: Manually rebuild context (2000+ tokens)

With recovery:
Context automatically saved on exit, restored on start
Next session: Context available immediately (0 tokens)

For a 5-session workflow: 8000+ token savings!
```

---

### 3. Workflow Fusion
**Location**: `src/fusion/implementations/workflow-fusion.ts`

**What it does**: Automatically coordinates Planning → Agent → TDD → Memory workflow with smart sequential execution and context passing.

**Workflow Steps**:
```
1. Memory Recall (optional): Fetch relevant past context
2. Planning: Create TODO for the task
3. Agent: Auto-spawn agent to implement
4. TDD: Auto-run tests after agent completes
5. Memory: Auto-save test results
6. Planning: Auto-mark TODO as completed if tests pass
```

**How to use**:
```typescript
import { WorkflowOrchestrator } from '@/fusion/implementations/workflow-fusion.js';

const workflow = new WorkflowOrchestrator(featureCoordinator);

// Start a complete workflow with one call
const result = await workflow.startWorkflow({
  description: 'Implement user authentication with JWT',
  tags: ['auth', 'security'],
  autoStartAgent: true,
  autoRunTests: true,
  testPath: 'tests/auth.test.ts',
  memoryKeys: ['jwt-implementation', 'authentication-best-practices']
});

console.log(`✓ Workflow started`);
console.log(`  TODO created: ${result.todoId}`);
console.log(`  Agent spawned: ${result.agentId}`);
console.log(`  Steps completed: ${result.stepsCompleted.join(' → ')}`);
```

**Check workflow status**:
```typescript
const status = workflow.getWorkflowStatus(todoId);
console.log(`Agent: ${status?.agentId}`);
console.log(`Test result: ${status?.testResult?.passed ? 'PASSED' : 'FAILED'}`);
console.log(`Completed: ${status?.stepsCompleted.join(', ')}`);
```

**Automatic Hooks**:
- `PlanningCompleted` → Auto-spawn agent
- `AgentCompleted` → Auto-run tests
- `TDDCycleCompleted` → Auto-save to memory and mark TODO done

**Token Savings Example**:
```
Manual workflow:
1. "Create TODO for auth"                        [300 tokens]
2. "Spawn coder agent"                           [500 tokens]
3. "Run tests on implementation"                 [400 tokens]
4. "Save test results to memory"                 [200 tokens]
Total: 1400 tokens

Workflow Fusion:
1. "Implement auth with auto-workflow"           [300 tokens]
   (Steps 2-4 execute automatically)
Total: 300 tokens (79% reduction!)
```

---

### 4. Dashboard Fusion
**Location**: `src/fusion/implementations/dashboard-fusion.ts`

**What it does**: Provides a unified status view of all features in one call—token-efficient alternative to checking features individually.

**Collects**:
- **Memory**: Total entries, categories, recent activity
- **Planning**: TODOs by status (pending/in-progress/completed), progress %
- **Agents**: Running/completed/failed counts, by type breakdown
- **TDD**: Test counts, pass rate, recent runs
- **Guide**: Total guides, recently viewed, in progress, completed
- **Science**: Available tools, features

**How to use**:
```typescript
import { DashboardManager } from '@/fusion/implementations/dashboard-fusion.js';

const dashboard = new DashboardManager({
  memoryManager,
  planningManager,
  agentOrchestrator,
  tddManager,
  guideManager,
  scienceManager
});

// Get unified status in one call
const status = dashboard.getUnifiedStatus();

// Full ASCII dashboard
console.log(dashboard.formatDashboard(status));

// Or compact summary
console.log(dashboard.getCompactSummary(status));

// Watch mode: continuously update
const stopWatch = dashboard.watchMode(5000, (dashboard) => {
  console.clear();
  console.log(dashboard);
});

// Stop watching
setTimeout(stopWatch, 60000);
```

**Dashboard Output**:
```
╔════════════════════════════════════════════════════════════════════╗
║  FLUX Dashboard - Unified Status View                             ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  MEMORY                                                            ║
║    Total Entries:     47                                          ║
║    Recent (24h):      12                                          ║
║    Recent (7d):       38                                          ║
║    Top Categories:                                                 ║
║      - project: 18                                                ║
║      - code: 12                                                   ║
║      - task: 17                                                   ║
║                                                                    ║
║  PLANNING                                                          ║
║    Total TODOs:       15                                          ║
║    Pending:           3                                           ║
║    In Progress:       7                                           ║
║    Completed:         5                                           ║
║    Progress:          33%                                         ║
║    [███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 33%
║                                                                    ║
║  AGENTS                                                            ║
║    Total Agents:      8                                           ║
║    Running:           2                                           ║
║    Completed:         6                                           ║
║    Failed:            0                                           ║
║    By Type:                                                        ║
║      - coder: 4                                                   ║
║      - debugger: 2                                                ║
║      - designer: 2                                                ║
║                                                                    ║
║  TDD                                                               ║
║    Total Tests:       42                                          ║
║    Passed:            38                                          ║
║    Failed:            4                                           ║
║    Pass Rate:         90%                                         ║
║    [███████████████████████████████████░░░░░░░░░░] 90%
║                                                                    ║
║  GUIDE                                                             ║
║    Total Guides:      24                                          ║
║    Recently Viewed:   8                                           ║
║    In Progress:       3                                           ║
║    Completed:         12                                          ║
║                                                                    ║
║  SCIENCE                                                           ║
║    Tools Available:   15                                          ║
║    Features:          8                                           ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

**Token Savings Example**:
```
Without Dashboard:
User: "What's the status of all features?"
System checks: memory, planning, agents, tdd, guide, science
Each feature returns full details (300-500 tokens total)

With Dashboard:
User: "Show dashboard"
Dashboard collects summaries from all features (1 call)
Returns aggregated status (100-150 tokens)
80%+ token reduction!
```

---

## How Fusion Integrates with FeatureCoordinator

The FeatureCoordinator routes tool calls to individual feature managers. Fusion operates at a higher level:

```typescript
FeatureCoordinator (routes individual tool calls)
        ↓
Fusion System (coordinates between features)
        ├─ Lifecycle Hooks: Auto-trigger features
        ├─ Context Recovery: Save/restore state
        ├─ Workflow: Coordinate Planning→Agent→TDD→Memory
        └─ Dashboard: Unified status view
```

**Integration points**:
```typescript
// In FeatureCoordinator initialization
const hooksManager = new HooksManager();
hooksManager.injectManagers({
  memoryManager: this.memoryManager,
  planningManager: this.planningManager,
  tddManager: this.tddManager,
  agentOrchestrator: this.agentOrchestrator
});

// Then initialize fusion systems
const workflow = new WorkflowOrchestrator(this);
const recovery = new ContextRecoveryManager(dbPath, { ... });
const dashboard = new DashboardManager({ ... });
```

---

## Fusion Configuration

```typescript
interface FusionConfig {
  // Enable automatic trigger propagation
  autoTriggers: boolean;

  // Enable shared context between features
  sharedContext: boolean;

  // Enable pipeline execution
  enablePipeline: boolean;

  // Enable parallel execution (NOT what Fusion does)
  enableParallel: boolean;

  // Maximum depth for chained fusions
  maxChainDepth: number;

  // Timeout for fusion operations (ms)
  timeout: number;
}
```

---

## Best Practices

### 1. Hook Priority
Higher priority hooks run first. Use appropriate priorities:
```typescript
// Built-in critical hooks: priority 100
// Custom handlers: priority 50
// Low-priority hooks: priority 10-20
```

### 2. Hook Ordering
When designing workflows, remember hook execution order:
1. Session/Context hooks (highest priority)
2. Workflow coordination hooks (high)
3. Feature-specific hooks (medium)
4. Cleanup/logging hooks (low)

### 3. Avoid Circular Hooks
Don't create hooks that trigger each other indefinitely:
```typescript
// BAD: Circular hook
PlanningCompleted → AgentStarted → PlanningCompleted → ...

// GOOD: Linear workflow
PlanningCompleted → AgentStarted → TDDCompleted → MemorySaved
```

### 4. Error Handling
Hooks continue executing even if one fails. Design for resilience:
```typescript
async (context) => {
  try {
    // Do work
  } catch (error) {
    logger.error('Hook failed:', error);
    // Don't rethrow; let other hooks continue
  }
}
```

### 5. Context Passing
Use `context.sharedState` to pass data between hooks:
```typescript
// Hook 1
context.sharedState.todoId = todoResult.id;

// Hook 2 (runs after)
const todoId = context.sharedState.todoId;
```

---

## Token Savings Summary

| Scenario | Without Fusion | With Fusion | Savings |
|----------|---|---|---|
| Single workflow (Planning→Agent→TDD→Memory) | 1400 tokens | 350 tokens | 75% |
| Session recovery | 2000+ tokens | 50 tokens | 97% |
| Dashboard check | 400 tokens | 100 tokens | 75% |
| Multi-feature coordination | 3000+ tokens | 600 tokens | 80% |

**Cumulative**: A typical session with Fusion saves 3000-5000 tokens compared to manual coordination.

---

## Next Steps

- **[FeatureCoordinator Pattern](../architecture/feature-coordinator.md)**: How features are registered and routed
- **[Architecture Overview](../architecture/overview.md)**: System-wide design
- **[Contributing](../guides/contributing.md)**: Add new Fusion implementations
