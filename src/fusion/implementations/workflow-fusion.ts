/**
 * Workflow Fusion System
 *
 * Provides automatic sequential coordination between Planning, Agent, TDD, and Memory
 * components using hook-based event system.
 *
 * Features:
 * - Planning → Agent: Auto-start agent when TODOs created
 * - Agent → TDD: Auto-run tests when agent completes
 * - TDD → Memory: Auto-save test results
 * - Memory: Auto-recall past work context
 */

import logger from '../../utils/logger.js';
import type { MemoryManager } from '../../features/memory/memory-manager.js';
import type { PlanningManager } from '../../features/planning/planning-manager.js';
import type { TDDManager } from '../../features/tdd/tdd-manager.js';
import type { AgentOrchestrator } from '../../features/agents/agent-orchestrator.js';
import type { FeatureCoordinator } from '../../core/feature-coordinator.js';
import { HooksManager, LifecycleHookType, type HookContext } from './lifecycle-hooks-fusion.js';

/**
 * Workflow task definition
 */
export interface WorkflowTask {
  /** Task description */
  description: string;

  /** Optional parent task ID */
  parentId?: string;

  /** Tags for categorization */
  tags?: string[];

  /** Whether to auto-start agent */
  autoStartAgent?: boolean;

  /** Whether to auto-run tests after agent */
  autoRunTests?: boolean;

  /** Test path for TDD workflow */
  testPath?: string;

  /** Memory keys to recall for context */
  memoryKeys?: string[];
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  /** Success status */
  success: boolean;

  /** Created TODO ID */
  todoId?: string;

  /** Spawned agent ID */
  agentId?: string;

  /** TDD test run ID */
  testRunId?: string;

  /** Memory saved ID */
  memoryId?: string;

  /** Error message if failed */
  error?: string;

  /** Execution steps completed */
  stepsCompleted: string[];
}

/**
 * Workflow context shared across hooks
 */
interface WorkflowContext {
  /** Original task */
  task: WorkflowTask;

  /** Created TODO ID */
  todoId?: string;

  /** Spawned agent ID */
  agentId?: string;

  /** Agent completion result */
  agentResult?: {
    success: boolean;
    output?: string;
  };

  /** TDD test result */
  testResult?: {
    passed: boolean;
    phase: 'red' | 'green' | 'refactor';
    output?: string;
  };

  /** Steps completed */
  stepsCompleted: string[];

  /** Timestamp when workflow started */
  startedAt: number;
}

/**
 * WorkflowOrchestrator manages automatic workflow coordination
 */
export class WorkflowOrchestrator {
  private hooksManager: HooksManager;
  private memoryManager?: MemoryManager;
  private planningManager?: PlanningManager;
  private tddManager?: TDDManager;
  private agentOrchestrator?: AgentOrchestrator;

  // Track active workflows
  private activeWorkflows: Map<string, WorkflowContext> = new Map();

  // Hook IDs for cleanup
  private registeredHookIds: string[] = [];

  constructor(
    coordinator: FeatureCoordinator,
    options?: {
      hooksManager?: HooksManager;
    }
  ) {
    this.hooksManager = options?.hooksManager || coordinator.getHooksManager();
    this.memoryManager = coordinator.getMemoryManager();
    this.planningManager = coordinator.getPlanningManager();
    this.tddManager = coordinator.getTddManager();
    this.agentOrchestrator = coordinator.getAgentOrchestrator();

    // Register workflow hooks
    this.registerWorkflowHooks();
  }

