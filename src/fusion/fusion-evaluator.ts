/**
 * Fusion Evaluator
 *
 * Evaluates potential feature integrations and calculates fusion scores
 * based on synergy, automation, performance, and user value metrics
 */

import {
  FusionLevel,
  FusionPotential,
  FusionMetrics,
  FusionOpportunity,
  HookType,
  FeatureMetadata
} from './types';

/**
 * Scoring matrix for different feature pairs
 *
 * Each cell represents the base synergy between feature pairs (0-20 scale)
 */
const SYNERGY_MATRIX: Record<string, Record<string, number>> = {
  memory: {
    agents: 18,    // Agents save results to memory
    planning: 15,  // Plans reference memory
    tdd: 12,       // Tests can save to memory
    guide: 14,     // Learning progress saved
    science: 16    // Analysis results saved
  },
  agents: {
    memory: 18,    // Strong bidirectional
    planning: 20,  // Agents create/update plans
    tdd: 16,       // Agents run TDD workflows
    guide: 10,     // Agents can reference guides
    science: 14    // Agents perform analysis
  },
  planning: {
    memory: 15,
    agents: 20,
    tdd: 19,       // TDD phases create todos
    guide: 8,      // Weak connection
    science: 10    // Analysis can create todos
  },
  tdd: {
    memory: 12,
    agents: 16,
    planning: 19,  // Strong workflow integration
    guide: 13,     // TDD tutorials
    science: 11    // Test coverage analysis
  },
  guide: {
    memory: 14,
    agents: 10,
    planning: 8,
    tdd: 13,
    science: 9
  },
  science: {
    memory: 16,
    agents: 14,
    planning: 10,
    tdd: 11,
    guide: 9
  }
};

/**
 * Automation potential matrix
 *
 * Measures how much manual work can be eliminated (0-20 scale)
 */
const AUTOMATION_MATRIX: Record<string, Record<string, number>> = {
  memory: {
    agents: 17,    // Auto-save agent results
    planning: 12,  // Auto-reference in plans
    tdd: 10,
    guide: 15,     // Auto-save progress
    science: 14    // Auto-save analysis
  },
  agents: {
    memory: 17,
    planning: 18,  // Auto-create todos
    tdd: 15,       // Auto-run test phases
    guide: 8,
    science: 12
  },
  planning: {
    memory: 12,
    agents: 18,
    tdd: 17,       // Auto-create test todos
    guide: 7,
    science: 9
  },
  tdd: {
    memory: 10,
    agents: 15,
    planning: 17,
    guide: 11,
    science: 10
  },
  guide: {
    memory: 15,
    agents: 8,
    planning: 7,
    tdd: 11,
    science: 8
  },
  science: {
    memory: 14,
    agents: 12,
    planning: 9,
    tdd: 10,
    guide: 8
  }
};

/**
 * Performance impact matrix
 *
 * Measures efficiency gains from integration (0-20 scale)
 */
const PERFORMANCE_MATRIX: Record<string, Record<string, number>> = {
  memory: {
    agents: 14,    // Reduce redundant queries
    planning: 13,  // Cached references
    tdd: 11,
    guide: 12,
    science: 15    // Cache analysis results
  },
  agents: {
    memory: 14,
    planning: 16,  // Parallel updates
    tdd: 15,       // Streamlined workflow
    guide: 9,
    science: 13
  },
  planning: {
    memory: 13,
    agents: 16,
    tdd: 18,       // Reduced context switching
    guide: 8,
    science: 11
  },
  tdd: {
    memory: 11,
    agents: 15,
    planning: 18,
    guide: 10,
    science: 12
  },
  guide: {
    memory: 12,
    agents: 9,
    planning: 8,
    tdd: 10,
    science: 9
  },
  science: {
    memory: 15,
    agents: 13,
    planning: 11,
    tdd: 12,
    guide: 9
  }
};

/**
 * User value matrix
 *
 * Measures direct benefit to end users (0-20 scale)
 */
