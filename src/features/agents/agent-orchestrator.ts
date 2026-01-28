import { AgentStore, AgentRecord } from './agent-store.js';
import type { AgentType, AgentStatus } from './agent-store.js';
import { AgentPromptRegistry } from './agent-prompt-registry.js';
import type { ToolMetadata } from '../../core/types.js';
import type { PlanningManager } from '../planning/planning-manager.js';
import type { MemoryManager } from '../memory/memory-manager.js';
import type { TDDManager } from '../tdd/tdd-manager.js';
import {
  SpawnAgentInputSchema,
  AgentStatusInputSchema,
  AgentResultInputSchema,
  AgentTerminateInputSchema,
  AgentListInputSchema,
  validateInput,
  type SpawnAgentInput,
  type AgentStatusInput,
  type AgentResultInput,
  type AgentTerminateInput,
  type AgentListInput,
} from '../../validation/schemas.js';

// Re-export types for backwards compatibility
export type {
  SpawnAgentInput,
  AgentStatusInput,
  AgentResultInput,
  AgentTerminateInput,
  AgentListInput,
  AgentType,
  AgentStatus,
};

/**
 * Agent Orchestrator - Manages agent lifecycle using Strategy Pattern
 * Inspired by oh-my-claudecode multi-agent pattern
 *
 * Features:
 * - Strategy pattern for specialist agents via AgentPromptRegistry
 * - Integration with Planning (TODO tracking)
 * - Integration with Memory (result persistence)
 * - Integration with TDD (test-first workflow)
 */
export class AgentOrchestrator {
  private store: AgentStore;
  private promptRegistry: AgentPromptRegistry;
  private runningAgents: Map<string, NodeJS.Timeout>;
  private agentStateLocks: Map<string, boolean>; // Mutex for state updates
  private planningManager?: PlanningManager;
  private memoryManager?: MemoryManager;
  private tddManager?: TDDManager;

  constructor(
    dbPath: string = ':memory:',
    options?: {
      planningManager?: PlanningManager;
      memoryManager?: MemoryManager;
      tddManager?: TDDManager;
    }
  ) {
    this.store = new AgentStore(dbPath);
    this.promptRegistry = new AgentPromptRegistry();
    this.runningAgents = new Map();
    this.agentStateLocks = new Map();

    // Optional integrations
    this.planningManager = options?.planningManager;
    this.memoryManager = options?.memoryManager;
    this.tddManager = options?.tddManager;
  }

  /**
   * Spawn a new agent using strategy pattern
   * Enhanced with Planning, Memory, and TDD integrations
   */
  async spawn(input: SpawnAgentInput): Promise<{ agentId: string; status: 'spawned'; prompt?: string; todoId?: string }> {
    // Get prompt template from registry (strategy pattern)
    const promptTemplate = this.promptRegistry.getPrompt(input.type);
    const fullPrompt = promptTemplate.template(input.task, input.specialistConfig);

    // Create TODO if requested (Planning integration)
    let todoId: string | undefined;
    if (input.createTodo && this.planningManager) {
      const todoResult = this.planningManager.create({
        content: `Agent ${input.type}: ${input.task}`,
        parentId: input.parentTaskId || undefined,
        tags: ['agent', input.type, ...(input.memoryTags || [])],
        status: 'in_progress',
        type: input.testPath ? 'tdd' : 'todo',
        testPath: input.testPath,
      });
      todoId = todoResult.todo.id;
    }

    // Create agent record with specialist configuration
    const agent = this.store.create(input.type, input.task, {
      timeout: input.timeout,
      specialistConfig: input.specialistConfig,
      parentTaskId: input.parentTaskId || todoId || null,
      memoryKeys: input.memoryKeys,
    });

    // Start agent execution asynchronously with integrations
    this.executeAgent(agent, {
      saveToMemory: input.saveToMemory,
      memoryTags: input.memoryTags,
      todoId,
    });

    return {
      agentId: agent.id,
      status: 'spawned',
      prompt: fullPrompt,
      todoId,
    };
  }

