/**
 * Simple test to verify MCP server connection
 * This demonstrates connecting to a simple MCP server
 */

import { AwesomePluginGateway } from '../src/index.js';

async function simpleTest() {
  console.log('='.repeat(60));
  console.log('Simple MCP Server Connection Test');
  console.log('='.repeat(60));

  const gateway = new AwesomePluginGateway({
    dbPath: ':memory:',
  });

  try {
    // Example: Connect to a filesystem MCP server (if available)
    // Replace with your actual MCP server command
    await gateway.connectToServer({
      id: 'test-server',
      name: 'Test Server',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    });

    // Search for tools
    const results = await gateway.searchTools('read file', { limit: 5 });

    console.log(`\nFound ${results.length} matching tools:`);
    results.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   ${tool.description}`);
      console.log(`   Category: ${tool.category || 'N/A'}`);
      console.log('');
    });

    // Show statistics
    const stats = gateway.getStatistics();
    console.log('Gateway Statistics:');
    console.log(JSON.stringify(stats, null, 2));

    // Cleanup
    await gateway.stop();

    console.log('\n✅ Test completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    await gateway.stop();
    process.exit(1);
  }
}

simpleTest();
