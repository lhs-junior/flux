# FeatureCoordinator Pattern

Complete guide to the FeatureCoordinator pattern for managing internal features in awesome-plugin.

## Overview

The FeatureCoordinator is the central hub for all internal feature managers. It provides:

- **Unified Tool Registration**: Aggregates tools from all features
- **Smart Routing**: Routes tool calls to appropriate feature managers
- **Lifecycle Management**: Initializes and cleans up all features
- **Backward Compatibility**: Provides accessors for legacy tests

**Location**: `src/core/feature-coordinator.ts`

## Core Architecture

```typescript
export class FeatureCoordinator {
  // Six internal feature managers
  private memoryManager: MemoryManager;
  private agentOrchestrator: AgentOrchestrator;
  private planningManager: PlanningManager;
  private tddManager: TDDManager;
  private guideManager: GuideManager;
  private scienceManager: ScienceManager;

  constructor(options: FeatureCoordinatorOptions) {
    // Initialize all features with dependency injection
    this.memoryManager = new MemoryManager(options.dbPath);
    this.agentOrchestrator = new AgentOrchestrator(options.dbPath);
    this.planningManager = new PlanningManager(options.dbPath);
    this.tddManager = new TDDManager(options.dbPath);
    this.guideManager = new GuideManager();
    this.scienceManager = new ScienceManager(options.dbPath);
  }

  // Get all tools from all features
  getAllToolDefinitions(): ToolMetadata[];

  // Check if serverId is internal
  isInternalFeature(serverId: string): boolean;

  // Route tool calls to appropriate manager
  routeToolCall(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> | null;

  // Cleanup all features
  close(): void;
}
```

## Six Feature Managers

### 1. MemoryManager
**Server ID**: `internal:memory`
**Purpose**: Long-term memory management with BM25 search
**Location**: `src/features/memory/memory-manager.ts`

**Tools**:
- `memory_save`: Save information to long-term memory
- `memory_recall`: Search and recall memories using BM25
- `memory_list`: List all stored memories
- `memory_delete`: Delete specific memory entries

**Key Features**:
- SQLite-based persistence
- BM25 semantic search
- Automatic memory cleanup (7-day retention by default)
- Context tags for categorization

**Implementation Highlights**:
```typescript
export class MemoryManager {
  private store: MemoryStore;
  private indexer: BM25Indexer;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(dbPath: string) {
    this.store = new MemoryStore(dbPath);
    this.indexer = new BM25Indexer();
    this.startAutomaticCleanup();
  }

  async save(input: MemorySaveInput): Promise<MemorySaveOutput> {
    const memory = await this.store.save(input);
    this.indexer.addDocument(memory.id, memory.content);
    return { success: true, memoryId: memory.id };
  }

  async recall(input: MemoryRecallInput): Promise<MemoryRecallOutput> {
    const results = this.indexer.search(input.query, { limit: input.limit });
    const memories = await this.store.getByIds(results.map(r => r.docId));
    return { memories };
  }
}
```

### 2. AgentOrchestrator
**Server ID**: `internal:agents`
**Purpose**: Multi-agent task orchestration and delegation
**Location**: `src/features/agents/agent-orchestrator.ts`

**Tools**:
- `agent_spawn`: Spawn a new specialized agent
- `agent_status`: Check status of running agents
- `agent_result`: Retrieve agent results
- `agent_terminate`: Stop a running agent

**Key Features**:
- Parallel agent execution
- Task-specific agent specialization
- Result aggregation
- Resource management

**Implementation Highlights**:
```typescript
export class AgentOrchestrator {
  private activeAgents: Map<string, AgentInstance>;
  private agentStore: AgentStore;

  async spawn(input: AgentSpawnInput): Promise<AgentSpawnOutput> {
    const agentId = generateId();
    const agent = new AgentInstance({
      id: agentId,
      role: input.role,
      task: input.task,
      context: input.context,
    });

    this.activeAgents.set(agentId, agent);
    agent.start(); // Non-blocking execution

    return { agentId, status: 'spawned' };
  }

  async status(input: AgentStatusInput): Promise<AgentStatusOutput> {
    const agent = this.activeAgents.get(input.agentId);
    if (!agent) {
      throw new Error(`Agent ${input.agentId} not found`);
    }
    return agent.getStatus();
  }
}
```