const USER_VALUE_MATRIX: Record<string, Record<string, number>> = {
  memory: {
    agents: 16,    // Persistent agent knowledge
    planning: 14,  // Better context
    tdd: 12,
    guide: 17,     // Learning continuity
    science: 15    // Reusable analysis
  },
  agents: {
    memory: 16,
    planning: 19,  // Automated task management
    tdd: 17,       // Quality assurance
    guide: 11,
    science: 14
  },
  planning: {
    memory: 14,
    agents: 19,
    tdd: 18,       // Clear workflow
    guide: 10,
    science: 12
  },
  tdd: {
    memory: 12,
    agents: 17,
    planning: 18,
    guide: 14,     // Learning by doing
    science: 13
  },
  guide: {
    memory: 17,
    agents: 11,
    planning: 10,
    tdd: 14,
    science: 11
  },
  science: {
    memory: 15,
    agents: 14,
    planning: 12,
    tdd: 13,
    guide: 11
  }
};

/**
 * Current integration levels between features
 */
const CURRENT_LEVELS: Record<string, Record<string, FusionLevel>> = {
  memory: {
    agents: 1,     // Basic --save-to-memory flag
    planning: 0,
    tdd: 0,
    guide: 0,
    science: 0
  },
  agents: {
    memory: 1,
    planning: 1,   // Basic --create-todo flag
    tdd: 0,
    guide: 0,
    science: 0
  },
  planning: {
    memory: 0,
    agents: 1,
    tdd: 1,        // Basic todo creation
    guide: 0,
    science: 0
  },
  tdd: {
    memory: 0,
    agents: 0,
    planning: 1,
    guide: 0,
    science: 0
  },
  guide: {
    memory: 0,
    agents: 0,
    planning: 0,
    tdd: 0,
    science: 0
  },
  science: {
    memory: 0,
    agents: 0,
    planning: 0,
    tdd: 0,
    guide: 0
  }
};

/**
 * FusionEvaluator class
 *
 * Analyzes feature pairs and recommends integration opportunities
 */
export class FusionEvaluator {
  private features: string[];

  constructor(features: string[]) {
    this.features = features;
  }

  /**
   * Evaluate fusion potential between two features
   */
  evaluatePair(featureA: string, featureB: string): FusionPotential {
    // Calculate metrics
    const synergy = this.evaluateSynergy(featureA, featureB);
    const automation = this.evaluateAutomation(featureA, featureB);
    const performance = this.evaluatePerformance(featureA, featureB);
    const userValue = this.evaluateUserValue(featureA, featureB);

    const metrics: FusionMetrics = {
      synergy,
      automation,
      performance,
      userValue,
      total: synergy + automation + performance + userValue
    };

    // Determine levels
    const currentLevel = this.getCurrentLevel(featureA, featureB);
    const potentialLevel = this.estimatePotentialLevel(featureA, featureB, metrics.total);

    // Generate opportunities
    const opportunities = this.generateOpportunities(featureA, featureB, metrics);

    // Calculate priority and effort
    const priority = this.calculatePriority(metrics.total, potentialLevel);
    const estimatedEffort = this.estimateEffort(currentLevel, potentialLevel);

    // Generate recommendation
    const recommendation = this.calculateRecommendation(metrics, currentLevel, potentialLevel);

    // Recommend patterns
    const recommendedPatterns = this.recommendPatterns(featureA, featureB, metrics);

    return {
      featureA,
      featureB,
      currentLevel,
      potentialLevel,
      metrics,
      recommendedPatterns,
      opportunities,
      estimatedEffort,
      priority,
      recommendation
    };
  }

  /**
   * Evaluate all possible feature pairs
   */
  evaluateAllPairs(): FusionPotential[] {
    const results: FusionPotential[] = [];

    for (let i = 0; i < this.features.length; i++) {
      for (let j = i + 1; j < this.features.length; j++) {
        const featureA = this.features[i];
        const featureB = this.features[j];
        if (featureA && featureB) {
          const potential = this.evaluatePair(featureA, featureB);
          results.push(potential);
        }
      }
    }

    // Sort by total score descending
    return results.sort((a, b) => b.metrics.total - a.metrics.total);
  }

  /**
   * Get top fusion opportunities
   */
  getTopOpportunities(limit: number = 5): FusionPotential[] {
    return this.evaluateAllPairs().slice(0, limit);
  }

  /**
   * Evaluate synergy between two features (0-20 points)
   */
  private evaluateSynergy(featureA: string, featureB: string): number {
    return this.getMatrixValue(SYNERGY_MATRIX, featureA, featureB);
  }

