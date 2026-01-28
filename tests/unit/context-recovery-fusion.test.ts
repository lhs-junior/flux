/**
 * Tests for Context Recovery Fusion
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContextRecoveryManager } from '../../src/fusion/implementations/context-recovery-fusion.js';
import { MemoryManager } from '../../src/features/memory/memory-manager.js';
import { PlanningManager } from '../../src/features/planning/planning-manager.js';
import { TDDManager } from '../../src/features/tdd/tdd-manager.js';
import { randomUUID } from 'crypto';

describe('ContextRecoveryManager', () => {
  let contextManager: ContextRecoveryManager;
  let memoryManager: MemoryManager;
  let planningManager: PlanningManager;
  let tddManager: TDDManager;

  beforeEach(() => {
    // Create in-memory managers for testing
    memoryManager = new MemoryManager(':memory:');
    planningManager = new PlanningManager(':memory:');
    tddManager = new TDDManager(':memory:');

    contextManager = new ContextRecoveryManager(':memory:', {
      memoryManager,
      planningManager,
      tddManager,
    });
  });

  afterEach(() => {
    contextManager.close();
    memoryManager.close();
    planningManager.close();
    tddManager.close();
  });

  describe('captureContext', () => {
    it('should capture empty state when no data exists', async () => {
      const state = await contextManager.captureContext();

      expect(state).toBeDefined();
      expect(state.memory).toBeDefined();
      expect(state.memory?.memories).toHaveLength(0);
      expect(state.planning).toBeDefined();
      expect(state.planning?.todos).toHaveLength(0);
    });

    it('should capture memory state', async () => {
      // Add some memories
      memoryManager.save({
        key: 'test-key',
        value: 'test-value',
        metadata: { category: 'test', tags: ['tag1'] },
      });

      memoryManager.save({
        key: 'another-key',
        value: 'another-value',
        metadata: { category: 'test' },
      });

      const state = await contextManager.captureContext();

      expect(state.memory?.memories).toHaveLength(2);
      expect(state.memory?.memories[0]?.key).toBe('another-key'); // Most recent first
      expect(state.memory?.memories[1]?.key).toBe('test-key');
    });

    it('should capture planning state', async () => {
      // Add some TODOs
      const todo1 = planningManager.create({
        content: 'Test TODO 1',
        status: 'pending',
        tags: ['test'],
      });

      const todo2 = planningManager.create({
        content: 'Test TODO 2',
        status: 'in_progress',
        parentId: todo1.todo.id,
      });

      const state = await contextManager.captureContext();

      expect(state.planning?.todos).toHaveLength(2);
      expect(state.planning?.todos.some((t) => t.content === 'Test TODO 1')).toBe(true);
      expect(state.planning?.todos.some((t) => t.content === 'Test TODO 2')).toBe(true);
    });

    it('should capture todos with TDD metadata', async () => {
      planningManager.create({
        content: 'TDD Task',
        type: 'tdd',
        tddStatus: 'red',
        testPath: 'tests/example.test.ts',
      });

      const state = await contextManager.captureContext();

      expect(state.planning?.todos).toHaveLength(1);
      expect(state.planning?.todos[0]?.type).toBe('tdd');
      expect(state.planning?.todos[0]?.tddStatus).toBe('red');
      expect(state.planning?.todos[0]?.testPath).toBe('tests/example.test.ts');
    });
  });

  describe('saveContext', () => {
    it('should save context to database', async () => {
      const sessionId = `session_${randomUUID()}`;

      // Add some data
      memoryManager.save({
        key: 'save-test',
        value: 'save-value',
      });

      const contextId = await contextManager.saveContext(sessionId);

      expect(contextId).toBeDefined();
      expect(typeof contextId).toBe('string');

      // Verify statistics
      const stats = contextManager.getStatistics();
      expect(stats.totalContexts).toBe(1);
      expect(stats.uniqueSessions).toBe(1);
    });

    it('should save context with metadata', async () => {
      const sessionId = `session_${randomUUID()}`;
      const metadata = {
        user: 'test-user',
        project: 'test-project',
        description: 'Test session',
      };

      const contextId = await contextManager.saveContext(sessionId, undefined, metadata);
      expect(contextId).toBeDefined();

      // Retrieve session to verify metadata
      const sessions = contextManager.getAvailableSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.metadata).toEqual(metadata);
    });

    it('should save provided state instead of capturing', async () => {
      const sessionId = `session_${randomUUID()}`;
      const customState = {
        memory: {
          memories: [
            {
              id: '123',
              key: 'custom-key',
              value: 'custom-value',
              createdAt: Date.now(),
              accessCount: 0,
            },
          ],
        },
        planning: {
          todos: [],
        },
      };

      const contextId = await contextManager.saveContext(sessionId, customState);
      expect(contextId).toBeDefined();

      // Restore and verify
      const result = await contextManager.restoreContext(sessionId);
      expect(result.success).toBe(true);
      expect(result.state?.memory?.memories).toHaveLength(1);
      expect(result.state?.memory?.memories[0]?.key).toBe('custom-key');
    });
  });

  describe('restoreContext', () => {
    it('should fail to restore non-existent session', async () => {
      const result = await contextManager.restoreContext('non-existent-session');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No saved context found');
      expect(result.restored).toEqual({ memories: 0, todos: 0, agents: 0, tddRuns: 0 });
    });

    it('should restore memory state', async () => {
      const sessionId = `session_${randomUUID()}`;

      // Save some memories
      memoryManager.save({
        key: 'restore-test-1',
        value: 'restore-value-1',
        metadata: { category: 'test' },
      });

      memoryManager.save({
        key: 'restore-test-2',
        value: 'restore-value-2',
        metadata: { tags: ['important'] },
      });

      // Save context
      await contextManager.saveContext(sessionId);

      // Clear current state
      const allMemories = memoryManager.list({});
      for (const memory of allMemories.memories) {
        memoryManager.forget({ id: memory.id });
      }

      // Verify cleared
      const clearedMemories = memoryManager.list({});
      expect(clearedMemories.memories).toHaveLength(0);

      // Restore
      const result = await contextManager.restoreContext(sessionId);

      expect(result.success).toBe(true);
      expect(result.restored.memories).toBe(2);

      // Verify restored memories
      const restoredMemories = memoryManager.list({});
      expect(restoredMemories.memories).toHaveLength(2);
      expect(restoredMemories.memories.some((m) => m.key === 'restore-test-1')).toBe(true);
      expect(restoredMemories.memories.some((m) => m.key === 'restore-test-2')).toBe(true);
    });

    it('should restore planning state', async () => {
      const sessionId = `session_${randomUUID()}`;

      // Create TODOs
      const rootTodo = planningManager.create({
        content: 'Root TODO',
        status: 'in_progress',
      });

      planningManager.create({
        content: 'Child TODO',
        status: 'pending',
        parentId: rootTodo.todo.id,
      });

      // Save context
      await contextManager.saveContext(sessionId);

      // Clear current state
      const allTodos = planningManager.list();
      for (const todo of allTodos) {
        planningManager.delete(todo.id);
      }

      // Verify cleared
      const clearedTodos = planningManager.list();
      expect(clearedTodos).toHaveLength(0);

      // Restore
      const result = await contextManager.restoreContext(sessionId);

      expect(result.success).toBe(true);
      expect(result.restored.todos).toBe(2);

      // Verify restored TODOs
      const restoredTodos = planningManager.list();
      expect(restoredTodos).toHaveLength(2);
      expect(restoredTodos.some((t) => t.content === 'Root TODO')).toBe(true);
      expect(restoredTodos.some((t) => t.content === 'Child TODO')).toBe(true);
    });

    it('should restore TDD todos with metadata', async () => {
      const sessionId = `session_${randomUUID()}`;

      // Create TDD TODO
      planningManager.create({
        content: 'Implement feature X',
        type: 'tdd',
        tddStatus: 'green',
        testPath: 'tests/feature-x.test.ts',
      });

      // Save and restore
      await contextManager.saveContext(sessionId);
      const allTodos = planningManager.list();
      for (const todo of allTodos) {
        planningManager.delete(todo.id);
      }

      const result = await contextManager.restoreContext(sessionId);

      expect(result.success).toBe(true);
      const restoredTodos = planningManager.list();
      expect(restoredTodos).toHaveLength(1);
      expect(restoredTodos[0]?.type).toBe('tdd');
      expect(restoredTodos[0]?.tddStatus).toBe('green');
      expect(restoredTodos[0]?.testPath).toBe('tests/feature-x.test.ts');
    });
  });

  describe('getAvailableSessions', () => {
    it('should return empty array when no sessions exist', () => {
      const sessions = contextManager.getAvailableSessions();
      expect(sessions).toEqual([]);
    });

    it('should return session summaries', async () => {
      const sessionId1 = `session_${randomUUID()}`;
      const sessionId2 = `session_${randomUUID()}`;

      // Add data for session 1
      memoryManager.save({ key: 'test1', value: 'value1' });
      await contextManager.saveContext(sessionId1);

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Clear and add data for session 2
      const memories = memoryManager.list({});
      for (const memory of memories.memories) {
        memoryManager.forget({ id: memory.id });
      }

      memoryManager.save({ key: 'test2', value: 'value2' });
      memoryManager.save({ key: 'test3', value: 'value3' });
      planningManager.create({ content: 'Todo 1' });
      await contextManager.saveContext(sessionId2);

      // Get sessions
      const sessions = contextManager.getAvailableSessions();

      expect(sessions).toHaveLength(2);
      // Most recent session should be first
      expect(sessions[0]?.sessionId).toBe(sessionId2);
      expect(sessions[0]?.memoriesCount).toBe(2);
      expect(sessions[0]?.todosCount).toBe(1);
      expect(sessions[1]?.sessionId).toBe(sessionId1);
      expect(sessions[1]?.memoriesCount).toBe(1);
    });

    it('should respect limit option', async () => {
      // Create multiple sessions
      for (let i = 0; i < 5; i++) {
        await contextManager.saveContext(`session_${i}`);
      }

      const sessions = contextManager.getAvailableSessions({ limit: 3 });
      expect(sessions).toHaveLength(3);
    });

    it('should filter by since timestamp', async () => {
      const now = Date.now();

      // Create old session
      await contextManager.saveContext('old_session');

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cutoffTime = Date.now();

      // Create new session
      await contextManager.saveContext('new_session');

      const sessions = contextManager.getAvailableSessions({ since: cutoffTime });
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.sessionId).toBe('new_session');
    });
  });

  describe('deleteSession', () => {
    it('should delete session context', async () => {
      const sessionId = `session_${randomUUID()}`;

      // Create and save context
      memoryManager.save({ key: 'test', value: 'value' });
      await contextManager.saveContext(sessionId);

      // Verify exists
      let sessions = contextManager.getAvailableSessions();
      expect(sessions).toHaveLength(1);

      // Delete
      const deleted = contextManager.deleteSession(sessionId);
      expect(deleted).toBe(true);

      // Verify deleted
      sessions = contextManager.getAvailableSessions();
      expect(sessions).toHaveLength(0);
    });

    it('should return false for non-existent session', () => {
      const deleted = contextManager.deleteSession('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      // Initially empty
      let stats = contextManager.getStatistics();
      expect(stats.totalContexts).toBe(0);
      expect(stats.uniqueSessions).toBe(0);

      // Add contexts
      await contextManager.saveContext('session1');
      await contextManager.saveContext('session1'); // Same session
      await contextManager.saveContext('session2');

      stats = contextManager.getStatistics();
      expect(stats.totalContexts).toBe(3);
      expect(stats.uniqueSessions).toBe(2);
    });
  });

  describe('registerHooks', () => {
    it('should return hook functions', () => {
      const hooks = contextManager.registerHooks();

      expect(hooks).toHaveProperty('sessionEnd');
      expect(hooks).toHaveProperty('sessionStart');
      expect(hooks).toHaveProperty('contextFull');

      expect(typeof hooks.sessionEnd).toBe('function');
      expect(typeof hooks.sessionStart).toBe('function');
      expect(typeof hooks.contextFull).toBe('function');
    });

    it('should save context on sessionEnd hook', async () => {
      const hooks = contextManager.registerHooks();

      // Add some data
      memoryManager.save({ key: 'hook-test', value: 'hook-value' });

      // Call hook
      await hooks.sessionEnd();

      // Verify context was saved
      const stats = contextManager.getStatistics();
      expect(stats.totalContexts).toBeGreaterThanOrEqual(1);
    });

    it('should check for sessions on sessionStart hook', async () => {
      const hooks = contextManager.registerHooks();

      // Create a session first
      await contextManager.saveContext('previous_session');

      // Call hook (should log that sessions are available)
      await hooks.sessionStart();

      // Verify sessions exist
      const sessions = contextManager.getAvailableSessions();
      expect(sessions).toHaveLength(1);
    });

    it('should compress and save on contextFull hook', async () => {
      const hooks = contextManager.registerHooks();

      // Add data
      memoryManager.save({ key: 'compress-test', value: 'compress-value' });

      // Call hook
      await hooks.contextFull();

      // Verify context was saved with compression metadata
      const sessions = contextManager.getAvailableSessions();
      expect(sessions.length).toBeGreaterThanOrEqual(1);

      // The most recent session should have the compression description
      const latestSession = sessions[0];
      expect(latestSession?.metadata?.description).toBe('Auto-saved due to context limit');
    });
  });

  describe('integration', () => {
    it('should handle full save and restore cycle', async () => {
      const sessionId = `session_${randomUUID()}`;

      // Create complex state
      const memory1 = memoryManager.save({
        key: 'user-preference',
        value: 'dark-mode',
        metadata: { category: 'preference', tags: ['ui'] },
      });

      const memory2 = memoryManager.save({
        key: 'project-name',
        value: 'awesome-plugin',
        metadata: { category: 'project' },
      });

      const rootTodo = planningManager.create({
        content: 'Implement feature',
        status: 'in_progress',
        tags: ['priority-high'],
      });

      const childTodo1 = planningManager.create({
        content: 'Write tests',
        status: 'completed',
        parentId: rootTodo.todo.id,
        type: 'tdd',
        tddStatus: 'green',
        testPath: 'tests/feature.test.ts',
      });

      const childTodo2 = planningManager.create({
        content: 'Write implementation',
        status: 'in_progress',
        parentId: rootTodo.todo.id,
      });

      // Save context
      const contextId = await contextManager.saveContext(sessionId, undefined, {
        user: 'developer',
        project: 'awesome-plugin',
        description: 'Working on new feature',
      });

      expect(contextId).toBeDefined();

      // Clear all state
      const allMemories = memoryManager.list({});
      for (const memory of allMemories.memories) {
        memoryManager.forget({ id: memory.id });
      }

      const allTodos = planningManager.list();
      for (const todo of allTodos) {
        planningManager.delete(todo.id);
      }

      // Verify cleared
      expect(memoryManager.list({}).memories).toHaveLength(0);
      expect(planningManager.list()).toHaveLength(0);

      // Restore context
      const result = await contextManager.restoreContext(sessionId);

      expect(result.success).toBe(true);
      expect(result.restored.memories).toBe(2);
      expect(result.restored.todos).toBe(3);

      // Verify restored state
      const restoredMemories = memoryManager.list({});
      expect(restoredMemories.memories).toHaveLength(2);
      expect(restoredMemories.memories.some((m) => m.key === 'user-preference')).toBe(true);
      expect(restoredMemories.memories.some((m) => m.key === 'project-name')).toBe(true);

      const restoredTodos = planningManager.list();
      expect(restoredTodos).toHaveLength(3);

      // Verify hierarchy is preserved (root should exist)
      const rootTodos = restoredTodos.filter((t) => !t.parentId);
      expect(rootTodos).toHaveLength(1);
      expect(rootTodos[0]?.content).toBe('Implement feature');

      // Verify TDD metadata is preserved
      const tddTodo = restoredTodos.find((t) => t.type === 'tdd');
      expect(tddTodo).toBeDefined();
      expect(tddTodo?.tddStatus).toBe('green');
      expect(tddTodo?.testPath).toBe('tests/feature.test.ts');
    });
  });
});
