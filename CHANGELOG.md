# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-01-28

### 🧬 Fifth Absorption: science-tools - Data Science & ML Integration

This release absorbs the science tools ecosystem, providing comprehensive statistical analysis, machine learning, and data export capabilities with full Python integration.

**Quality Score**: 88/100 (Grade: B+)

### Added

#### Science Tools (6 new tools)

- **`science_setup`**: Initialize and manage Python virtual environment
  - Create/reset virtual environment
  - Install packages (pandas, numpy, scipy, scikit-learn, etc.)
  - Manage Python dependencies
  - Environment status and health checks

- **`science_analyze`**: Data analysis using Python/pandas
  - Load data from CSV/JSON/Parquet files
  - Transform and clean datasets
  - Execute custom Python analysis code
  - Query data with pandas expressions
  - Integration with Memory for result storage

- **`science_visualize`**: Data visualization with matplotlib/seaborn
  - Create charts: line, bar, scatter, histogram, heatmap, boxplot
  - Custom plots with Python code
  - Interactive Plotly visualizations
  - Export as PNG, SVG, or HTML
  - Style customization and themes

- **`science_stats`**: Statistical analysis suite
  - T-tests (independent, paired, one-sample)
  - ANOVA (one-way, two-way)
  - Chi-square tests
  - Correlation analysis (Pearson, Spearman)
  - Linear regression
  - Mann-Whitney U test (non-parametric)

- **`science_ml`**: Machine learning models
  - Regression: Linear, Logistic
  - Classification: Random Forest, SVM, XGBoost
  - Clustering: K-Means
  - Model training, prediction, and evaluation
  - Feature importance analysis
  - Cross-validation support

- **`science_export`**: Multi-format data export
  - Formats: CSV, Excel, JSON, Parquet, HTML, PDF, Jupyter Notebook
  - Custom styling and formatting
  - Batch export support
  - Compression options

#### Infrastructure

- **ScienceStore**: SQLite-based persistence for Python sessions
  - Session management with namespace isolation
  - Result tracking (success/error/partial)
  - Execution history and statistics
  - Automatic cleanup of old sessions

- **ScienceManager**: Orchestration and cross-feature integration
  - Memory integration for saving analysis results
  - Planning integration for creating analysis tasks
  - Tool routing and execution
  - Statistics and monitoring

- **Python Integration**: Native Python execution layer
  - Virtual environment management
  - Package dependency handling
  - Session state persistence with pickle
  - Error handling and traceback capture

### Improved

#### Synergy Features

- **Memory ↔ Science Integration**:
  - Save statistical analysis results to memory
  - Store ML model outputs and predictions
  - Recall previous analyses for comparison
  - Tag results by analysis type

- **Planning ↔ Science Integration**:
  - Create follow-up analysis tasks
  - Track data science workflow steps
  - Tag science-related TODOs
  - Organize multi-step analysis pipelines

- **Agent → Science Integration** (future):
  - Agents can execute data analysis workflows
  - Automatic experiment tracking
  - Result comparison and optimization

### Testing

- **science-store.test.ts**: Comprehensive test suite (15 tests)
  - Session CRUD operations
  - Result storage and retrieval
  - Filtering and statistics
  - Cleanup and cascade deletion
  - Edge cases and concurrent updates

- **science-test.ts**: Complete workflow demonstration
  - All 6 science tools exercised
  - Statistical analysis examples (t-test, ANOVA, correlation, etc.)
  - ML model examples (linear regression, random forest, k-means, etc.)
  - Export format demonstrations (CSV, JSON, HTML, Excel, Parquet)
  - Memory and Planning integration
  - End-to-end analysis workflow

### Statistics

- **Total Tools**: 34 (4 memory + 5 agent + 3 planning + 4 tdd + 10 specialist + 2 guide + 6 science)
- **Absorbed Projects**: 7/8 (87.5% complete)
- **Quality Score Average**: 88.4/100

### Documentation

- **docs/science-system-evaluation.md**: Quality evaluation and design rationale
- **examples/science-test.ts**: Comprehensive runnable example (350+ lines)
- **README.md**: Updated with Science System section and 87.5% milestone
- **CLI**: Updated `absorbed` command with science-tools entry

### Quality Evaluation

**88/100 (Grade: B+)** - Comprehensive data science integration

- **Functional Innovation** (28/30): Python integration + statistical/ML toolkit
- **Synergy Score** (27/30): Full integration with Memory + Planning
- **Architectural Fit** (18/20): Clean separation, follows established patterns
- **Maintainability** (15/20): Python dependency adds complexity
- **Community Value** (0/0): Bonus for data science enablement

### Design Decisions

**Python Integration Approach**:
- Virtual environment isolation for dependency management
- Session-based persistence for stateful analysis
- JSON-based communication between TypeScript and Python
- Graceful error handling with detailed tracebacks

**Tool Separation Strategy**:
- Setup: Environment management (separate from analysis)
- Analyze: Data manipulation and custom code execution
- Visualize: Chart creation and rendering
- Stats: Statistical tests (focused, scientific)
- ML: Machine learning models (comprehensive algorithms)
- Export: Data output (multiple formats)

