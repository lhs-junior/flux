/**
 * Dashboard Fusion - Unified Status View
 *
 * Provides a comprehensive view of all feature states:
 * - Memory: entries count, recent activity
 * - Planning: TODO progress (pending/in_progress/completed)
 * - Agents: running/completed agent counts
 * - TDD: test pass rate
 * - Science: running job count
 * - Guide: recent access history
 *
 * Token-efficient: One call to see everything!
 */

import type { MemoryManager } from '../../features/memory/memory-manager.js';
import type { PlanningManager } from '../../features/planning/planning-manager.js';
import type { AgentOrchestrator } from '../../features/agents/agent-orchestrator.js';
import type { TDDManager } from '../../features/tdd/tdd-manager.js';
import type { GuideManager } from '../../features/guide/guide-manager.js';
import type { ScienceManager } from '../../features/science/index.js';

/**
 * Memory statistics
 */
export interface MemoryStats {
  totalEntries: number;
  categories: Record<string, number>;
  recentActivity: {
    last24h: number;
    last7d: number;
  };
}

/**
 * Planning statistics
 */
export interface PlanningStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  progressPercentage: number;
}

/**
 * Agent statistics
 */
export interface AgentStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  byType: Record<string, number>;
}

/**
 * TDD statistics
 */
export interface TDDStats {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  recentRuns: number;
}

/**
 * Guide statistics
 */
export interface GuideStats {
  totalGuides: number;
  recentlyViewed: number;
  inProgress: number;
  completed: number;
}

/**
 * Science statistics
 */
export interface ScienceStats {
  toolsAvailable: number;
  features: string[];
}

/**
 * Unified dashboard status
 */
export interface DashboardStatus {
  timestamp: number;
  memory: MemoryStats;
  planning: PlanningStats;
  agents: AgentStats;
  tdd: TDDStats;
  guide: GuideStats;
  science: ScienceStats;
}

/**
 * Dashboard Manager - Unified Status View
 */
export class DashboardManager {
  private memoryManager: MemoryManager;
  private planningManager: PlanningManager;
  private agentOrchestrator: AgentOrchestrator;
  private tddManager: TDDManager;
  private guideManager: GuideManager;
  private scienceManager: ScienceManager;

  constructor(managers: {
    memoryManager: MemoryManager;
    planningManager: PlanningManager;
    agentOrchestrator: AgentOrchestrator;
    tddManager: TDDManager;
    guideManager: GuideManager;
    scienceManager: ScienceManager;
  }) {
    this.memoryManager = managers.memoryManager;
    this.planningManager = managers.planningManager;
    this.agentOrchestrator = managers.agentOrchestrator;
    this.tddManager = managers.tddManager;
    this.guideManager = managers.guideManager;
    this.scienceManager = managers.scienceManager;
  }

  /**
   * Collect statistics from Memory feature
   */
  private collectMemoryStats(): MemoryStats {
    const result = this.memoryManager.list({});
    const memories = result.memories;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const categories: Record<string, number> = {};
    let last24h = 0;
    let last7d = 0;

    for (const memory of memories) {
      // Count by category
      const category = memory.metadata.category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;

      // Count recent activity
      const age = now - memory.createdAt;
      if (age < day) last24h++;
      if (age < 7 * day) last7d++;
    }

    return {
      totalEntries: memories.length,
      categories,
      recentActivity: {
        last24h,
        last7d,
      },
    };
  }

