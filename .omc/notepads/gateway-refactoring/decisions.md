# Gateway Refactoring - Architecture Decisions

## Step 4: ToolSearchEngine Extraction (2026-01-28)

### Decision: Create Separate ToolSearchEngine Module

**Context:**
The Gateway class was handling both orchestration and tool search logic. The searchTools method (lines 312-342, ~31 lines) contained BM25 search logic that could be extracted.

**Decision:**
Extract tool search functionality into a dedicated `ToolSearchEngine` class.

**Rationale:**

1. **Single Responsibility Principle**
   - Gateway should orchestrate, not implement search algorithms
   - ToolSearchEngine focuses solely on tool discovery and ranking

2. **Testability**
   - Can test search logic independently without Gateway infrastructure
   - Easier to mock and unit test

3. **Reusability**
   - ToolSearchEngine can be used by other components (e.g., CLI, API layer)
   - Not tied to MCP server lifecycle

4. **Maintainability**
   - Search improvements only touch ToolSearchEngine
   - Gateway code stays clean and focused

### Design Choices

**Constructor Dependencies:**
```typescript
constructor(
  queryProcessor: QueryProcessor,
  toolLoader: ToolLoader,
  availableTools: Map<string, ToolMetadata>,
  options?: Partial<ToolSearchEngineOptions>
)
```

- **QueryProcessor**: Passed in (not instantiated) for flexibility
- **ToolLoader**: Reference to existing loader for BM25 search
- **availableTools**: Shared Map reference for live tool registry
- **options**: Configurable behavior (maxResults, enableToolSearch)

**Why not instantiate dependencies internally?**
- Maintains Gateway's control over shared resources
- Prevents duplicate instances of QueryProcessor and ToolLoader
- Allows testing with mock dependencies

**Options Pattern:**
```typescript
export interface ToolSearchEngineOptions {
  maxResults: number;
  enableToolSearch: boolean;
}
```

- Explicit interface for configuration
- Partial<> allows optional configuration
- Defaults: maxResults=15, enableToolSearch=true

### Integration Points

**Initialization Order in Gateway:**
1. SessionManager, ToolLoader, QueryProcessor
2. MetadataStore, FeatureCoordinator
3. MCPServerManager (external servers)
4. **ToolSearchEngine** ← New addition
5. registerInternalTools()
6. setupHandlers()

**Why after MCPServerManager?**
- Needs availableTools Map to be initialized
- Doesn't depend on MCP servers being connected
- Before internal tools registration is fine (operates on shared Map)

### API Design

**Public Method:**
```typescript
async search(query: string, options?: { limit?: number }): Promise<ToolMetadata[]>
```

**Design rationale:**
- Simple async interface matching Gateway's existing searchTools
- Optional limit allows per-call override
- Returns ToolMetadata[] for compatibility
- No side effects (pure search operation)

### Alternative Approaches Considered

**Alternative 1: Keep in Gateway**
- ❌ Violates SRP
- ❌ Gateway becomes too large
- ❌ Hard to test in isolation

**Alternative 2: Static utility function**
- ❌ No encapsulation of options
- ❌ No state management
- ❌ Hard to extend

**Alternative 3: Strategy pattern with SearchStrategy interface**
- ✅ More flexible
- ❌ Over-engineered for current needs
- ❌ Only one search strategy currently
- 💡 Can evolve to this later if needed

### Future Extensibility

The current design allows for future enhancements:

1. **Multiple search strategies:**
   ```typescript
   constructor(
     queryProcessor: QueryProcessor,
     toolLoader: ToolLoader,
     availableTools: Map<string, ToolMetadata>,
     searchStrategy: SearchStrategy, // Future addition
     options?: Partial<ToolSearchEngineOptions>
   )
   ```

2. **Search result caching:**
   ```typescript
   private cache: Map<string, ToolMetadata[]>;
   async search(query: string, options?: { limit?: number, useCache?: boolean })
   ```

3. **Search analytics:**
   ```typescript
   getSearchStats(): SearchStatistics
   ```

### Verification Results

- ✅ TypeScript compilation: Clean (npm run typecheck)
- ✅ All 327 tests pass (no changes required)
- ✅ No breaking changes to existing API
- ✅ Gateway.searchTools() maintains same signature
