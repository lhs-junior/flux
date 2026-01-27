// Core exports
export { AwesomePluginGateway, type MCPServerConfig, type ToolMetadata, type GatewayOptions } from './core/gateway.js';
export { SessionManager, type Session } from './core/session-manager.js';
export { ToolLoader, type LoadedToolsResult, type ToolLoadingStrategy } from './core/tool-loader.js';

// Search exports
export { BM25Indexer, type SearchResult, type IndexedDocument, type BM25IndexerOptions } from './search/bm25-indexer.js';
export { QueryProcessor, type QueryIntent, type ProcessedQuery, type ToolCategory } from './search/query-processor.js';

// Storage exports
export { MetadataStore, type PluginRecord, type ToolRecord, type UsageLogRecord, type MetadataStoreOptions } from './storage/metadata-store.js';

// Main entry point for running as MCP server
async function main() {
  const { AwesomePluginGateway } = await import('./core/gateway.js');
  const gateway = new AwesomePluginGateway();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await gateway.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await gateway.stop();
    process.exit(0);
  });

  // Start the gateway
  await gateway.start();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
