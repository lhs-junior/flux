# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