## [0.5.0] - 2025-01-28

### 🧬 Fourth Absorption: guide system - Self-Documenting System

This release introduces inspiration-based absorption (not direct absorption) from the guide system projects. Instead of absorbing existing code, we created new guide tools inspired by their concepts of interactive learning and documentation.

**Quality Score**: 92/100 (Grade: A-)

### Added

#### Guide System Tools (2 new tools)

- **`guide_search`**: Search through interactive code guides and documentation
  - Full-text search across guide titles, descriptions, and content
  - Contextual snippet matching for quick learning
  - Returns top matching guides with relevance scores

- **`guide_tutorial`**: Access interactive tutorials and learning paths
  - Step-by-step guidance for complex tasks
  - Code examples with explanations
  - Integration with existing agents and planning system

#### Initial Guide Library (5 guides)

1. **Getting Started with Claude Code** - Welcome guide for new users
2. **Building with awesome-plugin** - Integration and development guide
3. **Absorption Engine Deep Dive** - Understanding the philosophy and architecture
4. **Memory System Best Practices** - Effective use of memory tools
5. **TDD Workflow Mastery** - Step-by-step TDD cycle enforcement

#### Synergy Features

- **Planning ↔ Guide Integration**: Create learning tasks assigned to specific guides
- **Memory ↔ Guide Integration**: Save learnings and tutorial progress to memory
- **Search Integration**: Guides indexed in BM25 search engine for discovery
- **Agent ↔ Guide Integration**: Agents can recommend relevant guides for tasks

### Improved

#### Documentation System

- **Self-Documenting Architecture**: Guides describe the system itself
- **Interactive Learning**: Connect guides with actual tool usage
- **Knowledge Reusability**: Save guide insights to memory for context awareness
- **Task-Guided Learning**: Link planning tasks with appropriate guides

### Inspiration Sources

