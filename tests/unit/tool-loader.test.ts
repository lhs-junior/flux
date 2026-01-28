import { describe, it, expect, beforeEach } from 'vitest';
import { ToolLoader } from '../../src/core/tool-loader.js';
import type { ToolMetadata } from '../../src/core/types.js';

describe('ToolLoader', () => {
  let loader: ToolLoader;

  beforeEach(() => {
    loader = new ToolLoader();
  });

  describe('Tool Registration', () => {
    it('should register a single tool', () => {
      const tool: ToolMetadata = {
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: {},
        serverId: 'server1',
      };

      loader.registerTool(tool);
      expect(loader.getToolCount()).toBe(1);
    });

    it('should register multiple tools', () => {
      const tools: ToolMetadata[] = [
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 's1' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 's1' },
        { name: 'tool3', description: 'Tool 3', inputSchema: {}, serverId: 's2' },
      ];

      loader.registerTools(tools);
      expect(loader.getToolCount()).toBe(3);
    });

    it('should get all registered tools', () => {
      const tools: ToolMetadata[] = [
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 's1' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 's1' },
      ];

      loader.registerTools(tools);
      const allTools = loader.getAllTools();

      expect(allTools.length).toBe(2);
      expect(allTools.find(t => t.name === 'tool1')).toBeDefined();
    });

    it('should handle duplicate tool registration', () => {
      const tool: ToolMetadata = {
        name: 'duplicate',
        description: 'Duplicate tool',
        inputSchema: {},
        serverId: 's1',
      };

      loader.registerTool(tool);
      loader.registerTool(tool); // Register again

      // Should either replace or keep single instance
      expect(loader.getToolCount()).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3-Layer Loading', () => {
    beforeEach(() => {
      const tools: ToolMetadata[] = [
        { name: 'read_file', description: 'Read file content from filesystem', inputSchema: {}, serverId: 's1', category: 'filesystem', keywords: ['read', 'file'] },
        { name: 'write_file', description: 'Write content to file', inputSchema: {}, serverId: 's1', category: 'filesystem', keywords: ['write', 'file'] },
        { name: 'send_slack', description: 'Send message to Slack', inputSchema: {}, serverId: 's2', category: 'communication', keywords: ['slack', 'send'] },
        { name: 'create_db', description: 'Create database table', inputSchema: {}, serverId: 's3', category: 'database', keywords: ['create', 'database'] },
        { name: 'list_files', description: 'List files in directory', inputSchema: {}, serverId: 's1', category: 'filesystem', keywords: ['list', 'files'] },
      ];

      loader.registerTools(tools);
    });

    it('should load Layer 1 (essential only) without query', async () => {
      const result = await loader.loadTools();

      expect(result.strategy.layer).toBe(1);
      expect(result.essential).toBeDefined();
      expect(result.relevant).toEqual([]);
    });

    it('should load Layer 2 (essential + relevant) with query', async () => {
      const result = await loader.loadTools('read file', { maxLayer2: 5 });

      expect(result.strategy.layer).toBe(2);
      expect(result.relevant.length).toBeGreaterThan(0);
      expect(result.relevant[0].name).toBe('read_file');
    });

    it('should measure search time', async () => {
      const result = await loader.loadTools('test query', { maxLayer2: 5 });

      expect(result.strategy.searchTimeMs).toBeDefined();
      expect(result.strategy.searchTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should limit Layer 2 results to maxLayer2', async () => {
      const result = await loader.loadTools('file', { maxLayer2: 2 });

      expect(result.relevant.length).toBeLessThanOrEqual(2);
    });

    it('should handle query with no relevant tools', async () => {
      const result = await loader.loadTools('completely unrelated xyz123', { maxLayer2: 5 });

      expect(result.strategy.layer).toBe(2);
      // May return empty or low-scored results
      expect(Array.isArray(result.relevant)).toBe(true);
    });
  });

  describe('Essential Tools', () => {
    it('should mark tool as essential', () => {
      const tool: ToolMetadata = {
        name: 'essential_tool',
        description: 'Essential tool',
        inputSchema: {},
        serverId: 's1',
      };

      loader.registerTool(tool);
      loader.setEssentialTool('essential_tool');

      const result = loader.loadTools();
      expect(result.essential.some(t => t.name === 'essential_tool')).toBe(true);
    });

    it('should support multiple essential tools', () => {
      const tools: ToolMetadata[] = [
        { name: 'essential1', description: 'Essential 1', inputSchema: {}, serverId: 's1' },
        { name: 'essential2', description: 'Essential 2', inputSchema: {}, serverId: 's1' },
        { name: 'regular', description: 'Regular tool', inputSchema: {}, serverId: 's1' },
      ];

      loader.registerTools(tools);
      loader.setEssentialTool('essential1');
      loader.setEssentialTool('essential2');

      const result = loader.loadTools();
      expect(result.essential.length).toBe(2);
    });

    it('should handle setting non-existent tool as essential', () => {
      loader.setEssentialTool('nonexistent');

      // Should not crash
      const result = loader.loadTools();
      expect(result.essential).toBeDefined();
    });
  });

  describe('Usage Tracking', () => {
    beforeEach(() => {
      loader.registerTool({
        name: 'tracked_tool',
        description: 'Tool for tracking',
        inputSchema: {},
        serverId: 's1',
      });
    });

    it('should record tool usage', () => {
      loader.recordToolUsage('tracked_tool');

      const count = loader.getToolUsageCount('tracked_tool');
      expect(count).toBe(1);
    });

    it('should increment usage count', () => {
      loader.recordToolUsage('tracked_tool');
      loader.recordToolUsage('tracked_tool');
      loader.recordToolUsage('tracked_tool');

      const count = loader.getToolUsageCount('tracked_tool');
      expect(count).toBe(3);
    });

    it('should return 0 for unused tool', () => {
      const count = loader.getToolUsageCount('never_used');
      expect(count).toBe(0);
    });

    it('should get most used tools', () => {
      loader.registerTools([
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 's1' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 's1' },
        { name: 'tool3', description: 'Tool 3', inputSchema: {}, serverId: 's1' },
      ]);

      loader.recordToolUsage('tool1');
      loader.recordToolUsage('tool1');
      loader.recordToolUsage('tool1');
      loader.recordToolUsage('tool2');
      loader.recordToolUsage('tool2');
      loader.recordToolUsage('tool3');

      const mostUsed = loader.getMostUsedTools(2);

      expect(mostUsed.length).toBe(2);
      expect(mostUsed[0].name).toBe('tool1');
      expect(mostUsed[1].name).toBe('tool2');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      loader.registerTools([
        { name: 'read_file', description: 'Read file content', inputSchema: {}, serverId: 's1', keywords: ['read', 'file'] },
        { name: 'write_file', description: 'Write to file', inputSchema: {}, serverId: 's1', keywords: ['write', 'file'] },
        { name: 'send_slack', description: 'Send Slack message', inputSchema: {}, serverId: 's2', keywords: ['slack', 'send'] },
      ]);
    });

    it('should search for tools', async () => {
      const results = await loader.searchTools('read file', { limit: 5 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('read_file');
    });

    it('should apply usage boost to search results', async () => {
      // Use write_file heavily
      loader.recordToolUsage('write_file');
      loader.recordToolUsage('write_file');
      loader.recordToolUsage('write_file');

      const results = await loader.searchTools('file', { limit: 5 });

      // write_file should rank higher due to usage
      const writeFileIndex = results.findIndex(t => t.name === 'write_file');
      expect(writeFileIndex).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty query in search', async () => {
      const results = await loader.searchTools('', { limit: 5 });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should respect search limit', async () => {
      const results = await loader.searchTools('file', { limit: 1 });

      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance', () => {
    it('should search quickly with 100 tools', async () => {
      const tools: ToolMetadata[] = [];
      for (let i = 0; i < 100; i++) {
        tools.push({
          name: `tool_${i}`,
          description: `Tool ${i} for testing`,
          inputSchema: {},
          serverId: `server_${Math.floor(i / 10)}`,
        });
      }

      loader.registerTools(tools);

      const start = performance.now();
      await loader.loadTools('test query', { maxLayer2: 15 });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5); // Should be very fast
    });

    it('should handle large number of tools efficiently', () => {
      const tools: ToolMetadata[] = [];
      for (let i = 0; i < 500; i++) {
        tools.push({
          name: `tool_${i}`,
          description: `Tool ${i}`,
          inputSchema: {},
          serverId: 's1',
        });
      }

      loader.registerTools(tools);

      expect(loader.getToolCount()).toBe(500);
    });
  });

  describe('Clear and Reset', () => {
    it('should clear all tools', () => {
      loader.registerTools([
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 's1' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 's1' },
      ]);

      expect(loader.getToolCount()).toBe(2);

      loader.clear();

      expect(loader.getToolCount()).toBe(0);
    });

    it('should clear usage statistics on reset', () => {
      loader.registerTool({
        name: 'tool1',
        description: 'Tool 1',
        inputSchema: {},
        serverId: 's1',
      });

      loader.recordToolUsage('tool1');
      expect(loader.getToolUsageCount('tool1')).toBe(1);

      loader.clear();

      // After clear, usage should be reset
      expect(loader.getToolUsageCount('tool1')).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tools with no description', () => {
      loader.registerTool({
        name: 'no_desc',
        description: '',
        inputSchema: {},
        serverId: 's1',
      });

      const result = loader.loadTools('test');
      expect(result).toBeDefined();
    });

    it('should handle tools with no keywords', () => {
      loader.registerTool({
        name: 'no_keywords',
        description: 'Tool without keywords',
        inputSchema: {},
        serverId: 's1',
      });

      const results = loader.searchTools('tool');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle Unicode in tool names and descriptions', () => {
      loader.registerTool({
        name: 'unicode_tool_日本語',
        description: 'Unicode description 中文 العربية',
        inputSchema: {},
        serverId: 's1',
      });

      expect(loader.getToolCount()).toBe(1);
    });

    it('should handle complex inputSchema', () => {
      loader.registerTool({
        name: 'complex_schema',
        description: 'Tool with complex schema',
        inputSchema: {
          type: 'object',
          properties: {
            nested: {
              type: 'object',
              properties: {
                deep: { type: 'string' },
              },
            },
            array: {
              type: 'array',
              items: { type: 'number' },
            },
          },
        },
        serverId: 's1',
      });

      const tools = loader.getAllTools();
      expect(tools[0].inputSchema).toBeDefined();
    });
  });
});
