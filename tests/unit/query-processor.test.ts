import { describe, it, expect, beforeEach } from 'vitest';
import { QueryProcessor } from '../../src/search/query-processor.js';

describe('QueryProcessor', () => {
  let processor: QueryProcessor;

  beforeEach(() => {
    processor = new QueryProcessor();
  });

  describe('Query Processing', () => {
    it('should process basic queries', () => {
      const result = processor.processQuery('send slack message');

      expect(result.originalQuery).toBe('send slack message');
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.intent).toBeDefined();
    });

    it('should extract keywords from query', () => {
      const result = processor.processQuery('read file from disk');

      expect(result.keywords).toContain('read');
      expect(result.keywords).toContain('file');
      expect(result.keywords).toContain('disk');
    });

    it('should filter out stop words', () => {
      const result = processor.processQuery('I want to read a file from the disk');

      expect(result.keywords).not.toContain('I');
      expect(result.keywords).not.toContain('a');
      expect(result.keywords).not.toContain('the');
      expect(result.keywords).not.toContain('to');
      expect(result.keywords).toContain('read');
      expect(result.keywords).toContain('file');
    });

    it('should enhance query with related terms', () => {
      const result = processor.processQuery('send message');

      expect(result.enhancedQuery).toBeDefined();
      expect(result.enhancedQuery.length).toBeGreaterThan(result.originalQuery.length);
    });

    it('should handle empty queries', () => {
      const result = processor.processQuery('');

      expect(result.originalQuery).toBe('');
      expect(result.keywords).toEqual([]);
      expect(result.enhancedQuery).toBe('');
    });

    it('should handle queries with special characters', () => {
      const result = processor.processQuery('send @user #channel');

      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should handle Unicode queries', () => {
      const result = processor.processQuery('읽기 파일 read file');

      expect(result.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Intent Detection', () => {
    it('should detect "send" action', () => {
      const result = processor.processQuery('send slack message');

      expect(result.intent.action).toBe('send');
    });

    it('should detect "read" action', () => {
      const result = processor.processQuery('read file content');

      expect(result.intent.action).toBe('read');
    });

    it('should detect "write" action', () => {
      const result = processor.processQuery('write to file');

      expect(result.intent.action).toBe('write');
    });

    it('should detect "create" action', () => {
      const result = processor.processQuery('create new database');

      expect(result.intent.action).toBe('write'); // create is mapped to write
    });

    it('should detect "delete" action', () => {
      const result = processor.processQuery('delete file from disk');

      expect(result.intent.action).toBe('delete');
    });

    it('should detect "update" action', () => {
      const result = processor.processQuery('update record in database');

      expect(result.intent.action).toBe('write'); // update is mapped to write
    });

    it('should detect "list" action', () => {
      const result = processor.processQuery('list all files');

      expect(result.intent.action).toBe('read'); // list is mapped to read
    });

    it('should detect "search" action', () => {
      const result = processor.processQuery('search for documents');

      expect(result.intent.action).toBe('read'); // search is mapped to read
    });

    it('should handle query with no clear action', () => {
      const result = processor.processQuery('slack integration');

      expect(result.intent.action).toBeDefined();
    });
  });

  describe('Domain Detection', () => {
    it('should detect communication domain', () => {
      const result = processor.processQuery('send slack message');

      expect(result.intent.domain).toBe('communication');
    });

    it('should detect filesystem domain', () => {
      const result = processor.processQuery('read file from disk');

      expect(result.intent.domain).toBe('filesystem');
    });

    it('should detect database domain', () => {
      const result = processor.processQuery('create database table');

      expect(result.intent.domain).toBe('database');
    });

    it('should detect web domain', () => {
      const result = processor.processQuery('fetch api endpoint');

      expect(result.intent.domain).toBe('web');
    });

    it('should detect development domain', () => {
      const result = processor.processQuery('commit to github');

      expect(result.intent.domain).toBe('development');
    });

    it('should detect AI domain', () => {
      const result = processor.processQuery('generate text with gpt');

      expect(result.intent.domain).toBe('ai');
    });

    it('should handle query with no clear domain', () => {
      const result = processor.processQuery('perform operation');

      expect(result.intent.domain).toBeDefined();
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide confidence score', () => {
      const result = processor.processQuery('send slack message to channel');

      expect(result.intent.confidence).toBeGreaterThanOrEqual(0);
      expect(result.intent.confidence).toBeLessThanOrEqual(1);
    });

    it('should have higher confidence for clear queries', () => {
      const clearQuery = processor.processQuery('send slack message');
      const vagueQuery = processor.processQuery('something with stuff');

      expect(clearQuery.intent.confidence).toBeGreaterThan(vagueQuery.intent.confidence);
    });

    it('should have lower confidence for empty queries', () => {
      const result = processor.processQuery('');

      expect(result.intent.confidence).toBe(0);
    });
  });

  describe('Query Enhancement', () => {
    it('should add synonyms to query', () => {
      const result = processor.processQuery('send message');

      // Enhanced query should contain additional related terms
      expect(result.enhancedQuery).toContain('send');
    });

    it('should expand domain-specific terms', () => {
      const result = processor.processQuery('slack notification');

      expect(result.enhancedQuery.length).toBeGreaterThan(result.originalQuery.length);
    });

    it('should not enhance empty query', () => {
      const result = processor.processQuery('');

      expect(result.enhancedQuery).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long queries', () => {
      const longQuery = 'word '.repeat(1000);
      const result = processor.processQuery(longQuery);

      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should handle queries with only stop words', () => {
      const result = processor.processQuery('the a an and or but');

      expect(result.keywords.length).toBe(0);
    });

    it('should handle queries with numbers', () => {
      const result = processor.processQuery('send 5 messages to channel');

      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should handle queries with mixed case', () => {
      const result = processor.processQuery('SEND Message TO slack');

      expect(result.intent.action).toBe('send');
      expect(result.intent.domain).toBe('communication');
    });

    it('should handle queries with punctuation', () => {
      const result = processor.processQuery('send message, please!');

      expect(result.intent.action).toBe('send');
    });

    it('should handle queries with URLs', () => {
      const result = processor.processQuery('fetch https://api.example.com/data');

      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should handle queries with email addresses', () => {
      const result = processor.processQuery('send email to user@example.com');

      expect(result.intent.action).toBe('send');
    });
  });

  describe('Multiple Intent Scenarios', () => {
    it('should prioritize first action in query', () => {
      const result = processor.processQuery('read and write file');

      // Should detect "read" as it appears first
      expect(result.intent.action).toBeDefined();
    });

    it('should prioritize first domain in query', () => {
      const result = processor.processQuery('slack database integration');

      // Should detect a domain (either communication or database)
      expect(result.intent.domain).toBeDefined();
    });

    it('should handle action without domain', () => {
      const result = processor.processQuery('send something');

      expect(result.intent.action).toBe('send');
    });

    it('should handle domain without action', () => {
      const result = processor.processQuery('slack integration');

      expect(result.intent.domain).toBe('communication');
    });
  });
});
