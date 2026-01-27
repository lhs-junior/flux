/**
 * Performance benchmark for BM25 Tool Search
 * Goal: < 50ms for 100+ tools
 */

import { AwesomePluginGateway, type ToolMetadata } from '../src/index.js';

// Generate mock tools for testing
function generateMockTools(count: number): ToolMetadata[] {
  const categories = ['communication', 'database', 'filesystem', 'development', 'web'];
  const actions = ['send', 'read', 'write', 'create', 'delete', 'update', 'list'];
  const tools: ToolMetadata[] = [];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const action = actions[i % actions.length];

    tools.push({
      name: `tool_${i}_${action}_${category}`,
      description: `${action} data in ${category} system. Tool number ${i} for testing.`,
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'First parameter' },
          param2: { type: 'number', description: 'Second parameter' },
        },
      },
      serverId: `server_${Math.floor(i / 10)}`,
      category: category as any,
      keywords: [action, category, `keyword${i}`],
    });
  }

  return tools;
}

async function runBenchmark() {
  console.log('='.repeat(60));
  console.log('BM25 Tool Search Performance Benchmark');
  console.log('='.repeat(60));

  // Test scenarios
  const scenarios = [
    { toolCount: 50, queries: ['send message', 'read file', 'create database'] },
    { toolCount: 100, queries: ['send message', 'read file', 'create database'] },
    { toolCount: 200, queries: ['send message', 'read file', 'create database'] },
  ];

  for (const scenario of scenarios) {
    console.log(`\n\nScenario: ${scenario.toolCount} tools`);
    console.log('-'.repeat(60));

    const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

    // Connect mock server and register tools
    await gateway.connectToServer({
      id: 'benchmark_server',
      name: 'Benchmark Server',
      command: 'mock',
    });

    // Generate and register mock tools
    const mockTools = generateMockTools(scenario.toolCount);
    const toolLoader = (gateway as any).toolLoader;
    toolLoader.registerTools(mockTools);

    console.log(`Registered ${scenario.toolCount} tools`);

    // Run search queries
    for (const query of scenario.queries) {
      const times: number[] = [];

      // Warm-up run
      await gateway.searchTools(query);

      // Benchmark runs (10 iterations)
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        const results = await gateway.searchTools(query, { limit: 15 });
        const duration = performance.now() - start;
        times.push(duration);
      }

      // Calculate statistics
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const medianTime = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

      const passed = avgTime < 50;
      const status = passed ? '✅ PASS' : '❌ FAIL';

      console.log(`\nQuery: "${query}"`);
      console.log(`  Average: ${avgTime.toFixed(2)}ms ${status}`);
      console.log(`  Median:  ${medianTime.toFixed(2)}ms`);
      console.log(`  Min:     ${minTime.toFixed(2)}ms`);
      console.log(`  Max:     ${maxTime.toFixed(2)}ms`);
    }

    // Statistics
    const stats = gateway.getStatistics();
    console.log(`\nGateway Statistics:`);
    console.log(`  Total Tools: ${stats.totalTools}`);
    console.log(`  BM25 Documents: ${stats.toolLoader.bm25.documentCount}`);
    console.log(`  Avg Doc Length: ${stats.toolLoader.bm25.averageDocumentLength.toFixed(1)} words`);

    await gateway.stop();
  }

  console.log('\n' + '='.repeat(60));
  console.log('Benchmark Complete!');
  console.log('='.repeat(60));
}

// Run benchmark
runBenchmark().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
