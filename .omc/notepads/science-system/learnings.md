# Science System - Learnings

## Patterns Applied

### 1. Store Pattern (from memory-store.ts)
- SQLite for persistent storage with better-sqlite3
- Separate tables for sessions and results with foreign key relationships
- JSON serialization for complex data (variables, packages, history)
- BLOB type for binary data (pickled Python session state)
- Standard methods: create, get, update, delete, list
- Statistics and cleanup methods included
- Proper indexing on commonly queried fields

### 2. Executor Pattern (from tdd-manager.ts)
- Use `child_process.spawn` for long-running Python processes
- Manual timeout handling with setTimeout + kill
- Type ChildProcess explicitly to avoid TypeScript inference issues
- Capture stdout/stderr with proper Buffer typing
- Graceful shutdown: SIGTERM followed by SIGKILL if needed
- Output size limits to prevent memory issues

### 3. Tool Setup Pattern
- Virtual environment management for isolated Python dependencies
- Platform-aware path handling (Windows vs Unix)
- Actions-based interface (init, install, list, reset, status)
- Automatic default package installation
- Pip list with JSON format for structured package information

## Key Architectural Decisions

### Session Persistence via Pickle
- Python sessions stored as pickled globals_dict
- Allows variable persistence across executions
- Stored as BLOB in SQLite for efficient retrieval
- Session directory: `{venvPath}/.sessions/`

### Execution Model
- Temporary Python scripts generated per execution
- Script includes session restoration, code execution, and output capture
- JSON output file for structured data (return values, variables, errors)
- Automatic cleanup of temporary files

### Resource Limits
- Configurable timeout (default: 5 minutes)
- Max memory limit (default: 2GB)
- Max output size (default: 10MB)
- Max history size (default: 1000 entries)

## TypeScript Gotchas

### spawn() Type Issues
- Don't use spawn options like `maxBuffer` (that's for exec, not spawn)
- Explicitly type as `ChildProcess` to avoid complex type intersections
- Type event handler parameters: `data: Buffer`, `code: number | null`, `error: Error`

### Array Access Safety
- Use optional chaining for array splits: `parts[0]?.trim()`
- Filter out empty results after mapping

## File Structure

```
src/features/science/
├── science-types.ts      # All interfaces and type definitions
├── science-store.ts      # SQLite persistence layer
├── science-executor.ts   # Python subprocess management
└── tools/
    └── setup.ts          # Environment setup tool
```

## Integration Points

- Store uses `randomUUID()` from crypto for ID generation
- Executor depends on Store for session management
- Setup tool is independent, only manages venv
- All tools share common types from science-types.ts

## Testing Considerations

- Mock child_process.spawn for executor tests
- Test session persistence by checking pickle file existence
- Test timeout behavior with long-running Python code
- Test resource limits with large outputs
- Test venv creation on different platforms
