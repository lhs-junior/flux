/**
 * Multi-Server Example
 *
 * This example demonstrates connecting to multiple MCP servers simultaneously:
 * 1. Connect to Filesystem, GitHub, and Slack servers
 * 2. Search across all servers
 * 3. Demonstrate token savings
 */

import { AwesomePluginGateway } from '../../../src/index.js';
import path from 'path';

async function main() {
  console.log('🚀 Awesome MCP Meta Plugin - Multi-Server Example\n');

  // 1. Create gateway
  console.log('1️⃣  Creating gateway...');
  const gateway = new AwesomePluginGateway({
    dbPath: path.join(process.cwd(), 'data', 'example-multi.db'),
    enableToolSearch: true,
    maxLayer2Tools: 20, // Increase for multiple servers
  });
  console.log('✅ Gateway created\n');

  // 2. Define multiple server configurations
  const serverConfigs = [
    {
      id: 'filesystem',
      name: 'Filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    },
    {
      id: 'github',
      name: 'GitHub',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
      },
    },
    // Uncomment if you have Slack token
    // {
    //   id: 'slack',
    //   name: 'Slack',
    //   command: 'npx',
    //   args: ['-y', '@modelcontextprotocol/server-slack'],
    //   env: {
    //     SLACK_TOKEN: process.env.SLACK_TOKEN || '',
    //   },
    // },
  ];

  // 3. Connect to all servers
  console.log('2️⃣  Connecting to multiple MCP servers...');

  // Connect sequentially for stability
  for (const config of serverConfigs) {
    try {
      console.log(`  Connecting to ${config.name}...`);
      await gateway.connectToServer(config);
      console.log(`  ✅ ${config.name} connected`);
    } catch (error) {
      console.error(`  ❌ Failed to connect to ${config.name}:`, error.message);
      // Continue with other servers
    }
  }
  console.log();

  // Alternative: Connect in parallel (faster but may be less stable)
  // await Promise.all(
  //   serverConfigs.map(config => gateway.connectToServer(config))
  // );

  // 4. Show statistics
  console.log('3️⃣  Multi-server statistics:');
  const stats = gateway.getStatistics();
  console.log(`  Connected servers: ${stats.connectedServers}`);
  console.log(`  Total tools available: ${stats.totalTools}`);
  console.log(`  Tools in Layer 1 (essential): ${stats.essentialTools}`);
  console.log(`  Max tools in Layer 2: 20`);
  console.log();

  // Calculate token savings
  const traditionalTokens = stats.totalTools * 300; // Assume 300 tokens per tool
  const awesomeTokens = (stats.essentialTools + 20) * 300; // Layer 1 + Layer 2
  const savings = Math.round(((traditionalTokens - awesomeTokens) / traditionalTokens) * 100);

  console.log('4️⃣  Token usage comparison:');
  console.log(`  Traditional MCP: ~${traditionalTokens.toLocaleString()} tokens`);
  console.log(`  Awesome Plugin: ~${awesomeTokens.toLocaleString()} tokens`);
  console.log(`  💰 Savings: ${savings}% (${(traditionalTokens - awesomeTokens).toLocaleString()} tokens)\n`);

  // 5. Search across all servers
  console.log('5️⃣  Searching across all servers:');

  // File operations
  console.log('\n  📁 File operations:');
  const fileTools = await gateway.searchTools('read write file', { limit: 5 });
  fileTools.forEach(tool => {
    console.log(`    - ${tool.name} (${tool.serverId})`);
  });

  // GitHub operations
  console.log('\n  🐙 GitHub operations:');
  const githubTools = await gateway.searchTools('github pull request', { limit: 5 });
  if (githubTools.length > 0) {
    githubTools.forEach(tool => {
      console.log(`    - ${tool.name} (${tool.serverId})`);
    });
  } else {
    console.log('    (GitHub server not connected or no matching tools)');
  }

  // Slack operations (if connected)
  console.log('\n  💬 Slack operations:');
  const slackTools = await gateway.searchTools('slack message', { limit: 5 });
  if (slackTools.length > 0) {
    slackTools.forEach(tool => {
      console.log(`    - ${tool.name} (${tool.serverId})`);
    });
  } else {
    console.log('    (Slack server not connected or no matching tools)');
  }
  console.log();

  // 6. Demonstrate dynamic loading
  console.log('6️⃣  Dynamic tool loading demonstration:');
  console.log('  When you ask Claude to "read a file", Awesome Plugin:');
  console.log('    1. Loads Layer 1 (essential tools)');
  console.log('    2. Searches for relevant tools using BM25');
  console.log('    3. Loads top 20 matching tools in Layer 2');
  console.log('    4. Makes Layer 3 tools available on-demand');
  console.log();
  console.log(`  Result: Only ${stats.essentialTools + 20} tools loaded instead of ${stats.totalTools}!`);
  console.log();

  // 7. Cleanup
  console.log('7️⃣  Shutting down...');
  await gateway.stop();
  console.log('✅ All servers disconnected\n');

  console.log('✨ Multi-server example completed successfully!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
