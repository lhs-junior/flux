#!/usr/bin/env node

import { Command } from 'commander';
import * as readline from 'readline/promises';
import { homedir } from 'os';
import { join } from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AwesomePluginGateway } from './core/gateway.js';
import { GitHubExplorer } from './discovery/github-explorer.js';
import { QualityEvaluator } from './discovery/quality-evaluator.js';
import { PluginInstaller } from './discovery/plugin-installer.js';
import { MemoryManager } from './features/memory/memory-manager.js';
import { AgentOrchestrator } from './features/agents/agent-orchestrator.js';
import { PlanningManager } from './features/planning/planning-manager.js';
import { TDDManager } from './features/tdd/tdd-manager.js';
import { GuideManager } from './features/guide/guide-manager.js';
import { ScienceManager } from './features/science/index.js';
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

// Helper to get DB path from env or default
function getDbPath(overridePath?: string): string {
  if (overridePath) return overridePath;
  const envPath = process.env.AWESOME_PLUGIN_DB_PATH;
  if (envPath) return envPath;
  return join(homedir(), '.awesome-plugin', 'data.db');
}

// Helper to output JSON or human-readable format
function outputResult(data: any, jsonMode: boolean): void {
  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

program
  .name('awesome-plugin')
  .description('Awesome MCP Meta Plugin - Intelligent tool selection and auto-discovery')
  .version('1.2.0')
  .option('--db-path <path>', 'Override database path (default: ~/.awesome-plugin/data.db or $AWESOME_PLUGIN_DB_PATH)');

// ==================== SKILLS COMMANDS ====================

program
  .command('install-skills')
  .description('Install skill files to Claude skills directory')
  .option('--dest <path>', 'Destination directory', path.join(os.homedir(), '.claude', 'skills'))
  .option('--link', 'Create symlinks instead of copies (dev mode)')
  .option('--force', 'Overwrite existing files without prompting')
  .action(async (options) => {
    try {
      const skillsDir = path.join(__dirname, '..', 'skills');
      const destDir = options.dest.replace(/^~/, os.homedir());

      // Ensure destination exists
      await fs.promises.mkdir(destDir, { recursive: true });

      // Check if skills directory exists
      const skillFiles = await fs.promises.readdir(skillsDir).catch(() => []);

      if (skillFiles.length === 0) {
        console.error('❌ No skill files found in skills/ directory');
        process.exit(1);
      }

      console.log(`🚀 Installing skill files to ${destDir}\n`);

      for (const file of skillFiles) {
        if (!file.endsWith('.md')) continue;

        const src = path.join(skillsDir, file);
        const dest = path.join(destDir, file);

        try {
          if (options.link) {
            // Symlink mode
            await fs.promises.symlink(src, dest).catch(async (err) => {
              if (err.code === 'EEXIST' && options.force) {
                await fs.promises.unlink(dest);
                await fs.promises.symlink(src, dest);
              } else if (err.code === 'EEXIST') {
                console.log(`⚠️  Skipped: ${file} (already exists, use --force to overwrite)`);
                return;
              } else {
                throw err;
              }
            });
            console.log(`🔗 Linked: ${file}`);
          } else {
            // Copy mode
            await fs.promises.copyFile(src, dest).catch(async (err) => {
              if (err.code === 'EEXIST' && !options.force) {
                console.log(`⚠️  Skipped: ${file} (already exists, use --force to overwrite)`);
                return;
              }
              throw err;
            });
            console.log(`✅ Installed: ${file}`);
          }
        } catch (error: any) {
          console.error(`❌ Failed to install ${file}:`, error.message);
        }
      }

      console.log(`\n✨ Installation complete!`);
      console.log(`Skill files location: ${destDir}`);
    } catch (error: any) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  });

// ==================== MCP COMMANDS ====================

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
      process.exit(1);
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
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show gateway statistics')
  .action(async () => {
    console.log('Gateway Statistics:');
    console.log('\nStatistics coming soon!');
  });

// ==================== MEMORY COMMANDS ====================

const memoryCmd = program
  .command('memory')
  .description('Memory management commands');

memoryCmd
  .command('save <key> <value>')
  .description('Save information to memory')
  .option('--category <category>', 'Category for the memory')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--json', 'Output as JSON')
  .action(async (key: string, value: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new MemoryManager(dbPath);

      const result = manager.save({
        key,
        value,
        metadata: {
          category: options.category,
          tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
        },
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(`✅ Memory saved: ${result.id}`);
        console.log(`   Key: ${result.memory.key}`);
        console.log(`   Category: ${result.memory.category || 'none'}`);
        if (result.memory.tags && result.memory.tags.length > 0) {
          console.log(`   Tags: ${result.memory.tags.join(', ')}`);
        }
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to save memory:', error.message);
      process.exit(1);
    }
  });

memoryCmd
  .command('recall <query>')
  .description('Search and recall memories')
  .option('--limit <number>', 'Maximum number of results', '10')
  .option('--category <category>', 'Filter by category')
  .option('--json', 'Output as JSON')
  .action(async (query: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new MemoryManager(dbPath);

      const result = manager.recall({
        query,
        limit: parseInt(options.limit),
        category: options.category,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        if (result.results.length === 0) {
          console.log('No memories found.');
        } else {
          console.log(`Found ${result.results.length} memories:\n`);
          result.results.forEach((mem, index) => {
            console.log(`${index + 1}. ${mem.key} (relevance: ${mem.relevance.toFixed(2)})`);
            console.log(`   ${mem.value}`);
            console.log(`   Category: ${mem.metadata.category || 'none'}`);
            if (mem.metadata.tags && mem.metadata.tags.length > 0) {
              console.log(`   Tags: ${mem.metadata.tags.join(', ')}`);
            }
            console.log('');
          });
        }
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to recall memories:', error.message);
      process.exit(1);
    }
  });

memoryCmd
  .command('list')
  .description('List all memories')
  .option('--category <category>', 'Filter by category')
  .option('--tags <tags>', 'Comma-separated tags to filter')
  .option('--limit <number>', 'Maximum number of results', '50')
  .option('--json', 'Output as JSON')
  .action(async (options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new MemoryManager(dbPath);

      const result = manager.list({
        filter: {
          category: options.category,
          tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
        },
        limit: parseInt(options.limit),
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        if (result.memories.length === 0) {
          console.log('No memories found.');
        } else {
          console.log(`${result.memories.length} memories:\n`);
          result.memories.forEach((mem, index) => {
            console.log(`${index + 1}. ${mem.key} (ID: ${mem.id})`);
            console.log(`   ${mem.value}`);
            console.log(`   Category: ${mem.metadata.category || 'none'}, Access count: ${mem.metadata.accessCount}`);
            console.log('');
          });
        }
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to list memories:', error.message);
      process.exit(1);
    }
  });

memoryCmd
  .command('forget <id>')
  .description('Delete a memory by ID')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new MemoryManager(dbPath);

      const result = manager.forget({ id });

      if (options.json) {
        outputResult(result, true);
      } else {
        if (result.success) {
          console.log(`✅ Memory forgotten: ${id}`);
        } else {
          console.log(`❌ Memory not found: ${id}`);
        }
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to forget memory:', error.message);
      process.exit(1);
    }
  });

// ==================== AGENT COMMANDS ====================

const agentCmd = program
  .command('agent')
  .description('Agent orchestration commands');

agentCmd
  .command('spawn <type> <task>')
  .description('Spawn a specialized agent')
  .option('--save-to-memory', 'Save agent result to memory')
  .option('--create-todo', 'Create a TODO for this agent task')
  .option('--json', 'Output as JSON')
  .action(async (type: string, task: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const orchestrator = new AgentOrchestrator(dbPath);

      const result = await orchestrator.spawn({
        type: type as any,
        task,
        saveToMemory: options.saveToMemory,
        createTodo: options.createTodo,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(`✅ Agent spawned: ${result.agentId}`);
        console.log(`   Type: ${type}`);
        console.log(`   Task: ${task}`);
        if (result.todoId) {
          console.log(`   TODO ID: ${result.todoId}`);
        }
      }

      orchestrator.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to spawn agent:', error.message);
      process.exit(1);
    }
  });

agentCmd
  .command('status <id>')
  .description('Check agent status')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const orchestrator = new AgentOrchestrator(dbPath);

      const result = orchestrator.getStatus({ agentId: id });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(`Agent: ${result.agentId}`);
        console.log(`Type: ${result.type}`);
        console.log(`Status: ${result.status}`);
        console.log(`Task: ${result.task}`);
        if (result.progress) {
          console.log(`Progress: ${result.progress}`);
        }
      }

      orchestrator.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to get agent status:', error.message);
      process.exit(1);
    }
  });

