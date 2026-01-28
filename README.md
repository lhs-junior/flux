# FLUX - Smart Claude Code Plugin

> **93% token reduction** through intelligent on-demand loading

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org/)

## Quick Navigation

**For End Users**: [Getting Started](docs/user/getting-started.md) | [Feature Guides](docs/user/features/) | [Usage Scenarios](docs/user/scenarios/)

**For Developers**: [Architecture](docs/developer/architecture/) | [API Reference](docs/developer/api/) | [Contributing](docs/developer/guides/contributing.md)

**For AI Systems**: [Skills Reference](docs/ai/skills/) | [Absorption Internals](docs/ai/absorption-internals/)

---

## What is FLUX?

FLUX is a **Claude Code plugin** that extends Claude's capabilities with stateful, integrated features. It provides 7 specialized skill files for enhanced development workflows by loading only what you need.

FLUX reduces token usage from 6,100 tokens to just 400-900 tokens per skill through intelligent on-demand loading. All data persists across sessions using SQLite, and the 7 skills work together seamlessly: Memory, Agents, Planning, TDD, Guide, Science, and Specialists.

Unlike stateless prompt-based systems, FLUX uses persistent state management to track memory entries, agent execution results, TODO tasks, test history, and scientific computing sessions. Skills load automatically based on your natural language requests—simply mention relevant keywords like "remember", "agent", "todo", or "test".

## Key Features

- **7 Skill Files**: Memory, Agents, Planning, TDD, Guide, Science, Specialists
- **93% Token Reduction**: Load only skills you need (6,100 → 400-900 tokens)
- **Persistent State**: SQLite-backed memory, tasks, agent results, and test history
- **On-Demand Loading**: Skills load automatically based on your requests
- **Integrated Workflow**: All 7 skills work together seamlessly
- **Fusion System**: Automatic intelligent coordination between features (Lifecycle Hooks, Context Recovery, Workflow Automation, Unified Dashboard)

## Installation

```bash
npm install -g flux
flux install-skills
```

## Quick Start

```bash
"Remember that our API uses PostgreSQL 15"
"Spawn an agent to analyze the codebase"
"Create a TODO list for the new feature"
```

See [Complete Getting Started Guide](docs/user/getting-started.md) for detailed tutorials.

## Documentation

### For End Users

- [Getting Started Guide](docs/user/getting-started.md)
- [Fusion System](docs/user/features/fusion-guide.md) - Automatic feature coordination
- [Memory System](docs/user/features/memory-guide.md)
- [Agent Orchestration](docs/user/features/agents-guide.md)
- [Planning & TODO](docs/user/features/planning-guide.md)
- [TDD Workflow](docs/user/features/tdd-guide.md)
- [Science Tools](docs/user/features/science-guide.md)
- [Usage Scenarios](docs/user/scenarios/)

### For Developers

- [Architecture Overview](docs/developer/architecture/overview.md)
- [Fusion System](docs/developer/fusion/overview.md) - Intelligent feature coordination
- [API Reference](docs/developer/api/)
- [Adding New Features](docs/developer/guides/adding-features.md)
- [Absorption System](docs/developer/absorption/)
- [Contributing Guide](docs/developer/guides/contributing.md)

### For AI Systems

- [Skill Files](docs/ai/skills/)
- [Absorption Internals](docs/ai/absorption-internals/)
- [Feature Analysis](docs/ai/feature-analysis/)

## Acknowledgments

FLUX is inspired by and built upon excellent Claude Code projects:

- [claude-mem](https://github.com/supermemoryai/claude-mem) - Memory management
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) - Agent orchestration
- [planning-with-files](https://github.com/OthmanAdi/planning-with-files) - TODO tracking
- [superpowers](https://github.com/obra/superpowers) - TDD workflow
- [agents](https://github.com/wshobson/agents) - Specialist agents

---

Made with care for the Claude Code community

Smart loading, powerful features, zero waste
