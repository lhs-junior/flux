/**
 * Dashboard Fusion Demo
 *
 * Demonstrates the unified status view of all FLUX features
 */

import { MemoryManager } from '../src/features/memory/memory-manager.js';
import { PlanningManager } from '../src/features/planning/planning-manager.js';
import { AgentOrchestrator } from '../src/features/agents/agent-orchestrator.js';
import { TDDManager } from '../src/features/tdd/tdd-manager.js';
import { GuideManager } from '../src/features/guide/guide-manager.js';
import { ScienceManager } from '../src/features/science/index.js';
import { DashboardManager } from '../src/fusion/implementations/dashboard-fusion.js';

async function main() {
  console.log('🚀 FLUX Dashboard Demo\n');

  // Initialize managers
  const memoryManager = new MemoryManager(':memory:');
  const planningManager = new PlanningManager(':memory:');
  const tddManager = new TDDManager(':memory:');

  const agentOrchestrator = new AgentOrchestrator(':memory:', {
    planningManager,
    memoryManager,
    tddManager,
  });

  const guideManager = new GuideManager(':memory:', {
    memoryManager,
    planningManager,
  });

  const scienceManager = new ScienceManager({
    memoryManager,
    planningManager,
  });

  // Initialize dashboard
  const dashboardManager = new DashboardManager({
    memoryManager,
    planningManager,
    agentOrchestrator,
    tddManager,
    guideManager,
    scienceManager,
  });

  // Add some sample data
  console.log('📝 Adding sample data...\n');

  // Add memories
  memoryManager.save({
    key: 'project-requirement',
    value: 'Build a dashboard fusion system',
    metadata: { category: 'requirements', tags: ['fusion', 'dashboard'] },
  });

  memoryManager.save({
    key: 'tech-stack',
    value: 'TypeScript, SQLite, BM25',
    metadata: { category: 'technical', tags: ['stack', 'architecture'] },
  });

  memoryManager.save({
    key: 'design-pattern',
    value: 'Strategy pattern for agents',
    metadata: { category: 'technical', tags: ['patterns', 'agents'] },
  });

  // Add TODOs
  planningManager.create({
    content: 'Implement dashboard manager',
    status: 'completed',
  });

  planningManager.create({
    content: 'Add ASCII rendering',
    status: 'completed',
  });

  planningManager.create({
    content: 'Write unit tests',
    status: 'in_progress',
  });

  planningManager.create({
    content: 'Create documentation',
    status: 'pending',
  });

  planningManager.create({
    content: 'Add CLI integration',
    status: 'pending',
  });

  // Spawn an agent
  await agentOrchestrator.spawn({
    type: 'researcher',
    task: 'Research dashboard best practices',
  });

  console.log('✅ Sample data added\n');
  console.log('═'.repeat(70));
  console.log();

  // Get unified status
  const status = dashboardManager.getUnifiedStatus();

  // Display full ASCII dashboard
  console.log(dashboardManager.formatDashboard(status));
  console.log();
  console.log('═'.repeat(70));
  console.log();

  // Display compact summary
  console.log('📊 COMPACT SUMMARY:\n');
  console.log(dashboardManager.getCompactSummary(status));
  console.log();
  console.log('═'.repeat(70));
  console.log();

  // Display JSON format
  console.log('📋 JSON FORMAT (sample):\n');
  console.log(JSON.stringify({
    memory: status.memory,
    planning: status.planning,
    agents: status.agents,
  }, null, 2));

  // Clean up
  memoryManager.close();
  planningManager.close();
  agentOrchestrator.close();
  tddManager.close();
  guideManager.close();
  scienceManager.close();

  console.log('\n✅ Demo complete!');
}

main().catch(console.error);
