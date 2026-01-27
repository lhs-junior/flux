#!/usr/bin/env node

import { Command } from 'commander';
import * as readline from 'readline/promises';
import { AwesomePluginGateway } from './core/gateway.js';
import { GitHubExplorer } from './discovery/github-explorer.js';
import { QualityEvaluator } from './discovery/quality-evaluator.js';
import { PluginInstaller } from './discovery/plugin-installer.js';

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
  .version('0.1.0');

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

      console.log(`✅ Found ${evaluated.length} recommended MCP servers:\n`);

      // Display results
      evaluated.forEach((item, index) => {
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
        for (const item of evaluated) {
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

        let toInstall: typeof evaluated = [];

        if (answer.trim().toLowerCase() === 'all') {
          toInstall = evaluated;
        } else {
          const indices = answer
            .split(',')
            .map((n) => parseInt(n.trim()) - 1)
            .filter((i) => i >= 0 && i < evaluated.length);

          toInstall = indices.map((i) => evaluated[i]).filter((item) => item !== undefined);
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

program.parse(process.argv);
