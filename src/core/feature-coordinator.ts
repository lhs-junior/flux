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

    logger.info(
      `FeatureCoordinator: ${memoryTools.length} memory + ${agentTools.length} agent + ${planningTools.length} planning + ${tddTools.length} tdd + ${guideTools.length} guide + ${scienceTools.length} science tools`
    );

    return [
      ...memoryTools,
      ...agentTools,
      ...planningTools,
      ...tddTools,
      ...guideTools,
      ...scienceTools,
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
  routeToolCall(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> | null {
    switch (serverId) {
      case 'internal:memory':
        return this.memoryManager.handleToolCall(toolName, args);

      case 'internal:agents':
        return this.agentOrchestrator.handleToolCall(toolName, args);

      case 'internal:planning':
        return this.planningManager.handleToolCall(toolName, args);

      case 'internal:tdd':
        return this.tddManager.handleToolCall(toolName, args);

      case 'internal:guide':
        return this.guideManager.handleToolCall(toolName, args);

      case 'internal:science':
        return this.scienceManager.handleToolCall(toolName, args);

      default:
        return null;
    }
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
}
