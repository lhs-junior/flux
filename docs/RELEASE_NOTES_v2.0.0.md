# v2.0.0 - Plugin Architecture Refactoring

**Major architecture refactoring with plugin-first design and 63% gateway complexity reduction.**

This is a **MAJOR VERSION** release with significant architectural improvements. The codebase has been refactored from MCP-centric to a clean plugin-first architecture with proper separation of concerns.

---

## Breaking Changes

- **Type Imports**: Types must now be imported from `./core/types.js` instead of `./core/gateway.js`
  - All internal modules have been updated
  - Public API maintains backward compatibility through re-exports
  - No changes required for external consumers using the public API

---

## Added

### New Architecture Components

- **types.ts**: Centralized type definitions (MCPServerConfig, ToolMetadata, GatewayOptions)
- **mcp-server-manager.ts**: Dedicated external MCP server lifecycle management (180 lines)
- **feature-coordinator.ts**: Unified internal feature management hub (248 lines)
- **tool-search-engine.ts**: Search orchestration layer (67 lines)
- **ARCHITECTURE.md**: Comprehensive architecture documentation
  - Module hierarchy and dependency graph
  - Type import patterns and best practices
  - Feature extension guide
  - Design principles and data flow diagrams

---

## Changed

### Gateway Refactoring

- **Reduced complexity by 63%**: ~800 lines → 298 lines
- **Eliminated circular dependencies**: Clean bottom-up dependency hierarchy
  - Layer 1: types.ts (0 dependencies)
  - Layer 2: Infrastructure (mcp-client, tool-loader, bm25-indexer)
  - Layer 3: Managers (mcp-server-manager, feature-coordinator, tool-search-engine)
  - Layer 4: Orchestration (gateway.ts)
- **Improved modularity**: Each module has single responsibility
- **Enhanced testability**: Components can be tested in isolation

### Type System Improvements

- **21 files updated** to import types from types.js
  - Core modules: tool-loader, mcp-client
  - Feature modules: memory, planning, agents, TDD, guide, science
  - Test files: integration and unit tests
- **Zero circular dependencies**: Types no longer depend on gateway implementation
- **Better IDE support**: Faster type checking and autocompletion

---

## Fixed

- **Circular dependency resolution**: Low-level modules (bm25-indexer, tool-loader) no longer import from gateway
- **Type safety**: Eliminated implicit any types in type access patterns
- **Architecture violations**: Established clear module boundaries and dependency rules

---

## Quality Assurance

- ✅ **Build**: TypeScript compilation successful
- ✅ **Tests**: 327/327 passing (100% pass rate)
- ✅ **Architecture**: Verified by UltraQA autonomous testing
- ✅ **Backward Compatibility**: Public API unchanged

---

## Developer Experience

- **Clear module hierarchy**: Easy to understand codebase structure
- **Extension guide**: ARCHITECTURE.md provides step-by-step feature addition guide
- **Better maintainability**: Single responsibility principle applied throughout
- **Improved debugging**: Clear separation makes issue diagnosis easier

---

## Migration Guide

For library consumers using the public API (index.ts exports), no changes required.

For internal development or plugin authors:

```typescript
// Before (deprecated)
import type { ToolMetadata } from './core/gateway.js';

// After (correct)
import type { ToolMetadata } from './core/types.js';
```

---

## Performance

- No performance regression
- Gateway initialization remains unchanged
- Tool search performance maintained (<2ms for 200+ tools)

---

## What's Changed

### Commits

The following commits are included in this release:

```
5402102 feat: implement database indexes and fix all tests (100% pass rate)
8e54731 docs: update KNOWN_ISSUES.md for v1.2.0 release
5ad1615 release: v1.2.0 - Documentation & Performance Improvements
c724f5d release: v1.1.0 - Error Handling & Type Safety
40a05a3 release: v1.0.0 - Production Ready Release
```

---

## Full Changelog

For a complete list of changes between v1.2.0 and v2.0.0, see the [full changelog](https://github.com/yourusername/awesome-pulgin/blob/main/CHANGELOG.md#200---2026-01-29).

---

**Released**: January 29, 2026
