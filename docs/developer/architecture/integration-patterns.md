# Integration Patterns

Best practices and patterns for integrating features, managing dependencies, and maintaining clean architecture.

## Overview

This guide covers proven patterns for:
- Feature-to-feature communication
- Dependency injection strategies
- Hook points for extensibility
- Error handling and recovery
- Testing and mocking

## Feature Integration Patterns

### Pattern 1: Direct Dependency Injection

**Use Case**: When Feature A needs Feature B's functionality.

**Implementation**:

```typescript
// In FeatureCoordinator constructor
export class FeatureCoordinator {
  constructor(options: FeatureCoordinatorOptions) {
    // Initialize independent features first
    this.memoryManager = new MemoryManager(options.dbPath);
    this.guideManager = new GuideManager();

    // Pass dependencies to dependent features
    this.planningManager = new PlanningManager({
      dbPath: options.dbPath,
      memoryManager: this.memoryManager, // Inject dependency
    });
  }
}
```

**Example**:

```typescript
// PlanningManager needs memory for storing plans
export class PlanningManager {
  private memoryManager: MemoryManager;

  constructor(options: {
    dbPath: string;
    memoryManager: MemoryManager;
  }) {
    this.memoryManager = options.memoryManager;
  }

  async savePlan(plan: Plan): Promise<void> {
    // Use injected memory manager
    await this.memoryManager.save({
      content: JSON.stringify(plan),
      tags: ['plan', plan.id],
    });
  }
}
```

**Benefits**:
- Type-safe dependencies
- Clear dependency graph
- Easy to test with mocks

### Pattern 2: Event-Based Communication

**Use Case**: When features need to react to events without tight coupling.

**Implementation**:

```typescript
// Create event emitter
export class FeatureEventEmitter extends EventEmitter {
  emitToolExecuted(event: ToolExecutedEvent): void {
    this.emit('tool:executed', event);
  }

  onToolExecuted(handler: (event: ToolExecutedEvent) => void): void {
    this.on('tool:executed', handler);
  }
}

// In FeatureCoordinator
export class FeatureCoordinator {
  private eventEmitter: FeatureEventEmitter;

  constructor(options: FeatureCoordinatorOptions) {
    this.eventEmitter = new FeatureEventEmitter();

    // Initialize features with event emitter
    this.memoryManager = new MemoryManager({
      dbPath: options.dbPath,
      events: this.eventEmitter,
    });

    this.agentOrchestrator = new AgentOrchestrator({
      dbPath: options.dbPath,
      events: this.eventEmitter,
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Memory manager reacts to tool executions
    this.eventEmitter.onToolExecuted((event) => {
      if (event.serverId === 'internal:memory') {
        // Track memory usage
        this.recordMemoryAccess(event);
      }
    });
  }
}
```

**Example**:

```typescript
// Feature A emits event
export class AgentOrchestrator {
  async spawn(input: AgentSpawnInput): Promise<AgentSpawnOutput> {
    const agent = await this.createAgent(input);

    // Emit event for other features to react
    this.events?.emit('agent:spawned', {
      agentId: agent.id,
      role: agent.role,
      timestamp: Date.now(),
    });

    return { agentId: agent.id };
  }
}

// Feature B listens to event
export class MemoryManager {
  constructor(options: { events?: EventEmitter }) {
    options.events?.on('agent:spawned', (event) => {
      // Auto-save agent context to memory
      this.save({
        content: `Agent ${event.agentId} spawned with role ${event.role}`,
        tags: ['agent', event.agentId],
      });
    });
  }
}
```

**Benefits**:
- Loose coupling between features
- Easy to add new listeners
- Asynchronous communication

### Pattern 3: Shared Store Pattern

**Use Case**: When multiple features need to access common data.

**Implementation**:

