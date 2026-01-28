#!/usr/bin/env node

import { Command } from 'commander';
import * as readline from 'readline/promises';
import { AwesomePluginGateway } from './core/gateway.js';
import { GitHubExplorer } from './discovery/github-explorer.js';
import { QualityEvaluator } from './discovery/quality-evaluator.js';
import { PluginInstaller } from './discovery/plugin-installer.js';
import logger from './utils/logger.js';

const program = new Command();

// Helper function to format relative time
function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

program
  .name('awesome-plugin')
  .description('Awesome MCP Meta Plugin - Intelligent tool selection and auto-discovery')
  .version('1.2.0');

program
  .command('start')
  .description('Start the Awesome Plugin Gateway')
  .action(async () => {
    console.log('Starting Awesome Plugin Gateway...');
    const gateway = new AwesomePluginGateway();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await gateway.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down...');
      await gateway.stop();
      process.exit(0);
    });

    await gateway.start();
  });

program
  .command('init')
  .description('Initialize Awesome Plugin configuration')
  .action(async () => {
    console.log('Initializing Awesome Plugin...');
    console.log('\nConfiguration wizard coming soon in Phase 3!');
    console.log('For now, you can manually configure servers in config/servers/');
  });

program
  .command('discover')
  .description('Discover and install MCP servers from GitHub')
  .option('-l, --limit <number>', 'Maximum number of results', '50')
  .option('--min-score <number>', 'Minimum quality score (0-100)', '70')
  .option('--auto-install', 'Automatically install all recommended plugins', false)
  .action(async (options) => {
    try {
      console.log('🔍 Discovering MCP servers from GitHub...\n');

      const explorer = new GitHubExplorer();
      const evaluator = new QualityEvaluator({
        minScore: parseInt(options.minScore),
      });
      const installer = new PluginInstaller();

      // Search for MCP servers
      const repos = await explorer.searchMCPServers({
        maxResults: parseInt(options.limit),
        minStars: 10,
      });

      if (repos.length === 0) {
        console.log('❌ No MCP servers found.');
        return;
      }

      // Evaluate and filter recommended ones
      const evaluated = evaluator.filterRecommended(repos);

      if (evaluated.length === 0) {
        console.log(`❌ No MCP servers met the quality threshold (${options.minScore}+).`);
        return;
      }

      // Map to include scores
      const reposWithScores = evaluated.map(repo => ({
        repo,
        score: evaluator.evaluate(repo)
      }));

      console.log(`✅ Found ${reposWithScores.length} recommended MCP servers:\n`);

      // Display results
      reposWithScores.forEach((item, index) => {
        const { repo, score } = item;
        console.log(`${index + 1}. ${repo.fullName}`);
        console.log(`   Score: ${score.total}/100 (${score.grade}) - ${score.recommendation}`);
        console.log(`   ⭐ ${repo.stars} stars | 🔧 Updated ${getRelativeTime(repo.lastCommit)}`);
        console.log(`   ${repo.description || 'No description'}`);
        console.log(`   Reasons: ${score.reasons.slice(0, 3).join(', ')}`);
        console.log('');
      });

      // Check rate limit
      const rateLimit = await explorer.getRateLimit();
      console.log(`\nGitHub API: ${rateLimit.remaining}/${rateLimit.limit} requests remaining\n`);

      // Ask user which ones to install
      if (options.autoInstall) {
        console.log('🚀 Auto-installing all recommended plugins...\n');
        for (const item of reposWithScores) {
          await installer.installFromGitHub(item.repo);
        }
      } else {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await rl.question(
          'Would you like to install any of these? (Enter numbers separated by commas, or "all", or "none"): '
        );

        rl.close();

        if (answer.trim().toLowerCase() === 'none') {
          console.log('No plugins installed.');
          return;
        }

        let toInstall: typeof reposWithScores = [];

        if (answer.trim().toLowerCase() === 'all') {
          toInstall = reposWithScores;
        } else {
          const indices = answer
            .split(',')
            .map((n) => parseInt(n.trim()) - 1)
            .filter((i) => i >= 0 && i < reposWithScores.length);

          toInstall = indices.map((i) => reposWithScores[i]).filter((item) => item !== undefined);
        }

        if (toInstall.length === 0) {
          console.log('No valid selections.');
          return;
        }

        console.log(`\n🚀 Installing ${toInstall.length} plugin(s)...\n`);

        for (const item of toInstall) {
          const result = await installer.installFromGitHub(item.repo);
          if (result.success) {
            console.log(`  ✅ ${item.repo.fullName}`);
          } else {
            console.log(`  ❌ ${item.repo.fullName}: ${result.error}`);
          }
        }

        console.log('\n✨ Installation complete!');
        console.log(`Config directory: ${installer.getConfigDir()}`);
      }
    } catch (error: any) {
      console.error('❌ Discovery failed:', error.message);
      if (error.message.includes('rate limit')) {
        console.log('\n💡 Tip: Set GITHUB_TOKEN environment variable to increase rate limit.');
      }
    }
  });

