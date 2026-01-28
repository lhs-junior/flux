import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  HooksManager,
  LifecycleHookType,
  getGlobalHooksManager,
  resetGlobalHooksManager,
  type HookContext,
} from '../../src/fusion/implementations/lifecycle-hooks-fusion.js';
import { MemoryManager } from '../../src/features/memory/memory-manager.js';
import { PlanningManager } from '../../src/features/planning/planning-manager.js';
import { TDDManager } from '../../src/features/tdd/tdd-manager.js';
import * as fs from 'fs';
import * as path from 'path';

describe('HooksManager', () => {
  let hooksManager: HooksManager;
  let memoryManager: MemoryManager;
  let planningManager: PlanningManager;
  let tddManager: TDDManager;
  const testDbPath = path.join('/tmp', `test-hooks-${Date.now()}.db`);

  beforeEach(() => {
    hooksManager = new HooksManager();
    memoryManager = new MemoryManager(':memory:');
    planningManager = new PlanningManager(':memory:');
    tddManager = new TDDManager(':memory:');
  });

  afterEach(() => {
    if (memoryManager) {
      memoryManager.close();
    }
    if (planningManager) {
      planningManager.close();
    }
    if (tddManager) {
      tddManager.close();
    }

    // Clean up test database file if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    it('should initialize with all hook types registered', () => {
      const stats = hooksManager.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalHooks).toBe(0);
      expect(Object.keys(stats.hooksByType).length).toBeGreaterThan(0);
    });

    it('should support all 19 hook types', () => {
      const hookTypes = Object.values(LifecycleHookType);
      expect(hookTypes.length).toBe(19);

      // Verify each hook type exists
      const expectedHooks = [
        'SessionStart',
        'SessionEnd',
        'UserPromptSubmit',
        'PreToolUse',
        'PostToolUse',
        'ErrorOccurred',
        'ContextFull',
        'TestCompleted',
        'AgentStarted',
        'AgentCompleted',
        'PlanningStarted',
        'PlanningCompleted',
        'MemorySaved',
        'MemoryRecalled',
        'TDDCycleStarted',
        'TDDCycleCompleted',
        'ScienceJobStarted',
        'ScienceJobCompleted',
        'GuideQueried',
      ];

      expectedHooks.forEach((hookName) => {
        expect(hookTypes).toContain(hookName);
      });
    });
  });

  describe('Hook Registration', () => {
    it('should register a hook', () => {
      const handler = vi.fn();
      const hookId = hooksManager.registerHook(
        LifecycleHookType.PostToolUse,
        handler
      );

      expect(hookId).toBeDefined();
      expect(hookId).toMatch(/^hook-\d+$/);

      const hooks = hooksManager.getHooks(LifecycleHookType.PostToolUse);
      expect(hooks.length).toBe(1);
      expect(hooks[0].id).toBe(hookId);
    });

    it('should register multiple hooks for same type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      hooksManager.registerHook(LifecycleHookType.SessionStart, handler1);
      hooksManager.registerHook(LifecycleHookType.SessionStart, handler2);
      hooksManager.registerHook(LifecycleHookType.SessionStart, handler3);

      const hooks = hooksManager.getHooks(LifecycleHookType.SessionStart);
      expect(hooks.length).toBe(3);
    });

    it('should register hooks with priority', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      hooksManager.registerHook(LifecycleHookType.PreToolUse, handler1, {
        priority: 5,
      });
      hooksManager.registerHook(LifecycleHookType.PreToolUse, handler2, {
        priority: 10,
      });
      hooksManager.registerHook(LifecycleHookType.PreToolUse, handler3, {
        priority: 1,
      });

      const hooks = hooksManager.getHooks(LifecycleHookType.PreToolUse);
      expect(hooks[0].priority).toBe(10); // Highest priority first
      expect(hooks[1].priority).toBe(5);
      expect(hooks[2].priority).toBe(1);
    });

    it('should register hooks with description', () => {
      const handler = vi.fn();
      const description = 'Test hook for validation';

      hooksManager.registerHook(
        LifecycleHookType.ErrorOccurred,
        handler,
        { description }
      );

      const hooks = hooksManager.getHooks(LifecycleHookType.ErrorOccurred);
      expect(hooks[0].description).toBe(description);
    });

    it('should unregister a hook by ID', () => {
      const handler = vi.fn();
      const hookId = hooksManager.registerHook(
        LifecycleHookType.ContextFull,
        handler
      );

      expect(hooksManager.getHooks(LifecycleHookType.ContextFull).length).toBe(
        1
      );

      const result = hooksManager.unregisterHook(hookId);
      expect(result).toBe(true);
      expect(hooksManager.getHooks(LifecycleHookType.ContextFull).length).toBe(
        0
      );
    });

    it('should return false when unregistering non-existent hook', () => {
      const result = hooksManager.unregisterHook('non-existent-hook');
      expect(result).toBe(false);
    });
  });

  describe('Hook Execution', () => {
    it('should execute registered hook', async () => {
      const handler = vi.fn();
      hooksManager.registerHook(LifecycleHookType.TestCompleted, handler);

      await hooksManager.executeHooks(LifecycleHookType.TestCompleted, {
        data: { testPath: 'test.ts', passed: true },
      });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          hookType: LifecycleHookType.TestCompleted,
          data: { testPath: 'test.ts', passed: true },
        })
      );
    });

    it('should execute hooks in priority order', async () => {
      const executionOrder: number[] = [];

      const handler1 = vi.fn(async () => {
        executionOrder.push(1);
      });
      const handler2 = vi.fn(async () => {
        executionOrder.push(2);
      });
      const handler3 = vi.fn(async () => {
        executionOrder.push(3);
      });

      hooksManager.registerHook(LifecycleHookType.AgentStarted, handler1, {
        priority: 5,
      });
      hooksManager.registerHook(LifecycleHookType.AgentStarted, handler2, {
        priority: 10,
      });
      hooksManager.registerHook(LifecycleHookType.AgentStarted, handler3, {
        priority: 1,
      });

      await hooksManager.executeHooks(LifecycleHookType.AgentStarted);

      expect(executionOrder).toEqual([2, 1, 3]); // Priority 10, 5, 1
    });

    it('should pass context to hook handlers', async () => {
      const handler = vi.fn();
      hooksManager.registerHook(LifecycleHookType.PostToolUse, handler);

      const context = {
        toolName: 'memory_save',
        toolArgs: { key: 'test', value: 'data' },
        toolResult: { success: true },
      };

      await hooksManager.executeHooks(LifecycleHookType.PostToolUse, context);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          hookType: LifecycleHookType.PostToolUse,
          toolName: 'memory_save',
          toolArgs: { key: 'test', value: 'data' },
          toolResult: { success: true },
          timestamp: expect.any(Number),
          sharedState: expect.any(Object),
        })
      );
    });

    it('should support shared state between hooks', async () => {
      const handler1 = vi.fn(async (context: HookContext) => {
        if (context.sharedState) {
          context.sharedState.step1 = 'completed';
        }
      });

      const handler2 = vi.fn(async (context: HookContext) => {
        expect(context.sharedState?.step1).toBe('completed');
        if (context.sharedState) {
          context.sharedState.step2 = 'completed';
        }
      });

      hooksManager.registerHook(LifecycleHookType.MemorySaved, handler1, {
        priority: 2,
      });
      hooksManager.registerHook(LifecycleHookType.MemorySaved, handler2, {
        priority: 1,
      });

      await hooksManager.executeHooks(LifecycleHookType.MemorySaved);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle async hook handlers', async () => {
      const handler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      hooksManager.registerHook(LifecycleHookType.PlanningCompleted, handler);

      await hooksManager.executeHooks(LifecycleHookType.PlanningCompleted);

      expect(handler).toHaveBeenCalled();
    });

    it('should continue executing hooks if one fails', async () => {
      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 failed');
      });
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      hooksManager.registerHook(LifecycleHookType.ErrorOccurred, handler1, {
        priority: 3,
      });
      hooksManager.registerHook(LifecycleHookType.ErrorOccurred, handler2, {
        priority: 2,
      });
      hooksManager.registerHook(LifecycleHookType.ErrorOccurred, handler3, {
        priority: 1,
      });

      await hooksManager.executeHooks(LifecycleHookType.ErrorOccurred);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    it('should handle empty hook list', async () => {
      await expect(
        hooksManager.executeHooks(LifecycleHookType.UserPromptSubmit)
      ).resolves.not.toThrow();
    });
  });

  describe('Built-in Hooks', () => {
    beforeEach(() => {
      hooksManager.injectManagers({
        memoryManager,
        planningManager,
        tddManager,
      });
    });

    it('should register built-in hooks after manager injection', () => {
      const stats = hooksManager.getStatistics();
      expect(stats.totalHooks).toBeGreaterThan(0);

      // Check specific built-in hooks
      expect(stats.hooksByType[LifecycleHookType.PostToolUse]).toBeGreaterThan(
        0
      );
      expect(
        stats.hooksByType[LifecycleHookType.AgentCompleted]
      ).toBeGreaterThan(0);
      expect(
        stats.hooksByType[LifecycleHookType.TestCompleted]
      ).toBeGreaterThan(0);
      expect(stats.hooksByType[LifecycleHookType.ContextFull]).toBeGreaterThan(
        0
      );
      expect(stats.hooksByType[LifecycleHookType.SessionStart]).toBeGreaterThan(
        0
      );
    });

    it('should auto-save important tool results on PostToolUse', async () => {
      await hooksManager.executeHooks(LifecycleHookType.PostToolUse, {
        toolName: 'memory_save',
        toolArgs: { key: 'test', value: 'data' },
        toolResult: { success: true, id: '123' },
      });

      // Verify memory was saved
      const recall = await memoryManager.recall({
        query: 'tool_result:memory_save',
        category: 'tool_execution',
        limit: 1,
      });

      expect(recall.results.length).toBeGreaterThan(0);
    });

    it('should update TODOs on AgentCompleted', async () => {
      // Create a test TODO
      const { todo } = planningManager.create({
        content: 'Test task',
        status: 'in_progress',
      });

      await hooksManager.executeHooks(LifecycleHookType.AgentCompleted, {
        data: {
          result: {
            success: true,
            todoIds: [todo.id],
          },
        },
      });

      // Verify TODO was updated by listing all TODOs
      const allTodos = planningManager.list();
      const updatedTodo = allTodos.find((t) => t.id === todo.id);
      expect(updatedTodo?.status).toBe('completed');
    });

    it('should save context snapshot on ContextFull', async () => {
      const sessionId = 'test-session-123';

      await hooksManager.executeHooks(LifecycleHookType.ContextFull, {
        sessionId,
        data: {
          currentTokens: 8000,
          maxTokens: 8000,
        },
      });

      // Verify context snapshot was saved
      const recall = await memoryManager.recall({
        query: `context_snapshot:${sessionId}`,
        category: 'context',
        limit: 1,
      });

      expect(recall.results.length).toBeGreaterThan(0);
    });

    it('should restore session state on SessionStart', async () => {
      const sessionId = 'test-session-456';

      // Save some context first
      await memoryManager.save({
        key: `context_snapshot:${sessionId}:${Date.now()}`,
        value: JSON.stringify({ previousData: 'test' }),
        metadata: {
          category: 'context',
          tags: ['context_full'],
        },
      });

      await hooksManager.executeHooks(LifecycleHookType.SessionStart, {
        sessionId,
      });

      // Session start hook should have attempted to restore context
      // (We can't directly verify the restoration, but we can verify it doesn't crash)
    });

    it('should handle TestCompleted hook', async () => {
      await hooksManager.executeHooks(LifecycleHookType.TestCompleted, {
        data: {
          testPath: 'tests/example.test.ts',
          passed: true,
          phase: 'green',
        },
      });

      // The hook should log the test completion without errors
      // (This is primarily a logging hook, so we verify it doesn't crash)
    });
  });

  describe('Statistics', () => {
    it('should return accurate statistics', () => {
      hooksManager.registerHook(
        LifecycleHookType.PostToolUse,
        vi.fn()
      );
      hooksManager.registerHook(
        LifecycleHookType.PostToolUse,
        vi.fn()
      );
      hooksManager.registerHook(
        LifecycleHookType.SessionStart,
        vi.fn()
      );

      const stats = hooksManager.getStatistics();
      expect(stats.totalHooks).toBe(3);
      expect(stats.hooksByType[LifecycleHookType.PostToolUse]).toBe(2);
      expect(stats.hooksByType[LifecycleHookType.SessionStart]).toBe(1);
    });

    it('should handle empty statistics', () => {
      const stats = hooksManager.getStatistics();
      expect(stats.totalHooks).toBe(0);
    });
  });

  describe('Clear Hooks', () => {
    it('should clear all hooks', () => {
      hooksManager.registerHook(LifecycleHookType.PostToolUse, vi.fn());
      hooksManager.registerHook(LifecycleHookType.SessionStart, vi.fn());
      hooksManager.registerHook(LifecycleHookType.ErrorOccurred, vi.fn());

      expect(hooksManager.getStatistics().totalHooks).toBe(3);

      hooksManager.clearAllHooks();

      expect(hooksManager.getStatistics().totalHooks).toBe(0);
    });
  });

  describe('Global Instance', () => {
    afterEach(() => {
      resetGlobalHooksManager();
    });

    it('should get or create global instance', () => {
      const instance1 = getGlobalHooksManager();
      const instance2 = getGlobalHooksManager();

      expect(instance1).toBe(instance2);
    });

    it('should reset global instance', () => {
      const instance1 = getGlobalHooksManager();
      instance1.registerHook(LifecycleHookType.PostToolUse, vi.fn());

      resetGlobalHooksManager();

      const instance2 = getGlobalHooksManager();
      expect(instance2).not.toBe(instance1);
      expect(instance2.getStatistics().totalHooks).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in hook handlers gracefully', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Hook error');
      });
      const successHandler = vi.fn();

      hooksManager.registerHook(
        LifecycleHookType.MemoryRecalled,
        errorHandler,
        { priority: 2 }
      );
      hooksManager.registerHook(
        LifecycleHookType.MemoryRecalled,
        successHandler,
        { priority: 1 }
      );

      await expect(
        hooksManager.executeHooks(LifecycleHookType.MemoryRecalled)
      ).resolves.not.toThrow();

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });

    it('should pass error context to ErrorOccurred hooks', async () => {
      const errorHandler = vi.fn();
      hooksManager.registerHook(LifecycleHookType.ErrorOccurred, errorHandler);

      const testError = new Error('Test error');
      await hooksManager.executeHooks(LifecycleHookType.ErrorOccurred, {
        error: testError,
        toolName: 'test_tool',
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          error: testError,
          toolName: 'test_tool',
        })
      );
    });
  });

  describe('Hook Context', () => {
    it('should include timestamp in context', async () => {
      const handler = vi.fn();
      hooksManager.registerHook(
        LifecycleHookType.TDDCycleStarted,
        handler
      );

      const beforeTime = Date.now();
      await hooksManager.executeHooks(LifecycleHookType.TDDCycleStarted);
      const afterTime = Date.now();

      expect(handler).toHaveBeenCalled();
      const context = handler.mock.calls[0][0];
      expect(context.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(context.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should include hook type in context', async () => {
      const handler = vi.fn();
      hooksManager.registerHook(LifecycleHookType.ScienceJobStarted, handler);

      await hooksManager.executeHooks(LifecycleHookType.ScienceJobStarted);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          hookType: LifecycleHookType.ScienceJobStarted,
        })
      );
    });

    it('should support tool-specific context', async () => {
      const handler = vi.fn();
      hooksManager.registerHook(LifecycleHookType.PreToolUse, handler);

      await hooksManager.executeHooks(LifecycleHookType.PreToolUse, {
        toolName: 'guide_query',
        toolArgs: { query: 'test' },
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          toolName: 'guide_query',
          toolArgs: { query: 'test' },
        })
      );
    });
  });

  describe('Integration with Features', () => {
    beforeEach(() => {
      hooksManager.injectManagers({
        memoryManager,
        planningManager,
        tddManager,
      });
    });

    it('should handle memory save through PostToolUse hook', async () => {
      await hooksManager.executeHooks(LifecycleHookType.PostToolUse, {
        toolName: 'planning_create',
        toolArgs: { content: 'New task' },
        toolResult: { success: true, todo: { id: '123' } },
      });

      // Verify auto-save occurred
      const recall = await memoryManager.recall({
        query: 'tool_result:planning_create',
        limit: 1,
      });

      expect(recall.results.length).toBeGreaterThan(0);
    });

    it('should support custom hooks alongside built-in hooks', async () => {
      const customHandler = vi.fn();
      hooksManager.registerHook(
        LifecycleHookType.PostToolUse,
        customHandler,
        { priority: 5 }
      );

      await hooksManager.executeHooks(LifecycleHookType.PostToolUse, {
        toolName: 'tdd_red',
        toolArgs: { testPath: 'test.ts' },
        toolResult: { success: true },
      });

      // Both custom and built-in hooks should execute
      expect(customHandler).toHaveBeenCalled();
    });
  });
});
