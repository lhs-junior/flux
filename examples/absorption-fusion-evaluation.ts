/**
 * Example: QualityEvaluator with Fusion Integration
 *
 * Demonstrates the 120-point evaluation system:
 * - 100 points: Base quality (functionality, synergy, conflicts, maintainability, license)
 * - 20 points: Fusion potential with existing features
 */

import {
  QualityEvaluator,
  type ProjectInfo,
  type EvaluationContext,
} from '../src/absorption/quality-evaluator.js';

// Setup: Define existing system context
const context: EvaluationContext = {
  existingTools: [
    'memory_save',
    'memory_recall',
    'memory_search',
    'agent_spawn',
    'agent_list',
    'plan_create',
    'plan_update',
  ],
  existingFeatures: ['memory', 'agents', 'planning', 'tdd', 'guide', 'science'],
  currentComplexity: 5,
};

// Create evaluator
const evaluator = new QualityEvaluator(context);

// Example 1: Memory-related project (High fusion potential)
const memoryProject: ProjectInfo = {
  name: 'claude-mem',
  repo: 'https://github.com/example/claude-mem',
  description: 'Advanced memory management for Claude with context storage and recall',
  stars: 150,
  forks: 25,
  lastCommit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  license: 'MIT',
  dependencies: ['typescript', 'sqlite3'],
  complexity: 'low',
};

console.log('=== Example 1: Memory Project ===\n');

// 100-point evaluation
const baseScore = evaluator.evaluate(memoryProject);
console.log('100-Point Evaluation:');
console.log(`  Total: ${baseScore.total}/100`);
console.log(`  Grade: ${baseScore.grade}`);
console.log(`  Recommendation: ${baseScore.recommendation}`);
console.log(`  Breakdown:`);
console.log(`    - Functional Improvement: ${baseScore.breakdown.functionalImprovement}/30`);
console.log(`    - Synergy Score: ${baseScore.breakdown.synergyScore}/30`);
console.log(`    - Conflict Risk: ${baseScore.breakdown.conflictRisk}/0`);
console.log(`    - Maintainability: ${baseScore.breakdown.maintainability}/20`);
console.log(`    - License: ${baseScore.breakdown.license}/20`);
console.log();

// 120-point evaluation with Fusion
const enhancedScore = evaluator.evaluateWithFusion(memoryProject);
console.log('120-Point Evaluation (with Fusion):');
console.log(`  Total: ${enhancedScore.total}/120`);
console.log(`  Grade: ${enhancedScore.grade}`);
console.log(`  Recommendation: ${enhancedScore.recommendation}`);
console.log(`  Fusion Score: ${enhancedScore.fusionScore}/20`);
console.log();

console.log('Top Fusion Opportunities:');
enhancedScore.fusionOpportunities.slice(0, 3).forEach((opp, index) => {
  console.log(`  ${index + 1}. ${opp.features[0]} ↔ ${opp.features[1]}`);
  console.log(`     Synergy: ${opp.synergy}/20`);
  console.log(`     Potential Score: ${opp.potentialScore}/80`);
  console.log(`     ${opp.recommendation}`);
  console.log();
});

console.log('Reasons:');
enhancedScore.reasons.forEach((reason) => {
  console.log(`  - ${reason}`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Example 2: Agent automation project (High fusion potential)
const agentProject: ProjectInfo = {
  name: 'auto-agent',
  repo: 'https://github.com/example/auto-agent',
  description: 'Autonomous agent workflow automation with task planning',
  stars: 200,
  forks: 35,
  lastCommit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  license: 'Apache-2.0',
  dependencies: ['typescript'],
  complexity: 'medium',
};

console.log('=== Example 2: Agent Project ===\n');

const agentBaseScore = evaluator.evaluate(agentProject);
const agentEnhancedScore = evaluator.evaluateWithFusion(agentProject);

console.log('Score Comparison:');
console.log(`  Base (100-point): ${agentBaseScore.total}/100 - Grade ${agentBaseScore.grade}`);
console.log(
  `  Enhanced (120-point): ${agentEnhancedScore.total}/120 - Grade ${agentEnhancedScore.grade}`
);
console.log(`  Fusion Bonus: +${agentEnhancedScore.fusionScore} points`);
console.log();

console.log('Fusion Impact:');
console.log(
  `  Without Fusion: ${agentBaseScore.recommendation} (${agentBaseScore.total}% of 100)`
);
console.log(
  `  With Fusion: ${agentEnhancedScore.recommendation} (${Math.round((agentEnhancedScore.total / 120) * 100)}% of 120)`
);
console.log();

console.log('Top Integration Opportunities:');
agentEnhancedScore.fusionOpportunities.forEach((opp, index) => {
  console.log(`  ${index + 1}. ${opp.features[0]} ↔ ${opp.features[1]} (synergy: ${opp.synergy})`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Example 3: Low fusion potential project
const utilityProject: ProjectInfo = {
  name: 'utility-lib',
  repo: 'https://github.com/example/utility-lib',
  description: 'General utility library for string manipulation',
  stars: 50,
  forks: 8,
  lastCommit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  license: 'BSD-3-Clause',
  dependencies: ['lodash', 'moment', 'axios', 'express'],
  complexity: 'high',
};

console.log('=== Example 3: Low Fusion Potential ===\n');

const utilityBaseScore = evaluator.evaluate(utilityProject);
const utilityEnhancedScore = evaluator.evaluateWithFusion(utilityProject);

console.log('Scores:');
console.log(`  Base: ${utilityBaseScore.total}/100`);
console.log(`  Enhanced: ${utilityEnhancedScore.total}/120`);
console.log(`  Fusion Score: ${utilityEnhancedScore.fusionScore}/20`);
console.log();

console.log('Decision:');
console.log(`  Recommendation: ${utilityEnhancedScore.recommendation}`);
console.log(
  `  Reason: Low synergy with existing features, limited fusion opportunities`
);
console.log();

console.log('Fusion Opportunities Found: ' + utilityEnhancedScore.fusionOpportunities.length);
if (utilityEnhancedScore.fusionOpportunities.length > 0) {
  console.log('Even with opportunities, score too low for absorption.');
}

console.log('\n' + '='.repeat(60) + '\n');

// Summary
console.log('=== Summary: 120-Point Evaluation System ===\n');
console.log('Grading Scale (120 points):');
console.log('  A: 108+ (90%)');
console.log('  B: 96-107 (80-89%)');
console.log('  C: 84-95 (70-79%)');
console.log('  D: 72-83 (60-69%)');
console.log('  F: <72 (<60%)');
console.log();

console.log('Recommendation Thresholds:');
console.log('  Approve: 96+ points (80%)');
console.log('  Consider: 84-95 points (70-79%)');
console.log('  Reject: <84 points (<70%)');
console.log();

console.log('Fusion Score Breakdown (0-20 points):');
console.log('  18-20: Exceptional fusion potential');
console.log('  15-17: Strong fusion potential');
console.log('  10-14: Good fusion potential');
console.log('  5-9: Moderate fusion potential');
console.log('  0-4: Limited fusion potential');
console.log();

console.log('Benefits:');
console.log('  1. Identifies integration opportunities during absorption planning');
console.log('  2. Rewards projects that enhance existing features');
console.log('  3. Maintains strict quality bar (70% threshold = 84/120)');
console.log('  4. Provides clear fusion roadmap for approved projects');
