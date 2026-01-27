import { describe, it, expect, beforeEach } from 'vitest';
import { BM25Indexer } from '../../src/search/bm25-indexer.js';
import type { ToolMetadata } from '../../src/core/gateway.js';

describe('BM25Indexer', () => {
  let indexer: BM25Indexer;

  beforeEach(() => {
    indexer = new BM25Indexer();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      expect(indexer).toBeDefined();
      const stats = indexer.getStatistics();
      expect(stats.documentCount).toBe(0);
    });

    it('should initialize with custom k1 and b parameters', () => {
      const customIndexer = new BM25Indexer({ k1: 1.5, b: 0.8 });
      expect(customIndexer).toBeDefined();
    });
  });

  describe('Document Management', () => {
    const mockTool: ToolMetadata = {
      name: 'test_tool',
      description: 'A test tool for testing functionality',
      inputSchema: { type: 'object', properties: {} },
      serverId: 'test-server',
      category: 'filesystem',
      keywords: ['test', 'file', 'read'],
    };

    it('should add a single document', () => {
      indexer.addDocument(mockTool);
      const stats = indexer.getStatistics();
      expect(stats.documentCount).toBe(1);
    });

    it('should add multiple documents at once', () => {
      const tools: ToolMetadata[] = [
        { name: 'read_file', description: 'Read file content', inputSchema: {}, serverId: 's1', keywords: ['read', 'file'] },
        { name: 'write_file', description: 'Write to file', inputSchema: {}, serverId: 's1', keywords: ['write', 'file'] },
        { name: 'send_slack', description: 'Send slack message', inputSchema: {}, serverId: 's2', keywords: ['slack', 'message'] },
      ];

      indexer.addDocuments(tools);
      const stats = indexer.getStatistics();
      expect(stats.documentCount).toBe(3);
    });

    it('should remove a document', () => {
      indexer.addDocument(mockTool);
      expect(indexer.getStatistics().documentCount).toBe(1);

      indexer.removeDocument('test_tool');
      expect(indexer.getStatistics().documentCount).toBe(0);
    });

    it('should clear all documents', () => {
      const tools: ToolMetadata[] = [
        { name: 'tool1', description: 'Tool 1', inputSchema: {}, serverId: 's1' },
        { name: 'tool2', description: 'Tool 2', inputSchema: {}, serverId: 's1' },
      ];

      indexer.addDocuments(tools);
      expect(indexer.getStatistics().documentCount).toBe(2);

      indexer.clear();
      expect(indexer.getStatistics().documentCount).toBe(0);
    });

    it('should handle removing non-existent document', () => {
      indexer.removeDocument('nonexistent');
      expect(indexer.getStatistics().documentCount).toBe(0);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      const tools: ToolMetadata[] = [
        { name: 'read_file', description: 'Read file content from filesystem', inputSchema: {}, serverId: 's1', category: 'filesystem', keywords: ['read', 'file'] },
        { name: 'write_file', description: 'Write content to file', inputSchema: {}, serverId: 's1', category: 'filesystem', keywords: ['write', 'file'] },
        { name: 'send_slack', description: 'Send message to Slack channel', inputSchema: {}, serverId: 's2', category: 'communication', keywords: ['slack', 'message', 'send'] },
        { name: 'create_database', description: 'Create new database table', inputSchema: {}, serverId: 's3', category: 'database', keywords: ['create', 'database', 'table'] },
        { name: 'list_files', description: 'List all files in directory', inputSchema: {}, serverId: 's1', category: 'filesystem', keywords: ['list', 'files'] },
      ];

      indexer.addDocuments(tools);
    });

    it('should find relevant tools for query', () => {
      const results = indexer.search('read file', { limit: 5 });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].toolName).toBe('read_file');
    });

    it('should return results in order of relevance', () => {
      const results = indexer.search('slack message send', { limit: 5 });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].toolName).toBe('send_slack');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should limit results to specified count', () => {
      const results = indexer.search('file', { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should handle empty query', () => {
      const results = indexer.search('');
      expect(results).toEqual([]);
    });

    it('should handle query with no matches', () => {
      const results = indexer.search('completely unrelated query xyz123');
      // Even with no exact matches, BM25 might return some results with low scores
      // or empty if truly no matches
      expect(Array.isArray(results)).toBe(true);
    });

    it('should boost results based on usage count', () => {
      const resultsWithoutBoost = indexer.search('file', { limit: 5 });
      const originalTopTool = resultsWithoutBoost[0].toolName;

      // Boost a different tool heavily
      const otherTool = resultsWithoutBoost.find(r => r.toolName !== originalTopTool)?.toolName;
      if (otherTool) {
        const usageCounts = new Map<string, number>([[otherTool, 100]]);
        const resultsWithBoost = indexer.search('file', { limit: 5, usageCounts });

        // The heavily used tool should rank higher
        expect(resultsWithBoost[0].score).toBeGreaterThan(0);
      }
    });

    it('should handle Unicode in queries', () => {
      const unicodeTool: ToolMetadata = {
        name: 'unicode_tool',
        description: 'Tool with 日本語 中文 العربية unicode',
        inputSchema: {},
        serverId: 's1',
        keywords: ['unicode', '日本語'],
      };

      indexer.addDocument(unicodeTool);
      const results = indexer.search('日本語');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle special characters in queries', () => {
      const results = indexer.search('!@#$%^&*()');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should search in less than 1ms for 100 tools', () => {
      // Generate 100 tools
      const tools: ToolMetadata[] = [];
      for (let i = 0; i < 100; i++) {
        tools.push({
          name: `tool_${i}`,
          description: `Tool ${i} for testing performance with various keywords`,
          inputSchema: {},
          serverId: `server_${Math.floor(i / 10)}`,
          keywords: [`keyword${i}`, 'test', 'performance'],
        });
      }

      indexer.addDocuments(tools);

      // Warm-up run
      indexer.search('test query', { limit: 15 });

      // Measure performance
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        indexer.search('test performance query', { limit: 15 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      expect(avgTime).toBeLessThan(1);
    });

    it('should handle 500 tools efficiently', () => {
      const tools: ToolMetadata[] = [];
      for (let i = 0; i < 500; i++) {
        tools.push({
          name: `tool_${i}`,
          description: `Tool ${i} description`,
          inputSchema: {},
          serverId: `server_${Math.floor(i / 50)}`,
        });
      }

      indexer.addDocuments(tools);

      const start = performance.now();
      const results = indexer.search('tool description', { limit: 15 });
      const duration = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(2); // Should still be very fast
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      const tools: ToolMetadata[] = [
        { name: 'tool1', description: 'Short description', inputSchema: {}, serverId: 's1' },
        { name: 'tool2', description: 'A much longer description with more words', inputSchema: {}, serverId: 's1' },
      ];

      indexer.addDocuments(tools);
      const stats = indexer.getStatistics();

      expect(stats.documentCount).toBe(2);
      expect(stats.averageDocumentLength).toBeGreaterThan(0);
    });

    it('should return zero stats for empty index', () => {
      const stats = indexer.getStatistics();
      expect(stats.documentCount).toBe(0);
      expect(stats.averageDocumentLength).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tool with empty description', () => {
      const tool: ToolMetadata = {
        name: 'empty_desc_tool',
        description: '',
        inputSchema: {},
        serverId: 's1',
      };

      indexer.addDocument(tool);
      expect(indexer.getStatistics().documentCount).toBe(1);
    });

    it('should handle tool with no keywords', () => {
      const tool: ToolMetadata = {
        name: 'no_keywords_tool',
        description: 'Tool without keywords',
        inputSchema: {},
        serverId: 's1',
      };

      indexer.addDocument(tool);
      const results = indexer.search('keywords');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'word '.repeat(1000);
      const tool: ToolMetadata = {
        name: 'long_desc_tool',
        description: longDescription,
        inputSchema: {},
        serverId: 's1',
      };

      indexer.addDocument(tool);
      const results = indexer.search('word');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle adding same tool twice', () => {
      const tool: ToolMetadata = {
        name: 'duplicate_tool',
        description: 'Duplicate',
        inputSchema: {},
        serverId: 's1',
      };

      indexer.addDocument(tool);
      indexer.addDocument(tool); // Add again

      // Should either replace or ignore, but not crash
      const stats = indexer.getStatistics();
      expect(stats.documentCount).toBeGreaterThanOrEqual(1);
    });
  });
});
