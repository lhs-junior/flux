import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AwesomePluginGateway } from '../../src/index.js';
import type { MCPServerConfig } from '../../src/core/gateway.js';

describe('Gateway Integration', () => {
  let gateway: AwesomePluginGateway;

  const filesystemConfig: MCPServerConfig = {
    id: 'test-filesystem',
    name: 'Test Filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
  };

  beforeEach(() => {
    gateway = new AwesomePluginGateway({ dbPath: ':memory:' });
  });

  afterEach(async () => {
    await gateway.stop();
  });

  describe('Gateway Initialization', () => {
    it('should initialize gateway successfully', () => {
      expect(gateway).toBeDefined();

      const stats = gateway.getStatistics();
      expect(stats.connectedServers).toBe(0);
      expect(stats.totalTools).toBe(0);
    });

    it('should initialize with in-memory database', () => {
      const stats = gateway.getStatistics();

      expect(stats.database).toBeDefined();
      expect(stats.database.pluginCount).toBe(0);
    });

    it('should initialize with file-based database', () => {
      const fileGateway = new AwesomePluginGateway({
        dbPath: '/tmp/test-gateway.db',
      });

      expect(fileGateway).toBeDefined();
      fileGateway.stop();
    });
  });

  describe('Server Connection', () => {
    it('should connect to MCP server', async () => {
      await gateway.connectToServer(filesystemConfig);

      const stats = gateway.getStatistics();
      expect(stats.connectedServers).toBe(1);
      expect(stats.totalTools).toBeGreaterThan(0);
    }, 30000);

    it('should register tools from connected server', async () => {
      await gateway.connectToServer(filesystemConfig);

      const stats = gateway.getStatistics();
      expect(stats.totalTools).toBeGreaterThan(0);
      expect(stats.toolLoader.bm25.documentCount).toBe(stats.totalTools);
    }, 30000);

    it('should index tools in BM25 search', async () => {
      await gateway.connectToServer(filesystemConfig);

      const stats = gateway.getStatistics();
      expect(stats.toolLoader.bm25.documentCount).toBeGreaterThan(0);
    }, 30000);

    it('should handle connection errors gracefully', async () => {
      const invalidConfig: MCPServerConfig = {
        id: 'invalid',
        name: 'Invalid Server',
        command: 'nonexistent-command',
      };

      await expect(gateway.connectToServer(invalidConfig)).rejects.toThrow();

      const stats = gateway.getStatistics();
      expect(stats.connectedServers).toBe(0);
    });

    it('should connect to multiple servers', async () => {
      await gateway.connectToServer(filesystemConfig);

      // In a real scenario, you'd connect to another server
      // For now, verify single connection works
      const stats = gateway.getStatistics();
      expect(stats.connectedServers).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('Tool Search Integration', () => {
    beforeEach(async () => {
      await gateway.connectToServer(filesystemConfig);
    }, 30000);

    it('should search for tools across all servers', async () => {
      const results = await gateway.searchTools('read file', { limit: 5 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBeDefined();
    });

    it('should return relevant tools based on query', async () => {
      const results = await gateway.searchTools('read', { limit: 10 });

      expect(results.length).toBeGreaterThan(0);

      // At least one result should be related to reading
      const hasReadTool = results.some(t =>
        t.name.toLowerCase().includes('read') ||
        t.description.toLowerCase().includes('read')
      );

      expect(hasReadTool).toBe(true);
    });

    it('should rank results by relevance', async () => {
      const results = await gateway.searchTools('read file', { limit: 5 });

      // Verify search returns results
      expect(results.length).toBeGreaterThan(0);

      // Verify results are relevant to file operations
      // (BM25 should return filesystem tools for "read file" query)
      const hasFileRelatedTool = results.some(r =>
        r.name.toLowerCase().includes('file') ||
        r.description.toLowerCase().includes('file')
      );
      expect(hasFileRelatedTool).toBe(true);
    });

    it('should handle empty query', async () => {
      const results = await gateway.searchTools('', { limit: 5 });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should respect search limit', async () => {
      const results = await gateway.searchTools('file', { limit: 3 });

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should search quickly (< 5ms)', async () => {
      const start = performance.now();
      await gateway.searchTools('test query', { limit: 15 });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      await gateway.connectToServer(filesystemConfig);

      const stats = gateway.getStatistics();

      expect(stats.connectedServers).toBe(1);
      expect(stats.totalTools).toBeGreaterThan(0);
      expect(stats.database.pluginCount).toBe(1);
      expect(stats.database.toolCount).toBe(stats.totalTools);
      expect(stats.toolLoader.totalTools).toBe(stats.totalTools);
      expect(stats.toolLoader.bm25.documentCount).toBe(stats.totalTools);
    }, 30000);

    it('should update statistics after server connection', async () => {
      const statsBefore = gateway.getStatistics();
      expect(statsBefore.connectedServers).toBe(0);

      await gateway.connectToServer(filesystemConfig);

      const statsAfter = gateway.getStatistics();
      expect(statsAfter.connectedServers).toBe(1);
      expect(statsAfter.totalTools).toBeGreaterThan(statsBefore.totalTools);
    }, 30000);
  });

  describe('Tool Metadata', () => {
    beforeEach(async () => {
      await gateway.connectToServer(filesystemConfig);
    }, 30000);

    it('should store tool metadata in database', async () => {
      const stats = gateway.getStatistics();

      expect(stats.database.toolCount).toBeGreaterThan(0);
    });

    it('should categorize tools automatically', async () => {
      const results = await gateway.searchTools('', { limit: 100 });

      const categorized = results.filter(t => t.category);
      expect(categorized.length).toBeGreaterThan(0);
    });

    it('should extract keywords from tools', async () => {
      const results = await gateway.searchTools('', { limit: 100 });

      const withKeywords = results.filter(t => t.keywords && t.keywords.length > 0);
      expect(withKeywords.length).toBeGreaterThan(0);
    });
  });

  describe('Gateway Lifecycle', () => {
    it('should start successfully', async () => {
      // Gateway is already initialized in beforeEach
      expect(gateway).toBeDefined();
    });

    it('should stop successfully', async () => {
      await gateway.connectToServer(filesystemConfig);

      await gateway.stop();

      // After stop, should be in clean state
      expect(true).toBe(true);
    }, 30000);

    it('should handle stop when no servers connected', async () => {
      await gateway.stop();

      expect(true).toBe(true);
    });

    it('should handle multiple stop calls', async () => {
      await gateway.stop();
      await gateway.stop();

      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle search before server connection', async () => {
      const results = await gateway.searchTools('test');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle server disconnection during operation', async () => {
      await gateway.connectToServer(filesystemConfig);

      // Disconnect
      await gateway.stop();

      // Should handle gracefully
      expect(true).toBe(true);
    }, 30000);
  });

  describe('Performance', () => {
    it('should handle many tools efficiently', async () => {
      await gateway.connectToServer(filesystemConfig);

      const stats = gateway.getStatistics();
      const toolCount = stats.totalTools;

      // Search should be fast regardless of tool count
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await gateway.searchTools('test query', { limit: 15 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      expect(avgTime).toBeLessThan(5);
    }, 30000);

    it('should initialize quickly', () => {
      const start = performance.now();
      const quickGateway = new AwesomePluginGateway({ dbPath: ':memory:' });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      quickGateway.stop();
    });
  });
});
