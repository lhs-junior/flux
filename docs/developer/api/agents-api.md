# Agent Orchestrator API

The Agent Orchestrator manages the lifecycle of specialist agents using the Strategy Pattern. Agents work asynchronously on subtasks and can integrate with Planning, Memory, and TDD managers.

## Overview

**Class:** `AgentOrchestrator`

**Location:** `src/features/agents/agent-orchestrator.ts`

The Agent Orchestrator spawns specialist agents that handle domain-specific tasks in parallel. Agents support 10 specialist types plus base agent types (researcher, coder, tester, reviewer).

## Agent Types

### Base Agents
- **researcher**: Web search and research tasks
- **coder**: Code generation and implementation
- **tester**: Test execution and validation
- **reviewer**: Code review and feedback

### Specialist Agents
- **architect**: System design and architecture
- **frontend**: UI/UX development
- **backend**: API and server implementation
- **database**: Schema design and optimization
- **devops**: Infrastructure and deployment
- **security**: Security audit and hardening
- **performance**: Performance optimization
- **documentation**: Documentation generation
- **bugfix**: Debug and fix issues
- **refactor**: Code improvement and refactoring

## Methods

### spawn()

Spawn a new specialist agent to handle a task.

**Signature:**
```typescript
spawn(input: SpawnAgentInput): Promise<{
  agentId: string;
  status: 'spawned';
  prompt?: string;
  todoId?: string;
}>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `SpawnAgentInput` | Yes | Agent configuration |
| `input.type` | `AgentType` | Yes | One of the 14 agent types listed above |
| `input.task` | `string` | Yes | Clear description of what the agent should do |
| `input.timeout` | `number` | No | Timeout in milliseconds |
| `input.specialistConfig` | `object` | No | Specialist-specific configuration |
| `input.parentTaskId` | `string` | No | Parent task ID for hierarchies |
| `input.memoryKeys` | `string[]` | No | Related memory IDs to provide context |
| `input.saveToMemory` | `boolean` | No | Auto-save results to memory |
| `input.memoryTags` | `string[]` | No | Tags for memory categorization |
| `input.createTodo` | `boolean` | No | Create TODO to track the task |
| `input.testPath` | `string` | No | Path to test file for TDD workflow |

**Returns:**

```typescript
{
  agentId: string;       // UUID of spawned agent
  status: 'spawned';     // Always 'spawned' on success
  prompt?: string;       // Full agent prompt (optional)
  todoId?: string;       // Created TODO ID if createTodo=true
}
```

**Example:**

```typescript
const orchestrator = new AgentOrchestrator();

const result = await orchestrator.spawn({
  type: 'backend',
  task: 'Implement user authentication endpoint',
  timeout: 60000,
  saveToMemory: true,
  memoryTags: ['auth', 'backend'],
  createTodo: true
});