```typescript
// Create shared store
export class SharedStore {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  async get(key: string): Promise<any> {
    return this.db.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    return this.db.set(key, value);
  }

  async getNamespace(namespace: string): Promise<Map<string, any>> {
    return this.db.getAll(`${namespace}:*`);
  }
}

// In FeatureCoordinator
export class FeatureCoordinator {
  constructor(options: FeatureCoordinatorOptions) {
    const sharedStore = new SharedStore(options.dbPath);

    // Pass same store to multiple features
    this.memoryManager = new MemoryManager({ store: sharedStore });
    this.planningManager = new PlanningManager({ store: sharedStore });
    this.agentOrchestrator = new AgentOrchestrator({ store: sharedStore });
  }
}
```

**Example**:

```typescript
// Each feature uses namespaced keys
export class MemoryManager {
  private store: SharedStore;
  private namespace = 'memory';

  async save(memory: Memory): Promise<void> {
    await this.store.set(`${this.namespace}:${memory.id}`, memory);
  }
}

export class PlanningManager {
  private store: SharedStore;
  private namespace = 'plans';

  async savePlan(plan: Plan): Promise<void> {
    await this.store.set(`${this.namespace}:${plan.id}`, plan);
  }
}
```

**Benefits**:
- Single database connection
- Transactional consistency
- Efficient resource usage

## Dependency Injection Strategies

### Strategy 1: Constructor Injection

**Best for**: Required dependencies that features can't work without.

```typescript
export class FeatureManager {
  constructor(
    private readonly store: Store,
    private readonly logger: Logger
  ) {
    if (!store) throw new Error('Store is required');
    if (!logger) throw new Error('Logger is required');
  }
}
```

### Strategy 2: Options Object

**Best for**: Multiple dependencies with some optional.

```typescript
interface FeatureOptions {
  dbPath: string;              // Required
  memoryManager?: MemoryManager; // Optional
  events?: EventEmitter;       // Optional
  maxRetries?: number;         // Optional with default
}

export class FeatureManager {
  constructor(options: FeatureOptions) {
    this.dbPath = options.dbPath;
    this.memoryManager = options.memoryManager || null;
    this.events = options.events || new EventEmitter();
    this.maxRetries = options.maxRetries ?? 3;
  }
}
```

### Strategy 3: Setter Injection

**Best for**: Optional dependencies that can be added later.

```typescript
export class FeatureManager {
  private memoryManager?: MemoryManager;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  setMemoryManager(manager: MemoryManager): void {
    this.memoryManager = manager;
  }

  async operation(): Promise<void> {
    // Check if optional dependency is available
    if (this.memoryManager) {
      await this.memoryManager.save(...);
    }
  }
}
```

### Strategy 4: Factory Pattern

**Best for**: Complex initialization or conditional dependencies.

```typescript
export interface FeatureFactory {
  create(options: FeatureOptions): FeatureManager;
}

export class DefaultFeatureFactory implements FeatureFactory {
  constructor(
    private readonly memoryManager: MemoryManager,
    private readonly logger: Logger
  ) {}

  create(options: FeatureOptions): FeatureManager {
    return new FeatureManager({
      ...options,
      memoryManager: this.memoryManager,
      logger: this.logger,
    });
  }
}

// In FeatureCoordinator
export class FeatureCoordinator {
  constructor(options: FeatureCoordinatorOptions) {
    const factory = new DefaultFeatureFactory(
      this.memoryManager,
      this.logger
    );

    this.customFeature = factory.create({
      dbPath: options.dbPath,
      maxRetries: 5,
    });
  }
}
```

## Hook Points for Extensibility

### Hook 1: Pre/Post Tool Execution

Allow features to intercept tool calls:

