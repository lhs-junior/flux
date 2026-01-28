# Architecture Overview

A 5-minute introduction to the awesome-plugin architecture, core principles, and module organization.

## Quick Introduction

Awesome Plugin is a sophisticated MCP (Model Context Protocol) gateway that intelligently manages tool discovery, loading, and execution across internal features and external MCP servers.

**Key Achievement**: 95% reduction in token usage through intelligent 3-layer tool loading.

## Core Principles

### 1. Single Responsibility Principle (SRP)

Each module has exactly one reason to change:

- **gateway.ts**: Changes to MCP server behavior or orchestration logic
- **mcp-server-manager.ts**: Changes to server connection management
- **tool-loader.ts**: Changes to tool loading or BM25 ranking
- **feature-coordinator.ts**: Changes to internal feature routing
- **mcp-client.ts**: Changes to MCP protocol interaction
- **types.ts**: Changes to shared type definitions

### 2. Dependency Injection (DI)

Dependencies are passed in, not created internally. This enables:
- **Testability**: Easy to mock dependencies in unit tests
- **Flexibility**: Swap implementations without code changes
- **Clarity**: Explicit dependencies visible in constructors

```typescript
// Good - Dependencies injected in constructor
class ToolSearchEngine {
  constructor(
    queryProcessor: QueryProcessor,
    toolLoader: ToolLoader,
    availableTools: Map<string, ToolMetadata>,
    options?: Partial<ToolSearchEngineOptions>
  ) {
    this.queryProcessor = queryProcessor;
    this.toolLoader = toolLoader;
    this.availableTools = availableTools;
  }
}

// Bad - Creating dependencies internally
class ToolSearchEngine {
  constructor() {
    this.queryProcessor = new QueryProcessor();  // ❌ Hard to test
    this.toolLoader = new ToolLoader();          // ❌ Hard to mock
  }
}
```

### 3. Clean Architecture Layers

Dependencies point inward (dependency inversion principle):

```
┌─────────────────────────────────────────┐
│      Entity/Orchestration Layer         │
│  Gateway, FeatureCoordinator            │
└─────────────────────────────────────────┘
           ↓ depends on
┌─────────────────────────────────────────┐
│      Manager/Use Case Layer             │
│  MCPServerManager, ToolSearchEngine     │
└─────────────────────────────────────────┘
           ↓ depends on
┌─────────────────────────────────────────┐
│    Infrastructure/External Layer        │
│  MCPClient, BM25Indexer, MetadataStore │
└─────────────────────────────────────────┘
```

**Benefits**:
- Upper layers don't know about lower layer implementation details
- Lower layers can be swapped without affecting upper layers
- Easy to test each layer independently

### 4. Type Safety via Centralization

All shared types live in `src/core/types.ts`:

```typescript
// CORRECT - Always import types from types.ts
import type { MCPServerConfig, ToolMetadata } from './types.js';

// WRONG - Never import types from other modules
import type { ToolMetadata } from './gateway.js';  // ❌
```

**Benefits**:
- Single source of truth
- Prevents circular imports
- Clear API contracts
- Easier refactoring

### 5. Backward Compatibility

Gateway exposes getters for managers to support legacy tests:

```typescript
export class AwesomePluginGateway {
  get memoryManager() {
    return this.featureCoordinator.getMemoryManager();
  }

  get agentOrchestrator() {
    return this.featureCoordinator.getAgentOrchestrator();
  }
}
```

This allows tests to access individual managers while maintaining clean internal architecture.

## Module Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                     Gateway (Orchestrator)              │
│              src/core/gateway.ts (AwesomePluginGateway) │
└──────┬───────────┬────────────────┬──────────────────────┘
       │           │                │
    ┌──▼───────────▼───┐  ┌───────┬▼──────────┐
    │ FeatureCoordinator│  │       Type System │
    │ (feature-coord)   │  │   (types.ts)     │
    └────────┬──────────┘  └──────────────────┘
             │
    ┌────────┼──────────────────────────────────────┐
    │        │                    FUSION LAYER      │
    │        │  ┌──────────────────────────────┐   │
    │        ├─▶│ Lifecycle Hooks Fusion       │   │
    │        │  │ (auto feature coordination)  │   │
    │        │  └──────────────────────────────┘   │
    │        │                                     │
    │        │  ┌──────────────────────────────┐   │
    │        ├─▶│ Context Recovery Fusion      │   │
    │        │  │ (save/restore state)         │   │
    │        │  └──────────────────────────────┘   │
    │        │                                     │
    │        │  ┌──────────────────────────────┐   │
    │        ├─▶│ Workflow Fusion              │   │
    │        │  │ (Plan→Agent→TDD→Memory)     │   │
    │        │  └──────────────────────────────┘   │
    │        │                                     │
    │        │  ┌──────────────────────────────┐   │
    │        └─▶│ Dashboard Fusion             │   │
    │           │ (unified status view)        │   │
    │           └──────────────────────────────┘   │
    │                                               │
    │ ┌─────────────────────────────────────────┐  │
    │ │ Internal Feature Managers (6 features)  │  │
    │ ├─────────────────────────────────────────┤  │
    │ │ • MemoryManager                         │  │
    │ │ • AgentOrchestrator                     │  │
    │ │ • PlanningManager                       │  │
    │ │ • TDDManager                            │  │
    │ │ • GuideManager                          │  │
    │ │ • ScienceManager                        │  │
    │ └─────────────────────────────────────────┘  │
    │                                               │
    └───────────────────────────────────────────────┘
             │
    ┌────────┴──────────────────────────────────────┐
    │              Manager Layer                    │
    ├──────────────────────────────────────────────┤
    │ • ToolLoader (BM25 + 3-layer loading)        │
    │ • ToolSearchEngine (query + BM25)            │
    │ • MCPServerManager (external servers)        │
    │ • SessionManager (session tracking)          │
    │ • MetadataStore (persistence)                │
    └────────────────────────────────────────────┬─┘
             │
    ┌────────▼──────────────────────────────────┐
    │         Low-Level Components              │
    ├─────────────────────────────────────────┤
    │ • MCPClient (MCP protocol wrapper)       │
    │ • BM25Indexer (search algorithm)        │
    │ • QueryProcessor (intent analysis)      │
    │ • Logger (unified logging)              │
    └────────────────────────────────────────┘
