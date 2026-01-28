import { AgentStore, AgentType, AgentStatus, AgentRecord } from './agent-store.js';
import type { ToolMetadata } from '../../core/gateway.js';

export interface SpawnAgentInput {
  type: AgentType;
  task: string;
  timeout?: number;
}

export interface AgentStatusInput {
  agentId: string;
}

export interface AgentResultInput {
  agentId: string;
}

export interface AgentTerminateInput {
  agentId: string;
}

export interface AgentListInput {
  status?: AgentStatus;
  type?: AgentType;
  limit?: number;
}

/**
 * Agent Orchestrator - Manages agent lifecycle
 * Inspired by oh-my-claudecode multi-agent pattern
 */
export class AgentOrchestrator {
  private store: AgentStore;
  private runningAgents: Map<string, NodeJS.Timeout>;

  constructor(dbPath: string = ':memory:') {
    this.store = new AgentStore(dbPath);
    this.runningAgents = new Map();
  }

  /**
   * Spawn a new agent
   */
  spawn(input: SpawnAgentInput): { agentId: string; status: 'spawned' } {
    // Create agent record
    const agent = this.store.create(input.type, input.task, input.timeout);

    // Start agent execution asynchronously
    this.executeAgent(agent);

    return {
      agentId: agent.id,
      status: 'spawned',
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
    const timer = this.runningAgents.get(input.agentId);
    if (timer) {
      clearTimeout(timer);
      this.runningAgents.delete(input.agentId);
    }

    const agent = this.store.get(input.agentId);
    if (agent && (agent.status === 'pending' || agent.status === 'running')) {
      this.store.updateStatus(input.agentId, 'failed', {
        error: 'Terminated by user',
      });
      return { success: true };
    }

    return { success: false };
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
   * Execute agent task (simulated for now)
   * In production, this would spawn actual subprocesses or use Task tool
   */
  private async executeAgent(agent: AgentRecord): Promise<void> {
    // Update status to running
    this.store.updateStatus(agent.id, 'running', {
      progress: 'Starting agent...',
    });

    // Simulate agent work with timeout
    const workPromise = this.simulateAgentWork(agent);
    const timeoutPromise = agent.timeout
      ? new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Agent timeout'));
          }, agent.timeout!);
          this.runningAgents.set(agent.id, timer);
        })
      : null;

    try {
      const result = timeoutPromise ? await Promise.race([workPromise, timeoutPromise]) : await workPromise;

      // Clear timeout
      const timer = this.runningAgents.get(agent.id);
      if (timer) {
        clearTimeout(timer);
        this.runningAgents.delete(agent.id);
      }

      // Update status to completed
      this.store.updateStatus(agent.id, 'completed', {
        result,
      });
    } catch (error: any) {
      // Clear timeout
      const timer = this.runningAgents.get(agent.id);
      if (timer) {
        clearTimeout(timer);
        this.runningAgents.delete(agent.id);
      }

      const status: AgentStatus = error.message === 'Agent timeout' ? 'timeout' : 'failed';
      this.store.updateStatus(agent.id, status, {
        error: error.message,
      });
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
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }
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
    };
  }

  /**
   * Get MCP tool definitions
   */
  getToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'agent_spawn',
        description: 'Spawn a specialized agent to handle a subtask. Agents work asynchronously and can be monitored.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['researcher', 'coder', 'tester', 'reviewer'],
              description: 'Type of agent: researcher (web search & analysis), coder (code generation), tester (test execution), reviewer (code review)',
            },
            task: {
              type: 'string',
              description: 'Clear description of what the agent should do',
            },
            timeout: {
              type: 'number',
              description: 'Optional timeout in milliseconds (default: no timeout)',
            },
          },
          required: ['type', 'task'],
        },
        category: 'agents',
        keywords: ['agent', 'spawn', 'delegate', 'parallel', 'async', 'subtask'],
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
              enum: ['researcher', 'coder', 'tester', 'reviewer'],
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
   * Handle tool calls
   */
  async handleToolCall(toolName: string, args: unknown): Promise<any> {
    switch (toolName) {
      case 'agent_spawn':
        return this.spawn(args as SpawnAgentInput);

      case 'agent_status':
        return this.getStatus(args as AgentStatusInput);

      case 'agent_result':
        return this.getResult(args as AgentResultInput);

      case 'agent_terminate':
        return this.terminate(args as AgentTerminateInput);

      case 'agent_list':
        return this.list(args as AgentListInput);

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
      clearTimeout(timer);
      this.store.updateStatus(agentId, 'failed', {
        error: 'Orchestrator shutdown',
      });
    }
    this.runningAgents.clear();

    this.store.close();
  }
}
