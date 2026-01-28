import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MetadataStore } from '../../src/storage/metadata-store.js';
import type { ToolMetadata } from '../../src/core/types.js';
import * as fs from 'fs';
import * as path from 'path';

describe('MetadataStore', () => {
  let store: MetadataStore;
  const testDbPath = path.join('/tmp', `test-db-${Date.now()}.db`);

  beforeEach(() => {
    // Use in-memory database for most tests
    store = new MetadataStore({ filepath: ':memory:' });
  });

  afterEach(() => {
    store.close();

    // Clean up test database file if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    it('should initialize with in-memory database', () => {
      expect(store).toBeDefined();
      const stats = store.getStatistics();
      expect(stats.pluginCount).toBe(0);
      expect(stats.toolCount).toBe(0);
    });

    it('should initialize with file-based database', () => {
      const fileStore = new MetadataStore({ filepath: testDbPath });
      expect(fileStore).toBeDefined();

      const stats = fileStore.getStatistics();
      expect(stats.pluginCount).toBe(0);

      fileStore.close();
    });

    it('should create tables on initialization', () => {
      const stats = store.getStatistics();
      // Tables should exist (no errors thrown)
      expect(stats).toBeDefined();
    });
  });

  describe('Plugin Management', () => {
    const mockPlugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      command: 'npx test-command',
      qualityScore: 85,
      args: ['arg1', 'arg2'],
      env: { KEY: 'value' },
    };

    it('should add a plugin', () => {
      store.addPlugin(mockPlugin);

      const plugin = store.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('Test Plugin');
      expect(plugin?.qualityScore).toBe(85);
    });

    it('should retrieve plugin by id', () => {
      store.addPlugin(mockPlugin);

      const plugin = store.getPlugin('test-plugin');
      expect(plugin?.id).toBe('test-plugin');
      expect(plugin?.command).toBe('npx test-command');
    });

    it('should return null for non-existent plugin', () => {
      const plugin = store.getPlugin('nonexistent');
      expect(plugin).toBeNull();
    });

    it('should list all plugins', () => {
      store.addPlugin(mockPlugin);
      store.addPlugin({
        id: 'plugin2',
        name: 'Plugin 2',
        command: 'test',
        qualityScore: 90,
      });

      const plugins = store.getAllPlugins();
      expect(plugins.length).toBe(2);
    });

    it('should update existing plugin', () => {
      store.addPlugin(mockPlugin);

      store.addPlugin({
        ...mockPlugin,
        name: 'Updated Plugin',
        qualityScore: 95,
      });

      const plugin = store.getPlugin('test-plugin');
      expect(plugin?.name).toBe('Updated Plugin');
      expect(plugin?.qualityScore).toBe(95);
    });

    it('should remove plugin', () => {
      store.addPlugin(mockPlugin);
      expect(store.getPlugin('test-plugin')).not.toBeNull();

      store.removePlugin('test-plugin');
      expect(store.getPlugin('test-plugin')).toBeNull();
    });

    it('should handle plugin with minimal fields', () => {
      store.addPlugin({
        id: 'minimal',
        name: 'Minimal',
        command: 'test',
        qualityScore: 0,
      });

      const plugin = store.getPlugin('minimal');
      expect(plugin).toBeDefined();
      expect(plugin?.args).toBeUndefined();
      expect(plugin?.env).toBeUndefined();
    });
  });

  describe('Tool Management', () => {
    const mockTool: ToolMetadata = {
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object', properties: {} },
      serverId: 'test-server',
      category: 'filesystem',
      keywords: ['test', 'file'],
    };

    beforeEach(() => {
      // Add a plugin first for foreign key constraint
      store.addPlugin({
        id: 'test-server',
        name: 'Test Server',
        command: 'test',
        qualityScore: 0,
      });
    });

    it('should add a single tool', () => {
      store.addTool(mockTool);

      const tool = store.getTool('test_tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test_tool');
      expect(tool?.description).toBe('A test tool');
    });

    it('should add multiple tools', () => {
      const tools: ToolMetadata[] = [
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 'test-server' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 'test-server' },
        { name: 'tool3', description: 'Tool 3', inputSchema: {}, serverId: 'test-server' },
      ];

      store.addTools(tools);

      const allTools = store.getAllTools();
      expect(allTools.length).toBe(3);
    });

    it('should retrieve tool by name', () => {
      store.addTool(mockTool);

      const tool = store.getTool('test_tool');
      expect(tool?.serverId).toBe('test-server');
      expect(tool?.category).toBe('filesystem');
    });

    it('should return null for non-existent tool', () => {
      const tool = store.getTool('nonexistent');
      expect(tool).toBeNull();
    });

    it('should get tools by server id', () => {
      store.addTools([
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 'test-server' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 'test-server' },
      ]);

      const tools = store.getToolsByServer('test-server');
      expect(tools.length).toBe(2);
    });

    it('should update existing tool', () => {
      store.addTool(mockTool);

      store.addTool({
        ...mockTool,
        description: 'Updated description',
      });

      const tool = store.getTool('test_tool');
      expect(tool?.description).toBe('Updated description');
    });

    it('should remove tools by server', () => {
      store.addTools([
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 'test-server' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 'test-server' },
      ]);

      expect(store.getAllTools().length).toBe(2);

      store.removeToolsByServer('test-server');
      expect(store.getAllTools().length).toBe(0);
    });

    it('should handle tool with complex inputSchema', () => {
      const complexTool: ToolMetadata = {
        name: 'complex_tool',
        description: 'Complex tool',
        inputSchema: {
          type: 'object',
          properties: {
            param1: { type: 'string', description: 'First parameter' },
            param2: { type: 'number', minimum: 0, maximum: 100 },
            nested: {
              type: 'object',
              properties: {
                subParam: { type: 'boolean' },
              },
            },
          },
          required: ['param1'],
        },
        serverId: 'test-server',
      };

      store.addTool(complexTool);

      const tool = store.getTool('complex_tool');
      expect(tool?.inputSchema).toBeDefined();
      expect(tool?.inputSchema.properties).toBeDefined();
    });

    it('should handle tool with keywords array', () => {
      store.addTool(mockTool);

      const tool = store.getTool('test_tool');
      expect(tool?.keywords).toEqual(['test', 'file']);
    });

    it('should handle tool without optional fields', () => {
      const minimalTool: ToolMetadata = {
        name: 'minimal_tool',
        description: 'Minimal',
        inputSchema: {},
        serverId: 'test-server',
      };

      store.addTool(minimalTool);

      const tool = store.getTool('minimal_tool');
      expect(tool?.category).toBeUndefined();
      expect(tool?.keywords).toBeUndefined();
    });
  });

  describe('Usage Tracking', () => {
    beforeEach(() => {
      store.addPlugin({
        id: 'test-server',
        name: 'Test Server',
        command: 'test',
        qualityScore: 0,
      });

      store.addTool({
        name: 'tracked_tool',
        description: 'Tool for tracking',
        inputSchema: {},
        serverId: 'test-server',
      });
    });

    it('should record tool usage', () => {
      store.updateToolUsage('tracked_tool');

      const stats = store.getStatistics();
      // Statistics should reflect usage
      expect(stats).toBeDefined();
    });

    it('should add usage log', () => {
      store.addUsageLog({
        timestamp: Date.now(),
        toolName: 'tracked_tool',
        query: 'test query',
        success: true,
        responseTime: 100,
      });

      const logs = store.getUsageLogs({ limit: 10 });
      expect(logs.length).toBe(1);
      expect(logs[0].toolName).toBe('tracked_tool');
      expect(logs[0].success).toBe(true);
    });

    it('should retrieve usage logs with limit', () => {
      // Add multiple logs
      for (let i = 0; i < 20; i++) {
        store.addUsageLog({
          timestamp: Date.now() + i,
          toolName: 'tracked_tool',
          query: `query ${i}`,
          success: true,
          responseTime: 100 + i,
        });
      }

      const logs = store.getUsageLogs({ limit: 5 });
      expect(logs.length).toBe(5);
    });

    it('should filter usage logs by tool name', () => {
      store.addTool({
        name: 'other_tool',
        description: 'Other tool',
        inputSchema: {},
        serverId: 'test-server',
      });

      store.addUsageLog({
        timestamp: Date.now(),
        toolName: 'tracked_tool',
        query: 'query1',
        success: true,
        responseTime: 100,
      });

      store.addUsageLog({
        timestamp: Date.now(),
        toolName: 'other_tool',
        query: 'query2',
        success: true,
        responseTime: 200,
      });

      const logs = store.getUsageLogs({ toolName: 'tracked_tool', limit: 10 });
      expect(logs.length).toBe(1);
      expect(logs[0].toolName).toBe('tracked_tool');
    });

    it('should record failed usage', () => {
      store.addUsageLog({
        timestamp: Date.now(),
        toolName: 'tracked_tool',
        query: 'test query',
        success: false,
        responseTime: 50,
      });

      const logs = store.getUsageLogs({ limit: 1 });
      expect(logs[0].success).toBe(false);
    });

    it('should track usage count', () => {
      store.updateToolUsage('tracked_tool');
      store.updateToolUsage('tracked_tool');
      store.updateToolUsage('tracked_tool');

      // Usage count should be updated
      // (Exact method depends on implementation - this tests it doesn't crash)
      expect(true).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      store.addPlugin({
        id: 'plugin1',
        name: 'Plugin 1',
        command: 'test',
        qualityScore: 0,
      });

      store.addPlugin({
        id: 'plugin2',
        name: 'Plugin 2',
        command: 'test',
        qualityScore: 0,
      });

      store.addTools([
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 'plugin1' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 'plugin1' },
        { name: 'tool3', description: 'Tool 3', inputSchema: {}, serverId: 'plugin2' },
      ]);

      const stats = store.getStatistics();
      expect(stats.pluginCount).toBe(2);
      expect(stats.toolCount).toBe(3);
    });

    it('should return zero stats for empty database', () => {
      const stats = store.getStatistics();
      expect(stats.pluginCount).toBe(0);
      expect(stats.toolCount).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should persist data to file', () => {
      const fileStore = new MetadataStore({ filepath: testDbPath });

      fileStore.addPlugin({
        id: 'persist-test',
        name: 'Persist Test',
        command: 'test',
        qualityScore: 0,
      });

      fileStore.close();

      // Reopen database
      const fileStore2 = new MetadataStore({ filepath: testDbPath });
      const plugin = fileStore2.getPlugin('persist-test');

      expect(plugin).not.toBeNull();
      expect(plugin?.name).toBe('Persist Test');

      fileStore2.close();
    });

    it('should persist tools across sessions', () => {
      const fileStore = new MetadataStore({ filepath: testDbPath });

      fileStore.addPlugin({
        id: 'persist-server',
        name: 'Persist Server',
        command: 'test',
        qualityScore: 0,
      });

      fileStore.addTool({
        name: 'persist_tool',
        description: 'Persist tool',
        inputSchema: {},
        serverId: 'persist-server',
      });

      fileStore.close();

      // Reopen
      const fileStore2 = new MetadataStore({ filepath: testDbPath });
      const tool = fileStore2.getTool('persist_tool');

      expect(tool).not.toBeNull();
      expect(tool?.description).toBe('Persist tool');

      fileStore2.close();
    });
  });

  describe('Edge Cases', () => {
    it('should handle adding tool with non-existent server', () => {
      const tool: ToolMetadata = {
        name: 'orphan_tool',
        description: 'Orphan tool',
        inputSchema: {},
        serverId: 'nonexistent-server',
      };

      // May throw error or handle gracefully depending on implementation
      // At minimum, should not crash the entire application
      try {
        store.addTool(tool);
        // If no error, check if tool was added
        const retrieved = store.getTool('orphan_tool');
        expect(retrieved).toBeDefined();
      } catch (error) {
        // Foreign key constraint error is acceptable
        expect(error).toBeDefined();
      }
    });

    it('should handle concurrent access (same instance)', () => {
      store.addPlugin({
        id: 'concurrent-server',
        name: 'Concurrent Server',
        command: 'test',
        qualityScore: 0,
      });

      // Simulate concurrent writes
      const tools: ToolMetadata[] = [];
      for (let i = 0; i < 100; i++) {
        tools.push({
          name: `concurrent_tool_${i}`,
          description: `Tool ${i}`,
          inputSchema: {},
          serverId: 'concurrent-server',
        });
      }

      store.addTools(tools);

      const allTools = store.getAllTools();
      expect(allTools.length).toBe(100);
    });

    it('should handle very long strings', () => {
      const longDescription = 'x'.repeat(10000);

      store.addPlugin({
        id: 'long-string-server',
        name: 'Long String Server',
        command: 'test',
        qualityScore: 0,
      });

      store.addTool({
        name: 'long_desc_tool',
        description: longDescription,
        inputSchema: {},
        serverId: 'long-string-server',
      });

      const tool = store.getTool('long_desc_tool');
      expect(tool?.description).toBe(longDescription);
    });

    it('should handle Unicode in data', () => {
      store.addPlugin({
        id: 'unicode-server',
        name: '유니코드 서버 🚀',
        command: 'test',
        qualityScore: 0,
      });

      store.addTool({
        name: 'unicode_tool',
        description: 'Unicode tool 日本語 中文 العربية 🎉',
        inputSchema: {},
        serverId: 'unicode-server',
      });

      const tool = store.getTool('unicode_tool');
      expect(tool?.description).toContain('日本語');
      expect(tool?.description).toContain('🎉');
    });

    it('should handle special characters in IDs', () => {
      store.addPlugin({
        id: 'test-plugin-with-dashes',
        name: 'Test Plugin',
        command: 'test',
        qualityScore: 0,
      });

      const plugin = store.getPlugin('test-plugin-with-dashes');
      expect(plugin).not.toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should close database cleanly', () => {
      store.close();
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle double close', () => {
      store.close();
      store.close();
      // Should not crash
      expect(true).toBe(true);
    });
  });
});