### 3. PlanningManager
**Server ID**: `internal:planning`
**Purpose**: Plan creation, task tracking, and TODO management
**Location**: `src/features/planning/planning-manager.ts`

**Tools**:
- `plan_create`: Create a new plan with tasks
- `plan_update`: Update plan status or tasks
- `plan_list`: List all active plans
- `plan_get`: Get detailed plan information
- `todo_add`: Add TODO items to a plan
- `todo_complete`: Mark TODO items as complete

**Key Features**:
- Hierarchical task structure
- Progress tracking
- Task dependencies
- Plan templates

**Implementation Highlights**:
```typescript
export class PlanningManager {
  private planStore: PlanStore;

  async createPlan(input: PlanCreateInput): Promise<PlanCreateOutput> {
    const plan = {
      id: generateId(),
      name: input.name,
      description: input.description,
      tasks: input.tasks.map(task => ({
        id: generateId(),
        ...task,
        status: 'pending',
      })),
      status: 'active',
      createdAt: new Date(),
    };

    await this.planStore.save(plan);
    return { planId: plan.id, taskCount: plan.tasks.length };
  }

  async updatePlan(input: PlanUpdateInput): Promise<PlanUpdateOutput> {
    const plan = await this.planStore.get(input.planId);
    if (!plan) {
      throw new Error(`Plan ${input.planId} not found`);
    }

    // Update tasks, status, or other fields
    Object.assign(plan, input.updates);
    await this.planStore.save(plan);

    return { success: true, plan };
  }
}
```

### 4. TDDManager
**Server ID**: `internal:tdd`
**Purpose**: Test-driven development workflow automation
**Location**: `src/features/tdd/tdd-manager.ts`

**Tools**:
- `tdd_cycle`: Execute TDD red-green-refactor cycle
- `tdd_test_create`: Create test cases
- `tdd_test_run`: Run tests and report results
- `tdd_coverage`: Get code coverage metrics

**Key Features**:
- Automatic test generation
- Test execution and reporting
- Coverage tracking
- Refactoring suggestions

**Implementation Highlights**:
```typescript
export class TDDManager {
  private testStore: TestStore;
  private testRunner: TestRunner;

  async cycle(input: TDDCycleInput): Promise<TDDCycleOutput> {
    const phases = {
      red: await this.runTests(input.testFile),
      green: null,
      refactor: null,
    };

    if (phases.red.passed) {
      return { phase: 'red', message: 'Tests already passing' };
    }

    // Generate implementation
    phases.green = await this.implementFeature(input);

    if (input.autoRefactor) {
      phases.refactor = await this.refactor(input);
    }

    return { phases, currentPhase: 'complete' };
  }
}
```

### 5. GuideManager
**Server ID**: `internal:guide`
**Purpose**: Interactive guides and documentation system
**Location**: `src/features/guide/guide-manager.ts`

**Tools**:
- `guide_search`: Search available guides
- `guide_get`: Retrieve a specific guide
- `guide_step`: Navigate through guide steps
- `guide_list`: List all available guides

**Key Features**:
- Interactive step-by-step guides
- Contextual help
- Progress tracking
- Custom guide creation

**Implementation Highlights**:
```typescript
export class GuideManager {
  private guides: Map<string, Guide>;
  private sessions: Map<string, GuideSession>;

  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'guide_search',
        description: 'Search for guides on specific topics',
        inputSchema: GuideSearchInputSchema,
        serverId: 'internal:guide',
      },
      // ... more tools
    ];
  }

  async search(input: GuideSearchInput): Promise<GuideSearchOutput> {
    const matchingGuides = Array.from(this.guides.values())
      .filter(guide =>
        guide.title.includes(input.query) ||
        guide.tags.some(tag => tag.includes(input.query))
      );

    return { guides: matchingGuides };
  }
}
```

### 6. ScienceManager
**Server ID**: `internal:science`
**Purpose**: Scientific computing and data analysis
**Location**: `src/features/science/science-manager.ts`

