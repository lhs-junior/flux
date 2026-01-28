---
name: awesome-planning
description: TODO/task management with dependency tracking
triggers:
  - todo
  - planning
  - task
  - checklist
---

# Awesome Planning

TODO/task management system with dependency tracking and tree visualization.

## When to Use
- Track tasks and TODOs with hierarchical dependencies
- Manage task progress through defined statuses
- Visualize entire project structure as dependency tree

## Commands

### Create TODO
```bash
npx awesome-plugin planning create "<content>" --status <status> --parent <id> [--json]
```

**Status options:** `pending`, `in_progress`, `completed`

**Parameters:**
- `<content>` - Task description
- `--status` - Initial status (default: pending)
- `--parent` - Parent task ID for dependency
- `--json` - Output as JSON

### Update TODO
```bash
npx awesome-plugin planning update <id> --status <status> --content "<content>" [--json]
```

**Parameters:**
- `<id>` - Task ID
- `--status` - New status (pending, in_progress, completed)
- `--content` - Updated task description
- `--json` - Output as JSON

### Show Tree
```bash
npx awesome-plugin planning tree [--json]
```

Displays entire task hierarchy with dependency relationships and status indicators.

## Examples

**Create root task:**
```bash
npx awesome-plugin planning create "Build authentication" --status pending
```

**Create dependent subtask:**
```bash
npx awesome-plugin planning create "Implement JWT" --status pending --parent task-1
```

**Update task progress:**
```bash
npx awesome-plugin planning update task-1 --status in_progress
```

**View task tree:**
```bash
npx awesome-plugin planning tree
```

Output shows parent-child relationships with statuses, enabling dependency visualization.
