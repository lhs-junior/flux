# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-28

### 🧬 First Absorption: planning-with-files

This release marks our first project absorption! We've successfully absorbed [planning-with-files](https://github.com/OthmanAdi/planning-with-files) with significant improvements.

**Quality Score**: 86/100 (Grade: B+)

### Added

#### Planning & TODO Tracking (3 new tools)

- **`planning_create`**: Create TODO items with optional parent-child dependencies
  - Support for tags and categorization
  - Status tracking (pending, in_progress, completed)
  - Parent-child relationships for dependency management
  - Prevents circular dependencies

- **`planning_update`**: Update existing TODOs
  - Change status (pending → in_progress → completed)
  - Modify content and tags
  - Reparent tasks (with cycle detection)
  - Automatic completion timestamp tracking

- **`planning_tree`**: Visualize TODO dependency tree
  - Beautiful ASCII tree visualization with status icons
  - 🔄 in_progress, ⏳ pending, ✅ completed
  - Summary statistics (total, by status)
  - Optional filtering by status

#### Infrastructure

- **PlanningStore**: SQLite-based persistence layer
  - Parent-child relationships with foreign keys
  - CASCADE delete (removing parent removes children)
  - Circular dependency prevention
  - Efficient indexing on status, parent_id, created_at

- **PlanningManager**: Feature manager with BM25 integration
  - Automatic indexing of TODOs for semantic search
  - Tool call handling for MCP integration
  - Statistics tracking (total, by status, root count)

### Improved

#### Synergy Features

- **Agent → Planning Integration**: Agents can now create TODOs
  - Agents can automatically generate follow-up tasks
  - Agent-generated TODOs tagged for tracking
  - Seamless integration with existing agent workflow

- **Memory ↔ Planning**: TODOs can be saved to memory for persistence across sessions

- **BM25 Search**: Planning tools indexed for intelligent discovery
  - Search for "task management" finds planning tools
  - Consistent with memory and agent tool discovery

### Our Improvements Over Original

