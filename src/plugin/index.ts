import type { PluginConfig } from './config.js';
import { loadConfig } from './config.js';

// Lazy-loaded managers
let managers: ReturnType<typeof createManagers> | null = null;

/**
 * Create manager instances (lazy initialization)
 */
function createManagers(config: PluginConfig) {
  // Dynamic imports to avoid circular dependencies
  const { MemoryManager } = require('../features/memory/memory-manager.js');
  const { PlanningManager } = require('../features/planning/planning-manager.js');
  const { GuideManager } = require('../features/guide/guide-manager.js');
  const { TDDManager } = require('../features/tdd/tdd-manager.js');
  const { AgentOrchestrator } = require('../features/agents/agent-orchestrator.js');
  const { ScienceManager } = require('../features/science/index.js');

  return {
    memory: new MemoryManager(config.dbPath),
    planning: new PlanningManager(config.dbPath),
    guide: new GuideManager(config.dbPath),
    tdd: new TDDManager(config.dbPath),
    agent: new AgentOrchestrator(config.dbPath),
    science: new ScienceManager()
  };
}

/**
 * Get plugin managers (singleton pattern with lazy initialization)
 */
export function getPluginManagers(options?: Partial<PluginConfig>) {
  if (!managers) {
    const config = loadConfig(options);
    managers = createManagers(config);
  }
  return managers;
}

/**
 * Reset plugin state (useful for testing)
 */
export function resetPlugin() {
  // Close all managers
  if (managers) {
    if (managers.memory?.close) managers.memory.close();
    if (managers.planning?.close) managers.planning.close();
    if (managers.guide?.close) managers.guide.close();
    if (managers.tdd?.close) managers.tdd.close();
    if (managers.agent?.close) managers.agent.close();
  }
  managers = null;
}

// Export types
export type { PluginConfig };
export { loadConfig };
