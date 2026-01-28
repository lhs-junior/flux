# Guide Manager API

The Guide Manager provides interactive tutorials and learning resources with progress tracking. It supports semantic search and step-by-step guided learning workflows.

## Overview

**Class:** `GuideManager`

**Location:** `src/features/guide/guide-manager.ts`

The Guide Manager manages a collection of guides and tutorials with built-in progress tracking, hints, and validation. Guides can be searched semantically and stepped through interactively.

## Methods

### search()

Search for guides and tutorials using semantic search.

**Signature:**
```typescript
search(input: GuideSearchInput): {
  results: Array<{
    guide: GuideRecord;
    relevance: number;
    progress?: LearningProgress;
  }>;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `GuideSearchInput` | Yes | Search parameters |
| `input.query` | `string` | Yes | Search query (natural language) |
| `input.category` | `string` | No | Filter by guide category |
| `input.difficulty` | `string` | No | Filter by difficulty level |
| `input.relatedTool` | `string` | No | Filter by related tool name |
| `input.limit` | `number` | No | Max results (default: 10) |

**Category Options:**
- `getting-started`
- `tutorial`
- `reference`
- `concept`
- `troubleshooting`

**Difficulty Options:**
- `beginner`
- `intermediate`
- `advanced`

**Returns:**

```typescript
{
  results: [
    {
      guide: {
        id: string;
        title: string;
        slug: string;
        excerpt: string;
        category: string;
        difficulty: string;
        tags: string[];
        relatedTools: string[];
        createdAt: number;
        updatedAt: number;
      };
      relevance: number;        // BM25 score (0-1)
      progress?: {
        id: string;
        guideId: string;
        currentStep: number;
        totalSteps: number;
        status: 'not-started' | 'in-progress' | 'completed';
        completedSteps: number[];
        startedAt: number;
        lastAccessedAt: number;
      };
    }
  ]
}
```

**Example:**

```typescript
const manager = new GuideManager();

const result = manager.search({
  query: 'how to set up memory system',
  category: 'getting-started',
  difficulty: 'beginner',
  limit: 5
});

result.results.forEach(r => {
  console.log(`${r.guide.title} (relevance: ${r.relevance})`);
  if (r.progress) {
    console.log(`  Progress: ${r.progress.currentStep}/${r.progress.totalSteps}`);
  }
});
```

**Exceptions:**

- Throws `Error` if query is empty
- Throws `Error` if search fails

---

### tutorial()

Interactive tutorial system: start, navigate, and track progress.

**Signature:**
```typescript
async tutorial(input: GuideTutorialInput): Promise<any>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `GuideTutorialInput` | Yes | Tutorial action parameters |
| `input.action` | `string` | Yes | Action to perform (see actions below) |
| `input.guideId` | `string` | No | Guide ID (use this OR guideSlug) |
| `input.guideSlug` | `string` | No | Guide slug (use this OR guideId) |

**Actions:**

#### start
Initialize tutorial and show first step.

```typescript
tutorial({
  action: 'start',
  guideId: 'guide-id'
})
```

**Returns:**
```typescript
{
  success: boolean;
  guide: GuideRecord;
  currentStep: TutorialStep;
  progress: LearningProgress;
}
```

#### next
Move to next step.

```typescript
tutorial({
  action: 'next',
  guideId: 'guide-id'
})
```

**Returns:**
```typescript
{
  success: boolean;
  currentStep: TutorialStep | null;
  progress: LearningProgress;
  completed: boolean;  // true if tutorial finished
}
```

#### previous
Move to previous step.

```typescript
tutorial({
  action: 'previous',
  guideId: 'guide-id'
})
```

**Returns:**
```typescript
{
  success: boolean;
  currentStep: TutorialStep | null;
  progress: LearningProgress;
}
```

#### hint
Get hint for current step.

```typescript
tutorial({
  action: 'hint',
  guideId: 'guide-id'
})
```

**Returns:**
```typescript
{
  success: boolean;
  hints: string[];
  currentStep: TutorialStep;
}
```

