---
slug: planning-workflow
title: Planning and TODO Tracking
category: tutorial
difficulty: intermediate
estimatedTime: 20
tags: [planning, todo, workflow, project-management]
relatedTools: [planning_create, planning_update, planning_tree]
prerequisites: [getting-started]
version: 1.0.0
excerpt: Structure your development process with planning and TODO tracking for better project organization.
---

# Planning and TODO Tracking

The Planning system provides structured project management with file-based plans, TODO tracking, and progress monitoring. Plans are stored as markdown files in `.omc/plans/` for easy version control.

## Overview

The planning system offers:
- **TODO tracking**: Structured tasks with parent-child relationships
- **Dependency management**: Create task hierarchies with cycle detection
- **Status tracking**: Monitor task progress (pending, in_progress, completed)
- **Tree visualization**: Beautiful ASCII tree view with status icons
- **Semantic search**: BM25-powered TODO discovery

## Step 1: Create Your First TODO

Let's create a TODO item for a feature:

```typescript
// Use the planning_create tool
{
  "content": "Implement user authentication with JWT",
  "tags": ["feature", "auth"],
  "status": "pending"
}
```

Expected output:
```json
{
  "success": true,
  "todo": {
    "id": "uuid-here",
    "content": "Implement user authentication with JWT",
    "status": "pending",
    "tags": ["feature", "auth"],
    "createdAt": 1234567890
  }
}
```

Hints:
- Use clear, specific TODO descriptions
- Add relevant tags for categorization
- One TODO per actionable item

## Step 2: Create Child TODOs

Break down large tasks into subtasks:

```typescript
// Use the planning_create tool to create child TODOs
{
  "content": "Design database schema for user table",
  "parentId": "uuid-from-step-1",
  "tags": ["auth", "database"],
  "status": "pending"
}

{
  "content": "Implement JWT token generation utility",
  "parentId": "uuid-from-step-1",
  "tags": ["auth", "security"],
  "status": "pending"
}

{
  "content": "Create login endpoint with validation",
  "parentId": "uuid-from-step-1",
  "tags": ["auth", "api"],
  "status": "pending"
}

{
  "content": "Write unit tests for auth module",
  "parentId": "uuid-from-step-1",
  "tags": ["auth", "testing"],
  "status": "pending"
}
```

Check: Use planning_tree to visualize the TODO hierarchy

## Step 3: Update TODO Status

Mark TODOs as you work on them:

```typescript
// Use the planning_update tool
{
  "id": "uuid-of-todo",
  "updates": {
    "status": "in-progress"
  }
}
```

Status options:
- `pending`: Not started (default)
- `in_progress`: Currently working on
- `completed`: Finished

## Step 4: View TODO Tree

Visualize your TODO hierarchy:

```typescript
// Use the planning_tree tool
{
  "filter": "all"
}
```

Expected output:
```
📋 TODO Tree (3 root items)

✅ Implement user authentication with JWT
  ✅ Design database schema for user table
  🔄 Implement JWT token generation utility
  ⏳ Create login endpoint with validation
  ⏳ Write unit tests for auth module

Summary:
  Total: 5 items
  Completed: 1
  In Progress: 1
  Pending: 3
```

Check: Use filter options to focus on specific statuses

## Step 5: Filter TODOs

See TODOs by status:

```typescript
// Use the planning_tree tool with filters
{
  "filter": "pending"
}
```

Filter options:
- `all`: Show all TODOs
- `pending`: Only pending items
- `in_progress`: Only in-progress items
- `completed`: Only completed items

Hints:
- Use `pending` to focus on what needs to be done
- Use `in_progress` to see current work
- Use `completed` to review achievements

## TODO Structure

TODOs are stored in a SQLite database with parent-child relationships:

```json
{
  "id": "uuid-here",
  "content": "Implement user authentication with JWT",
  "status": "in_progress",
  "tags": ["feature", "auth"],
  "parentId": null,
  "createdAt": 1704067200000,
  "completedAt": null,
  "children": [
    {
      "id": "uuid-child-1",
      "content": "Design database schema for user table",
      "status": "completed",
      "tags": ["auth", "database"],
      "parentId": "uuid-here",
      "completedAt": 1704070800000
    },
    {
      "id": "uuid-child-2",
      "content": "Implement JWT token generation utility",
      "status": "in_progress",
      "tags": ["auth", "security"],
      "parentId": "uuid-here"
    }
  ]
}
```

## Best Practices

### Writing Effective TODOs

1. **Be specific**: Clear, actionable TODO items
   - Good: `Add JWT token validation to login endpoint`, `Write unit tests for auth middleware`
   - Bad: `Fix auth`, `improve stuff`