  /**
   * Helper: Spawn agent with Planning integration
   */
  async spawnWithPlanning(
    type: AgentType,
    task: string,
    parentTodoId?: string,
    options?: Partial<SpawnAgentInput>
  ): Promise<{ agentId: string; todoId?: string }> {
    const result = await this.spawn({
      type,
      task,
      ...options,
      parentTaskId: parentTodoId,
      createTodo: true,
    });

    return {
      agentId: result.agentId,
      todoId: result.todoId,
    };
  }

  /**
   * Helper: Spawn agent with Memory integration
   */
  async spawnWithMemory(
    type: AgentType,
    task: string,
    memoryTags: string[],
    options?: Partial<SpawnAgentInput>
  ): Promise<{ agentId: string }> {
    const result = await this.spawn({
      type,
      task,
      ...options,
      saveToMemory: true,
      memoryTags,
    });

    return {
      agentId: result.agentId,
    };
  }

  /**
   * Helper: Spawn agent for TDD workflow
   */
  async spawnForTDD(
    type: AgentType,
    testPath: string,
    task?: string,
    options?: Partial<SpawnAgentInput>
  ): Promise<{ agentId: string; todoId?: string }> {
    const result = await this.spawn({
      type,
      task: task || `TDD workflow for ${testPath}`,
      ...options,
      testPath,
      createTodo: true,
      saveToMemory: true,
      memoryTags: ['tdd', type],
    });

    return {
      agentId: result.agentId,
      todoId: result.todoId,
    };
  }

  /**
   * Get agent status
   */
  getStatus(input: AgentStatusInput): {
    agentId: string;
    status: AgentStatus;
    progress?: string;
    startedAt: number;
    type: AgentType;
    task: string;
  } {
    const agent = this.store.get(input.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${input.agentId}`);
    }

    return {
      agentId: agent.id,
      status: agent.status,
      progress: agent.progress,
      startedAt: agent.startedAt,
      type: agent.type,
      task: agent.task,
    };
  }

  /**
   * Get agent result
   */
  getResult(input: AgentResultInput): {
    agentId: string;
    result: any;
    completedAt?: number;
    duration?: number;
    status: AgentStatus;
  } {
    const agent = this.store.get(input.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${input.agentId}`);
    }

    if (agent.status !== 'completed' && agent.status !== 'failed') {
      throw new Error(`Agent has not completed yet. Current status: ${agent.status}`);
    }

    const duration = agent.completedAt ? agent.completedAt - agent.startedAt : undefined;