program
  .command('list')
  .description('List all installed MCP plugins')
  .action(async () => {
    try {
      const installer = new PluginInstaller();
      const plugins = await installer.listInstalled();

      if (plugins.length === 0) {
        console.log('No plugins installed yet.');
        console.log('\n💡 Run "awesome-plugin discover" to find and install MCP servers.');
        return;
      }

      console.log(`📦 Installed MCP Plugins (${plugins.length}):\n`);

      plugins.forEach((plugin, index) => {
        console.log(`${index + 1}. ${plugin.name} (${plugin.id})`);
        console.log(`   Command: ${plugin.command} ${plugin.args?.join(' ') || ''}`);
        console.log('');
      });

      console.log(`Config directory: ${installer.getConfigDir()}`);
    } catch (error: any) {
      console.error('❌ Failed to list plugins:', error.message);
    }
  });

program
  .command('stats')
  .description('Show gateway statistics')
  .action(async () => {
    console.log('Gateway Statistics:');
    console.log('\nStatistics coming soon!');
  });

program
  .command('absorbed')
  .description('Show absorption history and progress')
  .action(async () => {
    console.log('🧬 Absorption History\n');

    // Absorbed projects
    const absorbed = [
      {
        name: 'claude-mem',
        version: 'v0.1.0',
        date: '2025-01-28',
        description: 'Memory management with BM25 semantic search',
        tools: 4,
        improvements: [
          'BM25 search instead of vector DB',
          'SQLite instead of file storage',
          'Tool schema redesign',
        ],
      },
      {
        name: 'oh-my-claudecode',
        version: 'v0.1.0',
        date: '2025-01-28',
        description: 'Multi-agent orchestration with parallel execution',
        tools: 5,
        improvements: [
          'Parallel async execution',
          'Real-time progress monitoring',
          'Background task support',
        ],
      },
      {
        name: 'planning-with-files',
        version: 'v0.2.0',
        date: '2025-01-28',
        description: 'TODO tracking with dependency management',
        tools: 3,
        improvements: [
          'File storage → SQLite with foreign keys',
          'BM25 semantic search integration',
          'Automatic cycle detection for dependencies',
          'ASCII tree visualization with status icons',
          'Agent integration (auto TODO creation)',
        ],
      },
      {
        name: 'superpowers',
        version: 'v0.3.0',
        date: '2025-01-28',
        description: 'TDD workflow enforcement (38k+ stars!)',
        tools: 4,
        improvements: [
          'Full framework → Focused TDD tools',
          'Code deletion → Warnings only',
          'Standalone → Integrated with Planning',
          'RED-GREEN-REFACTOR cycle enforcement',
          'Auto-detect test runner (Jest/Vitest/Mocha)',
          'SQLite test run history',
        ],
      },
      {
        name: 'agents',
        version: 'v0.4.0',
        date: '2025-01-28',
        description: 'Specialist agent types (top 10 from 72)',
        tools: 10,
        improvements: [
          'specialist_researcher, specialist_analyst, specialist_strategist',
          'specialist_designer, specialist_coder, specialist_teacher',
          'specialist_writer, specialist_debugger, specialist_reviewer',
          'specialist_optimizer - Dynamic specialist orchestration',
          'Parallel execution with Agent coordination',
          'Full state preservation across specialists',
        ],
      },
      {
        name: 'guide-system',
        version: 'v0.5.0',
        date: '2025-01-28',
        description: 'Self-documenting guide system (inspired by claude-code-guide)',
        tools: 2,
        guides: 5,
        improvements: [
          'guide_search, guide_tutorial - New guide tools',
          '5 initial guides: Getting Started, Building with awesome-plugin, Absorption Deep Dive, Memory Best Practices, TDD Mastery',
          'Inspired by (not absorbed from) zebbern and Cranot guides',
          'Interactive learning paths linked to tool usage',
          'Full integration with Memory + Agents + Planning',
          'Self-documenting architecture',
        ],
      },
      {
        name: 'science-tools',
        version: 'v0.6.0',
        date: '2026-01-28',
        description: 'Data science, statistical analysis, and ML integration',
        tools: 6,
        improvements: [
          'science_setup, science_analyze, science_visualize - Data analysis tools',
          'science_stats - Statistical tests (t-test, ANOVA, correlation, regression)',
          'science_ml - Machine learning (linear/logistic regression, random forest, SVM, k-means)',
          'science_export - Multi-format export (CSV, Excel, JSON, Parquet, HTML, PDF)',
          'Python virtual environment management',
          'Full integration with Memory + Planning for scientific workflows',
        ],
      },
    ];

    // Display absorbed projects
    absorbed.forEach((project, index) => {
      console.log(`✅ ${project.name} (${project.version} - ${project.date})`);
      console.log(`   ${project.description}`);
      if ((project as any).guides) {
        console.log(`   ${project.tools} tools + ${(project as any).guides} guides created`);
      } else {
        console.log(`   ${project.tools} tools absorbed`);
      }
      console.log(`   Our improvements:`);
      project.improvements.forEach((imp) => {
        console.log(`     - ${imp}`);
      });
      if (index < absorbed.length - 1) console.log('');
    });

    console.log('\n📊 Progress: 7/8 projects completed (87.5% 🎉)');
    console.log(`🔧 Total tools: ${absorbed.reduce((sum, p) => sum + p.tools, 0)}`);
    console.log(`📚 Total guides: ${absorbed.reduce((sum, p) => sum + ((p as any).guides || 0), 0)}`);
    console.log('   Distribution: 4 memory + 5 agent + 3 planning + 4 tdd + 10 specialist + 2 guide + 6 science');

    console.log('\n⏳ Next absorption (v0.7.0 - Future):');
    console.log('   Additional integration tools and features');
    console.log('   Expected: +4-8 tools\n');
  });

