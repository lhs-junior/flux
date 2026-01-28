# Planning Manager API

The Planning Manager provides TODO tracking with hierarchical task organization, dependency management, and semantic search. It integrates with TDD workflows and agent orchestration.

## Overview

**Class:** `PlanningManager`

**Location:** `src/features/planning/planning-manager.ts`

The Planning Manager allows you to create, organize, and track tasks with parent-child relationships and status tracking.

## Methods

### create()

Create a new TODO item with optional parent (for dependencies).

**Signature:**
```typescript
create(input: PlanningCreateInput): {
  success: boolean;
  todo: TodoRecord;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `PlanningCreateInput` | Yes | TODO configuration |
| `input.content` | `string` | Yes | The TODO content/description |
| `input.parentId` | `string` | No | Parent TODO ID (creates dependency) |
| `input.tags` | `string[]` | No | Tags for categorization (e.g., ["priority-high", "backend"]) |
| `input.status` | `string` | No | Initial status: `pending`, `in_progress`, `completed` (default: pending) |
| `input.type` | `string` | No | Type: `todo` or `tdd` (for test-driven development) |
| `input.tddStatus` | `string` | No | For TDD tasks: `red`, `green`, `refactored` |
| `input.testPath` | `string` | No | Path to test file for TDD tasks |

**Returns:**

```typescript
{
  success: boolean;
  todo: {
    id: string;                    // UUID of the TODO
    content: string;
    parentId?: string;
    tags: string[];
    status: 'pending' | 'in_progress' | 'completed';
    type?: 'todo' | 'tdd';
    tddStatus?: 'red' | 'green' | 'refactored';
    testPath?: string;
    createdAt: number;
    updatedAt: number;
  }
}
```

**Example:**

```typescript
const manager = new PlanningManager();

const result = manager.create({
  content: 'Implement user authentication',
  tags: ['backend', 'priority-high'],
  status: 'pending',
  type: 'todo'
});

console.log(`TODO created: ${result.todo.id}`);
```

**Exceptions:**

- Throws `Error` if content is empty
- Throws `Error` if database write fails

---

### update()

Update an existing TODO: change status, content, tags, or parent.

**Signature:**
```typescript
update(input: PlanningUpdateInput): {
  success: boolean;
  todo: TodoRecord | null;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `PlanningUpdateInput` | Yes | Update parameters |
| `input.id` | `string` | Yes | The TODO ID to update |
| `input.content` | `string` | No | New content |
| `input.status` | `string` | No | New status |
| `input.tags` | `string[]` | No | New tags |
| `input.parentId` | `string` \| `null` | No | New parent ID (null removes parent) |
| `input.tddStatus` | `string` | No | New TDD status |
| `input.testPath` | `string` | No | New test path |

**Returns:**

```typescript
{
  success: boolean;      // true if updated
  todo: TodoRecord | null; // Updated TODO or null if not found
}
```

**Example:**

```typescript
const result = manager.update({
  id: 'todo-id-here',
  status: 'completed',
  tags: ['backend', 'priority-high', 'done']
});

if (result.success) {
  console.log('TODO updated');
}
```

**Exceptions:**

- Throws `Error` if TODO not found
- Throws `Error` if update fails

---

### tree()

Visualize TODO dependency tree with status icons.

**Signature:**
```typescript
tree(input?: PlanningTreeInput): {
  tree: string;
  summary: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `PlanningTreeInput` | No | Tree filter options |
| `input.filter` | `object` | No | Filter criteria |
| `input.filter.status` | `string` | No | Filter by status |
| `input.filter.rootOnly` | `boolean` | No | Show only root TODOs |

**Returns:**

```typescript
{
  tree: string;  // ASCII art tree visualization
  summary: {
    total: number;        // Total TODOs
    pending: number;      // Pending count
    inProgress: number;   // In progress count
    completed: number;    // Completed count
  }
}
```

**Example:**

```typescript
const result = manager.tree();

console.log(result.tree);
// Output:
// 📋 TODO Dependency Tree
//
// ├─ ⏳ Implement authentication [backend, priority-high]
// │  ├─ ⏳ Create login endpoint
// │  └─ ⏳ Add JWT validation
// ├─ 🔄 Setup database
// └─ ✅ Deploy to production [done]
//
// 📊 Summary:
//   Total: 5
//   Pending: 2
//   In Progress: 1
//   Completed: 1
```

**Exceptions:**

- Throws `Error` if tree generation fails

---

### search()

Search TODOs using BM25 semantic search.

**Signature:**
```typescript
search(query: string, options?: { limit?: number }): TodoRecord[]
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | `string` | Yes | Search query |
| `options.limit` | `number` | No | Max results (default: 10) |

**Returns:**

```typescript
[
  {
    id: string;
    content: string;
    parentId?: string;
    tags: string[];
    status: string;
    type?: string;
    tddStatus?: string;
    testPath?: string;
    createdAt: number;
    updatedAt: number;
  }
]
```

**Example:**

```typescript
const todos = manager.search('authentication', { limit: 5 });

todos.forEach(todo => {
  console.log(`- ${todo.content} (${todo.status})`);
});
```

---

## Status Icons in Tree

- `⏳` - Pending
- `🔄` - In progress
- `✅` - Completed
- `🔴` - TDD Red phase
- `🟢` - TDD Green phase
- `✅` - TDD Refactored

## Task Hierarchies

Create parent-child relationships for task organization:

```typescript
// Create parent task
const parent = manager.create({
  content: 'Complete feature X',
  status: 'pending'
});

// Create subtasks
const subtask1 = manager.create({
  content: 'Write tests',
  parentId: parent.todo.id,
  type: 'tdd'
});

const subtask2 = manager.create({
  content: 'Implement feature',
  parentId: parent.todo.id
});
```

## Integration with Other Managers

The Planning Manager integrates with:

- **Agent Orchestrator**: Create TODOs for agent tasks
- **TDD Manager**: Track TDD workflows
- **Memory Manager**: Store task results

## Resource Cleanup

Always close the manager when done:

```typescript
manager.close();
```

This closes the database connection and clears indexer cache.
