import path from 'path';
import os from 'os';

// Core exports
export { AwesomePluginGateway, type GatewayOptions } from './core/gateway.js';
export { type MCPServerConfig, type ToolMetadata } from './core/types.js';
export { SessionManager, type Session } from './core/session-manager.js';
export { ToolLoader, type LoadedToolsResult, type ToolLoadingStrategy } from './core/tool-loader.js';
export { MCPClient, type MCPClientOptions } from './core/mcp-client.js';
import logger from './utils/logger.js';

// Search exports
export { BM25Indexer, type SearchResult, type IndexedDocument, type BM25IndexerOptions } from './search/bm25-indexer.js';
export { QueryProcessor, type QueryIntent, type ProcessedQuery, type ToolCategory } from './search/query-processor.js';

// Storage exports
export { MetadataStore, type PluginRecord, type ToolRecord, type UsageLogRecord, type MetadataStoreOptions } from './storage/metadata-store.js';

// Discovery exports
export { GitHubExplorer, type GitHubRepoInfo, type SearchOptions, type ExplorerOptions } from './discovery/github-explorer.js';
export { QualityEvaluator, type QualityScore, type EvaluationOptions } from './discovery/quality-evaluator.js';
export { PluginInstaller, type InstallOptions, type InstallResult } from './discovery/plugin-installer.js';

// Feature exports
export { MemoryManager, type MemorySaveInput, type MemoryRecallInput, type MemoryListInput, type MemoryForgetInput } from './features/memory/memory-manager.js';
export { MemoryStore, type MemoryRecord, type MemoryFilter } from './features/memory/memory-store.js';
export { PlanningManager, type PlanningCreateInput, type PlanningUpdateInput, type PlanningTreeInput } from './features/planning/planning-manager.js';
export { PlanningStore, type TodoRecord, type TodoFilter } from './features/planning/planning-store.js';
export { GuideManager, type GuideSearchInput, type GuideTutorialInput } from './features/guide/guide-manager.js';
export { GuideStore } from './features/guide/guide-store.js';
export {
  type GuideRecord,
  type TutorialStep,
  type LearningProgress,
  type GuideFilter,
  type GuideCategory,
  type DifficultyLevel,
  type LearningStatus
} from './features/guide/guide-types.js';

// Plugin wrapper exports
export { getPluginManagers, resetPlugin, loadConfig, type PluginConfig } from './plugin/index.js';

// Factory function for easy instantiation
export async function createAwesomePlugin(options?: {
  dbPath?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}) {
  const { MemoryManager } = await import('./features/memory/memory-manager.js');
  const { PlanningManager } = await import('./features/planning/planning-manager.js');
  const { GuideManager } = await import('./features/guide/guide-manager.js');

  const dbPath = options?.dbPath || path.join(os.homedir(), '.awesome-plugin', 'data.db');

  return {
    memory: new MemoryManager(dbPath),
    planning: new PlanningManager(dbPath),
    guide: new GuideManager(dbPath),
  };
}

// Main entry point for running as MCP server
async function main() {
  const { AwesomePluginGateway } = await import('./core/gateway.js');
  const gateway = new AwesomePluginGateway();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('\nShutting down...');
    await gateway.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\nShutting down...');
    await gateway.stop();
    process.exit(0);
  });

  // Start the gateway
  await gateway.start();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}
