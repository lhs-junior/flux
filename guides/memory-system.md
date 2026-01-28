---
slug: memory-system
title: Memory Management System
category: tutorial
difficulty: beginner
estimatedTime: 20
tags: [memory, persistence, recall, semantic-search]
relatedTools: [memory_save, memory_recall, memory_list, memory_forget]
prerequisites: [getting-started]
version: 1.0.0
excerpt: Learn how to use the persistent memory system with semantic search for context retention across conversations.
---

# Memory Management System

The Memory Management System provides persistent storage with semantic search capabilities, allowing you to save and recall information across conversations.

## Overview

The memory system uses:
- **SQLite database**: Persistent storage of key-value pairs
- **BM25 indexing**: Semantic search for relevant recall
- **Metadata support**: Tags, categories, and expiration
- **Access tracking**: Track how often memories are accessed

## Step 1: Save Your First Memory

Let's save some information to memory:

```typescript
// Use the memory_save tool
{
  "key": "project_tech_stack",
  "value": "TypeScript, Node.js, SQLite, BM25 search",
  "metadata": {
    "tags": ["project", "technology"],
    "category": "technical"
  }
}
```

Expected output:
```json
{
  "success": true,
  "id": "uuid-here",
  "memory": {
    "id": "uuid-here",
    "key": "project_tech_stack",
    "value": "TypeScript, Node.js, SQLite, BM25 search",
    "category": "technical",
    "tags": ["project", "technology"],
    "createdAt": 1234567890,
    "accessCount": 0
  }
}
```

Hints:
- Use descriptive keys that explain what you're storing
- Add relevant tags for better categorization
- Categories help filter recalls later

## Step 2: Recall Memories with Semantic Search

Retrieve memories using natural language queries:

```typescript
// Use the memory_recall tool
{
  "query": "what technologies are we using",
  "limit": 5
}
```

The BM25 search will find relevant memories based on semantic similarity.

Hints:
- Queries don't need to match exact keywords
- BM25 ranks results by relevance
- Use limit to control how many results you get

## Step 3: Filter by Category

Narrow your recall to specific categories:

```typescript
// Recall only technical memories
{
  "query": "implementation details",
  "category": "technical",
  "limit": 10
}
```

Categories help organize memories into logical groups:
- `technical`: Code, architecture, implementation details
- `preference`: User preferences and settings
- `context`: Project context and background
- `fact`: Static information and references

## Step 4: List All Memories

Browse all stored memories with filters:

```typescript
// Use the memory_list tool
{
  "filter": {
    "category": "technical",
    "tags": ["project"],
    "since": 1704067200000  // Unix timestamp
  },
  "limit": 50
}
```

This returns memories matching all filter criteria.

Hints:
- Omit filters to get all memories
- Use `since` to get recent memories only
- Combine filters for precise results

## Step 5: Manage Memory with Expiration

Set memories to expire automatically:

```typescript
// Save a temporary memory
{
  "key": "temporary_note",
  "value": "Meeting scheduled for tomorrow at 2pm",
  "metadata": {
    "tags": ["meeting", "temporary"],
    "expiresAt": 1704153600000  // Unix timestamp for tomorrow
  }
}
```

Expired memories are automatically cleaned up periodically.

## Step 6: Forget Memories

Remove memories when no longer needed:

```typescript
// Use the memory_forget tool
{
  "id": "uuid-of-memory-to-delete"
}
```

Expected output:
```json
{
  "success": true
}
```

Check: List memories after forgetting to verify deletion

## Best Practices

### Organizing Memories

1. **Use clear keys**: Make keys self-explanatory
   - Good: `user_coding_style`, `project_architecture`
   - Bad: `temp1`, `data`, `x`

2. **Add meaningful tags**: Tags improve searchability
   - Use multiple tags for cross-referencing
   - Keep tags lowercase and hyphenated

3. **Choose appropriate categories**: Consistent categorization helps filtering
   - Define a category scheme for your project
   - Use the same categories consistently

### Effective Recall

1. **Use natural language**: BM25 understands semantic queries
   - "what is the user's preferred language" works better than "language"

2. **Adjust limit based on needs**:
   - Use 5-10 for quick lookups
   - Use 20-50 for comprehensive searches

3. **Filter when appropriate**: Categories and tags speed up specific queries

### Memory Lifecycle

1. **Save contextually**: Store information when it's discussed
2. **Recall proactively**: Check memories before asking users to repeat
3. **Update regularly**: Replace outdated memories with fresh ones
4. **Clean up**: Forget obsolete or incorrect information

## Integration with Other Features

### With Agent Orchestration

Agents can access memories for context:

```typescript
// Agent can recall relevant project information
agent_spawn({
  "agentType": "specialist_strategist",
  "task": "suggest database schema improvements",
  "context": "Check memories for current tech stack"
})
```

### With Planning

Store plan-related context:

```typescript
memory_save({
  "key": "project_goals_2024",
  "value": "Improve performance, add testing, refactor auth",
  "metadata": {
    "category": "context",
    "tags": ["planning", "goals"]
  }
})
```

### With TDD

Remember test requirements:

```typescript
memory_save({
  "key": "test_coverage_goal",
  "value": "Maintain 80% code coverage, focus on critical paths",
  "metadata": {
    "category": "technical",
    "tags": ["testing", "requirements"]
  }
})
```

## Common Patterns

### User Preferences

```typescript
memory_save({
  "key": "code_style_preference",
  "value": "Functional programming, immutable data, pure functions",
  "metadata": {
    "category": "preference",
    "tags": ["coding", "style"]
  }
})
```

### Project Context

```typescript
memory_save({
  "key": "project_background",
  "value": "Building MCP gateway for tool aggregation and intelligent selection",
  "metadata": {
    "category": "context",
    "tags": ["project", "overview"]
  }
})
```

### Technical Decisions

```typescript
memory_save({
  "key": "database_choice_rationale",
  "value": "Using SQLite for simplicity, portability, and zero-config",
  "metadata": {
    "category": "technical",
    "tags": ["architecture", "database", "decision"]
  }
})
```

## Next Steps

- Explore **Agent Orchestration** to see how agents use memories
- Learn about **Planning Workflow** for structured development
- Check **TDD Integration** for test-driven development

Use `guide_search` to find more tutorials and documentation.