console.log(`Agent spawned: ${result.agentId}`);
```

**Exceptions:**

- Throws `Error` if agent type is invalid
- Throws `Error` if task description is empty

---

### status()

Check the current status of a running agent.

**Signature:**
```typescript
getStatus(input: AgentStatusInput): {
  agentId: string;
  status: AgentStatus;
  progress?: string;
  startedAt: number;
  type: AgentType;
  task: string;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `AgentStatusInput` | Yes | Status query parameters |
| `input.agentId` | `string` | Yes | Agent ID to check |

**AgentStatus Types:** `pending` | `running` | `completed` | `failed` | `timeout`

**Returns:**

```typescript
{
  agentId: string;       // Agent ID
  status: AgentStatus;   // Current status
  progress?: string;     // Current phase (e.g., "Analyzing...", "Processing...")
  startedAt: number;     // Unix timestamp when agent started
  type: AgentType;       // Agent type
  task: string;          // Original task description
}
```

**Example:**

```typescript
const status = orchestrator.getStatus({
  agentId: 'agent-id-here'
});

console.log(`Status: ${status.status}`);
console.log(`Progress: ${status.progress}`);
```

**Exceptions:**

- Throws `Error` if agent not found

---

### result()

Get the result from a completed agent.

**Signature:**
```typescript
getResult(input: AgentResultInput): {
  agentId: string;
  result: any;
  completedAt?: number;
  duration?: number;
  status: AgentStatus;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `AgentResultInput` | Yes | Result query parameters |
| `input.agentId` | `string` | Yes | Agent ID |

**Returns:**

```typescript
{
  agentId: string;          // Agent ID
  result: any;              // Agent result (varies by agent type)
  completedAt?: number;     // Unix timestamp when completed
  duration?: number;        // Execution time in milliseconds
  status: AgentStatus;      // Final status
}
```

**Result Structure Example:**

```typescript
{
  agentId: 'uuid',
  result: {
    type: 'backend',
    summary: 'Backend specialist task completed: ...',
    config: { /* specialistConfig */ },
    parentTaskId: 'parent-uuid',
    memoryKeys: ['key1', 'key2'],
    output: 'Completed backend specialist task successfully'
  },
  completedAt: 1234567890,
  duration: 2500,
  status: 'completed'
}
```

**Example:**

```typescript
const result = orchestrator.getResult({
  agentId: 'agent-id-here'
});

console.log(`Result: ${result.result.summary}`);
console.log(`Duration: ${result.duration}ms`);
```

**Exceptions:**

- Throws `Error` if agent not found
- Throws `Error` if agent has not completed yet

---

### terminate()

Terminate a running agent.

**Signature:**
```typescript
terminate(input: AgentTerminateInput): {
  success: boolean;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `AgentTerminateInput` | Yes | Termination parameters |
| `input.agentId` | `string` | Yes | Agent ID to terminate |

**Returns:**

```typescript
{
  success: boolean;  // true if terminated, false if already in terminal state
}
```

**Example:**

```typescript
const result = orchestrator.terminate({
  agentId: 'agent-id-here'
});

if (result.success) {
  console.log('Agent terminated');
}
```

---

### list()

List all agents with optional filters.

**Signature:**
```typescript
list(input: AgentListInput): {
  agents: Array<{
    agentId: string;
    type: AgentType;
    task: string;
    status: AgentStatus;
    startedAt: number;
    progress?: string;
  }>;
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `AgentListInput` | Yes | List parameters |
| `input.status` | `AgentStatus` | No | Filter by status |
| `input.type` | `AgentType` | No | Filter by agent type |
| `input.limit` | `number` | No | Max results (default: 50) |

**Returns:**

```typescript
{
  agents: [
    {
      agentId: string;
      type: AgentType;
      task: string;
      status: AgentStatus;
      startedAt: number;
      progress?: string;
    }
  ]
}
```

**Example:**

```typescript
const list = orchestrator.list({
  status: 'running',
  limit: 10
});

console.log(`${list.agents.length} agents running`);
```

---

## Helper Methods

### spawnWithPlanning()

Convenience method to spawn an agent with Planning integration.

```typescript
async spawnWithPlanning(
  type: AgentType,
  task: string,
  parentTodoId?: string,
  options?: Partial<SpawnAgentInput>
): Promise<{ agentId: string; todoId?: string }>
```

### spawnWithMemory()

Convenience method to spawn an agent with Memory integration.

```typescript
async spawnWithMemory(
  type: AgentType,
  task: string,
  memoryTags: string[],
  options?: Partial<SpawnAgentInput>
): Promise<{ agentId: string }>
```

### spawnForTDD()

Convenience method for TDD workflow.

```typescript
async spawnForTDD(
  type: AgentType,
  testPath: string,
  task?: string,
  options?: Partial<SpawnAgentInput>
): Promise<{ agentId: string; todoId?: string }>
```

## Integration Points

The Agent Orchestrator integrates with:

- **Planning Manager**: Create and update TODOs for agent tasks
- **Memory Manager**: Auto-save agent results and provide context
- **TDD Manager**: Support test-first workflows

## Resource Cleanup

Always close the orchestrator when done:

```typescript
orchestrator.close();
```

This terminates all running agents and closes resources.
