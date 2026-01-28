/**
 * FeatureCoordinator - Manages internal feature managers and tool routing
 * Extracted from gateway.ts to reduce its complexity
 */

import { MemoryManager } from '../features/memory/memory-manager.js';
import { AgentOrchestrator } from '../features/agents/agent-orchestrator.js';
import { PlanningManager } from '../features/planning/planning-manager.js';
import { TDDManager } from '../features/tdd/tdd-manager.js';
import { GuideManager } from '../features/guide/guide-manager.js';
import { ScienceManager } from '../features/science/index.js';
import { initializeGuides } from '../features/guide/seed-guides.js';
import { HooksManager, LifecycleHookType } from '../fusion/implementations/lifecycle-hooks-fusion.js';
import { DashboardManager } from '../fusion/implementations/dashboard-fusion.js';
import logger from '../utils/logger.js';
import type { ToolMetadata } from './types.js';

export interface FeatureCoordinatorOptions {
  dbPath: string;
}

/**
 * Internal plugin registration info
 */
interface InternalPluginRegistration {
  id: string;
  name: string;
}

/**
 * FeatureCoordinator manages all internal feature managers (memory, agents, planning, TDD, guide, science)
 * and provides unified interfaces for tool definitions and call routing.
 */
export class FeatureCoordinator {
  private memoryManager: MemoryManager;
  private agentOrchestrator: AgentOrchestrator;
  private planningManager: PlanningManager;
  private tddManager: TDDManager;
  private guideManager: GuideManager;
  private scienceManager: ScienceManager;
  private hooksManager: HooksManager;
  private dashboardManager: DashboardManager;

  constructor(options: FeatureCoordinatorOptions) {
    const dbPath = options.dbPath || ':memory:';

    // Initialize managers in dependency order
    this.memoryManager = new MemoryManager(dbPath);
    this.planningManager = new PlanningManager(dbPath);
    this.tddManager = new TDDManager(dbPath);

    // Initialize AgentOrchestrator with full manager integration
    this.agentOrchestrator = new AgentOrchestrator(dbPath, {
      planningManager: this.planningManager,
      memoryManager: this.memoryManager,
      tddManager: this.tddManager,
    });

    // Initialize GuideManager with cross-feature integration
    this.guideManager = new GuideManager(dbPath, {
      memoryManager: this.memoryManager,
      planningManager: this.planningManager,
    });

    // Initialize ScienceManager with cross-feature integration
    this.scienceManager = new ScienceManager({
      memoryManager: this.memoryManager,
      planningManager: this.planningManager,
    });

    // Initialize HooksManager and inject all managers for fusion
    this.hooksManager = new HooksManager();
    this.hooksManager.injectManagers({
      memoryManager: this.memoryManager,
      planningManager: this.planningManager,
      tddManager: this.tddManager,
      agentOrchestrator: this.agentOrchestrator,
    });

    // Initialize DashboardManager for unified status view
    this.dashboardManager = new DashboardManager({
      memoryManager: this.memoryManager,
      planningManager: this.planningManager,
      agentOrchestrator: this.agentOrchestrator,
      tddManager: this.tddManager,
      guideManager: this.guideManager,
      scienceManager: this.scienceManager,
    });

    // Initialize guides from seed files if database is empty
    this.initializeGuidesIfNeeded();
  }

  /**
   * Initialize guides from seed files if database is empty
   */
  private async initializeGuidesIfNeeded(): Promise<void> {
    try {
      // Use the GuideManager's store and indexer via proper accessors
      const store = this.guideManager.getStore();
      const indexer = this.guideManager.getIndexer();
      await initializeGuides(store, indexer);
    } catch (error) {
      logger.error('Failed to initialize guides:', error);
    }
  }

  /**
   * Get all internal plugin registrations for metadata store
   */
  getInternalPluginRegistrations(): InternalPluginRegistration[] {
    return [
      {
        id: 'internal:memory',
        name: 'Internal Memory Management',
      },
      {
        id: 'internal:agents',
        name: 'Internal Agent Orchestration',
      },
      {
        id: 'internal:planning',
        name: 'Internal Planning & TODO Tracking',
      },
      {
        id: 'internal:tdd',
        name: 'Internal TDD Workflow',
      },
      {
        id: 'internal:guide',
        name: 'Internal Guide System',
      },
      {
        id: 'internal:science',
        name: 'Internal Science Tools',
      },
      {
        id: 'internal:dashboard',
        name: 'Internal Dashboard Fusion',
      },
    ];
  }

  /**
   * Get all tool definitions from all internal feature managers
   */
  getAllToolDefinitions(): ToolMetadata[] {
    const memoryTools = this.memoryManager.getToolDefinitions();
    const agentTools = this.agentOrchestrator.getToolDefinitions();
    const planningTools = this.planningManager.getToolDefinitions();
    const tddTools = this.tddManager.getToolDefinitions();
    const guideTools = this.guideManager.getToolDefinitions();
    const scienceTools = this.scienceManager.getToolDefinitions();
    const dashboardTools = this.getDashboardToolDefinitions();

    logger.info(
      `FeatureCoordinator: ${memoryTools.length} memory + ${agentTools.length} agent + ${planningTools.length} planning + ${tddTools.length} tdd + ${guideTools.length} guide + ${scienceTools.length} science + ${dashboardTools.length} dashboard tools`
    );

    return [
      ...memoryTools,
      ...agentTools,
      ...planningTools,
      ...tddTools,
      ...guideTools,
      ...scienceTools,
      ...dashboardTools,
    ];
  }

