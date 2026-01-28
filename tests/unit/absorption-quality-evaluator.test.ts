import { describe, it, expect, beforeEach } from 'vitest';
import {
  QualityEvaluator,
  type ProjectInfo,
  type EvaluationContext,
  type EnhancedQualityScore,
} from '../../src/absorption/quality-evaluator.js';

describe('QualityEvaluator - Absorption System', () => {
  let evaluator: QualityEvaluator;
  let context: EvaluationContext;

  beforeEach(() => {
    context = {
      existingTools: ['memory_save', 'memory_recall', 'agent_spawn', 'plan_create'],
      existingFeatures: ['memory', 'agents', 'planning', 'tdd', 'guide', 'science'],
      currentComplexity: 5,
    };
    evaluator = new QualityEvaluator(context);
  });

  const createMockProject = (overrides: Partial<ProjectInfo> = {}): ProjectInfo => ({
    name: 'test-project',
    repo: 'https://github.com/test/test-project',
    description: 'A test project for MCP integration',
    stars: 100,
    forks: 20,
    lastCommit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    license: 'MIT',
    dependencies: ['typescript', 'node'],
    complexity: 'medium',
    ...overrides,
  });

  describe('100-Point Evaluation System', () => {
    it('should evaluate project with 100-point scale', () => {
      const project = createMockProject();
      const score = evaluator.evaluate(project);

      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.total).toBeLessThanOrEqual(100);
      expect(score.grade).toMatch(/[ABCDF]/);
    });

    it('should give high functional improvement score for popular project', () => {
      const project = createMockProject({ stars: 500, description: 'File-based search system' });
      const score = evaluator.evaluate(project);

      expect(score.breakdown.functionalImprovement).toBeGreaterThanOrEqual(15);
    });

    it('should give high synergy score for data-related project', () => {
      const project = createMockProject({ description: 'Data storage and retrieval system' });
      const score = evaluator.evaluate(project);

      expect(score.breakdown.synergyScore).toBeGreaterThanOrEqual(10);
    });

    it('should penalize conflicting projects', () => {
      const project = createMockProject({
        name: 'memory',
        description: 'Gateway pattern implementation',
        dependencies: Array(15).fill('dep'),
      });
      const score = evaluator.evaluate(project);

      expect(score.breakdown.conflictRisk).toBeLessThan(0);
    });

    it('should reward simple, well-maintained projects', () => {
      const project = createMockProject({
        complexity: 'low',
        dependencies: ['typescript'],
        lastCommit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });
      const score = evaluator.evaluate(project);

      expect(score.breakdown.maintainability).toBeGreaterThanOrEqual(15);
    });

    it('should give perfect license score for MIT', () => {
      const project = createMockProject({ license: 'MIT' });
      const score = evaluator.evaluate(project);

      expect(score.breakdown.license).toBe(20);
    });

    it('should grade A for score >= 90', () => {
      const project = createMockProject({
        stars: 500,
        description: 'Excellent file-based search with data storage',
        complexity: 'low',
        dependencies: [],
        license: 'MIT',
        lastCommit: new Date(),
      });
      const score = evaluator.evaluate(project);

      if (score.total >= 90) {
        expect(score.grade).toBe('A');
      }
    });

    it('should recommend approve for score >= 80', () => {
      const project = createMockProject({
        stars: 200,
        description: 'Task automation with workflow management',
        complexity: 'low',
        license: 'MIT',
      });
      const score = evaluator.evaluate(project);

      if (score.total >= 80) {
        expect(score.recommendation).toBe('approve');
      }
    });
  });

  describe('120-Point Fusion Evaluation System', () => {
    it('should evaluate project with 120-point scale (100 + 20 fusion)', () => {
      const project = createMockProject({
        description: 'Memory storage and retrieval system',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      expect(enhancedScore.total).toBeGreaterThanOrEqual(0);
      expect(enhancedScore.total).toBeLessThanOrEqual(120);
      expect(enhancedScore.fusionScore).toBeGreaterThanOrEqual(0);
      expect(enhancedScore.fusionScore).toBeLessThanOrEqual(20);
    });

    it('should identify fusion opportunities with existing features', () => {
      const project = createMockProject({
        name: 'advanced-memory',
        description: 'Advanced memory management and context storage',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      expect(enhancedScore.fusionOpportunities).toBeDefined();
      expect(Array.isArray(enhancedScore.fusionOpportunities)).toBe(true);
    });

    it('should give high fusion score for memory-related project', () => {
      const project = createMockProject({
        description: 'Memory and context management for AI agents',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      // Memory project should have good synergy with agents, planning, etc.
      expect(enhancedScore.fusionScore).toBeGreaterThanOrEqual(10);
    });

    it('should give high fusion score for agent-related project', () => {
      const project = createMockProject({
        description: 'Autonomous agent workflow automation',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      // Agent project should have excellent synergy with planning
      expect(enhancedScore.fusionScore).toBeGreaterThanOrEqual(10);
    });

    it('should include fusion score in total', () => {
      const project = createMockProject({
        description: 'Task planning and automation system',
      });
      const baseScore = evaluator.evaluate(project);
      const enhancedScore = evaluator.evaluateWithFusion(project);

      expect(enhancedScore.total).toBe(baseScore.total + enhancedScore.fusionScore);
    });

    it('should use 120-point grading scale', () => {
      const project = createMockProject({
        stars: 500,
        description: 'Agent memory and task planning integration',
        complexity: 'low',
        dependencies: [],
        license: 'MIT',
        lastCommit: new Date(),
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      // Grade A should be >= 108 (90% of 120)
      if (enhancedScore.total >= 108) {
        expect(enhancedScore.grade).toBe('A');
      }
    });

    it('should recommend approve for score >= 96 (80% of 120)', () => {
      const project = createMockProject({
        stars: 300,
        description: 'Memory-based agent automation with planning',
        complexity: 'low',
        license: 'MIT',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      if (enhancedScore.total >= 96) {
        expect(enhancedScore.recommendation).toBe('approve');
      }
    });

    it('should recommend consider for score >= 84 (70% of 120)', () => {
      const project = createMockProject({
        stars: 100,
        description: 'Task management with automation',
        complexity: 'medium',
        license: 'MIT',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      if (enhancedScore.total >= 84 && enhancedScore.total < 96) {
        expect(enhancedScore.recommendation).toBe('consider');
      }
    });
  });

  describe('Fusion Opportunities', () => {
    it('should rank fusion opportunities by synergy score', () => {
      const project = createMockProject({
        description: 'Agent workflow automation with memory and planning',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      if (enhancedScore.fusionOpportunities.length > 1) {
        for (let i = 0; i < enhancedScore.fusionOpportunities.length - 1; i++) {
          const current = enhancedScore.fusionOpportunities[i];
          const next = enhancedScore.fusionOpportunities[i + 1];
          expect(current!.synergy).toBeGreaterThanOrEqual(next!.synergy);
        }
      }
    });

    it('should limit fusion opportunities to top 5', () => {
      const project = createMockProject({
        description: 'Universal automation platform with memory, agents, planning, and testing',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      expect(enhancedScore.fusionOpportunities.length).toBeLessThanOrEqual(5);
    });

    it('should include feature pairs in opportunities', () => {
      const project = createMockProject({
        description: 'Memory storage for agent data',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      if (enhancedScore.fusionOpportunities.length > 0) {
        const opportunity = enhancedScore.fusionOpportunities[0];
        expect(opportunity).toHaveProperty('features');
        expect(Array.isArray(opportunity!.features)).toBe(true);
        expect(opportunity!.features.length).toBe(2);
      }
    });

    it('should include synergy and potential score in opportunities', () => {
      const project = createMockProject({
        description: 'Agent planning system',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      if (enhancedScore.fusionOpportunities.length > 0) {
        const opportunity = enhancedScore.fusionOpportunities[0];
        expect(opportunity).toHaveProperty('synergy');
        expect(opportunity).toHaveProperty('potentialScore');
        expect(opportunity).toHaveProperty('recommendation');
        expect(typeof opportunity!.synergy).toBe('number');
        expect(typeof opportunity!.potentialScore).toBe('number');
      }
    });
  });

  describe('Feature Inference', () => {
    it('should infer memory feature from description', () => {
      const project = createMockProject({
        description: 'Context storage and memory recall system',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      // Should detect memory-related fusion opportunities
      const hasMemoryOpportunity = enhancedScore.fusionOpportunities.some((opp) =>
        opp.features.includes('memory')
      );
      expect(hasMemoryOpportunity).toBe(true);
    });

    it('should infer agents feature from description', () => {
      const project = createMockProject({
        description: 'Autonomous agent workflow automation',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      const hasAgentOpportunity = enhancedScore.fusionOpportunities.some((opp) =>
        opp.features.includes('agents')
      );
      expect(hasAgentOpportunity).toBe(true);
    });

    it('should infer planning feature from description', () => {
      const project = createMockProject({
        description: 'Task planning and todo management',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      const hasPlanningOpportunity = enhancedScore.fusionOpportunities.some((opp) =>
        opp.features.includes('planning')
      );
      expect(hasPlanningOpportunity).toBe(true);
    });

    it('should infer tdd feature from description', () => {
      const project = createMockProject({
        description: 'Test-driven development automation and coverage',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      const hasTddOpportunity = enhancedScore.fusionOpportunities.some((opp) =>
        opp.features.includes('tdd')
      );
      expect(hasTddOpportunity).toBe(true);
    });
  });

  describe('Fusion Reasons', () => {
    it('should include fusion-related reasons', () => {
      const project = createMockProject({
        description: 'Memory and agent integration system',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      const hasFusionReason = enhancedScore.reasons.some((reason) =>
        reason.toLowerCase().includes('fusion')
      );
      expect(hasFusionReason).toBe(true);
    });

    it('should describe fusion potential level', () => {
      const project = createMockProject({
        description: 'Advanced agent memory system',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      const fusionReasons = enhancedScore.reasons.filter((reason) =>
        reason.toLowerCase().includes('fusion')
      );
      expect(fusionReasons.length).toBeGreaterThan(0);
    });

    it('should mention best integration opportunities', () => {
      const project = createMockProject({
        description: 'Agent workflow with memory and planning',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      if (enhancedScore.fusionOpportunities.length > 0) {
        const hasIntegrationMention = enhancedScore.reasons.some((reason) =>
          reason.toLowerCase().includes('integration')
        );
        expect(hasIntegrationMention).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle project with no fusion potential', () => {
      const project = createMockProject({
        description: 'Unrelated utility library',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      expect(enhancedScore.fusionScore).toBeGreaterThanOrEqual(0);
      expect(enhancedScore.fusionOpportunities).toBeDefined();
    });

    it('should handle empty existing features', () => {
      const emptyContext: EvaluationContext = {
        existingTools: [],
        existingFeatures: [],
        currentComplexity: 0,
      };
      const emptyEvaluator = new QualityEvaluator(emptyContext);
      const project = createMockProject();

      const enhancedScore = emptyEvaluator.evaluateWithFusion(project);

      expect(enhancedScore.fusionScore).toBe(0);
      expect(enhancedScore.fusionOpportunities.length).toBe(0);
    });

    it('should cap fusion score at 20', () => {
      const project = createMockProject({
        description: 'Universal system with memory, agents, planning, tdd, guide, and science',
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      expect(enhancedScore.fusionScore).toBeLessThanOrEqual(20);
    });

    it('should not exceed 120 total points', () => {
      const project = createMockProject({
        stars: 10000,
        description: 'Perfect project with all features and maximum synergy',
        complexity: 'low',
        dependencies: [],
        license: 'MIT',
        lastCommit: new Date(),
      });
      const enhancedScore = evaluator.evaluateWithFusion(project);

      expect(enhancedScore.total).toBeLessThanOrEqual(120);
    });
  });

  describe('Comparison: 100-point vs 120-point', () => {
    it('should have higher grade threshold for 120-point system', () => {
      const project = createMockProject({
        stars: 200,
        description: 'Good project with moderate fusion potential',
        complexity: 'low',
        license: 'MIT',
      });

      const baseScore = evaluator.evaluate(project);
      const enhancedScore = evaluator.evaluateWithFusion(project);

      // If base score is 85 (grade B in 100-point), enhanced might still be C in 120-point
      if (baseScore.total >= 84 && baseScore.total < 96) {
        // This project would get different recommendations
        expect(baseScore.recommendation).not.toBe(enhancedScore.recommendation);
      }
    });

    it('should maintain grade consistency when scaled', () => {
      const project = createMockProject({
        stars: 500,
        description: 'Excellent memory system with agent integration',
        complexity: 'low',
        dependencies: [],
        license: 'MIT',
        lastCommit: new Date(),
      });

      const enhancedScore = evaluator.evaluateWithFusion(project);
      const percentage = (enhancedScore.total / 120) * 100;

      if (percentage >= 90) {
        expect(enhancedScore.grade).toBe('A');
      } else if (percentage >= 80) {
        expect(enhancedScore.grade).toBe('B');
      } else if (percentage >= 70) {
        expect(enhancedScore.grade).toBe('C');
      }
    });
  });
});