agentCmd
  .command('result <id>')
  .description('Get agent result')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const orchestrator = new AgentOrchestrator(dbPath);

      const result = orchestrator.getResult({ agentId: id });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(`Agent: ${result.agentId}`);
        console.log(`Status: ${result.status}`);
        if (result.duration) {
          console.log(`Duration: ${result.duration}ms`);
        }
        console.log('\nResult:');
        console.log(JSON.stringify(result.result, null, 2));
      }

      orchestrator.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to get agent result:', error.message);
      process.exit(1);
    }
  });

agentCmd
  .command('terminate <id>')
  .description('Terminate a running agent')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const orchestrator = new AgentOrchestrator(dbPath);

      const result = orchestrator.terminate({ agentId: id });

      if (options.json) {
        outputResult(result, true);
      } else {
        if (result.success) {
          console.log(`✅ Agent terminated: ${id}`);
        } else {
          console.log(`❌ Failed to terminate agent: ${id} (may already be completed or not found)`);
        }
      }

      orchestrator.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to terminate agent:', error.message);
      process.exit(1);
    }
  });

agentCmd
  .command('list')
  .description('List all agents')
  .option('--status <status>', 'Filter by status (pending, running, completed, failed, timeout)')
  .option('--json', 'Output as JSON')
  .action(async (options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const orchestrator = new AgentOrchestrator(dbPath);

      const result = orchestrator.list({
        status: options.status as any,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        if (result.agents.length === 0) {
          console.log('No agents found.');
        } else {
          console.log(`${result.agents.length} agents:\n`);
          result.agents.forEach((agent, index) => {
            console.log(`${index + 1}. ${agent.agentId}`);
            console.log(`   Type: ${agent.type}`);
            console.log(`   Status: ${agent.status}`);
            console.log(`   Task: ${agent.task}`);
            if (agent.progress) {
              console.log(`   Progress: ${agent.progress}`);
            }
            console.log('');
          });
        }
      }

      orchestrator.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to list agents:', error.message);
      process.exit(1);
    }
  });