**Tools**:
- `science_compute`: Perform scientific calculations
- `science_plot`: Generate plots and visualizations
- `science_stats`: Calculate statistical measures
- `science_transform`: Transform and normalize data

**Key Features**:
- Numerical computation
- Data visualization
- Statistical analysis
- Data transformation pipelines

**Implementation Highlights**:
```typescript
export class ScienceManager {
  private computeEngine: ComputeEngine;
  private plotter: Plotter;

  async compute(input: ScienceComputeInput): Promise<ScienceComputeOutput> {
    const result = await this.computeEngine.execute(input.expression, {
      variables: input.variables,
      precision: input.precision,
    });

    return { result, unit: input.unit };
  }

  async plot(input: SciencePlotInput): Promise<SciencePlotOutput> {
    const plotData = await this.plotter.generate({
      type: input.plotType,
      data: input.data,
      options: input.options,
    });

    return { plotUrl: plotData.url, format: plotData.format };
  }
}
```

## Integration Mechanisms

### Tool Definition Aggregation

The FeatureCoordinator aggregates all tool definitions from feature managers:

```typescript
getAllToolDefinitions(): ToolMetadata[] {
  const memoryTools = this.memoryManager.getToolDefinitions();
  const agentTools = this.agentOrchestrator.getToolDefinitions();
  const planningTools = this.planningManager.getToolDefinitions();
  const tddTools = this.tddManager.getToolDefinitions();
  const guideTools = this.guideManager.getToolDefinitions();
  const scienceTools = this.scienceManager.getToolDefinitions();

  return [
    ...memoryTools,
    ...agentTools,
    ...planningTools,
    ...tddTools,
    ...guideTools,
    ...scienceTools,
  ];
}
```

### Tool Call Routing

The FeatureCoordinator routes tool calls based on serverId:

```typescript
routeToolCall(
  serverId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> | null {
  switch (serverId) {
    case 'internal:memory':
      return this.memoryManager.handleToolCall(toolName, args);

    case 'internal:agents':
      return this.agentOrchestrator.handleToolCall(toolName, args);

    case 'internal:planning':
      return this.planningManager.handleToolCall(toolName, args);

    case 'internal:tdd':
      return this.tddManager.handleToolCall(toolName, args);

    case 'internal:guide':
      return this.guideManager.handleToolCall(toolName, args);

    case 'internal:science':
      return this.scienceManager.handleToolCall(toolName, args);

    default:
      return null; // Not an internal feature
  }
}
```

### Feature Detection

Check if a serverId belongs to an internal feature:

```typescript
isInternalFeature(serverId: string): boolean {
  return serverId.startsWith('internal:');
}
```

### Lifecycle Management

```typescript
close(): void {
  try {
    this.memoryManager.close();
  } catch (error) {
    logger.error('Failed to close memory manager:', error);
  }

  try {
    this.agentOrchestrator.close();
  } catch (error) {
    logger.error('Failed to close agent orchestrator:', error);
  }

  // ... close other managers
}
```

## Adding a New Feature

Follow these steps to add a new internal feature:

### Step 1: Create Feature Manager

Create `src/features/{featureName}/{featureName}-manager.ts`:

```typescript
import type { ToolMetadata } from '../../core/types.js';

export class MyFeatureManager {
  constructor(dbPath: string) {
    // Initialize stores, indexers, etc.
  }

  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'myfeature_action',
        description: 'Performs an action',
        inputSchema: {
          type: 'object',
          properties: {
            param: { type: 'string', description: 'Parameter' },
          },
          required: ['param'],
        },
        serverId: 'internal:myfeature',
      },
    ];
  }

  async handleToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case 'myfeature_action':
        return this.doAction(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  close(): void {
    // Cleanup resources
  }

  private async doAction(args: any): Promise<any> {
    // Implementation
  }
}
```

### Step 2: Register in FeatureCoordinator

Edit `src/core/feature-coordinator.ts`:

