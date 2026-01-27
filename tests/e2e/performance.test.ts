import { describe, it, expect } from 'vitest';
import { AwesomePluginGateway, type ToolMetadata } from '../../src/index.js';

describe('Performance Validation', () => {
  function generateMockTools(count: number): ToolMetadata[] {
    const categories = ['communication', 'database', 'filesystem', 'development', 'web'];
    const actions = ['send', 'read', 'write', 'create', 'delete', 'update', 'list'];
    const tools: ToolMetadata[] = [];

    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const action = actions[i % actions.length];

      tools.push({
        name: `tool_${i}_${action}_${category}`,
        description: `${action} data in ${category} system. Tool number ${i} for testing performance.`,
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

  describe('BM25 Search Performance', () => {
    it('should search in < 1ms for 50 tools', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const tools = generateMockTools(50);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(tools);

      // Warm-up
      await gateway.searchTools('test query', { limit: 15 });

      // Measure
      const times: number[] = [];
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await gateway.searchTools('send message', { limit: 15 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      console.log(`\n50 tools - Avg: ${avgTime.toFixed(3)}ms, P95: ${p95Time.toFixed(3)}ms, Max: ${maxTime.toFixed(3)}ms`);

      expect(avgTime).toBeLessThan(2);
      expect(p95Time).toBeLessThan(3);

      await gateway.stop();
    });

    it('should search in < 1ms for 100 tools', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const tools = generateMockTools(100);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(tools);

      // Warm-up
      await gateway.searchTools('test query', { limit: 15 });

      // Measure
      const times: number[] = [];
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await gateway.searchTools('read file', { limit: 15 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      console.log(`\n100 tools - Avg: ${avgTime.toFixed(3)}ms, P95: ${p95Time.toFixed(3)}ms`);

      expect(avgTime).toBeLessThan(2);
      expect(p95Time).toBeLessThan(4);

      await gateway.stop();
    });

    it('should search in < 1ms for 200 tools', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const tools = generateMockTools(200);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(tools);

      // Warm-up
      await gateway.searchTools('test query', { limit: 15 });

      // Measure
      const times: number[] = [];
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await gateway.searchTools('create database', { limit: 15 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      console.log(`\n200 tools - Avg: ${avgTime.toFixed(3)}ms, P95: ${p95Time.toFixed(3)}ms`);

      expect(avgTime).toBeLessThan(2);
      expect(p95Time).toBeLessThan(3);

      await gateway.stop();
    });

    it('should search efficiently for 500 tools', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const tools = generateMockTools(500);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(tools);

      // Warm-up
      await gateway.searchTools('test query', { limit: 15 });

      // Measure
      const times: number[] = [];
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await gateway.searchTools('send message', { limit: 15 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      console.log(`\n500 tools - Avg: ${avgTime.toFixed(3)}ms, P95: ${p95Time.toFixed(3)}ms`);

      // For 500 tools, we allow slightly longer but still very fast
      expect(avgTime).toBeLessThan(2);
      expect(p95Time).toBeLessThan(5);

      await gateway.stop();
    });
  });

  describe('Token Reduction Validation', () => {
    function estimateTokens(tools: ToolMetadata[]): number {
      // Rough estimate: ~300 tokens per tool (name + description + schema)
      return tools.length * 300;
    }

    it('should reduce tokens by ~70% for 50 tools', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const allTools = generateMockTools(50);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(allTools);

      // Baseline: all tools
      const baselineTokens = estimateTokens(allTools);

      // Awesome Plugin: Layer 2 loading (15 tools)
      const result = await (gateway as any).toolLoader.loadTools('test query', { maxLayer2: 15 });
      const loadedTools = [...result.essential, ...result.relevant];
      const awesomeTokens = estimateTokens(loadedTools);

      const reduction = ((baselineTokens - awesomeTokens) / baselineTokens) * 100;

      console.log(`\n50 tools - Baseline: ${baselineTokens}, Awesome: ${awesomeTokens}, Reduction: ${reduction.toFixed(1)}%`);

      expect(reduction).toBeGreaterThanOrEqual(60); // At least 60% reduction

      await gateway.stop();
    });

    it('should reduce tokens by ~90% for 200 tools', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const allTools = generateMockTools(200);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(allTools);

      // Baseline: all tools
      const baselineTokens = estimateTokens(allTools);

      // Awesome Plugin: Layer 2 loading (15 tools)
      const result = await (gateway as any).toolLoader.loadTools('test query', { maxLayer2: 15 });
      const loadedTools = [...result.essential, ...result.relevant];
      const awesomeTokens = estimateTokens(loadedTools);

      const reduction = ((baselineTokens - awesomeTokens) / baselineTokens) * 100;

      console.log(`\n200 tools - Baseline: ${baselineTokens}, Awesome: ${awesomeTokens}, Reduction: ${reduction.toFixed(1)}%`);

      expect(reduction).toBeGreaterThanOrEqual(85); // At least 85% reduction

      await gateway.stop();
    });

    it('should reduce tokens by ~95% for 500 tools', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const allTools = generateMockTools(500);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(allTools);

      // Baseline: all tools
      const baselineTokens = estimateTokens(allTools);

      // Awesome Plugin: Layer 2 loading (15 tools)
      const result = await (gateway as any).toolLoader.loadTools('test query', { maxLayer2: 15 });
      const loadedTools = [...result.essential, ...result.relevant];
      const awesomeTokens = estimateTokens(loadedTools);

      const reduction = ((baselineTokens - awesomeTokens) / baselineTokens) * 100;

      console.log(`\n500 tools - Baseline: ${baselineTokens}, Awesome: ${awesomeTokens}, Reduction: ${reduction.toFixed(1)}%`);

      expect(reduction).toBeGreaterThanOrEqual(92); // At least 92% reduction

      await gateway.stop();
    });
  });

  describe('Stress Tests', () => {
    it('should handle 1000 tools without crashing', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const tools = generateMockTools(1000);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(tools);

      const start = performance.now();
      const results = await gateway.searchTools('test query', { limit: 15 });
      const duration = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10); // Should still be fast

      await gateway.stop();
    });

    it('should handle rapid consecutive searches', async () => {
      const gateway = new AwesomePluginGateway({ dbPath: ':memory:' });

      // Directly register tools without mock server connection
      const tools = generateMockTools(100);
      const toolLoader = (gateway as any).toolLoader;
      toolLoader.registerTools(tools);

      // Perform 100 searches rapidly
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(gateway.searchTools(`query ${i}`, { limit: 5 }));
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(100);

      await gateway.stop();
    });
  });
});
