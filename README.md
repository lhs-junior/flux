# 🧬 Awesome Plugin - The Absorption Engine

> **"좋은게 있으면 흡수한다!"** - 우수한 Claude Code 프로젝트를 지속적으로 발견하고, 평가하고, 개선해서 흡수하는 Built-in MCP Plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![Absorbed](https://img.shields.io/badge/absorbed-3%2F8-brightgreen)](README.md#-absorption-history)
[![Tools](https://img.shields.io/badge/tools-12-blue)](README.md#-absorption-history)

**Status**: ✅ **v0.2.0 - First Absorption Complete!**
**Latest**: planning-with-files 흡수 완료 (TODO 추적 + 의존성 관리 + Agent 시너지)

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
- [x] **BM25 Search Engine**: 0.2-0.7ms performance
- [x] **3-Layer Tool Loading**: 95% token reduction
- [x] **SQLite Persistence**: Stateful storage

### 🔄 Next Absorption

- [ ] **superpowers** (v0.3.0 - Mar 2025): TDD workflow enforcement

**Absorption engine running!**

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

### ✅ Absorbed Projects (3/8)

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

### 🔮 Next Absorptions

**v0.3.0 (Mar 2025)**: [superpowers](https://github.com/obra/superpowers)
- TDD workflow enforcement
- Expected: +4 tools, 80/100 quality score

**v0.4.0 (Apr 2025)**: [agents (wshobson)](https://github.com/wshobson/agents)
- Specialized agent skills (top 10 from 72)
- Expected: +10 tools, 85/100 quality score

**Vote for next absorption**: `node dist/cli.mjs vote <project>`

## 🌟 Inspired By & Credits

- [Anthropic Tool Search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
- [agents (wshobson)](https://github.com/wshobson/agents)
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)
- [planning-with-files](https://github.com/OthmanAdi/planning-with-files)

---

**Made with ❤️ for the MCP community**

*Reducing token waste, one plugin at a time* ✨
