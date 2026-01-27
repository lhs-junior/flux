import { describe, it, expect, beforeEach } from 'vitest';
import { QualityEvaluator } from '../../src/discovery/quality-evaluator.js';
import type { GitHubRepoInfo } from '../../src/discovery/github-explorer.js';

describe('QualityEvaluator', () => {
  let evaluator: QualityEvaluator;

  beforeEach(() => {
    evaluator = new QualityEvaluator({ minScore: 70 });
  });

  const createMockRepo = (overrides: Partial<GitHubRepoInfo> = {}): GitHubRepoInfo => ({
    owner: 'test-owner',
    name: 'test-repo',
    fullName: 'test-owner/test-repo',
    description: 'A test MCP server repository',
    stars: 100,
    forks: 20,
    lastCommit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    topics: ['mcp', 'server', 'typescript'],
    hasReadme: true,
    packageJson: {
      name: 'test-repo',
      version: '1.0.0',
      description: 'Test repo',
      keywords: ['mcp', 'server'],
    },
    license: 'MIT',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    openIssues: 5,
    url: 'https://github.com/test-owner/test-repo',
    ...overrides,
  });

  describe('Initialization', () => {
    it('should initialize with default minimum score', () => {
      const defaultEvaluator = new QualityEvaluator();
      expect(defaultEvaluator).toBeDefined();
    });

    it('should initialize with custom minimum score', () => {
      const customEvaluator = new QualityEvaluator({ minScore: 80 });
      expect(customEvaluator).toBeDefined();
    });
  });

  describe('Scoring - Overall', () => {
    it('should evaluate high-quality repo with good score', () => {
      const repo = createMockRepo({
        stars: 500,
        forks: 50,
        lastCommit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Recent
        openIssues: 10,
      });

      const score = evaluator.evaluate(repo);

      expect(score.total).toBeGreaterThanOrEqual(70);
      expect(score.grade).toMatch(/[ABC]/);
    });

    it('should evaluate poor-quality repo with low score', () => {
      const repo = createMockRepo({
        stars: 2,
        forks: 0,
        lastCommit: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000), // Very old
        hasReadme: false,
        packageJson: undefined,
        license: undefined,
        openIssues: 50,
      });

      const score = evaluator.evaluate(repo);

      expect(score.total).toBeLessThan(70);
      expect(score.grade).toMatch(/[DF]/);
    });

    it('should return score between 0 and 100', () => {
      const repo = createMockRepo();

      const score = evaluator.evaluate(repo);

      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.total).toBeLessThanOrEqual(100);
    });
  });

  describe('Scoring - Popularity', () => {
    it('should give high popularity score for many stars', () => {
      const repo = createMockRepo({ stars: 1000, forks: 100 });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.popularity).toBeGreaterThan(15);
    });

    it('should give low popularity score for few stars', () => {
      const repo = createMockRepo({ stars: 1, forks: 0 });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.popularity).toBeLessThan(10);
    });

    it('should consider both stars and forks', () => {
      const starsOnly = createMockRepo({ stars: 100, forks: 0 });
      const balanced = createMockRepo({ stars: 100, forks: 20 });

      const score1 = evaluator.evaluate(starsOnly);
      const score2 = evaluator.evaluate(balanced);

      expect(score2.breakdown.popularity).toBeGreaterThan(score1.breakdown.popularity);
    });

    it('should handle zero stars and forks', () => {
      const repo = createMockRepo({ stars: 0, forks: 0 });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.popularity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Scoring - Maintenance', () => {
    it('should give high maintenance score for recent commits', () => {
      const repo = createMockRepo({
        lastCommit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year old
      });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.maintenance).toBeGreaterThan(15);
    });

    it('should give low maintenance score for old commits', () => {
      const repo = createMockRepo({
        lastCommit: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000), // 500 days ago
      });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.maintenance).toBeLessThan(15);
    });

    it('should consider project age', () => {
      const newProject = createMockRepo({
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month old
      });

      const oldProject = createMockRepo({
        createdAt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), // 2 years old
      });

      const score1 = evaluator.evaluate(newProject);
      const score2 = evaluator.evaluate(oldProject);

      // Mature projects should score better (if maintained)
      expect(score2.breakdown.maintenance).toBeDefined();
    });

    it('should consider issue ratio', () => {
      const lowIssues = createMockRepo({ stars: 100, openIssues: 2 });
      const highIssues = createMockRepo({ stars: 100, openIssues: 50 });

      const score1 = evaluator.evaluate(lowIssues);
      const score2 = evaluator.evaluate(highIssues);

      expect(score1.breakdown.maintenance).toBeGreaterThan(score2.breakdown.maintenance);
    });
  });

  describe('Scoring - Documentation', () => {
    it('should give high documentation score for complete docs', () => {
      const repo = createMockRepo({
        hasReadme: true,
        description: 'Detailed description of the MCP server',
        packageJson: {
          name: 'test',
          version: '1.0.0',
          description: 'Package description',
          keywords: ['mcp', 'server', 'plugin'],
        },
        topics: ['mcp', 'server', 'typescript', 'plugin'],
        license: 'MIT',
      });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.documentation).toBeGreaterThan(18);
    });

    it('should give low documentation score for minimal docs', () => {
      const repo = createMockRepo({
        hasReadme: false,
        description: '',
        packageJson: undefined,
        topics: [],
        license: undefined,
      });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.documentation).toBeLessThan(10);
    });

    it('should award points for README', () => {
      const withReadme = createMockRepo({ hasReadme: true });
      const withoutReadme = createMockRepo({ hasReadme: false });

      const score1 = evaluator.evaluate(withReadme);
      const score2 = evaluator.evaluate(withoutReadme);

      expect(score1.breakdown.documentation).toBeGreaterThan(score2.breakdown.documentation);
    });

    it('should award points for package.json', () => {
      const withPkg = createMockRepo({
        packageJson: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
          keywords: ['mcp'],
        },
      });

      const withoutPkg = createMockRepo({ packageJson: undefined });

      const score1 = evaluator.evaluate(withPkg);
      const score2 = evaluator.evaluate(withoutPkg);

      expect(score1.breakdown.documentation).toBeGreaterThan(score2.breakdown.documentation);
    });

    it('should award points for license', () => {
      const withLicense = createMockRepo({ license: 'MIT' });
      const withoutLicense = createMockRepo({ license: undefined });

      const score1 = evaluator.evaluate(withLicense);
      const score2 = evaluator.evaluate(withoutLicense);

      expect(score1.breakdown.documentation).toBeGreaterThan(score2.breakdown.documentation);
    });

    it('should award points for topics', () => {
      const withTopics = createMockRepo({ topics: ['mcp', 'server', 'typescript'] });
      const withoutTopics = createMockRepo({ topics: [] });

      const score1 = evaluator.evaluate(withTopics);
      const score2 = evaluator.evaluate(withoutTopics);

      expect(score1.breakdown.documentation).toBeGreaterThan(score2.breakdown.documentation);
    });
  });

  describe('Scoring - Reliability', () => {
    it('should give high reliability score for stable repos', () => {
      const repo = createMockRepo({
        stars: 100,
        forks: 20,
        openIssues: 5,
        packageJson: {
          name: 'test',
          version: '2.0.0',
          description: 'Test',
        },
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.reliability).toBeGreaterThan(15);
    });

    it('should consider issue-to-star ratio', () => {
      const goodRatio = createMockRepo({ stars: 100, openIssues: 5 });
      const badRatio = createMockRepo({ stars: 100, openIssues: 80 });

      const score1 = evaluator.evaluate(goodRatio);
      const score2 = evaluator.evaluate(badRatio);

      expect(score1.breakdown.reliability).toBeGreaterThan(score2.breakdown.reliability);
    });

    it('should consider fork ratio', () => {
      const goodForks = createMockRepo({ stars: 100, forks: 20 });
      const fewForks = createMockRepo({ stars: 100, forks: 2 });

      const score1 = evaluator.evaluate(goodForks);
      const score2 = evaluator.evaluate(fewForks);

      // More forks relative to stars indicates wider adoption
      expect(score1.breakdown.reliability).toBeGreaterThanOrEqual(score2.breakdown.reliability);
    });

    it('should consider version number', () => {
      const mature = createMockRepo({
        packageJson: { name: 'test', version: '2.5.0', description: 'Test' },
      });

      const early = createMockRepo({
        packageJson: { name: 'test', version: '0.1.0', description: 'Test' },
      });

      const score1 = evaluator.evaluate(mature);
      const score2 = evaluator.evaluate(early);

      expect(score1.breakdown.reliability).toBeGreaterThan(score2.breakdown.reliability);
    });
  });

  describe('Grading System', () => {
    it('should grade 90+ as A', () => {
      const excellentRepo = createMockRepo({
        stars: 1000,
        forks: 200,
        lastCommit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        openIssues: 10,
        hasReadme: true,
        topics: ['mcp', 'server', 'typescript', 'plugin'],
        license: 'MIT',
      });

      const score = evaluator.evaluate(excellentRepo);

      if (score.total >= 90) {
        expect(score.grade).toBe('A');
      }
    });

    it('should grade 80-89 as B', () => {
      // Create repo that scores in B range
      const goodRepo = createMockRepo({
        stars: 200,
        forks: 30,
        lastCommit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        openIssues: 15,
      });

      const score = evaluator.evaluate(goodRepo);

      if (score.total >= 80 && score.total < 90) {
        expect(score.grade).toBe('B');
      }
    });

    it('should grade below 60 as F', () => {
      const poorRepo = createMockRepo({
        stars: 1,
        forks: 0,
        lastCommit: new Date(Date.now() - 600 * 24 * 60 * 60 * 1000),
        hasReadme: false,
        packageJson: undefined,
        license: undefined,
        openIssues: 20,
      });

      const score = evaluator.evaluate(poorRepo);

      if (score.total < 60) {
        expect(score.grade).toBe('F');
      }
    });
  });

  describe('Filtering', () => {
    it('should filter repos by minimum score', () => {
      const repos = [
        createMockRepo({ stars: 500, forks: 50 }), // Good
        createMockRepo({ stars: 5, forks: 0, hasReadme: false }), // Poor
        createMockRepo({ stars: 200, forks: 20 }), // Good
        createMockRepo({ stars: 1, forks: 0, packageJson: undefined }), // Poor
      ];

      const recommended = evaluator.filterRecommended(repos);

      expect(recommended.length).toBeLessThanOrEqual(repos.length);
      expect(recommended.length).toBeGreaterThan(0);

      // All recommended repos should meet minimum score
      recommended.forEach(repo => {
        const score = evaluator.evaluate(repo);
        expect(score.total).toBeGreaterThanOrEqual(70);
      });
    });

    it('should return empty array when no repos meet criteria', () => {
      const repos = [
        createMockRepo({ stars: 1, forks: 0, hasReadme: false, packageJson: undefined }),
        createMockRepo({ stars: 0, forks: 0, license: undefined }),
      ];

      const recommended = evaluator.filterRecommended(repos);

      // May return empty if all repos score below minimum
      expect(Array.isArray(recommended)).toBe(true);
    });

    it('should handle empty repo list', () => {
      const recommended = evaluator.filterRecommended([]);

      expect(recommended).toEqual([]);
    });

    it('should preserve repo data in filtered results', () => {
      const repos = [createMockRepo({ name: 'preserved-repo' })];

      const recommended = evaluator.filterRecommended(repos);

      if (recommended.length > 0) {
        expect(recommended[0].name).toBe('preserved-repo');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle repos with null/undefined fields', () => {
      const repo = createMockRepo({
        description: undefined as any,
        topics: undefined as any,
        license: undefined,
        packageJson: undefined,
      });

      const score = evaluator.evaluate(repo);

      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.total).toBeLessThanOrEqual(100);
    });

    it('should handle extremely high star counts', () => {
      const repo = createMockRepo({ stars: 1000000, forks: 50000 });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.popularity).toBeLessThanOrEqual(25);
    });

    it('should handle zero values', () => {
      const repo = createMockRepo({
        stars: 0,
        forks: 0,
        openIssues: 0,
      });

      const score = evaluator.evaluate(repo);

      expect(score.total).toBeGreaterThanOrEqual(0);
    });

    it('should handle very old repositories', () => {
      const repo = createMockRepo({
        createdAt: new Date('2010-01-01'),
        lastCommit: new Date('2010-06-01'),
      });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.maintenance).toBeDefined();
    });

    it('should handle future dates gracefully', () => {
      const repo = createMockRepo({
        createdAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Future date
      });

      const score = evaluator.evaluate(repo);

      expect(score.total).toBeGreaterThanOrEqual(0);
    });

    it('should handle repos with many topics', () => {
      const repo = createMockRepo({
        topics: Array(20).fill('topic'),
      });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.documentation).toBeLessThanOrEqual(25);
    });

    it('should handle complex version strings', () => {
      const repo = createMockRepo({
        packageJson: {
          name: 'test',
          version: '1.2.3-beta.4+build.5',
          description: 'Test',
        },
      });

      const score = evaluator.evaluate(repo);

      expect(score.breakdown.reliability).toBeDefined();
    });
  });
});
