# 🧬 Awesome Plugin - The Absorption Engine

> **"좋은게 있으면 흡수한다!"** - 우수한 Claude Code 프로젝트를 지속적으로 발견하고, 평가하고, 개선해서 흡수하는 Built-in MCP Plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![Absorbed](https://img.shields.io/badge/absorbed-7%2F8-brightgreen)](README.md#-absorption-history)
[![Tools](https://img.shields.io/badge/tools-34-blue)](README.md#-absorption-history)

**Status**: ✅ **v0.6.0 - 87.5% Milestone!**
**Latest**: science-tools 흡수 (6 Science Tools + Python Integration + Statistical/ML Analysis)

## 🎯 The Absorption Philosophy

### Problems We Solve

**1. MCP Gateway Pattern은 실패한 아키텍처**
- External MCP 10개 연결 = 300 tools = 45,000 tokens 폭발 💥
- BM25 필터링으로도 해결 불가 (metadata는 메모리 상주)
- Anthropic 100 tools 제한도 이 때문

**2. Anthropic Skills는 Stateless**
- Prompt-based: 휘발성 (재실행 시 기억 없음)
- No persistence: 데이터 저장 불가
- No integration: Skills 간 데이터 공유 불가

**3. oh-my-claudecode는 Static**
- 31 skills 고정
- 진화 없음
- 사용자 피드백 반영 불가

### ✨ Our Solution: Absorption Engine

```
Anthropic Skills (What to do) + awesome-plugin (How + Data)
──────────────────────────────────────────────────────────
Skills says:  "데이터를 분석하세요" (Prompt)
We execute:   Agent 실행 → Memory 저장 → Planning TODO → 재사용
```

**핵심 차별점**:
- ✅ **Stateful**: SQLite persistence (Skills는 stateless)
- ✅ **Integrated**: Memory ↔ Agent ↔ Planning (Skills는 독립적)
- ✅ **Evolving**: 매달 새 프로젝트 흡수 (Skills는 static)
- ✅ **Quality-driven**: 70점 이상만 흡수 (Skills는 검증 없음)

## 📊 Performance Results

### Token Reduction

| Scenario | Traditional | Awesome Plugin | Savings |
|----------|-------------|----------------|---------|
| 50 tools | 15,000 tokens | 4,500 tokens | **70%** |
| 200 tools | 60,000 tokens | 6,000 tokens | **90%** |
| 500 tools | 150,000 tokens | 7,500 tokens | **95%** |

### Search Speed

| Tools | Target | Actual | Status |
|-------|--------|--------|--------|
| 50 | < 50ms | **0.16-0.45ms** | ✅ 110x faster |
| 100 | < 50ms | **0.30-0.38ms** | ✅ 130x faster |
| 200 | < 50ms | **0.57-0.77ms** | ✅ 65x faster |

## 🔄 Comparison

| Feature | Traditional MCP | Awesome Plugin |
|---------|----------------|----------------|
| Token usage (500 tools) | 150,000 | 7,500 (95% less) |
| Plugin discovery | Manual | Automatic (GitHub) |
| Tool selection | Load all | Intelligent (BM25) |
| Quality evaluation | None | 0-100 scoring |
| Search speed | N/A | <1ms |
| Usage learning | No | Yes |

## 🌍 Real-World Use Cases

### 1. Multi-Tool Development Environment
Connect filesystem, git, slack, and database MCP servers - only relevant tools load based on your query.

### 2. AI Agent with 500+ Tools
Deploy AI agents with access to hundreds of tools without token bloat.

### 3. Plugin Discovery & Evaluation
Automatically find and evaluate MCP plugins from GitHub before installing.

**See [Examples](docs/examples/) for detailed tutorials.**

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository
git clone https://github.com/yourusername/awesome-pulgin.git
cd awesome-pulgin

# Install dependencies
npm install

# Build
npm run build
```

### 2. Discover & Install MCP Servers

Find and install high-quality MCP servers from GitHub:

```bash
# Discover MCP servers (with quality evaluation)
node dist/cli.mjs discover --limit 10 --min-score 75

# Auto-install all recommended plugins
node dist/cli.mjs discover --auto-install

# List installed plugins
node dist/cli.mjs list
```

**Example output:**
```
🔍 Discovering MCP servers from GitHub...

✅ Found 8 recommended MCP servers:

1. modelcontextprotocol/servers
   Score: 95/100 (A) - highly_recommended
   ⭐ 250 stars | 🔧 Updated 2 days ago
   Official MCP server implementations
   Reasons: ⭐ Highly popular, 🔧 Actively maintained, 📚 Excellent documentation

GitHub API: 4995/5000 requests remaining

Would you like to install any of these? (Enter numbers separated by commas, or "all", or "none"):
```

### 3. Use as MCP Server

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "node",
      "args": ["/path/to/awesome-pulgin/dist/index.mjs"]
    }
  }
}
```

**With GitHub token (recommended for discovery):**

```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "node",
      "args": ["/path/to/awesome-pulgin/dist/index.mjs"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### 4. Test Connection

```bash
# Run simple test
npx tsx examples/simple-test.ts

# Run benchmarks
npx tsx tests/benchmark.ts
```

## 📚 What's Inside

The awesome-plugin combines **7 major feature systems** providing a comprehensive development environment:

1. **Memory System** (4 tools) - Persistent memory with BM25 semantic search
2. **Agent Orchestration** (5 tools) - Multi-agent coordination with parallel execution
3. **Planning & TODO Tracking** (3 tools) - Hierarchical task management with dependencies
4. **TDD Workflow** (4 tools) - RED-GREEN-REFACTOR cycle enforcement
5. **Specialist Agents** (10 tools) - Researcher, Analyst, Designer, Coder, Teacher, Writer, Debugger, Reviewer, Optimizer, Strategist
6. **Guide System** (2 tools) - Interactive documentation and learning paths
7. **Scientific Computing** (6 tools) - Python REPL, data analysis, visualization, statistics, ML, export
8. **Tool Search** (BM25 engine) - Sub-millisecond intelligent tool discovery

**Total: 34 built-in tools + expandable guide library**

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│      Claude Desktop / Claude Code       │
└─────────────────┬───────────────────────┘
                  │ MCP Protocol
┌─────────────────┴───────────────────────┐
│    Awesome MCP Meta Plugin (Gateway)    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Tool Search & Selection Engine  │   │
│  │ - BM25 Indexer (<1ms)           │   │
│  │ - Intent Classifier             │   │
│  │ - Dynamic Loader (3-Layer)      │   │
│  │ - Usage Learning                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Plugin Discovery & Registry     │   │
│  │ - GitHub Explorer               │   │
│  │ - Quality Evaluator (0-100)     │   │
│  │ - Plugin Metadata (SQLite)      │   │
│  │ - Auto-installer                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ MCP Gateway / Proxy Layer       │   │
│  │ - Multi-server Connections      │   │
│  │ - Tool Call Proxying            │   │
│  │ - Session Manager               │   │
│  └─────────────────────────────────┘   │
└────┬────────┬────────┬─────────────────┘
     │        │        │
  [MCP1]  [MCP2]  [MCP3...N]
```

## 📖 Documentation

### English Documentation
- [API Reference](docs/api-reference.md) - Complete API documentation
- [Examples](docs/examples/) - Usage examples and tutorials
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [FAQ](docs/faq.md) - Frequently asked questions
- [Architecture](docs/architecture.md) - Deep dive into architecture *(coming soon)*
- [Configuration](docs/configuration.md) - Configuration options *(coming soon)*
- [Performance Tuning](docs/performance-tuning.md) - Optimization guide *(coming soon)*
- [Contributing](CONTRIBUTING.md) - How to contribute
- [Changelog](CHANGELOG.md) - Version history

### 한국어 문서 (Korean Documentation)
- [변경 로그](CHANGELOG-KO.md)
- [기여 가이드](CONTRIBUTING-KO.md)
- [문제 해결 가이드](docs/troubleshooting-ko.md) *(coming soon)*
- [FAQ (한글)](docs/faq-ko.md) *(coming soon)*
- [테스트 보고서](TEST-REPORT-KO.md)

## 🎓 How It Works

### 3-Layer Tool Loading

```
┌─────────────────────────────────────────┐
│ Layer 1: Essential Tools (Always)      │
│ • read_file, write_file, bash, search  │
│ • ~1.5K tokens                          │
└─────────────────────────────────────────┘
           ↓ User query: "send slack message"
┌─────────────────────────────────────────┐
│ Layer 2: BM25-Matched Tools (Dynamic)  │
│ • slack_send_message                    │
│ • slack_post_message                    │
│ • notify_channel                        │
│ • ~3-4.5K tokens (10-15 tools)          │
└─────────────────────────────────────────┘
           ↓ Explicit request
┌─────────────────────────────────────────┐
│ Layer 3: On-Demand (When Asked)        │
│ • All remaining tools                   │
│ • Loaded only when user requests        │
└─────────────────────────────────────────┘
```

### Quality Evaluation

Every plugin is scored on 4 dimensions (0-100):

1. **Popularity** (0-25): GitHub stars, forks
2. **Maintenance** (0-25): Recent commits, project age
3. **Documentation** (0-25): README, examples, package.json
4. **Reliability** (0-25): Issue ratio, versioning

**70+ points** = Recommended for installation

### BM25 Search

Uses Okapi BM25 algorithm with:
- **k1 = 1.2**: Term frequency saturation
- **b = 0.75**: Length normalization
- **Usage boost**: Logarithmic boost for frequently used tools

## 🛠️ CLI Commands

```bash
# Discover MCP servers
node dist/cli.mjs discover [options]

Options:
  -l, --limit <number>     Maximum results (default: 50)
  --min-score <number>     Minimum quality score (default: 70)
  --auto-install           Auto-install all recommended

# List installed plugins
node dist/cli.mjs list

# Start gateway server (for Claude Desktop)
node dist/cli.mjs start

# Show statistics
node dist/cli.mjs stats

# 🧬 Absorption commands
# Show absorption history and progress
node dist/cli.mjs absorbed

# Vote for next absorption target
node dist/cli.mjs vote [project]
```

## 📦 Programmatic API

```typescript
import { AwesomePluginGateway } from 'awesome-plugin';

const gateway = new AwesomePluginGateway({
  dbPath: './data/plugins.db',
  enableToolSearch: true,
  maxLayer2Tools: 15,
});

// Connect to MCP servers
await gateway.connectToServer({
  id: 'filesystem',
  name: 'Filesystem Server',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});

// Search for tools (BM25-powered)
const tools = await gateway.searchTools('read file', { limit: 5 });

console.log(`Found ${tools.length} relevant tools`);

await gateway.stop();
```

## 🔧 Configuration

### Environment Variables

```bash
# GitHub token for higher API rate limits (5000 req/hour)
export GITHUB_TOKEN=your_github_token_here

# Custom database path
export DB_PATH=/path/to/plugins.db
```

### Gateway Options

```typescript
interface GatewayOptions {
  dbPath?: string;           // SQLite database path (default: ':memory:')
  enableToolSearch?: boolean; // Enable BM25 search (default: true)
  maxLayer2Tools?: number;    // Max tools in Layer 2 (default: 15)
}
```

## 📝 Development Status

### ✅ Phase 0: Absorption Infrastructure (v0.1.1 - Jan 2025)

- [x] DB cleanup bug fixed (TypeError: database connection is not open)
- [x] Quality evaluation system (100-point scoring)
- [x] Conflict resolution framework (Merge > Namespace > Deprecate)
- [x] Upstream monitoring system
- [x] CLI commands (`absorbed`, `vote`)

### ✅ Core Features

- [x] **Memory Management**: 4 tools (from claude-mem)
- [x] **Agent Orchestration**: 5 tools (from oh-my-claudecode)
- [x] **Planning & TODO Tracking**: 3 tools (from planning-with-files)
- [x] **TDD Workflow**: 4 tools (from superpowers)
- [x] **BM25 Search Engine**: 0.2-0.7ms performance
- [x] **3-Layer Tool Loading**: 95% token reduction
- [x] **SQLite Persistence**: Stateful storage

### 🔄 Absorption Complete

**Progress: 7/8 projects absorbed (87.5%)** 🎉

All major absorptions complete! The awesome-plugin now combines:

- Memory management, agent orchestration, planning, TDD, specialist agents, interactive guides, and scientific computing

**Next Steps**: Continuous improvement, community feedback, and v1.0 stabilization

**Absorption engine: 7 successful integrations!**

## 🧪 Testing

```bash
# Run benchmarks
npx tsx tests/benchmark.ts

# Run example
npx tsx examples/simple-test.ts
```

## 📚 Project Structure

```
awesome-pulgin/
├── src/
│   ├── core/
│   │   ├── gateway.ts           # Main MCP gateway
│   │   ├── mcp-client.ts        # MCP server client
│   │   ├── session-manager.ts   # Session management
│   │   └── tool-loader.ts       # 3-layer tool loading
│   ├── features/                # 🧬 Absorbed features
│   │   ├── memory/              # claude-mem (v0.1.0)
│   │   │   ├── memory-manager.ts
│   │   │   └── memory-store.ts
│   │   └── agents/              # oh-my-claudecode (v0.1.0)
│   │       └── agent-orchestrator.ts
│   ├── absorption/              # 🔬 Absorption infrastructure
│   │   ├── quality-evaluator.ts    # 100-point scoring
│   │   ├── conflict-resolver.ts    # Conflict detection
│   │   └── upstream-monitor.ts     # Version tracking
│   ├── search/
│   │   ├── bm25-indexer.ts      # BM25 search engine
│   │   └── query-processor.ts   # Intent classification
│   ├── storage/
│   │   └── metadata-store.ts    # SQLite storage
│   ├── discovery/
│   │   ├── github-explorer.ts   # GitHub API integration
│   │   ├── quality-evaluator.ts # Quality scoring
│   │   └── plugin-installer.ts  # Auto-installer
│   ├── cli.ts                   # CLI interface (absorbed, vote)
│   └── index.ts                 # Main exports
├── tests/
│   └── benchmark.ts             # Performance tests
├── examples/
│   └── comprehensive-test.ts    # Full feature demo
├── PRD.md                       # Product Requirements Document
└── README.md
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Built on [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Inspired by [Anthropic's Tool Search](https://www.anthropic.com/news/tool-search)
- BM25 algorithm from [okapibm25](https://github.com/FurkanToprak/OkapiBM25)

## 🔗 Links

- [Product Requirements Document](/PRD.md)
- [Implementation Plan](/.claude/plans/composed-churning-glade.md)
- [MCP Specification](https://modelcontextprotocol.io/specification/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 🧬 Absorption History

### ✅ Absorbed Projects (6/8 - 75% Milestone)

**1. claude-mem** (v0.1.0 - 2025-01-28)
- **Original**: [supermemoryai/claude-mem](https://github.com/supermemoryai/claude-mem)
- **Absorbed**: Memory management with BM25 semantic search
- **Tools**: 4 (`memory_save`, `memory_recall`, `memory_list`, `memory_forget`)
- **Quality Score**: 95/100
- **Our Improvements**:
  - BM25 search instead of vector DB (0.2-0.7ms performance)
  - SQLite instead of file storage
  - Tool schema redesign for better UX

**2. oh-my-claudecode** (v0.1.0 - 2025-01-28)
- **Original**: [Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)
- **Absorbed**: Multi-agent orchestration with parallel execution
- **Tools**: 5 (`agent_spawn`, `agent_status`, `agent_result`, `agent_terminate`, `agent_list`)
- **Quality Score**: 95/100
- **Our Improvements**:
  - Parallel async execution (not sequential)
  - Real-time progress monitoring
  - Background task support

**3. planning-with-files** (v0.2.0 - 2025-01-28)
- **Original**: [OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files)
- **Absorbed**: TODO tracking with dependency management
- **Tools**: 3 (`planning_create`, `planning_update`, `planning_tree`)
- **Quality Score**: 86/100 (Grade: B+)
- **Our Improvements**:
  - File storage → SQLite with foreign keys
  - No search → BM25 semantic search
  - Manual tracking → Automatic cycle detection
  - Basic visualization → ASCII tree with status icons (🔄⏳✅)
  - Standalone → Integrated with Agents (auto TODO creation)

**4. superpowers** (v0.3.0 - 2025-01-28)

- **Original**: [obra/superpowers](https://github.com/obra/superpowers) (38k+ stars!)
- **Absorbed**: TDD workflow enforcement
- **Tools**: 4 (`tdd_red`, `tdd_green`, `tdd_refactor`, `tdd_verify`)
- **Quality Score**: 80/100 (Grade: B)
- **Our Improvements**:
  - Full framework → Focused TDD tools
  - Code deletion → Warnings only (user-friendly)
  - Standalone planning → Integrated with our Planning
  - Subagents → Integrated with our Agents
  - Git worktrees → SQLite test run history
  - Framework-specific → Auto-detect test runner (Jest/Vitest/Mocha)

**5. agents** (v0.4.0 - 2025-01-28)

- **Original**: [wshobson/agents](https://github.com/wshobson/agents)
- **Absorbed**: Specialist agent types (10 from 72 available)
- **Tools**: 10 (`specialist_researcher`, `specialist_analyst`, `specialist_strategist`, `specialist_designer`, `specialist_coder`, `specialist_teacher`, `specialist_writer`, `specialist_debugger`, `specialist_reviewer`, `specialist_optimizer`)
- **Quality Score**: 85/100 (Grade: B+)
- **Our Improvements**:
  - 72 agents → Top 10 specialist types (focused extraction)
  - Static agents → Dynamic integration with Memory + Planning + TDD
  - Standalone → Parallel execution with Agent orchestration
  - No context sharing → Full state preservation across specialists
  - Manual selection → Intelligent specialist recommendation

**6. guide-system** (v0.5.0 - 2025-01-28)

- **Inspired By**: [zebbern/claude-code-guide](https://github.com/zebbern/claude-code-guide) and [Cranot/claude-code-guide](https://github.com/Cranot/claude-code-guide)
- **Created**: New guide tools inspired by (not absorbed from) their concepts
- **Tools**: 2 (`guide_search`, `guide_tutorial`)
- **Initial Guides**: 5 (Getting Started, Building with awesome-plugin, Absorption Engine Deep Dive, Memory Best Practices, TDD Mastery)
- **Quality Score**: 92/100 (Grade: A-)
- **Our Approach**:
  - Inspiration-based creation (not code absorption)
  - Self-documenting system that teaches through guides
  - Full integration with Memory + Agents + Planning
  - Interactive learning paths linked to actual tool usage
  - Expandable guide library for community contributions

### 🔮 Next Absorptions

**v0.6.0 (Jun 2025)**: [claude-scientific-skills](https://github.com/K-Dense-AI/claude-scientific-skills)
- Scientific and research tools integration
- Expected: +4-6 tools, 88/100 quality score

**Vote for next absorption**: `node dist/cli.mjs vote <project>`

## 🌟 Inspired By & Credits

### Absorbed Projects

- [claude-mem](https://github.com/supermemoryai/claude-mem) - Memory management (v0.1.0)
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) - Agent orchestration (v0.1.0)
- [planning-with-files](https://github.com/OthmanAdi/planning-with-files) - TODO tracking (v0.2.0)

### Future Absorptions

- [claude-scientific-skills](https://github.com/K-Dense-AI/claude-scientific-skills) - Scientific tools (v0.6.0)
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Production patterns (v0.7.0)
- Additional high-quality Claude Code projects (v0.8.0)

### Reference & Best Practices

- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Production setup guide
- [Anthropic Tool Search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) - Tool search concept

---

**Made with ❤️ for the MCP community**

*Reducing token waste, one plugin at a time* ✨
