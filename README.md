# 🌊 FLUX - Smart Claude Code Plugin

> **93% token reduction** through intelligent on-demand loading

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org/)

FLUX is a powerful Claude Code plugin system that provides 7 specialized skill files for enhanced development workflows. By loading only what you need, FLUX reduces token usage from 6,100 tokens to just 400-900 tokens per skill.

## ✨ What is FLUX?

FLUX is a **Claude Code plugin** that extends Claude's capabilities with stateful, integrated features:

- **7 Skill Files**: Memory, Agents, Planning, TDD, Guide, Science, and Specialists
- **93% Token Reduction**: Load only the skills you need (6,100 → 400-900 tokens)
- **On-Demand Loading**: Skills load automatically based on your requests
- **SQLite Persistence**: All data persists across sessions
- **Integrated Features**: Skills work together seamlessly

## 🚀 Key Features

### Smart Token Management

Traditional approaches load all features at once (6,100+ tokens). FLUX loads skills on-demand based on your natural language requests, reducing token usage by 93%.

### Persistent State

Unlike stateless prompt-based systems, FLUX uses SQLite to persist:

- Memory entries and recall history
- Agent execution state and results
- TODO tasks and dependencies
- TDD test run history
- Scientific computing sessions

### Integrated Workflow

All 7 skills work together seamlessly:

- Agents can create TODO tasks automatically
- Memory integrates with all features
- TDD tracks test runs with Planning
- Specialists leverage Memory and Planning

## 📦 Installation

```bash
# Install FLUX globally
npm install -g flux

# Install skill files to Claude Code
flux install-skills
```

After installation, Claude Code will automatically load FLUX skills when you mention relevant keywords like "remember", "agent", "todo", "test", etc.

## 🎯 Skills Overview

| Skill | Operations | Tokens | Triggers |
| --- | --- | --- | --- |
| **awesome-memory** | 4 | ~270 | remember, recall, memory |
| **awesome-agents** | 5 | ~550 | agent, spawn, orchestration |
| **awesome-planning** | 3 | ~300 | todo, planning, task |
| **awesome-tdd** | 4 | ~460 | tdd, test, red-green-refactor |
| **awesome-guide** | 2 | ~220 | guide, tutorial, learn |
| **awesome-science** | 3 | ~220 | science, stats, ml |
| **awesome-specialists** | 14 types | ~890 | specialist, architect, etc |

**Total**: 35 operations across 7 skills, loading only what you need

### 1. Memory System (4 operations)

Persistent memory with semantic search powered by BM25.

**Operations**:

- `memory_save`: Store information with tags
- `memory_recall`: Search memories by query
- `memory_list`: List all memories
- `memory_forget`: Delete specific memories

**Example**: "Remember that the API endpoint is <https://api.example.com>"

### 2. Agent Orchestration (5 operations)

Multi-agent coordination with parallel execution.

**Operations**:

- `agent_spawn`: Create background agents
- `agent_status`: Check agent progress
- `agent_result`: Get agent output
- `agent_terminate`: Stop running agents
- `agent_list`: List all agents

**Example**: "Spawn an agent to analyze the codebase while I work on tests"

### 3. Planning & TODO (3 operations)

Hierarchical task management with dependencies.

**Operations**:

- `planning_create`: Create tasks with dependencies
- `planning_update`: Update task status
- `planning_tree`: Visualize task hierarchy

**Example**: "Create a TODO for implementing the API with dependencies on database setup"

### 4. TDD Workflow (4 operations)

RED-GREEN-REFACTOR cycle enforcement.

**Operations**:

- `tdd_red`: Write failing test
- `tdd_green`: Make test pass
- `tdd_refactor`: Refactor while maintaining tests
- `tdd_verify`: Verify all tests pass

**Example**: "Start TDD for the authentication module"

### 5. Guide System (2 operations)

Interactive documentation and learning paths.

**Operations**:

- `guide_search`: Find relevant guides
- `guide_tutorial`: Get step-by-step tutorials

**Example**: "Show me the guide for using memory effectively"

### 6. Scientific Computing (3 operations)

Python REPL, data analysis, and visualization.

**Operations**:

- `science_execute`: Run Python code
- `science_visualize`: Create plots
- `science_export`: Export results

**Example**: "Analyze this dataset and create a correlation matrix"

### 7. Specialist Agents (14 types)

Domain experts for specific tasks.

**Specialists**:

- Researcher, Analyst, Strategist
- Designer, Coder, Teacher
- Writer, Debugger, Reviewer, Optimizer
- And 4 more specialized roles

**Example**: "Use the debugger specialist to find the memory leak"

## 🏗️ Architecture

