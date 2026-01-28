# Fusion Evaluation System

The Fusion system evaluates feature integration opportunities and provides patterns for implementing seamless feature combinations.

## Quick Start

```typescript
import { FusionEvaluator, FusionOrchestrator } from './fusion';

// 1. Create evaluator with your features
const evaluator = new FusionEvaluator([
  'memory', 'agents', 'planning', 'tdd', 'guide', 'science'
]);

// 2. Evaluate a specific pair
const potential = evaluator.evaluatePair('agents', 'planning');
console.log(potential);
// {
//   featureA: 'agents',
//   featureB: 'planning',
//   currentLevel: 1,
//   potentialLevel: 4,
//   metrics: { synergy: 20, automation: 18, performance: 16, userValue: 19, total: 73 },
//   priority: 'high',
//   recommendation: 'HIGHLY RECOMMENDED: Exceptional fusion potential...'
// }

// 3. Get all opportunities ranked by value
const allPairs = evaluator.evaluateAllPairs();
console.log('Top fusion opportunity:', allPairs[0]);

// 4. Get top N opportunities
const top3 = evaluator.getTopOpportunities(3);
```

## Fusion Levels

- **Level 0**: No integration - Features work independently
- **Level 1**: Basic integration - Simple flags like `--save-to-memory`
- **Level 2**: Medium integration - Auto-triggers + shared context
- **Level 3**: Advanced integration - Deep hooks + bidirectional data flow
- **Level 4**: Full fusion - Seamless unified experience

## Scoring Metrics

Each feature pair is scored on 4 dimensions (0-20 points each):

1. **Synergy** (0-20): How well features complement each other
2. **Automation** (0-20): Potential for reducing manual steps
3. **Performance** (0-20): Impact on execution efficiency
4. **User Value** (0-20): Direct benefit to end users

Total score: 0-80 points

### Score Interpretation

- **70-80**: Full fusion recommended (Level 4)
- **60-69**: Advanced integration (Level 3)
- **45-59**: Medium integration (Level 2)
- **30-44**: Basic integration (Level 1)
- **0-29**: No integration needed

## Fusion Patterns

### 1. AutoTriggerFusion

Automatically triggers dependent features when source completes.

```typescript
import { AutoTriggerFusion, HookType, FusionContext } from './fusion';

const autoTrigger = new AutoTriggerFusion();

// Register a hook
autoTrigger.registerHook({
  type: HookType.POST_EXECUTION,
  provider: 'agents',
  consumer: 'memory',
  handler: async (context: FusionContext) => {
    // Auto-save agent result to memory
    await memoryManager.save({
      key: `agent-${context.data.id}`,
      value: context.data.result,
      category: 'agent-results'
    });
  }
});

// Trigger hooks when agent completes
await autoTrigger.triggerHooks('agents', HookType.POST_EXECUTION, {
  source: 'agents',
  target: 'memory',
  operation: 'agent_complete',
  data: { id: 'agent-123', result: 'Task completed' },
  timestamp: Date.now()
});
```

### 2. SharedContextFusion

Shares data context between features for enhanced integration.

```typescript
import { SharedContextFusion } from './fusion';

const sharedContext = new SharedContextFusion();

// Store context from source feature
sharedContext.setContext('agents:last-result', agentResult);
sharedContext.setContext('agents:execution-time', 1500);

// Retrieve in target feature
const agentData = sharedContext.getFeatureContext('agents');
console.log(agentData);
// { 'last-result': {...}, 'execution-time': 1500 }

// Merge context between features
sharedContext.mergeContext('agents', 'planning', ['last-result']);
```

### 3. PipelineFusion

Creates sequential execution pipeline between features.

```typescript
import { PipelineFusion, PipelineStage } from './fusion';

const pipeline = new PipelineFusion();

// Define pipeline stages
pipeline.addStage({
  feature: 'agents',
  handler: async (context) => {
    const result = await agentManager.spawn(context.data);
    return { data: result, sharedData: { agentId: result.id } };
  }
});

pipeline.addStage({
  feature: 'planning',
  handler: async (context) => {
    const todo = await planningManager.create({
      content: `Review agent ${context.sharedData?.agentId} results`,
      status: 'pending'
    });
    return { data: todo };
  },
  condition: (context) => context.sharedData?.agentId !== undefined
});

// Execute pipeline
const result = await pipeline.executePipeline({
  source: 'agents',
  target: 'planning',
  operation: 'agent-to-planning',
  data: { type: 'coder', task: 'Implement feature X' },
  timestamp: Date.now()
});
```