Original [planning-with-files](https://github.com/OthmanAdi/planning-with-files) vs Our Implementation:

| Feature | Original | Our Implementation |
|---------|----------|-------------------|
| Storage | File-based (JSON) | SQLite with transactions |
| Search | None | BM25 semantic search |
| Integration | Standalone | Integrated with Memory & Agents |
| Dependencies | Manual tracking | Foreign keys + cycle detection |
| Performance | File I/O overhead | In-memory SQLite (optional) |
| Tree visualization | Basic | ASCII art with status icons |

### Testing

- **planning-test.ts**: Comprehensive test suite
  - 5 TODO creation (manual + agent-generated)
  - Parent-child dependency management
  - Status updates and tree visualization
  - BM25 search integration
  - Agent synergy demonstration

### Statistics

- **Total Tools**: 12 (4 memory + 5 agent + 3 planning)
- **Absorbed Projects**: 3/8 (37.5% complete)
- **Quality Score Average**: 90.7/100 (claude-mem: 95, oh-my-claudecode: 95, planning-with-files: 86)

## [0.1.1] - 2026-01-28

### 🧬 Phase 0: Absorption Infrastructure

This release establishes the foundation for continuous project absorption, transforming awesome-plugin into "The Absorption Engine."

### Added

#### Absorption Infrastructure
- **QualityEvaluator**: 100-point scoring system for evaluating absorption candidates
  - Functional Improvement (0-30 points): Original vs improved implementation
  - Synergy Score (0-30 points): Integration with existing features (Memory, Agent)
  - Conflict Risk (-20~0 points): Tool naming and architecture conflicts
  - Maintainability (0-20 points): Code complexity and dependencies
  - License Compatibility (0-20 points): MIT/Apache-2.0 verification
  - Grade calculation (A/B/C/D/F) and recommendation (approve/consider/reject)
  - 70+ score required for absorption approval

- **ConflictResolver**: Systematic conflict detection and resolution
  - Naming conflict detection (tool names, prefixes)
  - Functionality overlap detection (similar features)
  - Architecture conflict detection (storage, execution model)
  - 3-priority resolution strategy: Merge > Namespace > Deprecate
  - Auto-approval for merge/namespace strategies

- **UpstreamMonitor**: Continuous monitoring of absorbed projects
  - Version tracking for all absorbed projects
  - Automatic changelog analysis (features, improvements, breaking changes)
  - Quality evaluation for upstream updates (70+ score for re-absorption)
  - GitHub issue creation for tracking worthy updates

#### CLI Commands
- `absorbed`: Show absorption history, progress (2/8 projects), and next targets
  - Lists all absorbed projects with details
  - Shows our improvements over originals
  - Displays next absorption target (v0.2.0: planning-with-files)

- `vote [project]`: User voting system for prioritizing next absorptions
  - Shows voting rankings without argument
  - Casts vote for specified project
  - Displays updated rankings after voting

#### Documentation
- **PRD.md**: Complete Product Requirements Document
  - Absorption philosophy and strategy
  - 100-point quality evaluation criteria
  - 5-category risk assessment (legal, technical, UX, community, operational)
  - Conflict resolution policies
  - Upstream synchronization policies
  - 13-week implementation roadmap
  - Differentiation from Anthropic Skills and oh-my-claudecode

- **README.md**: Updated to reflect "Absorption Engine" concept
  - Added "The Absorption Philosophy" section
  - Differentiation from Anthropic Skills (stateful vs stateless)
  - Differentiation from MCP Gateway (built-in vs external)
  - Absorption history section (2 projects absorbed)
  - Next absorption roadmap

### Fixed

#### Critical Bug Fixes
- **DB Cleanup Bug**: Fixed `TypeError: database connection is not open`
  - Root cause: `setInterval` in MemoryManager not cleared on shutdown
  - Added `cleanupInterval` property tracking
  - Proper cleanup in `close()` method with `clearInterval()`
  - Clean shutdown now guaranteed with no errors

### Changed

#### Project Positioning
- Positioned as "The Absorption Engine" - continuously absorbing best Claude Code projects
- Key differentiator: Stateful execution + data layer for Anthropic Skills (not competing, complementing)
- Focus: Built-in features only (no external MCP gateway pattern)

### Absorbed Projects (2/8)

#### 1. claude-mem (v0.1.0)
- **Original**: [supermemoryai/claude-mem](https://github.com/supermemoryai/claude-mem)
- **Tools**: 4 (`memory_save`, `memory_recall`, `memory_list`, `memory_forget`)
- **Our Improvements**:
  - BM25 search instead of vector DB (0.2-0.7ms performance)
  - SQLite instead of file storage
  - Tool schema redesign for better UX

#### 2. oh-my-claudecode (v0.1.0)
- **Original**: [Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)
- **Tools**: 5 (`agent_spawn`, `agent_status`, `agent_result`, `agent_terminate`, `agent_list`)
- **Our Improvements**:
  - Parallel async execution (not sequential)
  - Real-time progress monitoring
  - Background task support

### Next Absorption

- **v0.2.0 (Feb 2025)**: [planning-with-files](https://github.com/OthmanAdi/planning-with-files)
  - TODO tracking with dependency management
  - Expected: +3 tools, 86/100 quality score

## [0.1.0] - 2026-01-28

### Added

#### Phase 1: Core Gateway
- Core MCP Gateway implementation with multi-server support
- MCP server client with automatic reconnection logic (3 retries, 1s interval)
- Session management for tracking connected servers
- Tool call proxying to underlying MCP servers
- Basic tool registration and metadata storage

#### Phase 2: BM25 Tool Search Engine
- BM25-powered search engine with sub-millisecond performance (<1ms)
- Okapi BM25 algorithm implementation (k1=1.2, b=0.75)
- Tool indexing with document frequency calculation
- Query-based tool ranking and relevance scoring

#### Phase 3: GitHub Auto-Discovery
- GitHub API integration using @octokit/rest
- Automatic MCP server discovery from GitHub repositories
- Topic-based search (mcp-server, mcp)
- Name pattern matching for MCP servers
- README and description keyword search
- Rate limit handling and caching support

#### Phase 4: Intent Classification
- Query intent analysis for tool categorization
- Action normalization (read, write, delete, etc.)
- Domain classification (communication, database, filesystem, development, web, ai)
- Entity extraction from queries
- Synonym expansion and query enhancement
- Stop words filtering

#### Phase 5: Usage Learning
- SQLite-based persistence for tool metadata and usage logs
- Usage tracking and statistics
- Logarithmic boost for frequently used tools
- Tool usage history for personalized recommendations

#### Phase 6: Production-Ready Implementation
- 3-layer intelligent tool loading strategy:
  - **Layer 1**: Essential tools (always loaded, ~1.5K tokens)
  - **Layer 2**: BM25-matched tools (dynamic, 10-15 tools, ~3-4.5K tokens)
  - **Layer 3**: On-demand tools (loaded when explicitly requested)
- CLI interface with commands:
  - `discover`: Search and install MCP servers from GitHub
  - `list`: List installed plugins
  - `stats`: Show gateway statistics
  - `start`: Start the gateway server
- Quality evaluation system (0-100 scoring):
  - Popularity (0-25): GitHub stars, forks
  - Maintenance (0-25): Recent commits, project age
  - Documentation (0-25): README, package.json quality
  - Reliability (0-25): Issue ratio, versioning
- Interactive installation workflow
- Production-ready MCP server integration

### Performance

#### Token Reduction
- 50 tools: 70% reduction (15,000 → 4,500 tokens)
- 200 tools: 90% reduction (60,000 → 6,000 tokens)
- 500 tools: 95% reduction (150,000 → 7,500 tokens)

#### Search Speed
- 50 tools: 0.16-0.45ms (110x faster than 50ms target)
- 100 tools: 0.30-0.38ms (130x faster than 50ms target)
- 200 tools: 0.57-0.77ms (65x faster than 50ms target)

### Testing
- 231 test cases with 84% pass rate
- Unit tests for all core components:
  - BM25Indexer
  - QueryProcessor
  - MetadataStore
  - QualityEvaluator
  - ToolLoader
  - MCPClient
- Integration tests for Gateway
- E2E performance benchmarks
- 80% test coverage target

### Dependencies
- @modelcontextprotocol/sdk@^1.0.4 - MCP protocol implementation
- @octokit/rest@^21.0.2 - GitHub API integration
- better-sqlite3@^11.8.1 - SQLite database
- commander@^12.1.0 - CLI framework
- okapibm25@^1.4.1 - BM25 search algorithm
- zod@^3.24.1 - Schema validation

### Development
- TypeScript 5.7 with strict mode
- ESLint configuration with TypeScript support
- Vitest for testing with 30s timeout
- tsup for building (ESM output)
- Node.js 18+ requirement

## [Unreleased]

### Planned
- TypeScript documentation generation (TypeDoc)
- CI/CD pipeline with GitHub Actions
- npm package publication
- Additional example applications
- Performance monitoring and metrics
- Docker support
- Web UI for plugin management

---

For more details, see the [commit history](https://github.com/yourusername/awesome-plugin/commits/main).
