---
name: awesome-memory
description: Persistent memory with BM25 semantic search
triggers:
  - remember
  - recall
  - memory
  - save context
  - forget
---

# Awesome Memory

Persistent memory system with BM25 semantic search for storing and retrieving information across sessions.

## When to Use
- Store important facts, preferences, or context
- Recall previously saved information
- Track project-specific knowledge

## Commands

### Save Memory
```bash
npx awesome-plugin memory save "<key>" "<value>" --category <cat> --tags "tag1,tag2" [--json]
```

### Recall Memory
```bash
npx awesome-plugin memory recall "<query>" --limit 10 --category <cat> [--json]
```

### List Memories
```bash
npx awesome-plugin memory list --category <cat> --tags "tag1" --limit 50 [--json]
```

### Forget Memory
```bash
npx awesome-plugin memory forget <memory-id> [--json]
```

## Examples

### Example 1: Save Project Goal
```bash
npx awesome-plugin memory save "project-goal" "Build Claude Code plugin system with 93% token reduction" --category project --tags "goal,milestone"
```

### Example 2: Recall Information
```bash
npx awesome-plugin memory recall "token reduction" --limit 5
```

### Example 3: List by Category
```bash
npx awesome-plugin memory list --category project --limit 20
```

### Example 4: Get JSON Output
```bash
npx awesome-plugin memory list --category project --json
```

### Example 5: Delete Memory
```bash
npx awesome-plugin memory forget abc123def456 --json
```