// ==================== PLANNING COMMANDS ====================

const planningCmd = program
  .command('planning')
  .description('TODO planning and dependency management');

planningCmd
  .command('create <content>')
  .description('Create a new TODO item')
  .option('--status <status>', 'Status (pending, in_progress, completed)', 'pending')
  .option('--parent <id>', 'Parent TODO ID for dependencies')
  .option('--json', 'Output as JSON')
  .action(async (content: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new PlanningManager(dbPath);

      const result = manager.create({
        content,
        status: options.status as any,
        parentId: options.parent,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(`✅ TODO created: ${result.todo.id}`);
        console.log(`   Content: ${result.todo.content}`);
        console.log(`   Status: ${result.todo.status}`);
        if (result.todo.parentId) {
          console.log(`   Parent: ${result.todo.parentId}`);
        }
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to create TODO:', error.message);
      process.exit(1);
    }
  });

planningCmd
  .command('update <id>')
  .description('Update a TODO item')
  .option('--status <status>', 'New status (pending, in_progress, completed)')
  .option('--content <content>', 'New content')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new PlanningManager(dbPath);

      const result = manager.update({
        id,
        status: options.status as any,
        content: options.content,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        if (result.success && result.todo) {
          console.log(`✅ TODO updated: ${result.todo.id}`);
          console.log(`   Content: ${result.todo.content}`);
          console.log(`   Status: ${result.todo.status}`);
        } else {
          console.log(`❌ TODO not found: ${id}`);
        }
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to update TODO:', error.message);
      process.exit(1);
    }
  });

