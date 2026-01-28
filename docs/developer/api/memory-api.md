# Memory Manager API

The Memory Manager provides persistent, searchable memory capabilities for the FLUX plugin. It uses semantic search (BM25) to recall relevant information based on natural language queries.

## Overview

**Class:** `MemoryManager`

**Location:** `src/features/memory/memory-manager.ts`

The Memory Manager allows you to save, retrieve, and manage information across conversation sessions with semantic search capabilities.

## Methods

### save()

Save information to memory for later recall.

**Signature:**
```typescript
save(input: MemorySaveInput): {
  success: boolean;
  id: string;
  memory: MemoryRecord;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `MemorySaveInput` | Yes | Memory record to save |
| `input.key` | `string` | Yes | Short, descriptive key (e.g., "user_preference", "project_goal") |
| `input.value` | `string` | Yes | The actual information to remember |
| `input.metadata` | `object` | No | Optional metadata for the memory |
| `input.metadata.tags` | `string[]` | No | Array of tags for categorization |
| `input.metadata.category` | `string` | No | Category (e.g., "preference", "fact", "context") |
| `input.metadata.expiresAt` | `number` | No | Unix timestamp for memory expiration |

**Returns:**

```typescript
{
  success: boolean;          // true if memory was saved
  id: string;                // UUID of the saved memory
  memory: {
    id: string;
    key: string;
    value: string;
    category?: string;
    tags?: string[];
    createdAt: number;
    accessCount: number;
  }
}
```

**Example:**

```typescript
const manager = new MemoryManager();

const result = await manager.save({
  key: 'user_preferences',
  value: 'User prefers TypeScript, likes TDD workflow',
  metadata: {
    category: 'preference',
    tags: ['user', 'workflow'],
  }
});

console.log(`Memory saved with ID: ${result.id}`);
```

**Exceptions:**

- Throws `Error` if key or value is missing
- Throws `Error` if database write fails

---

### recall()

Search and recall memories using semantic search.

**Signature:**
```typescript
recall(input: MemoryRecallInput): {
  results: Array<{
    id: string;
    key: string;
    value: string;
    relevance: number;
    metadata: {
      category?: string;
      tags?: string[];
      createdAt: number;
      accessCount: number;
    };
  }>;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `MemoryRecallInput` | Yes | Recall parameters |
| `input.query` | `string` | Yes | Natural language search query |
| `input.limit` | `number` | No | Max results to return (default: 10) |
| `input.category` | `string` | No | Filter by category |

**Returns:**

```typescript
{
  results: [
    {
      id: string;              // Memory ID
      key: string;             // Memory key
      value: string;           // Memory value
      relevance: number;       // BM25 relevance score (0-1)
      metadata: {
        category?: string;
        tags?: string[];
        createdAt: number;
        accessCount: number;
      }
    }
  ]
}
```

**Example:**

```typescript
const result = manager.recall({
  query: 'what are the user preferences',
  limit: 5,
  category: 'preference'
});

result.results.forEach(r => {
  console.log(`${r.key}: ${r.value} (relevance: ${r.relevance})`);
});
```

**Exceptions:**

- Throws `Error` if query is empty
- Throws `Error` if search fails

---

### list()

List all memories with optional filters.

**Signature:**
```typescript
list(input: MemoryListInput): {
  memories: Array<{
    id: string;
    key: string;
    value: string;
    createdAt: number;
    metadata: {
      category?: string;
      tags?: string[];
      accessCount: number;
    };
  }>;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `MemoryListInput` | Yes | List parameters |
| `input.filter` | `object` | No | Filter criteria |
| `input.filter.category` | `string` | No | Filter by category |
| `input.filter.tags` | `string[]` | No | Filter by tags (matches any) |
| `input.filter.since` | `number` | No | Unix timestamp - only show memories after this |
| `input.limit` | `number` | No | Max results (default: 50) |

**Returns:**

```typescript
{
  memories: [
    {
      id: string;
      key: string;
      value: string;
      createdAt: number;
      metadata: {
        category?: string;
        tags?: string[];
        accessCount: number;
      }
    }
  ]
}
```

**Example:**

```typescript
const result = manager.list({
  filter: {
    category: 'preference',
    since: Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
  },
  limit: 20
});

console.log(`Found ${result.memories.length} memories`);
```

**Exceptions:**

- Throws `Error` if database query fails

---

### forget()

Delete a specific memory by its ID.

**Signature:**
```typescript
forget(input: MemoryForgetInput): {
  success: boolean;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `MemoryForgetInput` | Yes | Forget parameters |
| `input.id` | `string` | Yes | Memory ID to delete |

**Returns:**

```typescript
{
  success: boolean;  // true if memory was deleted
}
```

**Example:**

```typescript
const result = manager.forget({
  id: 'memory-uuid-here'
});

if (result.success) {
  console.log('Memory deleted');
}
```

**Exceptions:**

- Throws `Error` if memory ID not found
- Throws `Error` if deletion fails

---

## Error Handling

All methods include error handling and return structured error messages:

```typescript
try {
  const result = manager.save({
    key: 'test',
    value: 'test value'
  });
} catch (error) {
  if (error instanceof Error) {
    console.error(`Failed to save memory: ${error.message}`);
  }
}
```

## Integration with Other Managers

The Memory Manager integrates with other FLUX managers:

- **PlanningManager**: Store task results and context
- **AgentOrchestrator**: Auto-save agent results to memory
- **GuideManager**: Store learning progress

See `/src/features/` for integration examples.

## Resource Cleanup

Always close the manager when done:

```typescript
manager.close();
```

This clears:
- BM25 indexer cache
- Database connections
- Cleanup intervals