FLUX uses a clean 2-layer architecture:

```text
┌─────────────────────────────────────┐
│      Claude Code (User)             │
└──────────────┬──────────────────────┘
               │ Skill Files (7)
┌──────────────┴──────────────────────┐
│  FLUX Gateway (Orchestration)       │
│  - Session Management               │
│  - Tool Search (BM25)               │
│  - State Persistence                │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼────┐ ┌──▼─────┐ ┌─▼──────┐
│Feature │ │  Tool  │ │ SQLite │
│Coordi- │ │ Search │ │Storage │
│nator   │ │ Engine │ │        │
└───┬────┘ └────────┘ └────────┘
    │
┌───▼──────────────────┐
│ 7 Internal Features: │
│ - Memory             │
│ - Agents             │
│ - Planning           │
│ - TDD                │
│ - Guide              │
│ - Science            │
│ - Specialists        │
└──────────────────────┘
```

### Key Components

#### Layer 1: Gateway Orchestration

- Routes requests to appropriate skills
- Manages session state
- Handles tool search and selection

#### Layer 2: Feature Implementation

- FeatureCoordinator: Manages all 7 internal features
- ToolSearchEngine: BM25-powered intelligent tool discovery (<1ms)
- SQLite Storage: Persistent state across sessions

## 📖 Usage Examples

### Memory Management

```bash
# Natural language examples
"Remember that our database uses PostgreSQL 15"
"Recall everything about authentication"
"Forget the old API endpoint"
```

### Agent Orchestration

```bash
"Spawn 3 agents: one to analyze tests, one to check docs, one to audit security"
"Check status of all running agents"
"Get results from the security audit agent"
```

### Planning & TODO

```bash
"Create a TODO tree for the new feature with subtasks"
"Mark the database migration task as completed"
"Show me the task hierarchy with dependencies"
```

### TDD Workflow

```bash
"Start TDD cycle for the UserService class"
"Write failing test for email validation"
"Make the test pass"
"Refactor the validation logic"
```

## 📚 Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture and design decisions
- [NPM_PUBLISHING_GUIDE.md](docs/NPM_PUBLISHING_GUIDE.md) - Publishing to npm registry
- [RELEASE_NOTES_v2.0.0.md](docs/RELEASE_NOTES_v2.0.0.md) - v2.0.0 release notes
- [CHANGELOG.md](CHANGELOG.md) - Version history and release notes
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute to FLUX

## 🎓 How It Works

### On-Demand Loading

FLUX skills load automatically when you mention trigger keywords:

```text
User: "Remember that we're using React 18"
      ↓
FLUX detects: "remember" keyword
      ↓
Loads: awesome-memory skill (~270 tokens)
      ↓
Executes: memory_save operation
      ↓
Persists to SQLite
```

### Token Reduction

Traditional approach loads everything:

- All 35 operations = 6,100 tokens
- 93% waste when you only need 1-2 features

FLUX approach loads on-demand:

- Memory skill only = 270 tokens
- 95% reduction when focused on one feature
- Average 400-900 tokens per session

## 🛠️ CLI Commands

```bash
# Install skills to Claude Code
flux install-skills

# Show statistics
flux stats

# List available skills
flux list

# Verify installation
flux verify
```

## 📝 Configuration

### Environment Variables

```bash
# Custom database path
export FLUX_DB_PATH=/path/to/flux.db

# Enable debug logging
export FLUX_DEBUG=true
```

### Skill Configuration

Skills are automatically loaded based on your requests. No manual configuration needed.

## 🔧 Development

```bash
# Clone repository
git clone https://github.com/yourusername/flux.git
cd flux

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## 📊 Performance

### Token Usage

| Scenario | Traditional | FLUX | Savings |
| --- | --- | --- | --- |
| Single skill | 6,100 tokens | 400 tokens | **93%** |
| Two skills | 6,100 tokens | 800 tokens | **87%** |
| All skills | 6,100 tokens | 2,900 tokens | **52%** |

### Search Speed

- Tool search: **<1ms** (BM25-powered)
- Skill loading: **<10ms**
- State persistence: **<5ms** (SQLite)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

FLUX is inspired by and built upon excellent Claude Code projects:

- [claude-mem](https://github.com/supermemoryai/claude-mem) - Memory management
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) - Agent orchestration
- [planning-with-files](https://github.com/OthmanAdi/planning-with-files) - TODO tracking
- [superpowers](https://github.com/obra/superpowers) - TDD workflow
- [agents](https://github.com/wshobson/agents) - Specialist agents

---

Made with ❤️ for the Claude Code community

Smart loading, powerful features, zero waste ✨
