# Awesome Plugin Architecture

A comprehensive guide to the plugin architecture, module organization, and design patterns used in awesome-plugin.

## Table of Contents

1. [Overview](#overview)
2. [Module Hierarchy](#module-hierarchy)
3. [Core Modules](#core-modules)
4. [Type Import Patterns](#type-import-patterns)
5. [Feature System](#feature-system)
6. [Data Flow](#data-flow)
7. [Design Principles](#design-principles)
8. [Adding New Features](#adding-new-features)

## Overview

Awesome Plugin is a sophisticated MCP (Model Context Protocol) gateway that intelligently manages tool discovery, loading, and execution across internal features and external MCP servers. The architecture emphasizes:

- **Clean Separation of Concerns**: Each module has a single responsibility
- **Dependency Injection**: Dependencies are passed, not created
- **Intelligent Tool Loading**: 3-layer strategy to reduce token usage by 95%
- **Extensibility**: New features integrate seamlessly through FeatureCoordinator
- **Type Safety**: All imports flow from centralized type definitions

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
    ┌────────┴──────────────────────────────────────┐
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

## Core Modules

### 1. `types.ts` - Type Definitions

**Location**: `src/core/types.ts`

The single source of truth for all shared types. All other modules import from this file, not from each other.

```typescript
// MCPServerConfig: External MCP server configuration
interface MCPServerConfig {
  id: string;           // Unique identifier
  name: string;         // Display name
  command: string;      // Command to execute
  args?: string[];      // Command arguments
  env?: Record<string, string>;  // Environment variables
}

// ToolMetadata: Enhanced tool definition
interface ToolMetadata extends Tool {
  serverId: string;     // Which server provides this tool
  category?: string;    // Tool category (communication, database, etc)
  keywords?: string[];  // Searchable keywords
}

// GatewayOptions: Configuration options
interface GatewayOptions {
  dbPath?: string;           // SQLite database path
  enableToolSearch?: boolean; // Enable BM25 search
  maxLayer2Tools?: number;    // Max tools in dynamic layer
}
```

**Import Pattern**:
```typescript
// CORRECT - Always import types from types.ts
import type { MCPServerConfig, ToolMetadata, GatewayOptions } from './types.js';

// WRONG - Never import types from gateway.ts
import type { ToolMetadata } from './gateway.js';  // ❌
```

### 2. `gateway.ts` - Main Orchestration Layer

**Location**: `src/core/gateway.ts`

The main entry point for the plugin system. Acts as the MCP server and orchestrates all other components.

**Key Responsibilities**:
- Initialize and manage all sub-components (dependency injection)
- Expose getters for backward compatibility with tests
- Handle MCP server lifecycle (start/stop)
- Route tool calls to internal features or external servers
- Record usage statistics

**Core Class**: `AwesomePluginGateway`

```typescript
export class AwesomePluginGateway {
  // Internal managers
  private featureCoordinator: FeatureCoordinator;
  private mcpServerManager: MCPServerManager;
  private toolSearchEngine: ToolSearchEngine;
  private toolLoader: ToolLoader;
  private sessionManager: SessionManager;
  private metadataStore: MetadataStore;

  // Constructor initializes everything
  constructor(options: GatewayOptions = {});

  // Main API methods
  async connectToServer(config: MCPServerConfig): Promise<void>;
  async disconnectServer(serverId: string): Promise<void>;
  async searchTools(query: string): Promise<ToolMetadata[]>;
  async start(): Promise<void>;
  async stop(): Promise<void>;
}
```

**Architecture Pattern**: The Gateway uses dependency injection to pass initialized managers to sub-components, enabling clean separation and testability.

### 3. `mcp-server-manager.ts` - External Server Management

**Location**: `src/core/mcp-server-manager.ts`

Manages connections to external MCP servers and their tool registration.

**Key Responsibilities**:
- Create and maintain MCPClient connections
- Register tools from connected servers
- Handle server disconnection and cleanup
- Maintain a registry of active servers

**Core Class**: `MCPServerManager`

```typescript
export class MCPServerManager {
  private connectedServers: Map<string, MCPServerConfig>;
  private mcpClients: Map<string, MCPClient>;
  private availableTools: Map<string, ToolMetadata>;

  async connectToServer(config: MCPServerConfig): Promise<void>;
  async disconnectServer(serverId: string): Promise<void>;
  async disconnectAll(): Promise<void>;
  getClient(serverId: string): MCPClient | undefined;
  getConnectedServerCount(): number;
}
```

**Data Flow**:
1. Gateway calls `connectToServer(config)`
2. MCPServerManager creates an MCPClient
3. MCPClient connects via StdioClientTransport
4. MCPServerManager fetches tools via `client.listTools()`
5. Tools are registered in three places:
   - `availableTools` map (fast lookup)
   - `toolLoader` (for BM25 search indexing)
   - `metadataStore` (persistent storage)

### 4. `feature-coordinator.ts` - Internal Feature Management

**Location**: `src/core/feature-coordinator.ts`

Manages all internal feature managers and provides unified tool definition and routing.

**Key Responsibilities**:
- Initialize all internal feature managers
- Aggregate tool definitions from all features
- Route tool calls to appropriate feature manager
- Provide accessors for backward compatibility

**Core Class**: `FeatureCoordinator`

```typescript
export class FeatureCoordinator {
  private memoryManager: MemoryManager;
  private agentOrchestrator: AgentOrchestrator;
  private planningManager: PlanningManager;
  private tddManager: TDDManager;
  private guideManager: GuideManager;
  private scienceManager: ScienceManager;

  // Get all tools from all features
  getAllToolDefinitions(): ToolMetadata[];

  // Check if feature is internal
  isInternalFeature(serverId: string): boolean;

  // Route tool calls to appropriate manager
  routeToolCall(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> | null;
}
```

**Internal Feature IDs**:
- `internal:memory` - Memory management
- `internal:agents` - Agent orchestration
- `internal:planning` - Planning & TODO tracking
- `internal:tdd` - TDD workflow
- `internal:guide` - Guide system
- `internal:science` - Scientific computing

### 5. `tool-search-engine.ts` - Search Orchestration

**Location**: `src/core/tool-search-engine.ts`

Orchestrates intelligent tool searching using query processing and BM25 indexing.

**Key Responsibilities**:
- Process user queries to extract intent
- Execute BM25 search on tool database
- Return ranked results

**Core Class**: `ToolSearchEngine`

```typescript
export class ToolSearchEngine {
  private queryProcessor: QueryProcessor;
  private toolLoader: ToolLoader;
  private availableTools: Map<string, ToolMetadata>;

  async search(
    query: string,
    options?: { limit?: number }
  ): Promise<ToolMetadata[]>;
}
```

**Search Flow**:
1. User query arrives at gateway
2. ToolSearchEngine processes query with QueryProcessor
3. Query intent and keywords are extracted
4. BM25Indexer searches for relevant tools
5. Results are ranked by relevance + usage history
6. Top N results returned

**Performance**: Typical search completes in **0.2-0.7ms** across 500+ tools.

### 6. `tool-loader.ts` - Tool Loading with BM25

**Location**: `src/core/tool-loader.ts`

Implements the 3-layer intelligent tool loading strategy with BM25-based relevance ranking.

**Key Responsibilities**:
- Register and index tools with BM25
- Implement 3-layer loading strategy
- Combine BM25 scores with usage history
- Track tool usage over time

**Core Class**: `ToolLoader`

```typescript
export class ToolLoader {
  private allTools: Map<string, ToolMetadata>;
  private essentialTools: Set<string>;
  private loadingHistory: Map<string, number>;
  private bm25Indexer: BM25Indexer;

  // Register tools for indexing
  registerTools(tools: ToolMetadata[]): void;

  // 3-layer loading with strategy info
  loadTools(
    query?: string,
    options?: { maxLayer2?: number }
  ): LoadedToolsResult;

  // Search using BM25 + usage history
  searchTools(query: string, options?: { limit?: number }): ToolMetadata[];

  // Record tool usage for learning
  recordToolUsage(toolName: string): void;

  // Get most frequently used tools
  getMostUsedTools(limit?: number): ToolMetadata[];
}
```

**3-Layer Strategy**:

```
Layer 1: Essential Tools (Always Loaded)
  └─ Fixed set of always-available tools
  └─ ~1.5K tokens
  └─ Examples: read_file, write_file, bash

  ↓ User Query: "send slack message"

Layer 2: BM25-Matched Tools (Dynamic)
  └─ Query-matched tools via BM25 search
  └─ ~3-4.5K tokens (10-15 tools)
  └─ Combined with usage history for ranking
  └─ Examples: slack_send_message, notify_channel

  ↓ Explicit Request

Layer 3: On-Demand Tools
  └─ Remaining tools available on request
  └─ Loaded only when explicitly needed
```

**Scoring Algorithm**:
```
Final Score = BM25 Score + Usage Boost
Usage Boost = log(usageCount + 1) * 0.1  // Logarithmic boost
```

### 7. `mcp-client.ts` - Low-Level MCP Wrapper

**Location**: `src/core/mcp-client.ts`

Wraps the MCP SDK client, providing a clean interface for server communication.

**Key Responsibilities**:
- Create and manage MCP protocol connections
- List tools from connected servers
- Execute tool calls on remote servers
- Infer tool metadata (category, keywords)
- Handle reconnection logic

**Core Class**: `MCPClient`

```typescript
export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected: boolean = false;

  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  async listTools(): Promise<ToolMetadata[]>;
  async callTool(name: string, args: Record<string, unknown>): Promise<any>;
  isConnected(): boolean;
}
```

**Tool Metadata Inference**:
- **Categories**: communication, database, filesystem, development, web, ai
- **Keywords**: Extracted from tool name and description
- **Enrichment**: Adds `serverId`, `category`, and `keywords` to tools

## Type Import Patterns

### Rule 1: Always Import Types from `types.ts`

```typescript
// CORRECT
import type { MCPServerConfig, ToolMetadata } from './types.js';

// WRONG - Never import types from other modules
import type { ToolMetadata } from './gateway.js';  // ❌
import type { ToolMetadata } from './mcp-server-manager.js';  // ❌
```

### Rule 2: Re-export for API Surface

Gateway.ts re-exports types for convenience:

```typescript
// src/core/gateway.ts
export type { MCPServerConfig, ToolMetadata, GatewayOptions } from './types.js';

// Allows consumer code to import from gateway
import { AwesomePluginGateway, type ToolMetadata } from 'awesome-plugin';
```

### Rule 3: Internal Modules Always Reference types.ts

```typescript
// src/core/mcp-server-manager.ts
import type { MCPServerConfig, ToolMetadata } from './types.js';  // Always

// src/core/tool-loader.ts
import type { ToolMetadata } from './types.js';  // Always
```

## Feature System

The FeatureCoordinator pattern enables seamless feature addition. Each feature:

1. **Is a Manager Class** with standard interface:
   - `getToolDefinitions(): ToolMetadata[]`
   - `handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown>`
   - `close(): void`

2. **Gets a Unique serverId**: Format is `internal:{featureName}`

3. **Is Registered in FeatureCoordinator**:
   - Initialized in constructor with dependencies
   - Added to tool definition aggregation
   - Routed through switch statement in `routeToolCall`

4. **Gets Gateway Accessors** for backward compatibility:
   - Getters expose managers for tests: `gateway.memoryManager`
   - Getters proxy through feature coordinator

### Example Feature Manager Pattern

```typescript
// Memory feature
export class MemoryManager {
  private store: MemoryStore;
  private indexer: BM25Indexer;

  constructor(dbPath: string) {
    this.store = new MemoryStore(dbPath);
    this.indexer = new BM25Indexer();
  }

  // Required: Provide tool definitions
  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'memory_save',
        description: '...',
        inputSchema: MemorySaveInputSchema,
        serverId: 'internal:memory',
      },
      // ... more tools
    ];
  }

  // Required: Handle tool calls
  async handleToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case 'memory_save':
        return this.save(args as MemorySaveInput);
      case 'memory_recall':
        return this.recall(args as MemoryRecallInput);
      // ...
    }
  }

  // Required: Cleanup on shutdown
  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.close();
  }
}
```

## Data Flow

### Tool Call Execution Flow

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
Feature     MCPClient
Manager     callTool
    ↓          ↓
Execute    Execute
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

### Tool Registration Flow

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

## Design Principles

### 1. Single Responsibility Principle

Each module has one reason to change:

- **gateway.ts**: Changes to MCP server behavior or orchestration logic
- **mcp-server-manager.ts**: Changes to server connection management
- **tool-loader.ts**: Changes to tool loading or BM25 ranking
- **mcp-client.ts**: Changes to MCP protocol interaction
- **types.ts**: Changes to shared type definitions

### 2. Dependency Injection

Dependencies are injected, not created:

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

Dependencies point inward (dependency inversion principle).

### 4. Backward Compatibility

Gateway exposes getters for managers:

```typescript
export class AwesomePluginGateway {
  get memoryManager() {
    return this.featureCoordinator.getMemoryManager();
  }

  get agentOrchestrator() {
    return this.featureCoordinator.getAgentOrchestrator();
  }

  // ... more managers
}
```

This allows tests to access individual managers while maintaining the internal architecture.

### 5. Type Safety via Centralization

All types live in `types.ts`:
- Single source of truth
- Prevents circular imports
- Clear API contracts
- Easier refactoring

## Adding New Features

### Step 1: Create Feature Manager

Create `src/features/{featureName}/{featureName}-manager.ts`:

```typescript
import type { ToolMetadata } from '../../core/types.js';

export class MyFeatureManager {
  constructor(dbPath: string) {
    // Initialize any stores, indexers, etc.
  }

  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'my_tool',
        description: 'Does something',
        inputSchema: { /* ... */ },
        serverId: 'internal:myfeature',
      },
    ];
  }

  async handleToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case 'my_tool':
        return this.doSomething(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  close(): void {
    // Cleanup resources
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

Edit `src/core/gateway.ts` for backward compatibility:

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
    expect(tools[0].name).toBe('my_tool');
    expect(tools[0].serverId).toBe('internal:myfeature');
  });

  it('should handle tool calls', async () => {
    const manager = new MyFeatureManager(':memory:');
    const result = await manager.handleToolCall('my_tool', { /* args */ });

    expect(result).toBeDefined();
  });
});
```

## Summary

The awesome-plugin architecture achieves clean, maintainable code through:

1. **Centralized Types** - All types in `types.ts`, no circular imports
2. **Layered Architecture** - Clear separation between orchestration, managers, and infrastructure
3. **Dependency Injection** - Dependencies passed in, enabling testability
4. **Feature Coordinator Pattern** - New features integrate through a single coordinator
5. **Single Responsibility** - Each module has one reason to change
6. **Backward Compatibility** - Gateway exposes getters for direct manager access
7. **Intelligent Tool Loading** - 3-layer strategy reduces token usage by 95%

This design makes the codebase easy to understand, test, and extend.