```

## Key Modules

### Gateway (Orchestrator)
**File**: `src/core/gateway.ts`

Main entry point and orchestrator. Responsibilities:
- Initialize and manage all sub-components
- Handle MCP server lifecycle (start/stop)
- Route tool calls to internal features or external servers
- Record usage statistics

### FeatureCoordinator
**File**: `src/core/feature-coordinator.ts`

Manages all internal features. Responsibilities:
- Initialize 6 internal feature managers
- Aggregate tool definitions from all features
- Route tool calls to appropriate feature manager
- Provide accessors for backward compatibility

### Type System
**File**: `src/core/types.ts`

Single source of truth for all shared types:
- `MCPServerConfig`: External server configuration
- `ToolMetadata`: Enhanced tool definition with serverId, category, keywords
- `GatewayOptions`: Configuration options
- All other shared interfaces

### Fusion System (Intelligent Coordination Layer)

**Location**: `src/fusion/`

The Fusion system provides smart coordination between features through:

**1. Lifecycle Hooks Fusion** (`src/fusion/implementations/lifecycle-hooks-fusion.ts`)

- Event-driven automatic feature connections
- Hooks: SessionStart, AgentCompleted, TDDCompleted, MemorySaved, etc.
- Enables Level 3+ integration without manual coordination

**2. Context Recovery Fusion** (`src/fusion/implementations/context-recovery-fusion.ts`)

- Automatic state capture and restoration
- Preserves Memory, Planning, Agent history, TDD results across sessions
- Enables infinite context extension through session management

**3. Workflow Fusion** (`src/fusion/implementations/workflow-fusion.ts`)

- Auto-coordinates Planning → Agent → TDD → Memory workflow
- Eliminates manual sequencing; describes goal, system coordinates execution
- Level 3 integration: Planning auto-spawns agents, agents auto-run tests, tests auto-save results

**4. Dashboard Fusion** (`src/fusion/implementations/dashboard-fusion.ts`)

- Unified status view across all 6 features in one call
- Collects: Memory (entries), Planning (TODOs), Agents (running), TDD (pass rate), Guide, Science
- Token-efficient: One call instead of querying each feature separately

**Key Principle**: Fusion enables **똑똑한 협력** (Smart Cooperation) between features—features automatically trigger and coordinate with each other through hooks, not parallelism or code merging.

## Data Flow Summary

### Tool Call Execution

```
User Request via MCP
        ↓
Gateway.CallToolRequestSchema handler
        ↓
    Is Internal?
    ↙         ↘
   YES        NO
    ↓          ↓
 FeatureCoord  MCPServerMgr
 routeToolCall getClient
    ↓          ↓
 Feature      MCPClient
 Manager      callTool
    ↓          ↓
 Execute      Execute
    ↓          ↓
    └────┬─────┘
         ↓
   Record Usage
   - toolLoader.recordToolUsage
   - metadataStore.updateToolUsage
   - metadataStore.addUsageLog
         ↓
   Return Result
```

### Tool Registration

```
Server Connection Request
        ↓
MCPServerManager.connectToServer
        ↓
MCPClient.connect
        ↓
MCPClient.listTools
        ↓
Register in 3 places:
  ├─ availableTools Map (fast lookup)
  ├─ toolLoader (BM25 indexing)
  └─ metadataStore (persistence)
        ↓
Ready for Use
```

## Performance Highlights

- **Tool Search**: 0.2-0.7ms across 500+ tools
- **Token Reduction**: 95% reduction via 3-layer loading
- **Layer 1 (Essential)**: ~1.5K tokens (always loaded)
- **Layer 2 (Dynamic)**: ~3-4.5K tokens (query-matched)
- **Layer 3 (On-Demand)**: Remaining tools (loaded only when requested)

## Architecture Benefits

1. **Maintainability**: Clear separation makes changes isolated and safe
2. **Testability**: Dependency injection enables comprehensive unit testing
3. **Extensibility**: New features integrate through FeatureCoordinator pattern
4. **Performance**: Intelligent tool loading minimizes token usage
5. **Type Safety**: Centralized types prevent errors and circular imports
6. **Scalability**: Layered architecture supports growth without complexity

## Next Steps

- **[FeatureCoordinator Pattern](./feature-coordinator.md)**: Deep dive into internal feature management
- **[Tool Loading Strategy](./tool-loading.md)**: Understanding the 3-layer BM25-based approach
- **[Integration Patterns](./integration-patterns.md)**: Best practices for feature integration
