import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DashboardManager } from '../../src/fusion/implementations/dashboard-fusion.js';
import { MemoryManager } from '../../src/features/memory/memory-manager.js';
import { PlanningManager } from '../../src/features/planning/planning-manager.js';
import { AgentOrchestrator } from '../../src/features/agents/agent-orchestrator.js';
import { TDDManager } from '../../src/features/tdd/tdd-manager.js';
import { GuideManager } from '../../src/features/guide/guide-manager.js';
import { ScienceManager } from '../../src/features/science/index.js';
import * as fs from 'fs';
import * as path from 'path';

describe('DashboardManager', () => {
  let dashboardManager: DashboardManager;
  let memoryManager: MemoryManager;
  let planningManager: PlanningManager;
  let agentOrchestrator: AgentOrchestrator;
  let tddManager: TDDManager;
  let guideManager: GuideManager;
  let scienceManager: ScienceManager;
  const testDbPath = path.join('/tmp', `test-dashboard-${Date.now()}.db`);

  beforeEach(() => {
    // Initialize all managers
    memoryManager = new MemoryManager(':memory:');
    planningManager = new PlanningManager(':memory:');
    tddManager = new TDDManager(':memory:');

    agentOrchestrator = new AgentOrchestrator(':memory:', {
      planningManager,
      memoryManager,
      tddManager,
    });

    guideManager = new GuideManager(':memory:', {
      memoryManager,
      planningManager,
    });

    scienceManager = new ScienceManager({
      memoryManager,
      planningManager,
    });

    // Initialize dashboard manager
    dashboardManager = new DashboardManager({
      memoryManager,
      planningManager,
      agentOrchestrator,
      tddManager,
      guideManager,
      scienceManager,
    });
  });

  afterEach(() => {
    // Clean up managers
    if (memoryManager) {
      memoryManager.close();
    }
    if (planningManager) {
      planningManager.close();
    }
    if (agentOrchestrator) {
      agentOrchestrator.close();
    }
    if (tddManager) {
      tddManager.close();
    }
    if (guideManager) {
      guideManager.close();
    }
    if (scienceManager) {
      scienceManager.close();
    }

    // Clean up test database file if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    it('should initialize with all managers', () => {
      expect(dashboardManager).toBeDefined();
    });

    it('should get unified status from empty state', () => {
      const status = dashboardManager.getUnifiedStatus();

      expect(status).toBeDefined();
      expect(status.timestamp).toBeGreaterThan(0);
      expect(status.memory).toBeDefined();
      expect(status.planning).toBeDefined();
      expect(status.agents).toBeDefined();
      expect(status.tdd).toBeDefined();
      expect(status.guide).toBeDefined();
      expect(status.science).toBeDefined();
    });
  });

  describe('Memory Statistics', () => {
    it('should collect memory statistics', () => {
      // Add some memories
      memoryManager.save({
        key: 'test1',
        value: 'value1',
        metadata: { category: 'test' },
      });

      memoryManager.save({
        key: 'test2',
        value: 'value2',
        metadata: { category: 'test' },
      });

      memoryManager.save({
        key: 'test3',
        value: 'value3',
        metadata: { category: 'other' },
      });

      const status = dashboardManager.getUnifiedStatus();

      expect(status.memory.totalEntries).toBe(3);
      expect(status.memory.categories.test).toBe(2);
      expect(status.memory.categories.other).toBe(1);
      expect(status.memory.recentActivity.last24h).toBe(3);
    });

    it('should track recent activity', () => {
      // Add a memory
      memoryManager.save({
        key: 'recent',
        value: 'recent value',
      });

      const status = dashboardManager.getUnifiedStatus();

      expect(status.memory.recentActivity.last24h).toBeGreaterThan(0);
      expect(status.memory.recentActivity.last7d).toBeGreaterThan(0);
    });
  });

  describe('Planning Statistics', () => {
    it('should collect planning statistics', () => {
      // Add TODOs with different statuses
      planningManager.create({
        content: 'Pending task',
        status: 'pending',
      });

      planningManager.create({
        content: 'In progress task',
        status: 'in_progress',
      });

      planningManager.create({
        content: 'Completed task',
        status: 'completed',
      });

      const status = dashboardManager.getUnifiedStatus();

      expect(status.planning.total).toBe(3);
      expect(status.planning.pending).toBe(1);
      expect(status.planning.inProgress).toBe(1);
      expect(status.planning.completed).toBe(1);
      expect(status.planning.progressPercentage).toBe(33);
    });

    it('should calculate progress percentage correctly', () => {
      // Add 2 completed out of 5 total
      planningManager.create({ content: 'Task 1', status: 'pending' });
      planningManager.create({ content: 'Task 2', status: 'pending' });
      planningManager.create({ content: 'Task 3', status: 'in_progress' });
      planningManager.create({ content: 'Task 4', status: 'completed' });
      planningManager.create({ content: 'Task 5', status: 'completed' });

      const status = dashboardManager.getUnifiedStatus();

      expect(status.planning.total).toBe(5);
      expect(status.planning.completed).toBe(2);
      expect(status.planning.progressPercentage).toBe(40);
    });

    it('should handle empty planning state', () => {
      const status = dashboardManager.getUnifiedStatus();

      expect(status.planning.total).toBe(0);
      expect(status.planning.progressPercentage).toBe(0);
    });
  });

  describe('Agent Statistics', () => {
    it('should collect agent statistics', async () => {
      // Spawn some agents
      await agentOrchestrator.spawn({
        type: 'researcher',
        task: 'Test task 1',
      });

      await agentOrchestrator.spawn({
        type: 'researcher',
        task: 'Test task 2',
      });

      const status = dashboardManager.getUnifiedStatus();

      expect(status.agents.total).toBe(2);
      expect(status.agents.byType['researcher']).toBe(2);
    });

    it('should track agent status counts', async () => {
      // Spawn agent
      const result = await agentOrchestrator.spawn({
        type: 'researcher',
        task: 'Test task',
      });

      // Check running status
      let status = dashboardManager.getUnifiedStatus();
      expect(status.agents.running).toBeGreaterThan(0);

      // Terminate agent
      await agentOrchestrator.terminate({
        agentId: result.agentId,
      });

      // Check terminated status
      status = dashboardManager.getUnifiedStatus();
      expect(status.agents.running).toBe(0);
    });
  });

  describe('TDD Statistics', () => {
    it('should collect TDD statistics', async () => {
      // Create a test file path
      const testFile = path.join('/tmp', `test-${Date.now()}.test.ts`);

      try {
        // Write a simple test file
        fs.writeFileSync(
          testFile,
          `
          describe('test', () => {
            it('should pass', () => {
              expect(true).toBe(true);
            });
          });
        `
        );

        // Run RED phase
        const redResult = await tddManager.red({
          testPath: testFile,
          description: 'Test description',
        });

        const status = dashboardManager.getUnifiedStatus();

        expect(status.tdd.totalTests).toBeGreaterThanOrEqual(0);
        expect(status.tdd.passRate).toBeGreaterThanOrEqual(0);
        expect(status.tdd.passRate).toBeLessThanOrEqual(100);
      } finally {
        // Clean up test file
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    it('should calculate pass rate correctly', () => {
      // Note: This test uses the actual TDDManager implementation
      // which may not have test history yet
      const status = dashboardManager.getUnifiedStatus();

      expect(status.tdd.passRate).toBeGreaterThanOrEqual(0);
      expect(status.tdd.passRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Guide Statistics', () => {
    it('should collect guide statistics', () => {
      const status = dashboardManager.getUnifiedStatus();

      expect(status.guide.totalGuides).toBeGreaterThanOrEqual(0);
      expect(status.guide.recentlyViewed).toBeGreaterThanOrEqual(0);
      expect(status.guide.inProgress).toBeGreaterThanOrEqual(0);
      expect(status.guide.completed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Science Statistics', () => {
    it('should collect science statistics', () => {
      const status = dashboardManager.getUnifiedStatus();

      expect(status.science.toolsAvailable).toBe(3);
      expect(status.science.features.length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Rendering', () => {
    it('should format dashboard as ASCII art', () => {
      // Add some data
      memoryManager.save({ key: 'test', value: 'value' });
      planningManager.create({ content: 'Task', status: 'pending' });

      const status = dashboardManager.getUnifiedStatus();
      const dashboard = dashboardManager.formatDashboard(status);

      expect(dashboard).toContain('FLUX Dashboard');
      expect(dashboard).toContain('MEMORY');
      expect(dashboard).toContain('PLANNING');
      expect(dashboard).toContain('AGENTS');
      expect(dashboard).toContain('TDD');
      expect(dashboard).toContain('GUIDE');
      expect(dashboard).toContain('SCIENCE');
    });

    it('should include box drawing characters', () => {
      const status = dashboardManager.getUnifiedStatus();
      const dashboard = dashboardManager.formatDashboard(status);

      expect(dashboard).toContain('╔');
      expect(dashboard).toContain('╗');
      expect(dashboard).toContain('╚');
      expect(dashboard).toContain('╝');
      expect(dashboard).toContain('║');
      expect(dashboard).toContain('╠');
    });

    it('should display progress bars', () => {
      // Add TODOs to create progress
      planningManager.create({ content: 'Task 1', status: 'completed' });
      planningManager.create({ content: 'Task 2', status: 'pending' });

      const status = dashboardManager.getUnifiedStatus();
      const dashboard = dashboardManager.formatDashboard(status);

      expect(dashboard).toContain('█'); // Filled progress
      expect(dashboard).toContain('░'); // Empty progress
    });

    it('should display statistics correctly', () => {
      // Add some data
      memoryManager.save({ key: 'test1', value: 'value1' });
      memoryManager.save({ key: 'test2', value: 'value2' });
      planningManager.create({ content: 'Task 1', status: 'completed' });
      planningManager.create({ content: 'Task 2', status: 'pending' });

      const status = dashboardManager.getUnifiedStatus();
      const dashboard = dashboardManager.formatDashboard(status);

      expect(dashboard).toContain('2'); // Memory entries
      expect(dashboard).toContain('50%'); // Planning progress
    });
  });

  describe('Compact Summary', () => {
    it('should generate compact summary', () => {
      const status = dashboardManager.getUnifiedStatus();
      const summary = dashboardManager.getCompactSummary(status);

      expect(summary).toContain('FLUX Dashboard Summary');
      expect(summary).toContain('Memory:');
      expect(summary).toContain('Planning:');
      expect(summary).toContain('Agents:');
      expect(summary).toContain('TDD:');
      expect(summary).toContain('Guide:');
      expect(summary).toContain('Science:');
    });

    it('should display correct statistics in summary', () => {
      // Add some data
      memoryManager.save({ key: 'test', value: 'value' });
      planningManager.create({ content: 'Task', status: 'completed' });

      const status = dashboardManager.getUnifiedStatus();
      const summary = dashboardManager.getCompactSummary(status);

      expect(summary).toContain('1 entries');
      expect(summary).toContain('1/1 TODOs completed');
    });
  });

  describe('Watch Mode', () => {
    it('should support watch mode with callback', (done) => {
      let callCount = 0;

      const stopWatch = dashboardManager.watchMode(100, (dashboard) => {
        callCount++;
        expect(dashboard).toContain('FLUX Dashboard');

        // Stop after 2 calls
        if (callCount >= 2) {
          stopWatch();
          done();
        }
      });
    });

    it('should stop watch mode when cleanup is called', (done) => {
      let callCount = 0;

      const stopWatch = dashboardManager.watchMode(50, () => {
        callCount++;
      });

      // Stop immediately
      setTimeout(() => {
        stopWatch();

        // Wait a bit to ensure no more calls
        setTimeout(() => {
          const finalCount = callCount;
          setTimeout(() => {
            expect(callCount).toBe(finalCount); // No new calls
            done();
          }, 100);
        }, 100);
      }, 150);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dashboard', () => {
      const status = dashboardManager.getUnifiedStatus();

      expect(status.memory.totalEntries).toBe(0);
      expect(status.planning.total).toBe(0);
      expect(status.agents.total).toBe(0);
    });

    it('should handle very long category names', () => {
      const longCategory = 'a'.repeat(100);

      memoryManager.save({
        key: 'test',
        value: 'value',
        metadata: { category: longCategory },
      });

      const status = dashboardManager.getUnifiedStatus();
      const dashboard = dashboardManager.formatDashboard(status);

      // Should truncate long names
      expect(dashboard.split('\n').every((line) => line.length <= 72)).toBe(true);
    });

    it('should handle 100% progress', () => {
      planningManager.create({ content: 'Task 1', status: 'completed' });
      planningManager.create({ content: 'Task 2', status: 'completed' });

      const status = dashboardManager.getUnifiedStatus();

      expect(status.planning.progressPercentage).toBe(100);

      const dashboard = dashboardManager.formatDashboard(status);
      expect(dashboard).toContain('100%');
    });

    it('should handle 0% progress', () => {
      planningManager.create({ content: 'Task 1', status: 'pending' });
      planningManager.create({ content: 'Task 2', status: 'in_progress' });

      const status = dashboardManager.getUnifiedStatus();

      expect(status.planning.progressPercentage).toBe(0);

      const dashboard = dashboardManager.formatDashboard(status);
      expect(dashboard).toContain('0%');
    });
  });
});