### 4. ParallelFusion

Executes multiple features concurrently for performance.

```typescript
import { ParallelFusion, ParallelTask } from './fusion';

const parallel = new ParallelFusion();

// Add parallel tasks
parallel.addTask({
  feature: 'memory',
  handler: async (context) => {
    return memoryManager.save({
      key: 'analysis-result',
      value: context.data
    });
  },
  priority: 1
});

parallel.addTask({
  feature: 'planning',
  handler: async (context) => {
    return planningManager.create({
      content: 'Review analysis',
      metadata: context.data
    });
  },
  priority: 2
});

// Execute in parallel
const result = await parallel.executeParallel({
  source: 'science',
  target: 'memory,planning',
  operation: 'save_analysis',
  data: analysisResults,
  timestamp: Date.now()
});
```

### 5. FusionOrchestrator

Centralized management of all patterns.

```typescript
import { FusionOrchestrator } from './fusion';

const orchestrator = new FusionOrchestrator({
  autoTriggers: true,
  sharedContext: true,
  enablePipeline: true,
  enableParallel: true,
  maxChainDepth: 5,
  timeout: 30000
});

// Access individual patterns
const autoTrigger = orchestrator.getAutoTrigger();
const sharedContext = orchestrator.getSharedContext();
const pipeline = orchestrator.getPipeline();
const parallel = orchestrator.getParallel();

// Execute with pattern selection
const result = await orchestrator.executeFusion('PipelineFusion', context);
```

## Example: Complete Fusion Implementation

```typescript
import {
  FusionEvaluator,
  FusionOrchestrator,
  HookType
} from './fusion';

// 1. Evaluate opportunities
const evaluator = new FusionEvaluator(['memory', 'agents', 'planning']);
const opportunities = evaluator.getTopOpportunities(1);

console.log(`Top opportunity: ${opportunities[0].featureA} ↔ ${opportunities[0].featureB}`);
console.log(`Score: ${opportunities[0].metrics.total}/80`);
console.log(`Recommendation: ${opportunities[0].recommendation}`);

// 2. Implement fusion based on recommendation
const orchestrator = new FusionOrchestrator();

// Set up auto-trigger for agents → memory
orchestrator.getAutoTrigger().registerHook({
  type: HookType.POST_EXECUTION,
  provider: 'agents',
  consumer: 'memory',
  handler: async (context) => {
    await memoryManager.save({
      key: `agent-${context.data.id}`,
      value: context.data.result,
      category: 'agent-results'
    });
  }
});

// Set up pipeline for agents → planning
const pipeline = orchestrator.getPipeline();
pipeline.addStage({
  feature: 'agents',
  handler: async (context) => {
    const result = await agentManager.execute(context.data);
    return { data: result };
  }
});

pipeline.addStage({
  feature: 'planning',
  handler: async (context) => {
    const todo = await planningManager.create({
      content: `Review: ${context.data.summary}`,
      status: 'pending'
    });
    return { data: todo };
  }
});

// 3. Execute fused operations
const pipelineResult = await pipeline.executePipeline({
  source: 'agents',
  target: 'planning',
  operation: 'agent_workflow',
  data: { type: 'coder', task: 'Build feature' },
  timestamp: Date.now()
});

console.log('Fusion executed:', pipelineResult);
```

## Current Integration Status

| Feature Pair | Current Level | Potential Level | Score | Priority |
|--------------|---------------|-----------------|-------|----------|
| agents ↔ planning | 1 | 4 | 73/80 | HIGH |
| planning ↔ tdd | 1 | 4 | 72/80 | HIGH |
| memory ↔ agents | 1 | 3 | 65/80 | HIGH |
| memory ↔ science | 0 | 3 | 61/80 | MEDIUM |
| guide ↔ memory | 0 | 3 | 58/80 | MEDIUM |

## API Reference

See type definitions in `types.ts` for complete API documentation.

### Key Types

- `FusionLevel`: 0 | 1 | 2 | 3 | 4
- `HookType`: Enum with 8 event types
- `FusionPotential`: Evaluation result with metrics and recommendations
- `FusionResult`: Execution result with performance metrics
- `FusionContext`: Data passed between fused features

### Main Classes

- `FusionEvaluator`: Analyzes feature pairs and calculates scores
- `AutoTriggerFusion`: Event-driven integration pattern
- `SharedContextFusion`: Data sharing pattern
- `PipelineFusion`: Sequential execution pattern
- `ParallelFusion`: Concurrent execution pattern
- `FusionOrchestrator`: Central pattern manager
