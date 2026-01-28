/**
 * CLI Fusion Commands Tests
 *
 * Tests for absorbed --with-fusion and fusion-matrix commands
 */

import { describe, it, expect } from 'vitest';
import { FusionEvaluator } from '../fusion-evaluator';

describe('FusionEvaluator for CLI', () => {
  const features = ['memory', 'agents', 'planning', 'tdd', 'guide', 'science'];
  const evaluator = new FusionEvaluator(features);

  describe('evaluateAllPairs', () => {
    it('should return all feature pair evaluations', () => {
      const results = evaluator.evaluateAllPairs();

      // 6 features = 15 pairs (n*(n-1)/2)
      expect(results).toHaveLength(15);

      // Results should be sorted by total score descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i]!.metrics.total).toBeGreaterThanOrEqual(results[i + 1]!.metrics.total);
      }
    });

    it('should calculate metrics for each pair', () => {
      const results = evaluator.evaluateAllPairs();

      results.forEach(result => {
        // Check all metrics are present
        expect(result.metrics.synergy).toBeGreaterThanOrEqual(0);
        expect(result.metrics.synergy).toBeLessThanOrEqual(20);

        expect(result.metrics.automation).toBeGreaterThanOrEqual(0);
        expect(result.metrics.automation).toBeLessThanOrEqual(20);

        expect(result.metrics.performance).toBeGreaterThanOrEqual(0);
        expect(result.metrics.performance).toBeLessThanOrEqual(20);

        expect(result.metrics.userValue).toBeGreaterThanOrEqual(0);
        expect(result.metrics.userValue).toBeLessThanOrEqual(20);

        // Total should be sum of all metrics
        expect(result.metrics.total).toBe(
          result.metrics.synergy +
          result.metrics.automation +
          result.metrics.performance +
          result.metrics.userValue
        );
      });
    });
  });

  describe('getTopOpportunities', () => {
    it('should return top 5 opportunities by default', () => {
      const opportunities = evaluator.getTopOpportunities();

      expect(opportunities).toHaveLength(5);

      // Should be in descending order
      for (let i = 0; i < opportunities.length - 1; i++) {
        expect(opportunities[i]!.metrics.total).toBeGreaterThanOrEqual(
          opportunities[i + 1]!.metrics.total
        );
      }
    });

    it('should return correct number when limit is specified', () => {
      const opportunities = evaluator.getTopOpportunities(3);
      expect(opportunities).toHaveLength(3);
    });

    it('should include recommendations and opportunities', () => {
      const opportunities = evaluator.getTopOpportunities(1);
      const top = opportunities[0]!;

      expect(top.recommendation).toBeDefined();
      expect(typeof top.recommendation).toBe('string');
      expect(top.recommendation.length).toBeGreaterThan(0);

      expect(top.opportunities).toBeDefined();
      expect(Array.isArray(top.opportunities)).toBe(true);
    });
  });

  describe('evaluatePair', () => {
    it('should evaluate agents + planning with high scores', () => {
      const result = evaluator.evaluatePair('agents', 'planning');

      // This is expected to be one of the highest scoring pairs
      expect(result.metrics.total).toBeGreaterThanOrEqual(70);
      expect(result.metrics.synergy).toBeGreaterThanOrEqual(18);
      expect(result.potentialLevel).toBeGreaterThanOrEqual(3);
      expect(result.priority).toBe('high');
    });

    it('should evaluate planning + tdd with high scores', () => {
      const result = evaluator.evaluatePair('planning', 'tdd');

      expect(result.metrics.total).toBeGreaterThanOrEqual(70);
      expect(result.potentialLevel).toBeGreaterThanOrEqual(3);
    });

    it('should evaluate memory + agents with good scores', () => {
      const result = evaluator.evaluatePair('memory', 'agents');

      expect(result.metrics.total).toBeGreaterThanOrEqual(60);
      expect(result.metrics.synergy).toBeGreaterThanOrEqual(16);
    });

    it('should assign correct fusion levels', () => {
      const result = evaluator.evaluatePair('agents', 'planning');

      expect(result.currentLevel).toBeGreaterThanOrEqual(0);
      expect(result.currentLevel).toBeLessThanOrEqual(4);

      expect(result.potentialLevel).toBeGreaterThanOrEqual(result.currentLevel);
      expect(result.potentialLevel).toBeLessThanOrEqual(4);
    });

    it('should include specific opportunities for high-value pairs', () => {
      const result = evaluator.evaluatePair('agents', 'planning');

      expect(result.opportunities.length).toBeGreaterThan(0);

      result.opportunities.forEach(opp => {
        expect(opp.description).toBeDefined();
        expect(opp.hookType).toBeDefined();
        expect(opp.hookProvider).toBeDefined();
        expect(opp.hookConsumer).toBeDefined();
        expect(opp.valueGain).toBeDefined();
        expect(opp.complexity).toBeGreaterThanOrEqual(1);
        expect(opp.complexity).toBeLessThanOrEqual(5);
      });
    });

    it('should recommend integration patterns', () => {
      const result = evaluator.evaluatePair('agents', 'planning');

      expect(result.recommendedPatterns.length).toBeGreaterThan(0);

      // High automation score should suggest AutoTrigger
      if (result.metrics.automation >= 15) {
        expect(result.recommendedPatterns).toContain('AutoTriggerFusion');
      }

      // High synergy should suggest SharedContext
      if (result.metrics.synergy >= 15) {
        expect(result.recommendedPatterns).toContain('SharedContextFusion');
      }
    });
  });

  describe('Matrix formatting tests', () => {
    it('should create valid matrix with all pairs', () => {
      const matrix: Record<string, Record<string, number>> = {};

      for (let i = 0; i < features.length; i++) {
        const featureA = features[i]!;
        matrix[featureA] = {};

        for (let j = 0; j < features.length; j++) {
          const featureB = features[j]!;

          if (i === j) {
            matrix[featureA]![featureB] = -1;
          } else {
            const potential = evaluator.evaluatePair(featureA, featureB);
            matrix[featureA]![featureB] = potential.metrics.total;
          }
        }
      }

      // Verify matrix is complete
      expect(Object.keys(matrix)).toHaveLength(6);

      features.forEach(feature => {
        expect(matrix[feature]).toBeDefined();
        expect(Object.keys(matrix[feature]!)).toHaveLength(6);
      });
    });

    it('should have symmetric scores for bidirectional pairs', () => {
      const ab = evaluator.evaluatePair('memory', 'agents');
      const ba = evaluator.evaluatePair('agents', 'memory');

      // Scores should be the same regardless of order
      expect(ab.metrics.total).toBe(ba.metrics.total);
      expect(ab.metrics.synergy).toBe(ba.metrics.synergy);
      expect(ab.metrics.automation).toBe(ba.metrics.automation);
      expect(ab.metrics.performance).toBe(ba.metrics.performance);
      expect(ab.metrics.userValue).toBe(ba.metrics.userValue);
    });
  });

  describe('Output validation', () => {
    it('should generate valid recommendations for all priority levels', () => {
      const results = evaluator.evaluateAllPairs();

      const priorities = new Set(results.map(r => r.priority));

      // Should have at least high and medium priorities
      expect(priorities.size).toBeGreaterThanOrEqual(2);

      results.forEach(result => {
        expect(['high', 'medium', 'low']).toContain(result.priority);
      });
    });

    it('should estimate effort based on level gain', () => {
      const results = evaluator.evaluateAllPairs();

      results.forEach(result => {
        const levelGain = result.potentialLevel - result.currentLevel;

        // Effort should increase with level gain
        expect(result.estimatedEffort).toBeGreaterThanOrEqual(2);

        // Larger level gains should have more effort
        if (levelGain >= 3) {
          expect(result.estimatedEffort).toBeGreaterThanOrEqual(8);
        }
      });
    });
  });
});
