/**
 * Basic Usage Example
 *
 * This example demonstrates the basic usage of Awesome MCP Meta Plugin:
 * 1. Creating a gateway
 * 2. Connecting to an MCP server
 * 3. Searching for tools
 * 4. Getting statistics
 * 5. Graceful shutdown
 */

import { AwesomePluginGateway } from '../../../src/index.js';
import path from 'path';

async function main() {
  console.log('🚀 Awesome MCP Meta Plugin - Basic Usage Example\n');

  // 1. Create gateway with persistent database
  console.log('1️⃣  Creating gateway...');
  const gateway = new AwesomePluginGateway({
    dbPath: path.join(process.cwd(), 'data', 'example-basic.db'),
    enableToolSearch: true,
    maxLayer2Tools: 15,
  });
  console.log('✅ Gateway created\n');

  // 2. Connect to Filesystem MCP server
  console.log('2️⃣  Connecting to Filesystem MCP server...');
  try {
    await gateway.connectToServer({
      id: 'filesystem',
      name: 'Filesystem Server',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    });
    console.log('✅ Connected to Filesystem server\n');
  } catch (error) {
    console.error('❌ Failed to connect to server:', error);
    process.exit(1);
  }

  // 3. Search for tools
  console.log('3️⃣  Searching for file-related tools...');
  const fileTools = await gateway.searchTools('read file', { limit: 5 });

  console.log(`Found ${fileTools.length} tools:`);
  fileTools.forEach((tool, index) => {
    console.log(`  ${index + 1}. ${tool.name}`);
    console.log(`     ${tool.description || 'No description'}`);
  });
  console.log();

  // 4. Get gateway statistics
  console.log('4️⃣  Gateway statistics:');
  const stats = gateway.getStatistics();
  console.log(`  Connected servers: ${stats.connectedServers}`);
  console.log(`  Total tools: ${stats.totalTools}`);
  console.log(`  Essential tools (Layer 1): ${stats.essentialTools}`);
  console.log(`  Layer 2 tools: ${stats.layer2Tools}`);
  console.log(`  Search enabled: ${stats.searchEnabled}`);

  const estimatedTokens = stats.essentialTools * 300 + stats.layer2Tools * 300;
  console.log(`  Estimated token usage: ~${estimatedTokens} tokens`);
  console.log();

  // 5. Additional searches
  console.log('5️⃣  More search examples:');

  const writeTools = await gateway.searchTools('write', { limit: 3 });
  console.log(`  Write-related tools: ${writeTools.map(t => t.name).join(', ')}`);

  const dirTools = await gateway.searchTools('directory list', { limit: 3 });
  console.log(`  Directory-related tools: ${dirTools.map(t => t.name).join(', ')}`);
  console.log();

  // 6. Graceful shutdown
  console.log('6️⃣  Shutting down...');
  await gateway.stop();
  console.log('✅ Gateway stopped\n');

  console.log('✨ Example completed successfully!');
}

// Handle errors and cleanup
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
