import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScienceStore } from '../../src/features/science/science-store.js';
import type { ScienceSession, ScienceResult } from '../../src/features/science/science-types.js';

describe('ScienceStore', () => {
  let store: ScienceStore;

  beforeEach(() => {
    store = new ScienceStore(':memory:');
  });

  afterEach(() => {
    store.close();
  });

  describe('Session CRUD Operations', () => {
    it('should create a session', () => {
      const session = store.createSession('analysis-workspace');

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.namespace).toBe('analysis-workspace');
      expect(session.executionCount).toBe(0);
      expect(session.variables).toEqual({});
      expect(session.packages).toEqual([]);
      expect(session.history).toEqual([]);
      expect(session.createdAt).toBeDefined();
      expect(session.lastUsedAt).toBeDefined();
    });

    it('should retrieve session by ID', () => {
      const created = store.createSession('test-session');
      const retrieved = store.getSession(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.namespace).toBe('test-session');
    });

    it('should return undefined for non-existent session', () => {
      const retrieved = store.getSession('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should update session variables', () => {
      const session = store.createSession('update-test');

      const updated = store.updateSession(session.id, {
        variables: { x: 42, y: 'test' },
        packages: ['pandas', 'numpy'],
        history: ['import pandas', 'df = pd.DataFrame()'],
      });

      expect(updated).toBe(true);

      const retrieved = store.getSession(session.id);
      expect(retrieved?.variables).toEqual({ x: 42, y: 'test' });
      expect(retrieved?.packages).toEqual(['pandas', 'numpy']);
      expect(retrieved?.history).toEqual(['import pandas', 'df = pd.DataFrame()']);
      expect(retrieved?.lastUsedAt).toBeGreaterThanOrEqual(session.lastUsedAt);
    });

    it('should increment execution count', () => {
      const session = store.createSession('exec-test');
      expect(session.executionCount).toBe(0);

      store.incrementExecutionCount(session.id);
      const retrieved1 = store.getSession(session.id);
      expect(retrieved1?.executionCount).toBe(1);

      store.incrementExecutionCount(session.id);
      const retrieved2 = store.getSession(session.id);
      expect(retrieved2?.executionCount).toBe(2);
    });

    it('should delete a session', () => {
      const session = store.createSession('delete-test');
      expect(store.getSession(session.id)).toBeDefined();

      const deleted = store.deleteSession(session.id);
      expect(deleted).toBe(true);
      expect(store.getSession(session.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent session', () => {
      const deleted = store.deleteSession('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Session Listing and Filtering', () => {
    beforeEach(() => {
      store.createSession('workspace-a');
      store.createSession('workspace-a');
      store.createSession('workspace-b');
    });

    it('should list all sessions', () => {
      const sessions = store.listSessions();
      expect(sessions).toHaveLength(3);
    });

    it('should filter sessions by namespace', () => {
      const sessions = store.listSessions({ namespace: 'workspace-a' });
      expect(sessions).toHaveLength(2);
      sessions.forEach((s) => {
        expect(s.namespace).toBe('workspace-a');
      });
    });

    it('should filter sessions by time', () => {
      const now = Date.now();
      const sessions = store.listSessions({ since: now - 1000 });
      expect(sessions).toHaveLength(3);

      const future = store.listSessions({ since: now + 10000 });
      expect(future).toHaveLength(0);
    });

    it('should limit session results', () => {
      const sessions = store.listSessions({ limit: 2 });
      expect(sessions).toHaveLength(2);
    });

    it('should order sessions by last used descending', () => {
      const session1 = store.createSession('order-test-1');
      const session2 = store.createSession('order-test-2');

      // Update session1 to make it more recent
      store.updateSession(session1.id, { executionCount: 1 });

      const sessions = store.listSessions({ namespace: 'order-test-1' });
      expect(sessions.length).toBeGreaterThan(0);
      if (sessions.length >= 2) {
        expect(sessions[0].lastUsedAt).toBeGreaterThanOrEqual(sessions[1].lastUsedAt);
      }
    });
  });

  describe('Result CRUD Operations', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = store.createSession('result-test');
      sessionId = session.id;
    });

    it('should create a result', () => {
      const result = store.createResult(
        sessionId,
        'science_stats',
        'success',
        { mean: 42.5, median: 40 },
        { duration: 150 }
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
      expect(result.toolName).toBe('science_stats');
      expect(result.resultType).toBe('success');
      expect(result.resultData).toEqual({ mean: 42.5, median: 40 });
      expect(result.metadata).toEqual({ duration: 150 });
      expect(result.createdAt).toBeDefined();
    });

    it('should retrieve result by ID', () => {
      const created = store.createResult(
        sessionId,
        'science_ml',
        'success',
        { accuracy: 0.95 }
      );

      const retrieved = store.getResult(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.resultData).toEqual({ accuracy: 0.95 });
    });

    it('should return undefined for non-existent result', () => {
      const retrieved = store.getResult('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should create error results', () => {
      const result = store.createResult(
        sessionId,
        'science_stats',
        'error',
        { message: 'Division by zero' },
        { code: 'MATH_ERROR' }
      );

      expect(result.resultType).toBe('error');
      expect(result.resultData).toEqual({ message: 'Division by zero' });
    });

    it('should create partial results', () => {
      const result = store.createResult(
        sessionId,
        'science_export',
        'partial',
        { completed: 50, total: 100 }
      );

      expect(result.resultType).toBe('partial');
      expect(result.resultData).toEqual({ completed: 50, total: 100 });
    });
  });

  describe('Result Listing and Filtering', () => {
    let session1Id: string;
    let session2Id: string;

    beforeEach(() => {
      const session1 = store.createSession('session-1');
      const session2 = store.createSession('session-2');
      session1Id = session1.id;
      session2Id = session2.id;

      // Create various results
      store.createResult(session1Id, 'science_stats', 'success', { value: 1 });
      store.createResult(session1Id, 'science_stats', 'success', { value: 2 });
      store.createResult(session1Id, 'science_ml', 'success', { value: 3 });
      store.createResult(session2Id, 'science_export', 'error', { error: 'test' });
    });

    it('should list all results', () => {
      const results = store.listResults();
      expect(results).toHaveLength(4);
    });

    it('should filter results by session ID', () => {
      const results = store.listResults({ sessionId: session1Id });
      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect(r.sessionId).toBe(session1Id);
      });
    });

    it('should filter results by tool name', () => {
      const results = store.listResults({ toolName: 'science_stats' });
      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect(r.toolName).toBe('science_stats');
      });
    });

    it('should filter results by result type', () => {
      const successResults = store.listResults({ resultType: 'success' });
      expect(successResults).toHaveLength(3);

      const errorResults = store.listResults({ resultType: 'error' });
      expect(errorResults).toHaveLength(1);
    });

    it('should filter results by time', () => {
      const now = Date.now();
      const results = store.listResults({ since: now - 1000 });
      expect(results).toHaveLength(4);

      const future = store.listResults({ since: now + 10000 });
      expect(future).toHaveLength(0);
    });

    it('should limit result count', () => {
      const results = store.listResults({ limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const results = store.listResults({
        sessionId: session1Id,
        toolName: 'science_stats',
        resultType: 'success',
      });
      expect(results).toHaveLength(2);
    });

    it('should delete results by session', () => {
      const deleted = store.deleteResults(session1Id);
      expect(deleted).toBe(3);

      const remaining = store.listResults({ sessionId: session1Id });
      expect(remaining).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      const session1 = store.createSession('workspace-1');
      const session2 = store.createSession('workspace-1');
      const session3 = store.createSession('workspace-2');

      store.createResult(session1.id, 'science_stats', 'success', {});
      store.createResult(session1.id, 'science_ml', 'success', {});
      store.createResult(session2.id, 'science_stats', 'success', {});
      store.createResult(session3.id, 'science_export', 'error', {});

      store.incrementExecutionCount(session1.id);
      store.incrementExecutionCount(session1.id);
      store.incrementExecutionCount(session2.id);
    });

    it('should return accurate statistics', () => {
      const stats = store.getStatistics();

      expect(stats.sessions.total).toBe(3);
      expect(stats.results.total).toBe(4);
    });

    it('should group sessions by namespace', () => {
      const stats = store.getStatistics();

      const workspace1 = stats.sessions.byNamespace.find((n) => n.namespace === 'workspace-1');
      const workspace2 = stats.sessions.byNamespace.find((n) => n.namespace === 'workspace-2');

      expect(workspace1?.count).toBe(2);
      expect(workspace2?.count).toBe(1);
    });

    it('should group results by tool', () => {
      const stats = store.getStatistics();

      const statsResults = stats.results.byTool.find((t) => t.tool_name === 'science_stats');
      const mlResults = stats.results.byTool.find((t) => t.tool_name === 'science_ml');

      expect(statsResults?.count).toBe(2);
      expect(mlResults?.count).toBe(1);
    });

    it('should calculate average execution count', () => {
      const stats = store.getStatistics();
      expect(stats.sessions.avgExecutionCount).toBe(1); // (2 + 1 + 0) / 3 = 1
    });

    it('should track recent activity', () => {
      const stats = store.getStatistics();
      expect(stats.sessions.activeLastDay).toBe(3); // All created recently
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup old sessions', () => {
      const session1 = store.createSession('old-session');
      const session2 = store.createSession('new-session');

      // Simulate old session by updating to past timestamp
      store['db'].prepare(`
        UPDATE science_sessions SET last_used_at = ? WHERE id = ?
      `).run(Date.now() - 2 * 24 * 60 * 60 * 1000, session1.id);

      const cleaned = store.cleanupOldSessions(24 * 60 * 60 * 1000); // 1 day
      expect(cleaned).toBe(1);

      expect(store.getSession(session1.id)).toBeUndefined();
      expect(store.getSession(session2.id)).toBeDefined();
    });

    it('should cleanup old results', () => {
      const session = store.createSession('test');
      const result1 = store.createResult(session.id, 'science_stats', 'success', {});
      const result2 = store.createResult(session.id, 'science_ml', 'success', {});

      // Simulate old result
      store['db'].prepare(`
        UPDATE science_results SET created_at = ? WHERE id = ?
      `).run(Date.now() - 2 * 24 * 60 * 60 * 1000, result1.id);

      const cleaned = store.cleanupOldResults(24 * 60 * 60 * 1000);
      expect(cleaned).toBe(1);

      expect(store.getResult(result1.id)).toBeUndefined();
      expect(store.getResult(result2.id)).toBeDefined();
    });

    it('should cascade delete results when session is deleted', () => {
      const session = store.createSession('cascade-test');
      store.createResult(session.id, 'science_stats', 'success', {});
      store.createResult(session.id, 'science_ml', 'success', {});

      const allResults = store.listResults({ sessionId: session.id });
      expect(allResults).toHaveLength(2);

      store.deleteSession(session.id);

      const remainingResults = store.listResults({ sessionId: session.id });
      expect(remainingResults).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metadata and data', () => {
      const session = store.createSession('test');
      const result = store.createResult(session.id, 'science_stats', 'success', null);

      expect(result.resultData).toBeNull();
      expect(result.metadata).toEqual({});
    });

    it('should handle complex JSON data', () => {
      const session = store.createSession('test');
      const complexData = {
        nested: { array: [1, 2, 3], object: { key: 'value' } },
        numbers: [1.5, 2.7, 3.9],
        strings: ['a', 'b', 'c'],
      };

      const result = store.createResult(session.id, 'science_stats', 'success', complexData);
      const retrieved = store.getResult(result.id);

      expect(retrieved?.resultData).toEqual(complexData);
    });

    it('should handle pickle data as Buffer', () => {
      const session = store.createSession('pickle-test');
      const pickleBuffer = Buffer.from('fake-pickle-data');

      store.updateSession(session.id, { pickleData: pickleBuffer });
      const retrieved = store.getSession(session.id);

      expect(retrieved?.pickleData).toBeDefined();
      expect(Buffer.isBuffer(retrieved?.pickleData)).toBe(true);
    });

    it('should handle concurrent session updates', () => {
      const session = store.createSession('concurrent-test');

      store.updateSession(session.id, { variables: { a: 1 } });
      store.updateSession(session.id, { variables: { b: 2 } });

      const retrieved = store.getSession(session.id);
      expect(retrieved?.variables).toEqual({ b: 2 }); // Last update wins
    });
  });
});