program
  .command('vote')
  .description('Vote for next absorption target')
  .argument('[project]', 'Project to vote for (planning-with-files, superpowers, agents, guide, scientific)')
  .action(async (project?: string) => {
    // Voting data (in-memory for now, should be persisted)
    const votingData = {
      'planning-with-files': 156,
      superpowers: 89,
      agents: 67,
      guide: 45,
      scientific: 34,
    };

    if (!project) {
      // Show voting status
      console.log('📊 Next Absorption Vote:\n');

      const sorted = Object.entries(votingData).sort((a, b) => b[1] - a[1]);

      sorted.forEach(([name, votes], index) => {
        const isLocked = index === 0;
        const icon = isLocked ? '🎯' : '📅';
        const status = isLocked ? 'Locked for v0.2.0 (Feb 2025)' : `${votes} votes`;

        console.log(`  ${index + 1}. ${name} (${votes} votes)`);
        console.log(`     ${icon} ${status}\n`);
      });

      console.log('Want to vote?');
      console.log('→ awesome-plugin vote <project-name>\n');
      console.log('Want to suggest a new project?');
      console.log('→ Open an issue at github.com/yourusername/awesome-pulgin\n');
      return;
    }

    // Cast vote
    if (!(project in votingData)) {
      console.log(`❌ Unknown project: ${project}`);
      console.log('Available projects: planning-with-files, superpowers, agents, guide, scientific\n');
      return;
    }

    console.log(`✅ Voted for "${project}"!\n`);

    // Increment vote (in-memory only)
    (votingData as any)[project]++;

    // Show updated rankings
    const sorted = Object.entries(votingData).sort((a, b) => b[1] - a[1]);

    console.log('📊 Updated Rankings:\n');
    sorted.forEach(([name, votes], index) => {
      const indicator = name === project ? ' ← You voted' : '';
      const icon = index === 0 ? '🎯' : '📅';
      console.log(`  ${index + 1}. ${name} (${votes} votes)${indicator}`);
    });

    console.log('\n💡 Note: Voting data is not persisted yet. This is a preview feature.\n');
  });

program.parse(process.argv);
