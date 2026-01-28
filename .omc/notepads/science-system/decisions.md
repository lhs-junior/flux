# Science System - Architectural Decisions

## 1. Python Session Persistence via Pickle

**Decision**: Use Python's pickle module to serialize session state (globals_dict) and store as BLOB in SQLite.

**Rationale**:
- Preserves Python objects natively without manual serialization
- Supports complex data types (numpy arrays, pandas DataFrames, models)
- Efficient binary format
- Well-tested and standard in Python ecosystem

**Alternatives Considered**:
- JSON serialization: Limited to basic types, would lose structure
- Dill module: More powerful but external dependency
- Manual state management: Too complex for user experience

## 2. Subprocess Execution Model

**Decision**: Generate temporary Python scripts and execute via spawn(), not exec() or REPL.

**Rationale**:
- spawn() provides better control over process lifecycle
- Can implement proper timeouts and resource limits
- Easier to capture both stdout and stderr separately
- Script files allow debugging and inspection if needed
- Avoids REPL complexity and state management issues

**Trade-offs**:
- Slight overhead from file I/O
- Need to clean up temporary files
- Script generation adds complexity

## 3. SQLite Storage Schema

**Decision**: Two tables (science_sessions, science_results) with foreign key relationship.

**Rationale**:
- Separates concerns: sessions for state, results for execution history
- Foreign key CASCADE DELETE ensures consistency
- Allows efficient querying of results by session, tool, or time
- Supports statistics aggregation

**Schema Highlights**:
- BLOB for pickle_data (binary session state)
- TEXT for JSON-serialized variables, packages, history
- Indexes on namespace, last_used_at, session_id, tool_name, created_at

## 4. Virtual Environment Management

**Decision**: Tool-managed venv instead of system Python or conda.

**Rationale**:
- Isolated dependencies prevent conflicts
- User doesn't need to manage Python environment manually
- Pip is standard and universally available
- Simple init/install/reset workflow

**Default Packages**:
- numpy, pandas, matplotlib: Core data science stack
- scikit-learn, scipy: ML and scientific computing
- jupyter, ipython: Interactive development

## 5. Execution Limits

**Decision**: Configurable resource limits with sensible defaults.

**Rationale**:
- Prevents runaway processes from consuming resources
- Timeout (5min): Balances long-running computations vs responsiveness
- Memory (2GB): Enough for most tasks, prevents system crashes
- Output (10MB): Large enough for results, prevents log explosion
- History (1000): Captures useful context without bloat

## 6. Error Handling Strategy

**Decision**: Custom error classes (ScienceError, ScienceTimeoutError, ScienceEnvironmentError).

**Rationale**:
- Enables specific error handling in calling code
- Provides context-specific error messages
- Maintains error hierarchy for catch blocks

## 7. Type System Design

**Decision**: Comprehensive TypeScript interfaces for all tool inputs/outputs.

**Rationale**:
- Type safety throughout the system
- Clear contracts for tool implementations
- IDE autocomplete and validation
- Documentation through types

**Pattern**:
- Tool-specific Input/Output interfaces
- Common types (Session, Result, Config) shared
- Enums for action types and result types

## 8. Namespace System

**Decision**: Sessions have a namespace field for logical grouping.

**Rationale**:
- Users can organize experiments: 'ml-experiment', 'data-analysis', etc.
- Enables filtering and cleanup by namespace
- Supports multiple concurrent workflows
- Simple string-based, no complex hierarchy

## Future Considerations

1. **GPU Support**: Flag in config, but not implemented yet
2. **Distributed Execution**: Sessions are local for now, could extend to remote
3. **Notebook Export**: Placeholder for generating Jupyter notebooks from history
4. **Package Caching**: Could optimize by caching pip downloads
5. **Security**: Sandbox Python execution for untrusted code