```typescript
export interface ToolExecutionHook {
  preExecution?(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<void>;

  postExecution?(
    toolName: string,
    args: Record<string, unknown>,
    result: unknown
  ): Promise<void>;
}

export class FeatureCoordinator {
  private hooks: ToolExecutionHook[] = [];

  registerHook(hook: ToolExecutionHook): void {
    this.hooks.push(hook);
  }

  async routeToolCall(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    // Pre-execution hooks
    for (const hook of this.hooks) {
      await hook.preExecution?.(toolName, args);
    }

    // Execute tool
    const result = await this.executeToolInternal(serverId, toolName, args);

    // Post-execution hooks
    for (const hook of this.hooks) {
      await hook.postExecution?.(toolName, args, result);
    }

    return result;
  }
}
```

**Example Usage**:

```typescript
// Logging hook
class LoggingHook implements ToolExecutionHook {
  async preExecution(toolName: string, args: any): Promise<void> {
    logger.info(`Executing tool: ${toolName}`, { args });
  }

  async postExecution(toolName: string, args: any, result: any): Promise<void> {
    logger.info(`Tool completed: ${toolName}`, { result });
  }
}

// Register hook
coordinator.registerHook(new LoggingHook());
```

### Hook 2: Tool Registration

Allow features to enhance tool definitions:

```typescript
export interface ToolRegistrationHook {
  onToolRegistered?(tool: ToolMetadata): ToolMetadata;
}

export class ToolLoader {
  private registrationHooks: ToolRegistrationHook[] = [];

  registerHook(hook: ToolRegistrationHook): void {
    this.registrationHooks.push(hook);
  }

  registerTools(tools: ToolMetadata[]): void {
    for (let tool of tools) {
      // Apply hooks
      for (const hook of this.registrationHooks) {
        if (hook.onToolRegistered) {
          tool = hook.onToolRegistered(tool);
        }
      }

      this.allTools.set(tool.name, tool);
      this.bm25Indexer.addDocument(tool.name, this.buildIndexContent(tool));
    }
  }
}
```

**Example Usage**:

```typescript
// Category inference hook
class CategoryInferenceHook implements ToolRegistrationHook {
  onToolRegistered(tool: ToolMetadata): ToolMetadata {
    if (!tool.category) {
      tool.category = this.inferCategory(tool.name, tool.description);
    }
    return tool;
  }

  private inferCategory(name: string, description: string): string {
    if (name.includes('slack') || name.includes('email')) {
      return 'communication';
    }
    if (name.includes('git') || name.includes('code')) {
      return 'development';
    }
    return 'general';
  }
}
```

### Hook 3: Feature Initialization

Allow features to extend initialization:

```typescript
export interface FeatureInitHook {
  onInit?(coordinator: FeatureCoordinator): Promise<void>;
}

export class FeatureCoordinator {
  private initHooks: FeatureInitHook[] = [];

  async initialize(): Promise<void> {
    // Standard initialization
    await this.initializeFeatures();

    // Run init hooks
    for (const hook of this.initHooks) {
      await hook.onInit?.(this);
    }
  }

  registerInitHook(hook: FeatureInitHook): void {
    this.initHooks.push(hook);
  }
}
```

## Error Handling Patterns

### Pattern 1: Graceful Degradation

Continue operation even if one feature fails:

```typescript
async routeToolCall(
  serverId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  try {
    switch (serverId) {
      case 'internal:memory':
        return await this.memoryManager.handleToolCall(toolName, args);
      // ... other cases
    }
  } catch (error) {
    logger.error(`Tool call failed: ${toolName}`, error);

    // Try fallback if available
    if (this.hasFallback(serverId, toolName)) {
      return await this.executeFallback(serverId, toolName, args);
    }

    // Return user-friendly error
    throw new ToolExecutionError(
      `Failed to execute ${toolName}: ${error.message}`,
      { serverId, toolName, cause: error }
    );
  }
}
```

### Pattern 2: Circuit Breaker

Prevent cascading failures:

```typescript
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
      }

      throw error;
    }
  }
}

// Usage in feature
export class FeatureManager {
  private circuitBreaker = new CircuitBreaker();

  async operation(): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      // Potentially failing operation
      await this.externalService.call();
    });
  }
}
```