```typescript
// 1. Import the manager
import { MyFeatureManager } from '../features/myfeature/myfeature-manager.js';

// 2. Add to class
export class FeatureCoordinator {
  private myFeatureManager: MyFeatureManager;

  constructor(options: FeatureCoordinatorOptions) {
    // Initialize after other managers
    this.myFeatureManager = new MyFeatureManager(options.dbPath);
  }

  // 3. Add to registrations
  getInternalPluginRegistrations(): InternalPluginRegistration[] {
    return [
      // ... existing
      {
        id: 'internal:myfeature',
        name: 'Internal My Feature',
      },
    ];
  }

  // 4. Add to tool aggregation
  getAllToolDefinitions(): ToolMetadata[] {
    const myFeatureTools = this.myFeatureManager.getToolDefinitions();

    return [
      // ... existing
      ...myFeatureTools,
    ];
  }

  // 5. Add to routing
  routeToolCall(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> | null {
    switch (serverId) {
      // ... existing cases
      case 'internal:myfeature':
        return this.myFeatureManager.handleToolCall(toolName, args);
      default:
        return null;
    }
  }

  // 6. Add to cleanup
  close(): void {
    try {
      this.myFeatureManager.close();
    } catch (error) {
      logger.error('Failed to close my feature manager:', error);
    }
    // ... other closes
  }

  // 7. Add accessor (for tests)
  getMyFeatureManager(): MyFeatureManager {
    return this.myFeatureManager;
  }
}
```

### Step 3: Expose in Gateway (Optional)

For backward compatibility, add a getter in `src/core/gateway.ts`:

```typescript
export class AwesomePluginGateway {
  get myFeatureManager() {
    return this.featureCoordinator.getMyFeatureManager();
  }
}
```

### Step 4: Write Tests

```typescript
import { describe, it, expect } from 'vitest';
import { MyFeatureManager } from './myfeature-manager.js';

describe('MyFeatureManager', () => {
  it('should provide tool definitions', () => {
    const manager = new MyFeatureManager(':memory:');
    const tools = manager.getToolDefinitions();

    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('myfeature_action');
    expect(tools[0].serverId).toBe('internal:myfeature');
  });

  it('should handle tool calls', async () => {
    const manager = new MyFeatureManager(':memory:');
    const result = await manager.handleToolCall('myfeature_action', {
      param: 'test'
    });

    expect(result).toBeDefined();
  });
});
```

## Best Practices

### 1. Standard Interface
All feature managers must implement:
- `getToolDefinitions(): ToolMetadata[]`
- `handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown>`
- `close(): void`

### 2. Consistent Naming
- Server IDs: `internal:{featureName}` (lowercase)
- Tool names: `{featureName}_{action}` (lowercase, underscore-separated)
- Class names: `{FeatureName}Manager` (PascalCase)

### 3. Error Handling
Always wrap manager operations in try-catch:

```typescript
routeToolCall(serverId: string, toolName: string, args: any) {
  switch (serverId) {
    case 'internal:myfeature':
      try {
        return this.myFeatureManager.handleToolCall(toolName, args);
      } catch (error) {
        logger.error(`Error in myfeature tool call:`, error);
        throw error;
      }
  }
}
```

### 4. Dependency Injection
Pass dependencies through constructors:

```typescript
constructor(options: FeatureCoordinatorOptions) {
  // Good - pass dbPath to features
  this.memoryManager = new MemoryManager(options.dbPath);

  // Bad - let features create their own paths
  this.memoryManager = new MemoryManager(); // ❌
}
```

### 5. Cleanup
Always implement proper cleanup:

```typescript
close(): void {
  // Clear timers
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
  }

  // Close stores
  this.store.close();

  // Release resources
  this.activeConnections.forEach(conn => conn.close());
}
```

## Summary

The FeatureCoordinator pattern provides:

1. **Unified Management**: Single point for all internal features
2. **Clean Routing**: Automatic tool call routing based on serverId
3. **Easy Extension**: Add new features with minimal changes
4. **Type Safety**: All features use centralized type definitions
5. **Testability**: Each feature can be tested independently
6. **Lifecycle Control**: Coordinated initialization and cleanup

This pattern makes the codebase maintainable and extensible while keeping complexity low.