planningCmd
  .command('tree')
  .description('Show TODO dependency tree')
  .option('--json', 'Output as JSON')
  .action(async (options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new PlanningManager(dbPath);

      const result = manager.tree({});

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(result.tree);
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to generate tree:', error.message);
      process.exit(1);
    }
  });

// ==================== TDD COMMANDS ====================

const tddCmd = program
  .command('tdd')
  .description('Test-Driven Development workflow');

tddCmd
  .command('red <test-path>')
  .description('RED phase: Create and run a failing test')
  .option('--json', 'Output as JSON')
  .action(async (testPath: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new TDDManager(dbPath);

      const result = await manager.handleToolCall('tdd_red', {
        testPath,
        description: `Test for ${testPath}`,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log((result as any).message);
      }

      manager.close();
      process.exit((result as any).success ? 0 : 1);
    } catch (error: any) {
      console.error('❌ RED phase failed:', error.message);
      process.exit(1);
    }
  });

tddCmd
  .command('green <test-path>')
  .description('GREEN phase: Verify test passes')
  .option('--json', 'Output as JSON')
  .action(async (testPath: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new TDDManager(dbPath);

      const result = await manager.handleToolCall('tdd_green', {
        testPath,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log((result as any).message);
      }

      manager.close();
      process.exit((result as any).success ? 0 : 1);
    } catch (error: any) {
      console.error('❌ GREEN phase failed:', error.message);
      process.exit(1);
    }
  });

tddCmd
  .command('refactor <file-path>')
  .description('REFACTOR phase: Improve code while keeping tests green')
  .option('--json', 'Output as JSON')
  .action(async (filePath: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new TDDManager(dbPath);

      const result = await manager.handleToolCall('tdd_refactor', {
        filePath,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log((result as any).message);
      }

      manager.close();
      process.exit((result as any).success ? 0 : 1);
    } catch (error: any) {
      console.error('❌ REFACTOR phase failed:', error.message);
      process.exit(1);
    }
  });

tddCmd
  .command('verify')
  .description('Run full test suite with coverage')
  .option('--coverage <number>', 'Minimum coverage percentage', '80')
  .option('--json', 'Output as JSON')
  .action(async (options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new TDDManager(dbPath);

      const result = await manager.handleToolCall('tdd_verify', {
        minCoverage: parseFloat(options.coverage),
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log((result as any).message);
        console.log(`\nTests run: ${(result as any).testsRun}`);
        console.log(`Tests passed: ${(result as any).testsPassed}`);
        console.log(`Tests failed: ${(result as any).testsFailed}`);
        if ((result as any).coverage !== null) {
          console.log(`Coverage: ${(result as any).coverage.toFixed(1)}%`);
        }
      }

      manager.close();
      process.exit((result as any).success ? 0 : 1);
    } catch (error: any) {
      console.error('❌ Verify failed:', error.message);
      process.exit(1);
    }
  });

// ==================== GUIDE COMMANDS ====================

const guideCmd = program
  .command('guide')
  .description('Interactive guides and tutorials');