  /**
   * Evaluate automation potential (0-20 points)
   */
  private evaluateAutomation(featureA: string, featureB: string): number {
    return this.getMatrixValue(AUTOMATION_MATRIX, featureA, featureB);
  }

  /**
   * Evaluate performance impact (0-20 points)
   */
  private evaluatePerformance(featureA: string, featureB: string): number {
    return this.getMatrixValue(PERFORMANCE_MATRIX, featureA, featureB);
  }

  /**
   * Evaluate user value (0-20 points)
   */
  private evaluateUserValue(featureA: string, featureB: string): number {
    return this.getMatrixValue(USER_VALUE_MATRIX, featureA, featureB);
  }

  /**
   * Get current integration level
   */
  private getCurrentLevel(featureA: string, featureB: string): FusionLevel {
    const level = CURRENT_LEVELS[featureA]?.[featureB] ?? CURRENT_LEVELS[featureB]?.[featureA];
    return level ?? 0;
  }

  /**
   * Estimate potential fusion level based on score
   */
  private estimatePotentialLevel(featureA: string, featureB: string, totalScore: number): FusionLevel {
    // Score ranges for fusion levels
    if (totalScore >= 70) return 4;  // Full fusion (70-80)
    if (totalScore >= 60) return 3;  // Advanced (60-69)
    if (totalScore >= 45) return 2;  // Medium (45-59)
    if (totalScore >= 30) return 1;  // Basic (30-44)
    return 0;  // No integration (0-29)
  }

  /**
   * Calculate recommendation text
   */
  private calculateRecommendation(
    metrics: FusionMetrics,
    currentLevel: FusionLevel,
    potentialLevel: FusionLevel
  ): string {
    const gain = potentialLevel - currentLevel;
    const score = metrics.total;

    if (gain === 0) {
      return `Already at optimal fusion level (${currentLevel}). No further integration recommended.`;
    }

    if (score >= 70) {
      return `HIGHLY RECOMMENDED: Exceptional fusion potential (score: ${score}/80). Can achieve Level ${potentialLevel} integration with ${gain} level gain. Strong synergy across all metrics.`;
    }

    if (score >= 60) {
      return `RECOMMENDED: Strong fusion potential (score: ${score}/80). Advancing from Level ${currentLevel} to Level ${potentialLevel} would provide significant value.`;
    }

    if (score >= 45) {
      return `MODERATE: Decent fusion potential (score: ${score}/80). Consider implementing if resources available. Would improve from Level ${currentLevel} to Level ${potentialLevel}.`;
    }

    if (score >= 30) {
      return `LOW PRIORITY: Limited fusion potential (score: ${score}/80). Basic integration possible but prioritize higher-value opportunities first.`;
    }

    return `NOT RECOMMENDED: Minimal fusion potential (score: ${score}/80). Features work better independently.`;
  }