  /**
   * Start a workflow from a user task
   */
  async startWorkflow(task: WorkflowTask): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: false,
      stepsCompleted: [],
    };

    try {
      logger.info('Starting workflow:', task.description);

      // Step 1: Recall past context from memory
      if (this.memoryManager && task.memoryKeys && task.memoryKeys.length > 0) {
        await this.recallContext(task);
        result.stepsCompleted.push('context_recalled');
      }

      // Step 2: Create TODO in Planning
      if (!this.planningManager) {
        throw new Error('PlanningManager not available');
      }

      const todoResult = this.planningManager.create({
        content: task.description,
        parentId: task.parentId,
        tags: ['workflow', ...(task.tags || [])],
        status: 'pending',
        type: task.testPath ? 'tdd' : 'todo',
        testPath: task.testPath,
      });

      result.todoId = todoResult.todo.id;
      result.stepsCompleted.push('planning_created');

      // Create workflow context
      const context: WorkflowContext = {
        task,
        todoId: todoResult.todo.id,
        stepsCompleted: result.stepsCompleted,
        startedAt: Date.now(),
      };

      this.activeWorkflows.set(todoResult.todo.id, context);

      // Emit PlanningCompleted hook to trigger auto-agent
      await this.hooksManager.executeHooks(LifecycleHookType.PlanningCompleted, {
        data: {
          todoId: todoResult.todo.id,
          task,
          autoStartAgent: task.autoStartAgent !== false, // Default true
        },
      });

      // Wait a bit for async hooks to complete
      // In production, this would use proper async coordination
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if agent was started
      const updatedContext = this.activeWorkflows.get(todoResult.todo.id);
      if (updatedContext?.agentId) {
        result.agentId = updatedContext.agentId;
        result.stepsCompleted = [...updatedContext.stepsCompleted];
      }

      result.success = true;
      logger.info('Workflow started successfully:', result);

      return result;

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Workflow failed:', message);
      result.error = message;
      return result;
    }
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(todoId: string): WorkflowContext | undefined {
    return this.activeWorkflows.get(todoId);
  }

  /**
   * Register workflow coordination hooks
   */
  private registerWorkflowHooks(): void {
    // PlanningCompleted → AgentStarted
    const hook1 = this.hooksManager.registerHook(
      LifecycleHookType.PlanningCompleted,
      async (context: HookContext) => {
        await this.handlePlanningCompleted(context);
      },
      {
        priority: 100,
        description: 'Workflow: Auto-start agent after planning',
      }
    );
    this.registeredHookIds.push(hook1);

    // AgentCompleted → TDDCycleStarted
    const hook2 = this.hooksManager.registerHook(
      LifecycleHookType.AgentCompleted,
      async (context: HookContext) => {
        await this.handleAgentCompleted(context);
      },
      {
        priority: 100,
        description: 'Workflow: Auto-run tests after agent completion',
      }
    );
    this.registeredHookIds.push(hook2);

    // TDDCycleCompleted → MemorySaved
    const hook3 = this.hooksManager.registerHook(
      LifecycleHookType.TDDCycleCompleted,
      async (context: HookContext) => {
        await this.handleTDDCompleted(context);
      },
      {
        priority: 100,
        description: 'Workflow: Auto-save test results to memory',
      }
    );
    this.registeredHookIds.push(hook3);

    logger.info('Registered workflow coordination hooks');
  }

  /**
   * Handle PlanningCompleted hook: Start agent automatically
   */
  private async handlePlanningCompleted(context: HookContext): Promise<void> {
    try {
      const todoId = context.data?.todoId as string | undefined;
      const task = context.data?.task as WorkflowTask | undefined;
      const autoStartAgent = context.data?.autoStartAgent as boolean | undefined;

      logger.debug(`handlePlanningCompleted: todoId=${todoId}, autoStartAgent=${autoStartAgent}`);

      if (!todoId || !task || autoStartAgent === false) {
        logger.debug('Skipping auto-agent: conditions not met');
        return;
      }

      if (!this.agentOrchestrator) {
        logger.warn('AgentOrchestrator not available, skipping auto-agent');
        return;
      }

      logger.debug(`Auto-starting agent for TODO ${todoId}`);

      // Spawn agent (use 'coder' as default agent type)
      const spawnResult = await this.agentOrchestrator.spawn({
        type: 'coder',
        task: task.description,
        createTodo: false, // Already created
        parentTaskId: todoId,
        memoryKeys: task.memoryKeys,
        testPath: task.testPath,
      });

      logger.debug(`Agent spawned: ${spawnResult.agentId}`);

      // Update workflow context
      const workflowContext = this.activeWorkflows.get(todoId);
      if (workflowContext) {
        workflowContext.agentId = spawnResult.agentId;
        workflowContext.stepsCompleted.push('agent_started');
        logger.debug(`Updated workflow context for ${todoId}, agentId=${spawnResult.agentId}`);
      } else {
        logger.warn(`Workflow context not found for ${todoId}`);
      }

      // Emit AgentStarted hook
      await this.hooksManager.executeHooks(LifecycleHookType.AgentStarted, {
        data: {
          agentId: spawnResult.agentId,
          todoId,
          task,
        },
      });

      logger.info(`Agent ${spawnResult.agentId} started for TODO ${todoId}`);

    } catch (error) {
      logger.error('Failed to auto-start agent:', error);
    }
  }

  /**
   * Handle AgentCompleted hook: Run tests automatically
   */
  private async handleAgentCompleted(context: HookContext): Promise<void> {
    try {
      const agentId = context.data?.agentId as string | undefined;
      const todoId = context.data?.todoId as string | undefined;
      const agentResult = context.data?.result as { success: boolean; output?: string } | undefined;

      if (!agentId || !agentResult?.success) {
        return;
      }

      // Find workflow context
      const workflowContext = Array.from(this.activeWorkflows.values())
        .find(wc => wc.agentId === agentId);

      if (!workflowContext || !workflowContext.task.autoRunTests) {
        return;
      }

      const testPath = workflowContext.task.testPath;
      if (!testPath || !this.tddManager) {
        logger.debug('No test path or TDDManager, skipping auto-test');
        return;
      }

      logger.debug(`Auto-running tests for agent ${agentId}`);

      // Update context
      workflowContext.agentResult = agentResult;
      workflowContext.stepsCompleted.push('agent_completed');

      // Emit TDDCycleStarted hook (TDDManager will handle actual test execution)
      await this.hooksManager.executeHooks(LifecycleHookType.TDDCycleStarted, {
        data: {
          testPath,
          agentId,
          todoId: workflowContext.todoId,
          phase: 'green', // After agent completes, we verify tests pass
        },
      });

      logger.info(`TDD cycle started for agent ${agentId}`);

    } catch (error) {
      logger.error('Failed to auto-run tests:', error);
    }
  }

  /**
   * Handle TDDCycleCompleted hook: Save results to memory
   */
  private async handleTDDCompleted(context: HookContext): Promise<void> {
    try {
      const testPath = context.data?.testPath as string | undefined;
      const passed = context.data?.passed as boolean | undefined;
      const phase = context.data?.phase as string | undefined;
      const agentId = context.data?.agentId as string | undefined;

      if (!testPath || passed === undefined || !this.memoryManager) {
        return;
      }

      // Find workflow context
      const workflowContext = Array.from(this.activeWorkflows.values())
        .find(wc => wc.agentId === agentId);

      if (!workflowContext) {
        return;
      }

      logger.debug(`Auto-saving test results for ${testPath}`);

      // Save test result to memory
      const memoryResult = this.memoryManager.save({
        key: `workflow:test_result:${workflowContext.todoId}`,
        value: JSON.stringify({
          testPath,
          passed,
          phase,
          agentId,
          todoId: workflowContext.todoId,
          timestamp: Date.now(),
        }),
        metadata: {
          category: 'workflow',
          tags: ['test_result', phase || 'unknown', passed ? 'passed' : 'failed'],
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        },
      });

      // Update context
      workflowContext.testResult = {
        passed,
        phase: (phase as 'red' | 'green' | 'refactor') || 'green',
      };
      workflowContext.stepsCompleted.push('test_completed');
      workflowContext.stepsCompleted.push('memory_saved');

      // Emit MemorySaved hook
      await this.hooksManager.executeHooks(LifecycleHookType.MemorySaved, {
        data: {
          memoryId: memoryResult.id,
          todoId: workflowContext.todoId,
          agentId,
          testResult: workflowContext.testResult,
        },
      });

      // Mark TODO as completed if test passed
      if (passed && this.planningManager && workflowContext.todoId) {
        this.planningManager.update({
          id: workflowContext.todoId,
          status: 'completed',
        });
        workflowContext.stepsCompleted.push('todo_completed');
      }

      logger.info(`Workflow completed for TODO ${workflowContext.todoId}`);

      // Clean up completed workflow
      if (workflowContext.todoId) {
        this.activeWorkflows.delete(workflowContext.todoId);
      }

    } catch (error) {
      logger.error('Failed to save test results:', error);
    }
  }

  /**
   * Recall context from memory for a task
   */
  private async recallContext(task: WorkflowTask): Promise<void> {
    if (!this.memoryManager || !task.memoryKeys || task.memoryKeys.length === 0) {
      return;
    }

    try {
      for (const key of task.memoryKeys) {
        const recalled = this.memoryManager.recall({
          query: key,
          limit: 5,
        });

        if (recalled.results.length > 0) {
          logger.debug(`Recalled ${recalled.results.length} memories for key: ${key}`);
        }
      }

      // Emit MemoryRecalled hook
      await this.hooksManager.executeHooks(LifecycleHookType.MemoryRecalled, {
        data: {
          memoryKeys: task.memoryKeys,
        },
      });

    } catch (error) {
      logger.error('Failed to recall context:', error);
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Unregister all workflow hooks
    for (const hookId of this.registeredHookIds) {
      this.hooksManager.unregisterHook(hookId);
    }
    this.registeredHookIds = [];

    // Clear active workflows
    this.activeWorkflows.clear();

    logger.debug('WorkflowOrchestrator cleaned up');
  }
}
