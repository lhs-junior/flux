# Awesome Plugin Architecture

> **Note**: This document has been split into focused guides for easier navigation.

## Quick Links

### Core Documentation

1. **[Architecture Overview](./developer/architecture/overview.md)** (265 lines)
   - 5-minute introduction to the architecture
   - Core design principles (SRP, DI, Clean Architecture)
   - Module hierarchy and data flow
   - Performance highlights

2. **[FeatureCoordinator Pattern](./developer/architecture/feature-coordinator.md)** (671 lines)
   - Detailed explanation of the FeatureCoordinator pattern
   - All 6 internal feature managers
   - Integration mechanisms
   - Step-by-step guide for adding new features

3. **[Tool Loading Strategy](./developer/architecture/tool-loading.md)** (597 lines)
   - 3-layer intelligent tool loading
   - BM25 indexing implementation
   - Performance optimization techniques
   - Usage tracking and learning

4. **[Integration Patterns](./developer/architecture/integration-patterns.md)** (770 lines)
   - Feature-to-feature communication patterns
   - Dependency injection strategies
   - Hook points for extensibility
   - Error handling and testing best practices

## Quick Start

### For New Developers

Start with [Architecture Overview](./developer/architecture/overview.md) to understand the overall system design.

### For Feature Development

Read [FeatureCoordinator Pattern](./developer/architecture/feature-coordinator.md) to learn how to add new features.

### For Performance Optimization

See [Tool Loading Strategy](./developer/architecture/tool-loading.md) to understand token reduction techniques.

### For Advanced Integration

Study [Integration Patterns](./developer/architecture/integration-patterns.md) for best practices and patterns.

## Architecture at a Glance

```text
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
    │ Internal Feature Managers (6 features)        │
    │ • MemoryManager                               │
    │ • AgentOrchestrator                           │
    │ • PlanningManager                             │
    │ • TDDManager                                  │
    │ • GuideManager                                │
    │ • ScienceManager                              │
    └───────────────────────────────────────────────┘
             │
    ┌────────┴──────────────────────────────────────┐
    │              Manager Layer                    │
    │ • ToolLoader (BM25 + 3-layer loading)        │
    │ • ToolSearchEngine (query + BM25)            │
    │ • MCPServerManager (external servers)        │
    │ • SessionManager (session tracking)          │
    │ • MetadataStore (persistence)                │
    └────────────────────────────────────────────┬─┘
             │
    ┌────────▼──────────────────────────────────┐
    │         Low-Level Components              │
    │ • MCPClient (MCP protocol wrapper)       │
    │ • BM25Indexer (search algorithm)        │
    │ • QueryProcessor (intent analysis)      │
    │ • Logger (unified logging)              │
    └────────────────────────────────────────┘
```

## Core Principles

1. **Single Responsibility Principle**: Each module has one reason to change
2. **Dependency Injection**: Dependencies are passed, not created
3. **Clean Architecture**: Dependencies point inward
4. **Type Safety**: All types centralized in `types.ts`
5. **Backward Compatibility**: Gateway exposes getters for legacy tests

## Key Achievements

- **95% Token Reduction**: Via 3-layer intelligent tool loading
- **0.2-0.7ms Search**: Fast BM25-based tool discovery
- **6 Internal Features**: Seamlessly integrated through FeatureCoordinator
- **Clean Separation**: Each module has clear boundaries and responsibilities

## Contributing

When adding new features or making architectural changes:

1. Read the relevant architecture document first
2. Follow established patterns and conventions
3. Update documentation when making structural changes
4. Write tests for new components
5. Ensure backward compatibility when possible

## Additional Resources

- **[API Documentation](./developer/api/)**: Detailed API reference
- **[Development Guides](./developer/guides/)**: Step-by-step tutorials
- **[Release Notes](./developer/releases/)**: Version history and changes