### Pattern 3: Retry with Backoff

Retry transient failures:

```typescript
export class RetryHelper {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      shouldRetry?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const initialDelay = options.initialDelay ?? 1000;
    const maxDelay = options.maxDelay ?? 10000;
    const shouldRetry = options.shouldRetry ?? (() => true);

    let lastError: any;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !shouldRetry(error)) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, maxDelay);
      }
    }

    throw lastError;
  }
}

// Usage
await RetryHelper.withRetry(
  async () => await this.connectToServer(config),
  {
    maxRetries: 3,
    shouldRetry: (error) => error.code === 'ECONNREFUSED',
  }
);
```

## Testing Patterns

### Pattern 1: Mock Dependencies

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('PlanningManager', () => {
  it('should save plan to memory', async () => {
    // Create mock memory manager
    const mockMemoryManager = {
      save: vi.fn().mockResolvedValue({ success: true, memoryId: '123' }),
      recall: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
    } as any;

    // Inject mock
    const planning = new PlanningManager({
      dbPath: ':memory:',
      memoryManager: mockMemoryManager,
    });

    // Execute
    await planning.createPlan({
      name: 'Test Plan',
      tasks: [],
    });

    // Verify
    expect(mockMemoryManager.save).toHaveBeenCalledWith({
      content: expect.stringContaining('Test Plan'),
      tags: expect.arrayContaining(['plan']),
    });
  });
});
```

### Pattern 2: Integration Tests

```typescript
describe('FeatureCoordinator Integration', () => {
  it('should route calls between features', async () => {
    const coordinator = new FeatureCoordinator({
      dbPath: ':memory:',
    });

    // Create plan
    const planResult = await coordinator.routeToolCall(
      'internal:planning',
      'plan_create',
      { name: 'Test Plan', tasks: [] }
    );

    expect(planResult).toHaveProperty('planId');

    // Save plan to memory
    const memoryResult = await coordinator.routeToolCall(
      'internal:memory',
      'memory_save',
      {
        content: `Plan created: ${planResult.planId}`,
        tags: ['plan'],
      }
    );

    expect(memoryResult).toHaveProperty('success', true);
  });
});
```

### Pattern 3: Test Helpers

```typescript
export class TestHelpers {
  static createMockMemoryManager(): MemoryManager {
    const manager = new MemoryManager(':memory:');
    // Pre-populate with test data
    return manager;
  }

  static createMockFeatureCoordinator(
    overrides?: Partial<FeatureCoordinatorOptions>
  ): FeatureCoordinator {
    return new FeatureCoordinator({
      dbPath: ':memory:',
      ...overrides,
    });
  }

  static async cleanupTestData(manager: FeatureManager): Promise<void> {
    // Clean up after tests
    await manager.close();
  }
}

// Usage
describe('Feature Tests', () => {
  let coordinator: FeatureCoordinator;

  beforeEach(() => {
    coordinator = TestHelpers.createMockFeatureCoordinator();
  });

  afterEach(async () => {
    await coordinator.close();
  });
});
```

## Best Practices Summary

### 1. Dependency Management
- Use constructor injection for required dependencies
- Use options objects for multiple/optional dependencies
- Document all dependencies clearly
- Avoid circular dependencies

### 2. Feature Communication
- Prefer event-based for loose coupling
- Use direct injection for tight integration
- Share stores for common data
- Document integration points

### 3. Error Handling
- Fail gracefully with meaningful errors
- Use circuit breakers for external services
- Retry transient failures with backoff
- Log all errors with context

### 4. Testing
- Mock external dependencies
- Test integration points
- Use test helpers for common setups
- Clean up resources after tests

### 5. Extensibility
- Provide hooks for common extension points
- Document hook behavior and lifecycle
- Keep hooks simple and focused
- Test hooks independently

This approach ensures maintainable, testable, and extensible architecture.