  /**
   * Handle dashboard tool calls
   */
  private async handleDashboardToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (toolName === 'dashboard_status') {
        const format = (args.format as string) || 'full';
        const status = this.dashboardManager.getUnifiedStatus();

        let output: string;
        if (format === 'json') {
          output = JSON.stringify(status, null, 2);
        } else if (format === 'compact') {
          output = this.dashboardManager.getCompactSummary(status);
        } else {
          output = this.dashboardManager.formatDashboard(status);
        }

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      }

      throw new Error(`Unknown dashboard tool: ${toolName}`);
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: `Dashboard tool error: ${error.message}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  /**
   * Get dashboard tool definitions
   */
  private getDashboardToolDefinitions(): ToolMetadata[] {
    return [
      {
        name: 'dashboard_status',
        description:
          'Get unified status view of all FLUX features. Shows Memory entries, Planning progress, Agent counts, TDD pass rate, Guide stats, and Science tools. Token-efficient way to see everything at once!',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['full', 'compact', 'json'],
              description: 'Output format: full (ASCII dashboard), compact (summary), or json (raw data)',
              default: 'full',
            },
          },
        },
        serverId: 'internal:dashboard',
        category: 'fusion',
      },
    ];
  }

  /**
   * Check if a serverId belongs to an internal feature
   */
  isInternalFeature(serverId: string): boolean {
    return serverId.startsWith('internal:');
  }

  /**
   * Route a tool call to the appropriate internal feature manager
   * Returns null if the serverId is not an internal feature
   */
  async routeToolCall(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown | null> {
    // Execute PreToolUse hook
    await this.hooksManager.executeHooks(LifecycleHookType.PreToolUse, {
      toolName,
      toolArgs: args,
      data: { serverId },
    });

    let result: unknown = null;
    let error: Error | undefined;

    try {
      switch (serverId) {
        case 'internal:memory':
          result = await this.memoryManager.handleToolCall(toolName, args);
          break;

        case 'internal:agents':
          result = await this.agentOrchestrator.handleToolCall(toolName, args);
          break;

        case 'internal:planning':
          result = await this.planningManager.handleToolCall(toolName, args);
          break;

        case 'internal:tdd':
          result = await this.tddManager.handleToolCall(toolName, args);
          break;

        case 'internal:guide':
          result = await this.guideManager.handleToolCall(toolName, args);
          break;

        case 'internal:science':
          result = await this.scienceManager.handleToolCall(toolName, args);
          break;

        case 'internal:dashboard':
          result = await this.handleDashboardToolCall(toolName, args);
          break;

        default:
          return null;
      }
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));

      // Execute ErrorOccurred hook
      await this.hooksManager.executeHooks(LifecycleHookType.ErrorOccurred, {
        toolName,
        toolArgs: args,
        error,
        data: { serverId },
      });

      throw error;
    }

    // Execute PostToolUse hook
    await this.hooksManager.executeHooks(LifecycleHookType.PostToolUse, {
      toolName,
      toolArgs: args,
      toolResult: result,
      data: { serverId },
    });

    return result;
  }

  /**
   * Close all internal feature managers
   */
  close(): void {
    try {
      this.memoryManager.close();
    } catch (error) {
      logger.error('Failed to close memory manager:', error);
    }

    try {
      this.agentOrchestrator.close();
    } catch (error) {
      logger.error('Failed to close agent orchestrator:', error);
    }

    try {
      this.planningManager.close();
    } catch (error) {
      logger.error('Failed to close planning manager:', error);
    }

    try {
      this.tddManager.close();
    } catch (error) {
      logger.error('Failed to close TDD manager:', error);
    }

    try {
      this.guideManager.close();
    } catch (error) {
      logger.error('Failed to close guide manager:', error);
    }

    try {
      this.scienceManager.close();
    } catch (error) {
      logger.error('Failed to close science manager:', error);
    }
  }

  // Accessors for individual managers (primarily for testing and direct access)
  getMemoryManager(): MemoryManager {
    return this.memoryManager;
  }

  getAgentOrchestrator(): AgentOrchestrator {
    return this.agentOrchestrator;
  }

  getPlanningManager(): PlanningManager {
    return this.planningManager;
  }

  getTddManager(): TDDManager {
    return this.tddManager;
  }

  getGuideManager(): GuideManager {
    return this.guideManager;
  }

  getScienceManager(): ScienceManager {
    return this.scienceManager;
  }

  getHooksManager(): HooksManager {
    return this.hooksManager;
  }

  getDashboardManager(): DashboardManager {
    return this.dashboardManager;
  }
}