  /**
   * Generate specific integration opportunities
   */
  private generateOpportunities(
    featureA: string,
    featureB: string,
    metrics: FusionMetrics
  ): FusionOpportunity[] {
    const opportunities: FusionOpportunity[] = [];

    // Agent + Planning opportunities
    if ((featureA === 'agents' && featureB === 'planning') || (featureA === 'planning' && featureB === 'agents')) {
      opportunities.push({
        description: 'Automatically create planning todos when agents complete tasks',
        hookType: HookType.POST_EXECUTION,
        hookProvider: 'agents',
        hookConsumer: 'planning',
        valueGain: 'Seamless task tracking without manual todo creation',
        complexity: 2
      });

      opportunities.push({
        description: 'Enable agents to update todo status in real-time',
        hookType: HookType.PROGRESS_UPDATE,
        hookProvider: 'agents',
        hookConsumer: 'planning',
        valueGain: 'Live progress visibility during agent execution',
        complexity: 3
      });
    }

    // TDD + Planning opportunities
    if ((featureA === 'tdd' && featureB === 'planning') || (featureA === 'planning' && featureB === 'tdd')) {
      opportunities.push({
        description: 'Auto-create todos for each TDD phase (RED, GREEN, REFACTOR)',
        hookType: HookType.STATUS_CHANGE,
        hookProvider: 'tdd',
        hookConsumer: 'planning',
        valueGain: 'Structured workflow tracking for TDD cycles',
        complexity: 2
      });

      opportunities.push({
        description: 'Link test results to planning todos',
        hookType: HookType.POST_EXECUTION,
        hookProvider: 'tdd',
        hookConsumer: 'planning',
        valueGain: 'Test coverage visible in task management',
        complexity: 3
      });
    }

    // Memory + Agents opportunities
    if ((featureA === 'memory' && featureB === 'agents') || (featureA === 'agents' && featureB === 'memory')) {
      opportunities.push({
        description: 'Automatically save agent results to memory with context',
        hookType: HookType.POST_EXECUTION,
        hookProvider: 'agents',
        hookConsumer: 'memory',
        valueGain: 'Persistent agent knowledge across sessions',
        complexity: 2
      });

      opportunities.push({
        description: 'Enable agents to query memory for context',
        hookType: HookType.PRE_EXECUTION,
        hookProvider: 'agents',
        hookConsumer: 'memory',
        valueGain: 'Agents learn from previous interactions',
        complexity: 3
      });
    }

    // Memory + Science opportunities
    if ((featureA === 'memory' && featureB === 'science') || (featureA === 'science' && featureB === 'memory')) {
      opportunities.push({
        description: 'Auto-save analysis results to memory',
        hookType: HookType.POST_EXECUTION,
        hookProvider: 'science',
        hookConsumer: 'memory',
        valueGain: 'Reusable analysis results for future queries',
        complexity: 2
      });
    }

    // Guide + Memory opportunities
    if ((featureA === 'guide' && featureB === 'memory') || (featureA === 'memory' && featureB === 'guide')) {
      opportunities.push({
        description: 'Save learning progress and completions to memory',
        hookType: HookType.STATUS_CHANGE,
        hookProvider: 'guide',
        hookConsumer: 'memory',
        valueGain: 'Track learning journey over time',
        complexity: 2
      });
    }

    return opportunities;
  }

  /**
   * Recommend integration patterns
   */
  private recommendPatterns(
    featureA: string,
    featureB: string,
    metrics: FusionMetrics
  ): string[] {
    const patterns: string[] = [];

    // High automation score → AutoTrigger pattern
    if (metrics.automation >= 15) {
      patterns.push('AutoTriggerFusion');
    }

    // High synergy → SharedContext pattern
    if (metrics.synergy >= 15) {
      patterns.push('SharedContextFusion');
    }

    // High performance → Pipeline pattern
    if (metrics.performance >= 15) {
      patterns.push('PipelineFusion');
    }

    // Check for sequential workflow
    const isSequential = (
      (featureA === 'agents' && featureB === 'planning') ||
      (featureA === 'tdd' && featureB === 'planning')
    );

    if (isSequential) {
      patterns.push('PipelineFusion');
    }

    // Check for parallel potential
    const canParallel = metrics.performance >= 12 && metrics.synergy < 18;
    if (canParallel) {
      patterns.push('ParallelFusion');
    }

    return patterns.length > 0 ? patterns : ['SharedContextFusion'];
  }

  /**
   * Calculate priority level
   */
  private calculatePriority(totalScore: number, potentialLevel: FusionLevel): 'high' | 'medium' | 'low' {
    if (totalScore >= 65 || potentialLevel >= 4) return 'high';
    if (totalScore >= 50 || potentialLevel >= 3) return 'medium';
    return 'low';
  }

  /**
   * Estimate implementation effort in hours
   */
  private estimateEffort(currentLevel: FusionLevel, potentialLevel: FusionLevel): number {
    const levelGain = potentialLevel - currentLevel;

    // Base effort by level gain
    const baseEffort = levelGain * 4;

    // Current level adjustment (higher current = easier to extend)
    const currentAdjustment = currentLevel * -0.5;

    return Math.max(2, baseEffort + currentAdjustment);
  }

  /**
   * Get value from matrix, handling bidirectional lookup
   */
  private getMatrixValue(
    matrix: Record<string, Record<string, number>>,
    featureA: string,
    featureB: string
  ): number {
    return matrix[featureA]?.[featureB] ?? matrix[featureB]?.[featureA] ?? 0;
  }
}
