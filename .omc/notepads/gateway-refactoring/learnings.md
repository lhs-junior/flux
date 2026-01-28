# Gateway Refactoring - Learnings

## Step 3: Extract MCPServerManager (2026-01-28)

### What Was Done
Successfully extracted MCPServerManager from gateway.ts into a separate module:

1. **Created `/Users/hyunsoo/personal-projects/awesome-pulgin/src/core/mcp-server-manager.ts`**
   - Moved connectToServer() method (~39 lines extracted)
   - Moved private registerServerTools() method (~27 lines extracted)
   - Moved disconnectServer() method (~25 lines extracted)
   - Moved disconnectAll() logic from stop() method (~26 lines extracted)
   - Total: ~117 lines extracted from gateway.ts

2. **API Design**
   ```typescript
   export interface MCPServerManagerDependencies {
     metadataStore: MetadataStore;
     toolLoader: ToolLoader;
     availableTools: Map<string, ToolMetadata>;
   }

   export class MCPServerManager {
     constructor(deps: MCPServerManagerDependencies);
     connectToServer(config: MCPServerConfig): Promise<void>;
     disconnectServer(serverId: string): Promise<void>;
     disconnectAll(): Promise<void>;
     getClient(serverId: string): MCPClient | undefined;
     getConnectedServerCount(): number;
   }
   ```

3. **Gateway Updates**
   - Added MCPServerManager import
   - Removed private fields: connectedServers, mcpClients
   - Added private field: mcpServerManager: MCPServerManager
   - Instantiate MCPServerManager in constructor with dependencies
   - Simplified connectToServer() to delegate: `return this.mcpServerManager.connectToServer(config)`
   - Simplified disconnectServer() to delegate: `return this.mcpServerManager.disconnectServer(serverId)`
   - Removed registerServerTools() method (now private in MCPServerManager)
   - Updated tool call routing to use `mcpServerManager.getClient()`
   - Updated getStatistics() to use `mcpServerManager.getConnectedServerCount()`
   - Simplified stop() to delegate: `await this.mcpServerManager.disconnectAll()`

### Key Patterns

**Dependency Injection Pattern**
- MCPServerManager receives all dependencies via constructor
- Shares references to MetadataStore, ToolLoader, and availableTools Map
- No direct instantiation of shared dependencies inside the class
- Makes testing easier and improves modularity

**Single Responsibility Principle**
- Gateway no longer handles MCP server connection details
- MCPServerManager encapsulates all server lifecycle management
- Clear separation between orchestration (Gateway) and server management (MCPServerManager)

**Shared State Management**
- availableTools Map is passed by reference to MCPServerManager
- MCPServerManager updates the shared Map during tool registration
- Gateway can still read from the same Map for tool routing
- Avoids data duplication and synchronization issues

**Internal State Encapsulation**
- MCPServerManager owns connectedServers and mcpClients Maps
- Gateway no longer needs to track these internal details
- Provides clean public API: getClient(), getConnectedServerCount()

### Results
- **TypeScript compilation**: ✅ Clean (npm run typecheck)
- **Test suite**: ✅ All 327 tests pass
- **Lines extracted**: ~117 lines from gateway.ts
- **New module size**: 179 lines total
- **Gateway size**: Reduced to 297 lines (from ~414 lines)

### Integration Points
- Gateway constructor instantiates MCPServerManager after initializing:
  - MetadataStore
  - ToolLoader
  - AvailableTools Map

- Server connection flow:
  1. Gateway.connectToServer() receives config
  2. Delegates to MCPServerManager.connectToServer()
  3. MCPServerManager creates MCPClient
  4. MCPServerManager calls registerServerTools() (private method)
  5. Tools are registered in shared availableTools Map
  6. Gateway can immediately route tool calls

- Tool routing:
  1. Gateway receives tool call request
  2. Looks up tool metadata in availableTools Map
  3. Gets MCPClient via mcpServerManager.getClient(serverId)
  4. Calls client.callTool()

### Refactoring Benefits
1. **Modularity**: Server management logic isolated and reusable
2. **Testability**: Can test MCPServerManager independently
3. **Maintainability**: Clear ownership of server connection lifecycle
4. **Extensibility**: Easy to add server management features without touching Gateway
5. **Code Size**: Gateway.ts reduced by ~117 lines (28% reduction)

## Step 4: Extract ToolSearchEngine (2026-01-28)

### What Was Done
Successfully extracted ToolSearchEngine from gateway.ts into a separate module:

1. **Created `/Users/hyunsoo/personal-projects/awesome-pulgin/src/core/tool-search-engine.ts`**
   - Moved searchTools method logic (~31 lines extracted)
   - Moved QueryProcessor ownership from gateway to ToolSearchEngine
   - Implements clean API with configurable options

2. **API Design**
   ```typescript
   export interface ToolSearchEngineOptions {
     maxResults: number;
     enableToolSearch: boolean;
   }

   export class ToolSearchEngine {
     constructor(
       queryProcessor: QueryProcessor,
       toolLoader: ToolLoader,
       availableTools: Map<string, ToolMetadata>,
       options?: Partial<ToolSearchEngineOptions>
     );

     search(query: string, options?: { limit?: number }): Promise<ToolMetadata[]>;
   }
   ```

3. **Gateway Updates**
   - Added ToolSearchEngine import
   - Added private field: `toolSearchEngine: ToolSearchEngine`
   - Instantiate ToolSearchEngine in constructor after MCPServerManager
   - Simplified searchTools() to delegate: `return this.toolSearchEngine.search(query, options)`

### Key Patterns

**Dependency Injection Pattern**
- ToolSearchEngine receives all dependencies via constructor
- No direct instantiation of dependencies inside the class
- Makes testing easier and improves modularity

**Single Responsibility Principle**
- Gateway no longer handles search logic details
- ToolSearchEngine encapsulates all search-related functionality
- Clear separation between orchestration (Gateway) and search (ToolSearchEngine)

**Options Pattern**
- Use `Partial<ToolSearchEngineOptions>` for optional configuration
- Provide sensible defaults: maxResults=15, enableToolSearch=true
- Allow runtime override via search() method options parameter

### Results
- **TypeScript compilation**: ✅ Clean (npm run typecheck)
- **Test suite**: ✅ All 327 tests pass
- **Lines extracted**: ~31 lines from gateway.ts
- **New module size**: 65 lines total

### Integration Points
- Gateway constructor instantiates ToolSearchEngine after initializing:
  - QueryProcessor
  - ToolLoader
  - AvailableTools Map
  - Configuration options (enableToolSearch, maxLayer2Tools)

- Search flow:
  1. Gateway.searchTools() receives query
  2. Delegates to ToolSearchEngine.search()
  3. ToolSearchEngine uses QueryProcessor to enhance query
  4. ToolSearchEngine uses ToolLoader for BM25 search
  5. Returns filtered ToolMetadata[]

### Refactoring Benefits
1. **Modularity**: Search logic isolated and reusable
2. **Testability**: Can test ToolSearchEngine independently
3. **Maintainability**: Clear ownership of search functionality
4. **Extensibility**: Easy to add search features without touching Gateway