  /**
   * Collect statistics from Planning feature
   */
  private collectPlanningStats(): PlanningStats {
    const todos = this.planningManager.list();

    const pending = todos.filter((t) => t.status === 'pending').length;
    const inProgress = todos.filter((t) => t.status === 'in_progress').length;
    const completed = todos.filter((t) => t.status === 'completed').length;
    const total = todos.length;

    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      progressPercentage,
    };
  }

  /**
   * Collect statistics from Agent feature
   */
  private collectAgentStats(): AgentStats {
    const result = this.agentOrchestrator.list({});
    const agents = result.agents;

    const byType: Record<string, number> = {};
    let running = 0;
    let completed = 0;
    let failed = 0;

    for (const agent of agents) {
      // Count by type
      byType[agent.type] = (byType[agent.type] || 0) + 1;

      // Count by status
      switch (agent.status) {
        case 'running':
          running++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      total: agents.length,
      running,
      completed,
      failed,
      byType,
    };
  }

  /**
   * Collect statistics from TDD feature
   */
  private collectTDDStats(): TDDStats {
    const stats = this.tddManager.getStatistics();
    const storeStats = stats.store;

    const totalTests = storeStats.totalRuns;
    const passed = storeStats.byStatus.green || 0;
    const failed = (storeStats.byStatus.red || 0) + (storeStats.byStatus.refactored || 0);
    const passRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;

    return {
      totalTests,
      passed,
      failed,
      passRate,
      recentRuns: totalTests,
    };
  }

  /**
   * Collect statistics from Guide feature
   */
  private collectGuideStats(): GuideStats {
    // Get all guides
    const allGuides = this.guideManager.search({ query: '', limit: 1000 });

    let recentlyViewed = 0;
    let inProgress = 0;
    let completed = 0;

    for (const result of allGuides.results) {
      if (result.progress) {
        if (result.progress.completedSteps.length === result.progress.totalSteps) {
          completed++;
        } else if (result.progress.currentStep > 0) {
          inProgress++;
        }

        // Count as recently viewed if accessed in last 7 days
        const lastAccessed = result.progress.lastAccessedAt;
        const now = Date.now();
        if (now - lastAccessed < 7 * 24 * 60 * 60 * 1000) {
          recentlyViewed++;
        }
      }
    }

    return {
      totalGuides: allGuides.results.length,
      recentlyViewed,
      inProgress,
      completed,
    };
  }

  /**
   * Collect statistics from Science feature
   */
  private collectScienceStats(): ScienceStats {
    const stats = this.scienceManager.getStatistics();

    const features: string[] = [
      ...stats.features.statistics,
      ...stats.features.machine_learning,
      ...stats.features.export_formats,
    ];

    return {
      toolsAvailable: stats.toolsAvailable,
      features,
    };
  }

  /**
   * Get unified status from all features
   */
  getUnifiedStatus(): DashboardStatus {
    return {
      timestamp: Date.now(),
      memory: this.collectMemoryStats(),
      planning: this.collectPlanningStats(),
      agents: this.collectAgentStats(),
      tdd: this.collectTDDStats(),
      guide: this.collectGuideStats(),
      science: this.collectScienceStats(),
    };
  }

  /**
   * Format dashboard as ASCII art
   */
  formatDashboard(status: DashboardStatus): string {
    const lines: string[] = [];

    // Header
    lines.push('╔════════════════════════════════════════════════════════════════════╗');
    lines.push('║  FLUX Dashboard - Unified Status View                             ║');
    lines.push('╠════════════════════════════════════════════════════════════════════╣');

    // Memory
    lines.push('║                                                                    ║');
    lines.push('║  MEMORY                                                            ║');
    lines.push(`║    Total Entries:     ${this.pad(status.memory.totalEntries.toString(), 45)}║`);
    lines.push(`║    Recent (24h):      ${this.pad(status.memory.recentActivity.last24h.toString(), 45)}║`);
    lines.push(`║    Recent (7d):       ${this.pad(status.memory.recentActivity.last7d.toString(), 45)}║`);

    // Top categories
    const topCategories = Object.entries(status.memory.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    if (topCategories.length > 0) {
      lines.push('║    Top Categories:                                                 ║');
      for (const [category, count] of topCategories) {
        lines.push(`║      - ${this.pad(`${category}: ${count}`, 61)}║`);
      }
    }

    // Planning
    lines.push('║                                                                    ║');
    lines.push('║  PLANNING                                                          ║');
    lines.push(`║    Total TODOs:       ${this.pad(status.planning.total.toString(), 45)}║`);
    lines.push(`║    Pending:           ${this.pad(status.planning.pending.toString(), 45)}║`);
    lines.push(`║    In Progress:       ${this.pad(status.planning.inProgress.toString(), 45)}║`);
    lines.push(`║    Completed:         ${this.pad(status.planning.completed.toString(), 45)}║`);
    lines.push(`║    Progress:          ${this.pad(`${status.planning.progressPercentage}%`, 45)}║`);

    // Progress bar
    const progressBar = this.createProgressBar(status.planning.progressPercentage);
    lines.push(`║    ${this.pad(progressBar, 63)}║`);

    // Agents
    lines.push('║                                                                    ║');
    lines.push('║  AGENTS                                                            ║');
    lines.push(`║    Total Agents:      ${this.pad(status.agents.total.toString(), 45)}║`);
    lines.push(`║    Running:           ${this.pad(status.agents.running.toString(), 45)}║`);
    lines.push(`║    Completed:         ${this.pad(status.agents.completed.toString(), 45)}║`);
    lines.push(`║    Failed:            ${this.pad(status.agents.failed.toString(), 45)}║`);

    // Agent types
    if (Object.keys(status.agents.byType).length > 0) {
      lines.push('║    By Type:                                                        ║');
      for (const [type, count] of Object.entries(status.agents.byType)) {
        lines.push(`║      - ${this.pad(`${type}: ${count}`, 61)}║`);
      }
    }

    // TDD
    lines.push('║                                                                    ║');
    lines.push('║  TDD                                                               ║');
    lines.push(`║    Total Tests:       ${this.pad(status.tdd.totalTests.toString(), 45)}║`);
    lines.push(`║    Passed:            ${this.pad(status.tdd.passed.toString(), 45)}║`);
    lines.push(`║    Failed:            ${this.pad(status.tdd.failed.toString(), 45)}║`);
    lines.push(`║    Pass Rate:         ${this.pad(`${status.tdd.passRate}%`, 45)}║`);

    // Test pass bar
    const testBar = this.createProgressBar(status.tdd.passRate);
    lines.push(`║    ${this.pad(testBar, 63)}║`);

    // Guide
    lines.push('║                                                                    ║');
    lines.push('║  GUIDE                                                             ║');
    lines.push(`║    Total Guides:      ${this.pad(status.guide.totalGuides.toString(), 45)}║`);
    lines.push(`║    Recently Viewed:   ${this.pad(status.guide.recentlyViewed.toString(), 45)}║`);
    lines.push(`║    In Progress:       ${this.pad(status.guide.inProgress.toString(), 45)}║`);
    lines.push(`║    Completed:         ${this.pad(status.guide.completed.toString(), 45)}║`);

    // Science
    lines.push('║                                                                    ║');
    lines.push('║  SCIENCE                                                           ║');
    lines.push(`║    Tools Available:   ${this.pad(status.science.toolsAvailable.toString(), 45)}║`);
    lines.push(`║    Features:          ${this.pad(status.science.features.length.toString(), 45)}║`);

    // Footer
    lines.push('║                                                                    ║');
    lines.push('╚════════════════════════════════════════════════════════════════════╝');

    return lines.join('\n');
  }

  /**
   * Pad string to specified width
   */
  private pad(str: string, width: number): string {
    if (str.length >= width) {
      return str.substring(0, width);
    }
    return str + ' '.repeat(width - str.length);
  }

  /**
   * Create ASCII progress bar
   */
  private createProgressBar(percentage: number): string {
    const width = 50;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + `] ${percentage}%`;
  }

  /**
   * Get compact status summary (for CLI output)
   */
  getCompactSummary(status: DashboardStatus): string {
    const lines: string[] = [];

    lines.push('FLUX Dashboard Summary:');
    lines.push('');
    lines.push(`Memory:    ${status.memory.totalEntries} entries (${status.memory.recentActivity.last24h} in 24h)`);
    lines.push(`Planning:  ${status.planning.completed}/${status.planning.total} TODOs completed (${status.planning.progressPercentage}%)`);
    lines.push(`Agents:    ${status.agents.running} running, ${status.agents.completed} completed`);
    lines.push(`TDD:       ${status.tdd.passRate}% pass rate (${status.tdd.passed}/${status.tdd.totalTests} tests)`);
    lines.push(`Guide:     ${status.guide.totalGuides} guides (${status.guide.inProgress} in progress)`);
    lines.push(`Science:   ${status.science.toolsAvailable} tools available`);

    return lines.join('\n');
  }

  /**
   * Watch mode: continuously update dashboard (optional)
   * Returns a cleanup function to stop watching
   */
  watchMode(interval: number = 5000, callback: (dashboard: string) => void): () => void {
    const timer = setInterval(() => {
      const status = this.getUnifiedStatus();
      const dashboard = this.formatDashboard(status);
      callback(dashboard);
    }, interval);

    // Return cleanup function
    return () => clearInterval(timer);
  }
}