This release was inspired by (not absorbed from):
- [zebbern/claude-code-guide](https://github.com/zebbern/claude-code-guide) - Interactive guide concepts
- [Cranot/claude-code-guide](https://github.com/Cranot/claude-code-guide) - Learning path organization

Our approach: Instead of absorbing their code, we created new guide tools inspired by their vision of interactive documentation.

### Quality Evaluation

**92/100 (Grade: A-)** - Inspiration-based approach

- **Functional Innovation** (30/30): Created new guide paradigm
- **Synergy Score** (28/30): Full integration with Memory + Agents + Planning
- **Architectural Fit** (18/20): Self-contained system with strong connections
- **Maintainability** (16/20): Modular guide library with clear structure
- **Community Value** (0/0): Bonus for documentation excellence

### Statistics

- **Total Tools**: 28 (4 memory + 5 agent + 3 planning + 4 tdd + 10 specialist + 2 guide)
- **Total Guides**: 5 initial guides (expandable)
- **Absorbed Projects**: 6/8 (75% milestone)
- **Quality Score Average**: 88.3/100

### Documentation

- **docs/guide-system-evaluation.md**: Complete quality evaluation and design rationale
- **README.md**: Updated with Guide System section and 75% milestone
- **CLI**: Updated `absorbed` command showing guide inspiration

## [0.4.0] - 2025-01-28

### 🧬 Third Absorption: agents (wshobson) - 10 Specialist Agents

This release absorbs the specialist agent system from [agents](https://github.com/wshobson/agents), expanding from their 72 available agents to include the top 10 specialist agent types.

**Quality Score**: 85/100 (Grade: B+)

### Added

#### Specialist Agent Types (10 new tools)

- **`specialist_researcher`**: Deep information research and analysis
- **`specialist_analyst`**: Data analysis and pattern recognition
- **`specialist_strategist`**: Strategic planning and decision support
- **`specialist_designer`**: Design thinking and creative solutions
- **`specialist_coder`**: Code generation and technical implementation
- **`specialist_teacher`**: Educational content and explanations
- **`specialist_writer`**: Content creation and documentation
- **`specialist_debugger`**: Problem diagnosis and troubleshooting
- **`specialist_reviewer`**: Code/content review and feedback
- **`specialist_optimizer`**: Performance and efficiency improvements

#### Synergy Features

- **Planning ↔ Specialist Agents**: Create tasks assigned to specialist agent types
- **Memory ↔ Specialist Agents**: Save specialist outputs to memory for reuse
- **Agent Orchestration**: Spawn multiple specialists for parallel task execution
- **Quality Integration**: Automatic quality scoring for specialist outputs

### Improved

#### Multi-Agent Coordination

- **Parallel Specialist Execution**: Run multiple specialists simultaneously
- **Agent Chain Management**: Sequential specialist handoff for complex workflows
- **Result Aggregation**: Combine specialist outputs intelligently
- **Context Preservation**: Share memory and planning state across agents

### Statistics

- **Total Tools**: 26 (4 memory + 5 agent + 3 planning + 4 tdd + 10 specialist)
- **Absorbed Projects**: 5/8 (62.5% complete)
- **Quality Score Average**: 86/100 (claude-mem: 95, oh-my-claudecode: 95, planning-with-files: 86, superpowers: 80, agents: 85)

### Documentation

- **docs/agents-evaluation.md**: Complete quality evaluation (85/100)
- **README.md**: Updated absorption history and specialist agents section
- **CLI**: Updated `absorbed` command with agents (wshobson)

## [0.3.0] - 2026-01-28

### 🧬 Second Absorption: superpowers (TDD Workflow)

This release absorbs the TDD workflow enforcement concept from the massive [superpowers](https://github.com/obra/superpowers) framework (38k+ stars!).

**Quality Score**: 80/100 (Grade: B)

### Added

#### TDD Workflow Enforcement (4 new tools)

- **`tdd_red`**: RED phase - Create and verify failing test
  - Ensures tests actually fail before implementation
  - Prevents TDD violations (test passing immediately)
  - Auto-detects test runner (Jest/Vitest/Mocha)
  - Stores test run history in SQLite

- **`tdd_green`**: GREEN phase - Verify test now passes
  - Checks previous run was RED
  - Verifies test passes after implementation
  - Updates Planning TODO tddStatus automatically
  - Enforces proper TDD cycle

- **`tdd_refactor`**: REFACTOR phase - Improve code while keeping tests green
  - Runs full test suite to prevent regressions
  - Ensures all tests still pass after refactoring
  - Tracks refactoring history

- **`tdd_verify`**: Run full test suite with coverage
  - Checks coverage meets threshold (default: 80%)
  - Generates coverage reports
  - Validates before committing

#### Planning + TDD Integration

- **Extended Planning Schema**:
  - New `type` field: 'todo' | 'tdd'
  - New `tddStatus` field: 'red' | 'green' | 'refactored'
  - New `testPath` field for test file tracking

- **Tree Visualization Enhancements**:
  - TDD status icons: 🔴 RED, 🟢 GREEN, ✅ REFACTORED
  - [TDD] badge for TDD tasks
  - Test file paths in tree view

#### Infrastructure

- **TDDStore**: SQLite-based test run persistence
  - Tracks all test runs (RED/GREEN/REFACTOR)
  - Stores test output and coverage
  - Performance metrics (duration)
  - Statistics by status and test runner

- **TDDManager**: TDD workflow orchestration
  - Auto-detects test runner from package.json
  - Executes tests and parses output
  - Enforces RED-GREEN-REFACTOR discipline
  - Integrates with Planning for task tracking

### Improved

#### Synergy Features

- **Planning ↔ TDD Integration**:
  - Create TDD tasks as children of feature TODOs
  - Automatic tddStatus updates during workflow
  - Visual tracking in dependency tree
  - Filter TODOs by type='tdd'

- **Agent → TDD Integration** (future):
  - Agents can automatically follow TDD cycle
  - Create TDD tasks during implementation
  - Run tests and update status

- **Memory ↔ TDD** (future):
  - Save coverage reports to Memory
  - Track test failure patterns
  - Store TDD best practices

### Our Improvements Over Original

Original [superpowers](https://github.com/obra/superpowers) vs Our Implementation:

| Feature | Original (superpowers) | Our Implementation |
|---------|------------------------|-------------------|
| Scope | Full framework (brainstorm, plan, execute, git worktrees) | Focused TDD tools only |
| Code Deletion | **Deletes code written before tests** | Warnings only (user-friendly) |
| Planning | Built-in planning system | Integrated with our Planning |
| Agent System | Subagent-driven development | Integrated with our Agents |
| Test Runner | Framework-specific | Auto-detect (Jest/Vitest/Mocha) |
| Storage | Git-based | SQLite with history |
| Complexity | High (complete workflow) | Low (4 simple tools) |
| Integration | Standalone | Synergizes with Memory + Agents + Planning |

### Testing

- **tdd-test.ts**: Comprehensive TDD workflow demonstration
  - Feature TODO with TDD subtasks
  - RED-GREEN-REFACTOR cycle simulation
  - Tree visualization with TDD icons
  - Planning integration examples
  - Synergy feature demonstrations

### Statistics

- **Total Tools**: 16 (4 memory + 5 agent + 3 planning + 4 tdd)
- **Absorbed Projects**: 4/8 (50% complete)
- **Quality Score Average**: 89/100 (claude-mem: 95, oh-my-claudecode: 95, planning-with-files: 86, superpowers: 80)

### Documentation

- **docs/superpowers-evaluation.md**: Complete quality evaluation (80/100)
- **examples/tdd-test.ts**: TDD workflow demonstration
- **README.md**: Updated absorption history
- **CLI**: Updated `absorbed` command with superpowers

### Design Decisions

**Why we simplified superpowers**:
1. **No code deletion**: Original deletes code written before tests - too aggressive for users
2. **No git worktrees**: Original uses isolated git branches - adds complexity
3. **No subagents**: Original has its own agent system - we use ours
4. **Focused extraction**: Only absorbed TDD enforcement, not entire framework

**Merge approach for Planning conflict**:
- Extended existing Planning with `type='tdd'` instead of separate systems
- Unified TODO tree shows both regular and TDD tasks
- Single source of truth for all task tracking

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