guideCmd
  .command('search <query>')
  .description('Search for guides and tutorials')
  .option('--category <category>', 'Filter by category (getting-started, tutorial, reference, concept, troubleshooting)')
  .option('--difficulty <level>', 'Filter by difficulty (beginner, intermediate, advanced)')
  .option('--limit <number>', 'Maximum number of results', '10')
  .option('--json', 'Output as JSON')
  .action(async (query: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new GuideManager(dbPath);

      const result = manager.search({
        query,
        category: options.category as any,
        difficulty: options.difficulty as any,
        limit: parseInt(options.limit),
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        if (result.results.length === 0) {
          console.log('No guides found.');
        } else {
          console.log(`Found ${result.results.length} guides:\n`);
          result.results.forEach((item, index) => {
            console.log(`${index + 1}. ${item.guide.title}`);
            console.log(`   ${item.guide.excerpt}`);
            console.log(`   Category: ${item.guide.category}, Difficulty: ${item.guide.difficulty}`);
            console.log(`   Relevance: ${item.relevance.toFixed(2)}`);
            console.log('');
          });
        }
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Failed to search guides:', error.message);
      process.exit(1);
    }
  });

guideCmd
  .command('tutorial <action>')
  .description('Interactive tutorial system (actions: start, next, previous, hint, check, status, complete, reset)')
  .option('--guide-id <id>', 'Guide ID')
  .option('--json', 'Output as JSON')
  .action(async (action: string, options: any, command: Command) => {
    try {
      const dbPath = getDbPath(command.parent?.parent?.opts().dbPath);
      const manager = new GuideManager(dbPath);

      if (!options.guideId) {
        console.error('❌ --guide-id is required');
        process.exit(1);
      }

      const result = await manager.tutorial({
        action: action as any,
        guideId: options.guideId,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Tutorial action failed:', error.message);
      process.exit(1);
    }
  });

// ==================== SCIENCE COMMANDS ====================

const scienceCmd = program
  .command('science')
  .description('Data science and statistical analysis');

scienceCmd
  .command('stats <operation>')
  .description('Statistical analysis (ttest, anova, chi_square, correlation, regression, mann_whitney)')
  .option('--data <json>', 'Input data as JSON string')
  .option('--json', 'Output as JSON')
  .action(async (operation: string, options: any, command: Command) => {
    try {
      const manager = new ScienceManager();

      if (!options.data) {
        console.error('❌ --data is required');
        process.exit(1);
      }

      const data = JSON.parse(options.data);
      const result = await manager.handleToolCall('science_stats', {
        operation,
        data,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Stats operation failed:', error.message);
      process.exit(1);
    }
  });

scienceCmd
  .command('ml <operation>')
  .description('Machine learning (linear_regression, logistic_regression, random_forest, xgboost, svm, kmeans)')
  .option('--data <json>', 'Input data as JSON string')
  .option('--json', 'Output as JSON')
  .action(async (operation: string, options: any, command: Command) => {
    try {
      const manager = new ScienceManager();

      if (!options.data) {
        console.error('❌ --data is required');
        process.exit(1);
      }

      const data = JSON.parse(options.data);
      const result = await manager.handleToolCall('science_ml', {
        operation,
        data,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ ML operation failed:', error.message);
      process.exit(1);
    }
  });

scienceCmd
  .command('export <format>')
  .description('Export data to various formats (csv, excel, json, parquet, html, pdf, notebook)')
  .option('--data <json>', 'Input data as JSON string')
  .option('--output <path>', 'Output file path')
  .option('--json', 'Output as JSON')
  .action(async (format: string, options: any, command: Command) => {
    try {
      const manager = new ScienceManager();

      if (!options.data) {
        console.error('❌ --data is required');
        process.exit(1);
      }

      const data = JSON.parse(options.data);
      const result = await manager.handleToolCall('science_export', {
        format,
        data,
        output: options.output,
      });

      if (options.json) {
        outputResult(result, true);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }

      manager.close();
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Export failed:', error.message);
      process.exit(1);
    }
  });

// ==================== ABSORPTION HISTORY ====================

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
