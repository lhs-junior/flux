# Context Recovery Fusion

The Context Recovery Fusion system enables saving and restoring complete session context across /clear or restarts, providing infinite context extension by capturing and restoring state from all features.

## Overview

The `ContextRecoveryManager` automatically captures state from:
- **Memory**: All saved memories (keys, values, tags, categories)
- **Planning**: All TODOs (including parent-child relationships, TDD metadata)
- **Agents**: Agent execution history (reference only, not restored)
- **TDD**: Test run history (reference only, not restored)
- **Science**: Experiment data (stateless, not persisted)

## Architecture

### Storage Schema

```sql
CREATE TABLE contexts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  memory_state TEXT,      -- JSON: { memories: [...] }
  planning_state TEXT,    -- JSON: { todos: [...] }
  agents_state TEXT,      -- JSON: { executions: [...] }
  tdd_state TEXT,         -- JSON: { runs: [...] }
  science_state TEXT,     -- JSON: { experiments: [...] }
  metadata TEXT           -- JSON: { user, project, description }
);
```

### Key Features

1. **Capture Context**: Serializes current state from all feature managers
2. **Save Context**: Persists captured state to SQLite database
3. **Restore Context**: Loads and restores feature states, preserving relationships
4. **Session Management**: Lists, filters, and manages saved sessions
5. **Hook Integration**: Automatic triggers for SessionStart, SessionEnd, ContextFull events

## Usage

### Basic Usage

```typescript
import { ContextRecoveryManager } from '../fusion/implementations/context-recovery-fusion';
import { MemoryManager } from '../features/memory/memory-manager';
import { PlanningManager } from '../features/planning/planning-manager';

// Initialize with feature managers
const contextManager = new ContextRecoveryManager('/path/to/db.sqlite', {
  memoryManager,
  planningManager,
  agentOrchestrator,
  tddManager,
  scienceManager,
});

// Capture current context
const state = await contextManager.captureContext();

// Save context with session ID
const contextId = await contextManager.saveContext('session_123', state, {
  user: 'developer',
  project: 'awesome-plugin',
  description: 'Working on feature X',
});

// List available sessions
const sessions = contextManager.getAvailableSessions({ limit: 10 });

// Restore from session
const result = await contextManager.restoreContext('session_123');
console.log(`Restored ${result.restored.memories} memories`);
console.log(`Restored ${result.restored.todos} todos`);
```

### Hook Integration

```typescript
// Register hooks for automatic context management
const hooks = contextManager.registerHooks();

// On session end: automatically save context
hooks.sessionEnd(); // Captures and saves current state

// On session start: check for previous sessions
hooks.sessionStart(); // Logs available sessions

// On context full: compress and save
hooks.contextFull(); // Auto-saves with compression metadata
```

### Advanced Usage

#### Filter Sessions by Time

```typescript
const recentSessions = contextManager.getAvailableSessions({
  since: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  limit: 20,
});
```

#### Custom State Capture

```typescript
// Capture state from specific features only
const customState = {
  memory: {
    memories: memoryManager.list({ category: 'important' }).memories,
  },
  planning: {
    todos: planningManager.list({ status: 'in_progress' }),
  },
};

await contextManager.saveContext('important_tasks', customState);
```

#### Partial Restoration

```typescript
// Restore context and check what was restored
const result = await contextManager.restoreContext('session_123');

if (result.success) {
  console.log(`Restored:
    - ${result.restored.memories} memories
    - ${result.restored.todos} TODOs
    - ${result.restored.agents} agent executions
    - ${result.restored.tddRuns} TDD runs
  `);
} else {
  console.error('Restoration failed:', result.error);
}
```

#### Session Management

```typescript
// Get session statistics
const stats = contextManager.getStatistics();
console.log(`Total contexts: ${stats.totalContexts}`);
console.log(`Unique sessions: ${stats.uniqueSessions}`);

// Delete old sessions
const sessions = contextManager.getAvailableSessions();
for (const session of sessions.slice(10)) {
  // Keep only 10 most recent
  contextManager.deleteSession(session.sessionId);
}
```

## State Preservation

### Memory State

All memories are fully preserved and restored:
- Keys and values
- Categories and tags
- Creation timestamps
- Access counts
- Expiration times

### Planning State

TODOs are preserved with full hierarchy:
- Content, status, tags
- Parent-child relationships (using ID mapping)
- TDD metadata (type, tddStatus, testPath)
- Timestamps (created, updated, completed)

**Note**: Parent IDs are automatically remapped during restoration to maintain hierarchy.

### Agent State

Agent execution history is captured but **not restored** (reference only):
- Execution IDs
- Agent types
- Status and results
- Timing information

### TDD State

Test run history is captured but **not restored** (reference only):
- Test paths
- Run status (red/green/refactored)
- Test runner
- Output and duration

## Integration with FeatureCoordinator

The `ContextRecoveryManager` can be integrated into the `FeatureCoordinator` for automatic session management:

```typescript
// In FeatureCoordinator constructor
this.contextRecoveryManager = new ContextRecoveryManager(dbPath, {
  memoryManager: this.memoryManager,
  planningManager: this.planningManager,
  agentOrchestrator: this.agentOrchestrator,
  tddManager: this.tddManager,
  scienceManager: this.scienceManager,
});

// Register hooks
const hooks = this.contextRecoveryManager.registerHooks();

// Integrate with lifecycle events
this.on('sessionStart', hooks.sessionStart);
this.on('sessionEnd', hooks.sessionEnd);
this.on('contextFull', hooks.contextFull);
```

## Best Practices

1. **Regular Saves**: Save context at natural breakpoints (after completing tasks, before breaks)
2. **Meaningful Session IDs**: Use descriptive session IDs (e.g., `session_feature_x_2024-01-01`)
3. **Metadata**: Add descriptive metadata to help identify sessions later
4. **Cleanup**: Periodically delete old sessions to manage database size
5. **Selective Restoration**: Only restore the state you need (e.g., active TODOs only)

## Limitations

- **ID Remapping**: Restored TODOs have new IDs (parent relationships preserved)
- **Agent History**: Execution history is not actionable after restoration
- **TDD Runs**: Test run history is informational only
- **Database Size**: Context grows with usage; implement cleanup strategies

## Testing

Comprehensive unit tests cover:
- Context capture from all features
- Save and restore operations
- Session management and filtering
- Hook integration
- Parent-child relationship preservation
- TDD metadata handling
- Error handling

Run tests:
```bash
npm test tests/unit/context-recovery-fusion.test.ts
```

## Performance

- **Capture**: O(n) where n = number of memories + TODOs
- **Save**: O(1) - single database write with JSON serialization
- **Restore**: O(n) - one insert per memory/TODO
- **List Sessions**: O(log n) - indexed by timestamp

## Future Enhancements

1. **Compression**: Compress JSON state for large contexts
2. **Incremental Save**: Only save changed state since last save
3. **Context Merging**: Merge multiple sessions
4. **Export/Import**: Export sessions to file for portability
5. **Cloud Sync**: Sync sessions across machines