    return {
      agentId: agent.id,
      result: agent.status === 'completed' ? agent.result : { error: agent.error },
      completedAt: agent.completedAt,
      duration,
      status: agent.status,
    };
  }

  /**
   * Terminate a running agent
   */
  terminate(input: AgentTerminateInput): { success: boolean } {
    // Check if agent is already in terminal state (race condition protection)
    if (this.agentStateLocks.get(input.agentId)) {
      return { success: false };
    }

    const agent = this.store.get(input.agentId);
    if (!agent || (agent.status !== 'pending' && agent.status !== 'running')) {
      return { success: false };
    }

    // Acquire lock before state update
    this.agentStateLocks.set(input.agentId, true);

    try {
      const timer = this.runningAgents.get(input.agentId);
      if (timer) {
        clearTimeout(timer);
        this.runningAgents.delete(input.agentId);
      }

      this.store.updateStatus(input.agentId, 'failed', {
        error: 'Terminated by user',
      });
      return { success: true };
    } finally {
      // Lock is kept to prevent future state changes
    }
  }

  /**
   * List agents
   */
  list(input: AgentListInput): {
    agents: Array<{
      agentId: string;
      type: AgentType;
      task: string;
      status: AgentStatus;
      startedAt: number;
      progress?: string;
    }>;
  } {
    const agents = this.store.list({
      status: input.status,
      type: input.type,
      limit: input.limit || 50,
    });

    return {
      agents: agents.map((a) => ({
        agentId: a.id,
        type: a.type,
        task: a.task,
        status: a.status,
        startedAt: a.startedAt,
        progress: a.progress,
      })),
    };
  }

  /**
   * Get prompt registry (for testing or extension)
   */
  getPromptRegistry(): AgentPromptRegistry {
    return this.promptRegistry;
  }

  /**
   * Execute agent task with integration points
   * In production, this would spawn actual subprocesses or use Task tool
   */
  private async executeAgent(
    agent: AgentRecord,
    options?: {
      saveToMemory?: boolean;
      memoryTags?: string[];
      todoId?: string;
    }
  ): Promise<void> {
    // Update status to running
    this.store.updateStatus(agent.id, 'running', {
      progress: 'Starting agent...',
    });

    // Simulate agent work with timeout
    const workPromise = this.simulateAgentWork(agent);
    let timeoutTimer: NodeJS.Timeout | null = null;
    const timeoutPromise = agent.timeout
      ? new Promise<never>((_, reject) => {
          timeoutTimer = setTimeout(() => {
            reject(new Error('Agent timeout'));
          }, agent.timeout!);
          this.runningAgents.set(agent.id, timeoutTimer);
        })
      : null;

    try {
      const result = timeoutPromise ? await Promise.race([workPromise, timeoutPromise]) : await workPromise;

      // Acquire lock before finalizing state (race condition protection)
      if (this.agentStateLocks.get(agent.id)) {
        // Agent was already terminated, don't update state
        return;
      }
      this.agentStateLocks.set(agent.id, true);

      // Clear timeout - agent completed naturally
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        this.runningAgents.delete(agent.id);
      }

      // Update status to completed
      this.store.updateStatus(agent.id, 'completed', {
        result,
      });

      // Save to Memory if requested (Memory integration)
      if (options?.saveToMemory && this.memoryManager) {
        await this.memoryManager.save({
          key: `agent_${agent.type}_${agent.id}`,
          value: JSON.stringify(result),
          metadata: {
            tags: ['agent', agent.type, ...(options.memoryTags || [])],
            category: 'agent_result',
          },
        });
      }

      // Complete TODO if exists (Planning integration)
      if (options?.todoId && this.planningManager) {
        this.planningManager.update({
          id: options.todoId,
          status: 'completed',
        });
      }
    } catch (error: any) {
      // Acquire lock before finalizing state (race condition protection)
      if (this.agentStateLocks.get(agent.id)) {
        // Agent was already terminated, don't update state
        return;
      }
      this.agentStateLocks.set(agent.id, true);

      // Clear timeout
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        this.runningAgents.delete(agent.id);
      }

      const status: AgentStatus = error.message === 'Agent timeout' ? 'timeout' : 'failed';
      this.store.updateStatus(agent.id, status, {
        error: error.message,
      });

      // Mark TODO as failed if exists (Planning integration)
      if (options?.todoId && this.planningManager) {
        this.planningManager.update({
          id: options.todoId,
          status: 'pending', // Reset to pending so it can be retried
        });
      }
    }
  }

  /**
   * Simulate agent work (placeholder for actual implementation)
   */
  private async simulateAgentWork(agent: AgentRecord): Promise<any> {
    // Simulate different agent types
    switch (agent.type) {
      case 'researcher':
        return this.simulateResearcher(agent);
      case 'coder':
        return this.simulateCoder(agent);
      case 'tester':
        return this.simulateTester(agent);
      case 'reviewer':
        return this.simulateReviewer(agent);
      // Specialist agents
      case 'architect':
      case 'frontend':
      case 'backend':
      case 'database':
      case 'devops':
      case 'security':
      case 'performance':
      case 'documentation':
      case 'bugfix':
      case 'refactor':
        return this.simulateSpecialistAgent(agent);
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }
  }

  private async simulateSpecialistAgent(agent: AgentRecord): Promise<any> {
    const phases = ['Analyzing', 'Processing', 'Finalizing'];
    for (let i = 0; i < phases.length; i++) {
      this.store.updateStatus(agent.id, 'running', {
        progress: `${phases[i]}... (${i + 1}/${phases.length})`,
      });
      await this.delay(800);
    }

    return {
      type: agent.type,
      summary: `${agent.type} task completed: ${agent.task}`,
      config: agent.specialistConfig ? JSON.parse(agent.specialistConfig) : undefined,
      parentTaskId: agent.parentTaskId,
      memoryKeys: agent.memoryKeys ? JSON.parse(agent.memoryKeys) : undefined,
      output: `Completed ${agent.type} specialist task successfully`,
    };
  }

  private async simulateResearcher(agent: AgentRecord): Promise<any> {
    // Simulate research phases
    const phases = ['Searching', 'Analyzing', 'Synthesizing'];
    for (let i = 0; i < phases.length; i++) {
      this.store.updateStatus(agent.id, 'running', {
        progress: `${phases[i]}... (${i + 1}/${phases.length})`,
      });
      await this.delay(800);
    }

    return {
      type: 'research',
      summary: `Research completed for: ${agent.task}`,
      findings: [
        'Finding 1: Relevant information discovered',
        'Finding 2: Key insights identified',
        'Finding 3: Recommendations generated',
      ],
      sources: ['Source A', 'Source B', 'Source C'],
    };
  }

  private async simulateCoder(agent: AgentRecord): Promise<any> {
    const phases = ['Planning', 'Coding', 'Testing'];
    for (let i = 0; i < phases.length; i++) {
      this.store.updateStatus(agent.id, 'running', {
        progress: `${phases[i]}... (${i + 1}/${phases.length})`,
      });
      await this.delay(1000);
    }

    return {
      type: 'code',
      summary: `Code generated for: ${agent.task}`,
      files: ['file1.ts', 'file2.ts'],
      linesOfCode: 250,
    };
  }

  private async simulateTester(agent: AgentRecord): Promise<any> {
    const phases = ['Setup', 'Running tests', 'Cleanup'];
    for (let i = 0; i < phases.length; i++) {
      this.store.updateStatus(agent.id, 'running', {
        progress: `${phases[i]}... (${i + 1}/${phases.length})`,
      });
      await this.delay(600);
    }

    return {
      type: 'test',
      summary: `Tests completed for: ${agent.task}`,
      passed: 15,
      failed: 0,
      skipped: 2,
      coverage: 87.5,
    };
  }

  private async simulateReviewer(agent: AgentRecord): Promise<any> {
    const phases = ['Reading code', 'Analyzing', 'Generating feedback'];
    for (let i = 0; i < phases.length; i++) {
      this.store.updateStatus(agent.id, 'running', {
        progress: `${phases[i]}... (${i + 1}/${phases.length})`,
      });
      await this.delay(700);
    }

    return {
      type: 'review',
      summary: `Code review completed for: ${agent.task}`,
      issues: [
        { severity: 'low', message: 'Consider using more descriptive variable names' },
        { severity: 'medium', message: 'Missing error handling in function X' },
      ],
      suggestions: ['Add unit tests', 'Improve documentation'],
      overallRating: 'good',
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      store: this.store.getStatistics(),
      activeAgents: this.runningAgents.size,
      promptRegistry: {
        registeredTypes: this.promptRegistry.getRegisteredTypes().length,
        types: this.promptRegistry.getRegisteredTypes(),
      },
    };
  }

  /**
   * Get MCP tool definitions
   */
  getToolDefinitions(): ToolMetadata[] {
    const allAgentTypes = this.promptRegistry.getRegisteredTypes();

    return [
      {
        name: 'agent_spawn',
        description: 'Spawn a specialized agent to handle a subtask. Agents work asynchronously and can be monitored. Supports Planning, Memory, and TDD integrations.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: allAgentTypes,
              description: 'Type of agent - base: researcher (web search), coder (code gen), tester (test exec), reviewer (code review) | specialists: architect (design), frontend (UI/UX), backend (APIs), database (schema), devops (infra), security (audit), performance (optimization), documentation (docs), bugfix (debug), refactor (improve)',
            },
            task: {
              type: 'string',
              description: 'Clear description of what the agent should do',
            },
            timeout: {
              type: 'number',
              description: 'Optional timeout in milliseconds (default: no timeout)',
            },
            specialistConfig: {
              type: 'object',
              description: 'Optional specialist-specific configuration (JSON object)',
            },
            parentTaskId: {
              type: 'string',
              description: 'Optional parent task ID for task hierarchies',
            },
            memoryKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional array of related memory IDs',
            },
            saveToMemory: {
              type: 'boolean',
              description: 'Auto-save agent results to memory',
            },
            memoryTags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for memory categorization',
            },
            createTodo: {
              type: 'boolean',
              description: 'Create a TODO to track this agent task',
            },
            testPath: {
              type: 'string',
              description: 'Path to test file for TDD workflow',
            },
          },
          required: ['type', 'task'],
        },
        category: 'agents',
        keywords: ['agent', 'spawn', 'delegate', 'parallel', 'async', 'subtask', 'specialist', 'strategy'],
        serverId: 'internal:agents',
      },
      {
        name: 'agent_status',
        description: 'Check the current status of a running agent. Shows progress and current phase.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'The ID of the agent to check',
            },
          },
          required: ['agentId'],
        },
        category: 'agents',
        keywords: ['agent', 'status', 'progress', 'check', 'monitor'],
        serverId: 'internal:agents',
      },
      {
        name: 'agent_result',
        description: 'Get the result from a completed agent. Throws error if agent is still running.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'The ID of the agent',
            },
          },
          required: ['agentId'],
        },
        category: 'agents',
        keywords: ['agent', 'result', 'output', 'completion', 'get'],
        serverId: 'internal:agents',
      },
      {
        name: 'agent_terminate',
        description: 'Terminate a running agent. Useful for cancelling long-running tasks.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'The ID of the agent to terminate',
            },
          },
          required: ['agentId'],
        },
        category: 'agents',
        keywords: ['agent', 'terminate', 'cancel', 'stop', 'kill'],
        serverId: 'internal:agents',
      },
      {
        name: 'agent_list',
        description: 'List all agents with optional filters. Useful for tracking multiple parallel agents.',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed', 'timeout'],
              description: 'Filter by status',
            },
            type: {
              type: 'string',
              enum: allAgentTypes,
              description: 'Filter by agent type',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of agents to return (default: 50)',
            },
          },
        },
        category: 'agents',
        keywords: ['agent', 'list', 'all', 'browse', 'filter'],
        serverId: 'internal:agents',
      },
    ];
  }

  /**
   * Handle tool calls with Zod validation
   */
  async handleToolCall(toolName: string, args: unknown): Promise<unknown> {
    switch (toolName) {
      case 'agent_spawn': {
        const validation = validateInput(SpawnAgentInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.spawn(validation.data!);
      }

      case 'agent_status': {
        const validation = validateInput(AgentStatusInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.getStatus(validation.data!);
      }

      case 'agent_result': {
        const validation = validateInput(AgentResultInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.getResult(validation.data!);
      }

      case 'agent_terminate': {
        const validation = validateInput(AgentTerminateInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.terminate(validation.data!);
      }

      case 'agent_list': {
        const validation = validateInput(AgentListInputSchema, args);
        if (!validation.success) {
          throw new Error(validation.error);
        }
        return this.list(validation.data!);
      }

      default:
        throw new Error(`Unknown agent tool: ${toolName}`);
    }
  }

  /**
   * Close resources
   */
  close(): void {
    // Terminate all running agents
    for (const [agentId, timer] of this.runningAgents.entries()) {
      // Acquire lock before terminating
      if (!this.agentStateLocks.get(agentId)) {
        this.agentStateLocks.set(agentId, true);
        clearTimeout(timer);
        this.store.updateStatus(agentId, 'failed', {
          error: 'Orchestrator shutdown',
        });
      } else {
        clearTimeout(timer);
      }
    }
    this.runningAgents.clear();
    this.agentStateLocks.clear();

    this.store.close();
  }
}