#### check
Validate current step (if validation available).

```typescript
tutorial({
  action: 'check',
  guideId: 'guide-id'
})
```

**Returns:**
```typescript
{
  success: boolean;
  passed: boolean;
  message: string;
  currentStep: TutorialStep;
}
```

#### status
Get tutorial progress status.

```typescript
tutorial({
  action: 'status',
  guideId: 'guide-id'
})
```

**Returns:**
```typescript
{
  success: boolean;
  guide: GuideRecord;
  progress: LearningProgress;
  currentStep?: TutorialStep;
  stats: {
    completed: number;    // steps completed
    remaining: number;    // steps remaining
    percentage: number;   // completion %
  };
}
```

#### complete
Mark current step as complete.

```typescript
tutorial({
  action: 'complete',
  guideId: 'guide-id'
})
```

**Returns:**
```typescript
{
  success: boolean;
  progress: LearningProgress;
  message: string;
}
```

#### reset
Reset tutorial progress (restart from beginning).

```typescript
tutorial({
  action: 'reset',
  guideId: 'guide-id'
})
```

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Guide Record Structure

```typescript
interface GuideRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  difficulty: string;
  tags: string[];
  relatedTools: string[];
  createdAt: number;
  updatedAt: number;
}
```

---

## Tutorial Step Structure

```typescript
interface TutorialStep {
  id: string;
  stepNumber: number;
  title: string;
  content: string;
  hints: string[];
  checkCommand?: string;    // optional validation command
}
```

---

## Learning Progress Tracking

```typescript
interface LearningProgress {
  id: string;
  guideId: string;
  currentStep: number;
  totalSteps: number;
  status: 'not-started' | 'in-progress' | 'completed';
  completedSteps: number[];  // array of step numbers
  startedAt: number;
  lastAccessedAt: number;
}
```

---

## Example Tutorial Workflow

```typescript
const manager = new GuideManager();

// 1. Search for a guide
const searchResult = manager.search({
  query: 'memory manager basics',
  difficulty: 'beginner'
});

const guide = searchResult.results[0].guide;

// 2. Start tutorial
const startResult = await manager.tutorial({
  action: 'start',
  guideId: guide.id
});

console.log(`Starting: ${startResult.guide.title}`);
console.log(`Step 1: ${startResult.currentStep.title}`);

// 3. Navigate through steps
let progress = startResult.progress;

while (progress.status === 'in-progress') {
  console.log(`Step ${progress.currentStep}: ${progress.completedSteps.length}/${progress.totalSteps}`);

  // Get help if needed
  const hint = await manager.tutorial({
    action: 'hint',
    guideId: guide.id
  });
  console.log(`Hint: ${hint.hints[0]}`);

  // Mark complete and move to next
  await manager.tutorial({
    action: 'complete',
    guideId: guide.id
  });

  const nextResult = await manager.tutorial({
    action: 'next',
    guideId: guide.id
  });

  progress = nextResult.progress;

  if (nextResult.completed) {
    console.log('✅ Tutorial completed!');
    break;
  }
}

// 4. View final status
const status = await manager.tutorial({
  action: 'status',
  guideId: guide.id
});

console.log(`Progress: ${status.stats.percentage}% complete`);
```

---

## Integration with Other Managers

The Guide Manager integrates with:

- **Memory Manager**: Auto-save tutorial completion
- **Planning Manager**: Track learning goals

---

## Pagination and Limits

Search results are limited to improve performance:

- Default limit: 10 results
- Maximum: system-dependent (typically 100)

Use `limit` parameter to adjust:

```typescript
manager.search({
  query: 'authentication',
  limit: 20  // get more results
})
```

---

## Resource Cleanup

Always close the manager when done:

```typescript
manager.close();
```

This closes the database connection and clears the BM25 indexer cache.

---

## Statistics

Access usage statistics:

```typescript
const stats = manager.getStatistics();
console.log(stats.store);     // Store statistics
console.log(stats.index);     // Indexer statistics
```