2. **Use tags consistently**: Organize TODOs by category
   - Use lowercase, hyphenated tags
   - Common tags: `feature`, `bug`, `refactor`, `testing`, `documentation`
   - Project-specific tags: `auth`, `api`, `database`, `performance`

3. **Create hierarchies**: Parent-child relationships for organization
   - Parent TODO: Large feature or epic
   - Child TODOs: Specific implementation tasks
   - Prevents circular dependencies automatically

### Status Management

1. **Update regularly**: Keep statuses current
   - Update when starting a TODO
   - Mark completed immediately
   - Change status as circumstances change

2. **Use status appropriately**:
   - `pending`: Not started (default)
   - `in_progress`: Currently working on
   - `completed`: Finished and verified

3. **Monitor progress**: Use planning_tree to track overall progress
   - See summary statistics
   - Identify bottlenecks
   - Celebrate completions

### Workflow Integration

1. **Start day with tree view**: Review pending and in-progress TODOs
2. **Focus on root TODOs first**: Complete parent items before children
3. **Update as you progress**: Mark status changes immediately
4. **Track completions**: See what's been accomplished
5. **Plan next items**: Look ahead to pending TODOs

## Integration with Other Features

### Planning + Memory

Save planning insights to memory:

```typescript
memory_save({
  "key": "planning_lesson_time_estimates",
  "value": "Auth tasks take 50% longer than estimated due to testing",
  "metadata": {
    "category": "context",
    "tags": ["planning", "lessons-learned"]
  }
})
```

### Planning + Agents

Delegate planning-related tasks:

```typescript
// Create a feature TODO
planning_create({
  "content": "Refactor API layer for better error handling",
  "tags": ["refactoring", "api"]
})

// Delegate strategy work
agent_spawn({
  "agentType": "specialist_strategist",
  "task": "Design improved error handling architecture for API layer"
})

// Delegate implementation
agent_spawn({
  "agentType": "specialist_optimizer",
  "task": "Implement error handling improvements"
})
```

### Planning + TDD

Structure TDD workflow with TODOs:

```typescript
// Create TDD TODO
planning_create({
  "content": "Implement user service with TDD",
  "tags": ["tdd", "feature"]
})

// Create child TODOs for TDD cycle
planning_create({
  "content": "Write tests for user creation",
  "parentId": "uuid-from-above",
  "tags": ["tdd", "testing"]
})

planning_create({
  "content": "Implement user creation to pass tests",
  "parentId": "uuid-from-above",
  "tags": ["tdd", "implementation"]
})

// Start TDD workflow
tdd_red({ "feature": "user service" })
```

## Common Planning Patterns

### Feature Development

```typescript
planning_create({
  "content": "Build real-time notifications feature",
  "tags": ["feature", "notifications"]
})

// Child TODOs
planning_create({
  "content": "Design notification system architecture",
  "parentId": "uuid-from-above",
  "tags": ["design"]
})

planning_create({
  "content": "Implement real-time delivery with WebSockets",
  "parentId": "uuid-from-above",
  "tags": ["implementation"]
})

planning_create({
  "content": "Add email notification support",
  "parentId": "uuid-from-above",
  "tags": ["implementation"]
})

planning_create({
  "content": "Write comprehensive tests",
  "parentId": "uuid-from-above",
  "tags": ["testing"]
})
```

### Bug Fixing

```typescript
planning_create({
  "content": "Fix: Sessions timing out too quickly",
  "tags": ["bug", "urgent"]
})

// Investigation phase
planning_create({
  "content": "Reproduce and document the bug",
  "parentId": "uuid-from-above",
  "tags": ["investigation"]
})

// Fix phase
planning_create({
  "content": "Identify root cause in session middleware",
  "parentId": "uuid-from-above",
  "tags": ["debugging"]
})

planning_create({
  "content": "Implement timeout fix",
  "parentId": "uuid-from-above",
  "tags": ["implementation"]
})

planning_create({
  "content": "Add regression tests",
  "parentId": "uuid-from-above",
  "tags": ["testing"]
})
```

### Refactoring

```typescript
planning_create({
  "content": "Refactor database layer for better maintainability",
  "tags": ["refactoring"]
})

planning_create({
  "content": "Audit current database implementation",
  "parentId": "uuid-from-above",
  "tags": ["audit"]
})

planning_create({
  "content": "Design repository pattern architecture",
  "parentId": "uuid-from-above",
  "tags": ["design"]
})

planning_create({
  "content": "Migrate to repository pattern",
  "parentId": "uuid-from-above",
  "tags": ["implementation"]
})

planning_create({
  "content": "Update and verify all tests pass",
  "parentId": "uuid-from-above",
  "tags": ["testing"]
})
```

## Next Steps

- Explore **Agent Orchestration** for task delegation
- Learn **TDD Integration** for test-driven planning
- Check **Memory System** for saving planning insights

Use `guide_search` to find more tutorials and documentation.
