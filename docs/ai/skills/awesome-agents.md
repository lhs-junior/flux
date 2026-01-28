---
name: awesome-agents
description: Multi-agent orchestration with parallel execution
triggers:
  - agent
  - spawn agent
  - parallel tasks
  - orchestration
---

# Awesome Agents

Multi-agent orchestration system for parallel task execution with specialized agent types.

## When to Use
- Spawn specialized agents for different tasks
- Run multiple tasks in parallel
- Track agent progress and results
- Integrate with memory and planning systems

## Commands

### Spawn Agent
```bash
npx awesome-plugin agent spawn <type> <task> [--save-to-memory] [--create-todo] [--json]
```
Spawn a specialized agent for a task. Returns agent ID.

### Agent Status
```bash
npx awesome-plugin agent status <id> [--json]
```
Check current status and progress of an agent.

### Agent Result
```bash
npx awesome-plugin agent result <id> [--json]
```
Get the result of a completed agent.

### Terminate Agent
```bash
npx awesome-plugin agent terminate <id> [--json]
```
Stop a running agent before completion.

### List Agents
```bash
npx awesome-plugin agent list [--status <status>] [--json]
```
List all agents. Filter by status: pending, running, completed, failed, timeout.

## Agent Types

| Type | Purpose |
|------|---------|
| researcher | Research and analysis tasks with citations |
| coder | Write clean, production-ready code |
| tester | Create comprehensive test suites |
| reviewer | Code review with security and quality checks |
| architect | Design scalable system architectures |
| frontend | Build responsive, accessible UIs |
| backend | Develop robust server-side applications |
| database | Design efficient database schemas |
| devops | Automate deployment and infrastructure |
| security | Identify vulnerabilities and secure code |
| performance | Optimize code and eliminate bottlenecks |
| documentation | Write clear technical documentation |
| bugfix | Diagnose and fix bugs efficiently |
| refactor | Improve code quality without changing behavior |

## Integration Options
- `--save-to-memory` - Save agent result to memory for future recall
- `--create-todo` - Create TODO in planning system for tracking
- `--json` - Output as JSON for programmatic use

## Examples

### Example 1: Spawn Research Agent
```bash
npx awesome-plugin agent spawn researcher "Research best practices for React testing" --create-todo
```

### Example 2: Parallel Development
```bash
# Spawn multiple agents for parallel work
npx awesome-plugin agent spawn frontend "Build login form component"
npx awesome-plugin agent spawn backend "Create auth API endpoint"
npx awesome-plugin agent spawn tester "Write tests for auth flow"
```

### Example 3: Check Status
```bash
npx awesome-plugin agent status abc-123 --json
```

### Example 4: List All Running Agents
```bash
npx awesome-plugin agent list --status running
```
