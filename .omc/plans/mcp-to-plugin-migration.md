# Work Plan: Transform awesome-plugin from MCP Server to Claude Code Plugin

**Plan ID:** mcp-to-plugin-migration
**Created:** 2026-01-28
**Revised:** 2026-01-28 (Critic feedback + Architect guidance)
**Status:** Ready for Execution

---

## Context

### Original Request
Transform awesome-plugin (v1.2.0) from an MCP Server architecture to a Claude Code Plugin architecture. The current MCP implementation loads all 34 tools (~10,200 tokens) on every request due to protocol limitations. The goal is to create 7 skill files that load on-demand, reducing token usage by ~93%.

### Current Architecture Analysis

**MCP Server Structure:**
```
src/
  core/
    gateway.ts              # AwesomePluginGateway - MCP server entry point
    feature-coordinator.ts  # Routes calls to 6 feature managers
    mcp-client.ts          # MCP protocol client
    tool-loader.ts         # BM25-based tool loading
  features/
    memory/                # 4 tools: save, recall, list, forget
    agents/                # 5 tools + 14 specialist types
    planning/              # 3 tools exposed + delete (implementation exists, not exposed)
    tdd/                   # 4 tools: red, green, refactor, verify
    guide/                 # 2 tools: search, tutorial
    science/               # 3 tools: stats, ml, export
  storage/
    metadata-store.ts      # SQLite persistence
```

**Key Dependencies:**
- `better-sqlite3` (v11.8.1) - SQLite persistence
- `okapibm25` (v1.4.1) - BM25 search indexing
- `@modelcontextprotocol/sdk` (v1.0.4) - MCP protocol (to be removed)
- `zod` (v3.24.1) - Input validation

**Tool Count by System:**
| System | Tools | Est. Tokens |
|--------|-------|-------------|
| Memory | 4 | ~1,200 |
| Agents | 5 | ~1,500 |
| Planning | 4 (after adding delete) | ~1,000 |
| TDD | 4 | ~1,200 |
| Guide | 2 | ~600 |
| Science | 3 | ~900 |
| **Total** | **22** | **~6,400** |

Note: Original estimate of 34 tools included specialist agent types as separate tools. Actual MCP tool count is 21 (becomes 22 after exposing `planning_delete`), but specialist prompts add significant context.

### Research Findings

**Claude Code Plugin Format (.md skill files):**
- Location: `~/.claude/skills/` or project `.claude/skills/`
- Format: Markdown with frontmatter metadata
- Invocation: Through Bash commands calling TypeScript CLI
- Token loading: On-demand when skill is activated

**Plugin Architecture Pattern:**
```markdown
---
name: skill-name
description: Brief description
triggers:
  - keyword1
  - keyword2
---

# Skill Name

## Usage
Instructions for Claude on when/how to use this skill.

## Commands
```bash
npx awesome-plugin <command> [args]
```

## Examples
...
```

---

## Work Objectives

### Core Objective
Create 7 Claude Code Plugin skill files that wrap the existing TypeScript implementation, enabling on-demand loading with ~93% token reduction.

### Deliverables
1. **7 Skill Files** - One per system in project `skills/` directory (installed via CLI)
2. **CLI Wrapper** - Updated `src/cli.ts` with subcommands for all features (starting from zero subcommands)
3. **TypeScript Exports** - Clean API for plugin invocation
4. **Skill Installation Command** - `install-skills` CLI command for copying skills to user directory
5. **Migration Guide** - Documentation for existing users
6. **Updated Documentation** - README and feature docs

### Definition of Done
- [ ] `planning_delete` exposed as MCP tool
- [ ] All 7 skill files created and functional
- [ ] CLI supports all 22 tool operations
- [ ] `install-skills` command works (including `--link` dev mode)
- [ ] Existing SQLite databases remain compatible
- [ ] Cross-system integrations preserved (Memory <-> Agent <-> Planning)
- [ ] Token usage per skill: 600-800 tokens (verified)
- [ ] All existing tests pass
- [ ] Migration guide complete

---

## Guardrails

### Must Have
- Backward compatibility with existing SQLite databases
- All existing functionality preserved
- Cross-system integration maintained
- CLI interface for all operations
- Each skill file under 800 tokens
- Skill files bundled in npm package under `skills/` directory
- `"files": ["dist/", "skills/"]` in package.json

### Must NOT Have
- Breaking changes to database schema
- Removal of any existing feature
- Direct MCP protocol dependency in new plugin code
- Hardcoded paths (must use environment variables)

---

## Task Flow and Dependencies

```
Phase 1: Foundation (Tasks 0-3.5)
    |
    +-> [0] Expose planning_delete MCP tool (PREREQUISITE)
    |       |
    +-> [1] CLI Architecture (10h - starting from ZERO subcommands)
    |       |
    +-> [2] Export Cleanup ----+
    |       |                  |
    +-> [2.5] install-skills   |
    |         CLI command      |
    |                          |
    +-> [3] Plugin Wrapper ----+
                               |
                               v
Phase 2: Skill Files (Tasks 4-10) [Parallel]
    |
    +-> [4] Memory Skill      (project: skills/awesome-memory.md)
    +-> [5] Agents Skill      (project: skills/awesome-agents.md)
    +-> [6] Planning Skill    (project: skills/awesome-planning.md)
    +-> [7] TDD Skill         (project: skills/awesome-tdd.md)
    +-> [8] Guide Skill       (project: skills/awesome-guide.md)
    +-> [9] Science Skill     (project: skills/awesome-science.md)
    +-> [10] Specialists Skill (project: skills/awesome-specialists.md)
                               |
                               v
Phase 3: Integration (Tasks 11-13)
    |
    +-> [11] Cross-System Integration Testing
    +-> [12] Token Measurement & Optimization
    +-> [13] Documentation & Migration Guide
```

---

## Detailed TODOs

### Phase 1: Foundation

#### TODO 0: Expose `planning_delete` as MCP Tool
**Priority:** Critical (Prerequisite)
**Estimated Effort:** 0.5 hours
**Dependencies:** None

**Description:**
The `planning_delete` implementation already exists at line 207 in `planning-manager.ts`, but it is not exposed in `getToolDefinitions()`. This task adds the tool definition, validation schema, and handler case.

**Files to Modify:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/src/features/planning/planning-manager.ts`

**Implementation Steps:**
1. Add `planning_delete` to `getToolDefinitions()` return array
2. Create Zod validation schema for delete parameters (requires `id: string`)
3. Add `case 'planning_delete':` in `handleToolCall()` switch statement
4. Wire case to existing delete implementation at line 207

**Acceptance Criteria:**
- [ ] `planning_delete` appears in `getToolDefinitions()` output
- [ ] Zod schema validates `{ id: string }` input
- [ ] `handleToolCall('planning_delete', { id: 'xxx' })` invokes delete logic
- [ ] Existing tests still pass

**Code Pattern:**
```typescript
// In getToolDefinitions()
{
  name: 'planning_delete',
  description: 'Delete a TODO item by ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The TODO ID to delete' }
    },
    required: ['id']
  }
}

// In handleToolCall()
case 'planning_delete':
  return this.deleteTodo(input.id);
```

---

#### TODO 1: CLI Architecture Refactoring
**Priority:** Critical
**Estimated Effort:** 10 hours (revised from 4h - current CLI has ZERO feature subcommands)
**Dependencies:** TODO 0

**Description:**
The current `src/cli.ts` has no feature subcommands. This task creates the entire CLI subcommand structure from scratch for all 22 operations using Commander.js scaffolding pattern.

**Files to Modify:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/src/cli.ts`

**Implementation Steps:**
1. Install/verify Commander.js as dependency
2. Set up base program structure with version and description
3. Create subcommand groups for each system:
   - `memory save|recall|list|forget` (4 commands)
   - `agent spawn|status|result|terminate|list` (5 commands)
   - `planning create|update|tree|delete` (4 commands)
   - `tdd red|green|refactor|verify` (4 commands)
   - `guide search|tutorial` (2 commands)
   - `science stats|ml|export` (3 commands)
4. Add JSON output mode (`--json`) for machine-readable responses
5. Add database path configuration (`--db-path`)
6. Handle stdin for complex inputs
7. Add comprehensive help text for each command

**Acceptance Criteria:**
- [ ] All 22 operations accessible via CLI
- [ ] JSON output mode works for all commands
- [ ] Database path configurable via flag or env var
- [ ] Exit codes reflect success/failure
- [ ] `--help` shows usage for all commands
- [ ] Each command has argument validation

**Code Pattern:**
```typescript
// Example CLI structure using Commander.js scaffolding
import { Command } from 'commander';

const program = new Command();

program
  .name('awesome-plugin')
  .version('1.2.0')
  .description('Awesome Plugin CLI');

// Memory commands
const memoryCmd = program
  .command('memory')
  .description('Memory management operations');

memoryCmd
  .command('save <key> <value>')
  .option('--category <cat>', 'Category')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--json', 'Output as JSON')
  .action(async (key, value, opts) => { /* ... */ });

memoryCmd
  .command('recall <query>')
  .option('--limit <n>', 'Max results', '10')
  .option('--category <cat>', 'Filter by category')
  .option('--json', 'Output as JSON')
  .action(async (query, opts) => { /* ... */ });

// ... repeat for all 22 commands
```

---

#### TODO 2: Export Cleanup and Plugin API
**Priority:** Critical
**Estimated Effort:** 2 hours
**Dependencies:** None (can parallel with TODO 1)

**Description:**
Create a clean export API in `src/index.ts` that exposes all managers for direct programmatic access, independent of MCP protocol.

**Files to Modify:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/src/index.ts`
- `/Users/hyunsoo/personal-projects/awesome-pulgin/package.json` (add `"files": ["dist/", "skills/"]`)

**Implementation Steps:**
1. Export all feature managers directly
2. Create factory functions for easy instantiation
3. Remove MCP-specific main entry point (keep for backward compat)
4. Add TypeScript types for all public APIs
5. Update `package.json` to include `"files": ["dist/", "skills/"]` for npm bundling

**Acceptance Criteria:**
- [ ] All managers exported with proper types
- [ ] Factory function `createAwesomePlugin(options)` available
- [ ] No MCP dependencies in public API
- [ ] Backward compatible with existing imports
- [ ] `package.json` has `"files": ["dist/", "skills/"]`

---

#### TODO 2.5: Add `install-skills` CLI Command
**Priority:** Critical
**Estimated Effort:** 1.5 hours
**Dependencies:** TODO 1 (CLI structure), TODO 4-10 (skill files exist)

**Description:**
Create an `install-skills` CLI subcommand that copies skill files from the npm package's `skills/` directory to the user's `~/.claude/skills/` directory.

**Files to Modify:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/src/cli.ts`

**Implementation Steps:**
1. Add `install-skills` command to CLI
2. Determine source path: `path.join(__dirname, '../skills/')` (npm package location)
3. Default destination: `~/.claude/skills/`
4. Support `--dest <path>` to override destination
5. Support `--link` flag for development mode (symlink instead of copy)
6. Handle file conflicts (prompt or `--force` flag)
7. Print success/failure messages for each skill file

**Acceptance Criteria:**
- [ ] `npx awesome-plugin install-skills` copies all 7 skill files
- [ ] `--dest <path>` overrides destination directory
- [ ] `--link` creates symlinks instead of copies (for dev mode)
- [ ] `--force` overwrites existing files without prompt
- [ ] Command lists which files were installed
- [ ] Handles missing destination directory (creates it)

**Code Pattern:**
```typescript
program
  .command('install-skills')
  .description('Install skill files to Claude skills directory')
  .option('--dest <path>', 'Destination directory', '~/.claude/skills')
  .option('--link', 'Create symlinks instead of copies (dev mode)')
  .option('--force', 'Overwrite existing files')
  .action(async (opts) => {
    const skillsDir = path.join(__dirname, '../skills');
    const destDir = opts.dest.replace('~', os.homedir());

    // Ensure destination exists
    await fs.mkdir(destDir, { recursive: true });

    const files = await fs.readdir(skillsDir);
    for (const file of files) {
      const src = path.join(skillsDir, file);
      const dest = path.join(destDir, file);

      if (opts.link) {
        await fs.symlink(src, dest);
        console.log(`Linked: ${file}`);
      } else {
        await fs.copyFile(src, dest);
        console.log(`Installed: ${file}`);
      }
    }
  });
```

---

#### TODO 3: Plugin Wrapper Module
**Priority:** Critical
**Estimated Effort:** 3 hours
**Dependencies:** TODO 2

**Description:**
Create a lightweight wrapper module that initializes managers on-demand and handles JSON serialization for CLI output.

**Files to Create:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/src/plugin/index.ts`
- `/Users/hyunsoo/personal-projects/awesome-pulgin/src/plugin/config.ts`

**Implementation Steps:**
1. Create singleton manager instances with lazy initialization
2. Implement configuration loading (env vars, config file)
3. Add JSON serialization helpers
4. Handle database path resolution

**Acceptance Criteria:**
- [ ] Managers initialize only when needed
- [ ] Configuration supports env vars and config file
- [ ] Database path defaults to `~/.awesome-plugin/data.db`
- [ ] All outputs properly JSON serializable

---

### Phase 2: Skill Files

**Note:** All skill files are created in the project's `skills/` directory, not directly in `~/.claude/skills/`. Users install them via `npx awesome-plugin install-skills`.

#### TODO 4: Memory Skill File
**Priority:** High
**Estimated Effort:** 1.5 hours
**Dependencies:** TODO 1, TODO 3

**Description:**
Create `awesome-memory.md` skill file for Claude Code plugin system.

**File to Create:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-memory.md`

**Tool Operations:**
| Command | Description |
|---------|-------------|
| `memory save <key> <value>` | Save information to memory |
| `memory recall <query>` | Search memories using BM25 |
| `memory list` | List all memories with filters |
| `memory forget <id>` | Delete a specific memory |

**Skill File Structure:**
```markdown
---
name: awesome-memory
description: Persistent memory with BM25 semantic search
triggers:
  - remember
  - recall
  - memory
  - save context
  - forget
---

# Awesome Memory

Persistent memory system with BM25 semantic search for storing and retrieving information across sessions.

## When to Use
- Store important facts, preferences, or context
- Recall previously saved information
- Track project-specific knowledge

## Commands

### Save Memory
```bash
npx awesome-plugin memory save "<key>" "<value>" --category <cat> --tags "tag1,tag2"
```

### Recall Memory
```bash
npx awesome-plugin memory recall "<query>" --limit 10 --category <cat>
```

### List Memories
```bash
npx awesome-plugin memory list --category <cat> --tags "tag1" --limit 50
```

### Forget Memory
```bash
npx awesome-plugin memory forget <memory-id>
```

## Examples
[2-3 practical examples]
```

**Acceptance Criteria:**
- [ ] Skill file created at `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-memory.md`
- [ ] All 4 operations documented
- [ ] Token count under 800
- [ ] Triggers cover common use cases
- [ ] Examples are practical and clear

---

#### TODO 5: Agents Skill File
**Priority:** High
**Estimated Effort:** 2 hours
**Dependencies:** TODO 1, TODO 3

**Description:**
Create `awesome-agents.md` skill file for agent orchestration.

**File to Create:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-agents.md`

**Tool Operations:**
| Command | Description |
|---------|-------------|
| `agent spawn <type> <task>` | Spawn specialist agent |
| `agent status <id>` | Check agent status |
| `agent result <id>` | Get agent result |
| `agent terminate <id>` | Stop running agent |
| `agent list` | List all agents |

**Agent Types to Document:**
- Base: researcher, coder, tester, reviewer
- Specialists: architect, frontend, backend, database, devops, security, performance, documentation, bugfix, refactor

**Acceptance Criteria:**
- [ ] Skill file created at `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-agents.md`
- [ ] All 5 operations documented
- [ ] All 14 agent types listed with descriptions
- [ ] Integration options documented (--save-to-memory, --create-todo)
- [ ] Token count under 800

---

#### TODO 6: Planning Skill File
**Priority:** High
**Estimated Effort:** 1 hour
**Dependencies:** TODO 0 (planning_delete exposed), TODO 1, TODO 3

**Description:**
Create `awesome-planning.md` skill file for TODO/task management. Now includes `planning delete` operation.

**File to Create:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-planning.md`

**Tool Operations:**
| Command | Description |
|---------|-------------|
| `planning create <content>` | Create new TODO |
| `planning update <id>` | Update TODO status/content |
| `planning tree` | Visualize dependency tree |
| `planning delete <id>` | Remove TODO (NEW - enabled by TODO 0) |

**Acceptance Criteria:**
- [ ] Skill file created at `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-planning.md`
- [ ] All 4 operations documented (including delete)
- [ ] Dependency/parent relationship explained
- [ ] TDD integration documented
- [ ] Token count under 700

---

#### TODO 7: TDD Skill File
**Priority:** High
**Estimated Effort:** 1 hour
**Dependencies:** TODO 1, TODO 3

**Description:**
Create `awesome-tdd.md` skill file for test-driven development workflow.

**File to Create:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-tdd.md`

**Tool Operations:**
| Command | Description |
|---------|-------------|
| `tdd red <test-path>` | RED phase - write failing test |
| `tdd green <test-path>` | GREEN phase - make test pass |
| `tdd refactor <file-path>` | REFACTOR phase - improve code |
| `tdd verify` | Run full test suite with coverage |

**Acceptance Criteria:**
- [ ] Skill file created at `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-tdd.md`
- [ ] RED-GREEN-REFACTOR workflow clearly explained
- [ ] Test runner detection documented (vitest, jest, mocha)
- [ ] Coverage requirements configurable
- [ ] Token count under 700

---

#### TODO 8: Guide Skill File
**Priority:** Medium
**Estimated Effort:** 1 hour
**Dependencies:** TODO 1, TODO 3

**Description:**
Create `awesome-guide.md` skill file for interactive tutorials.

**File to Create:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-guide.md`

**Tool Operations:**
| Command | Description |
|---------|-------------|
| `guide search <query>` | Search guides/tutorials |
| `guide tutorial <action>` | Interactive tutorial navigation |

**Tutorial Actions:** start, next, previous, hint, check, status, complete, reset

**Acceptance Criteria:**
- [ ] Skill file created at `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-guide.md`
- [ ] Search with filters documented
- [ ] All tutorial actions documented
- [ ] Token count under 600

---

#### TODO 9: Science Skill File
**Priority:** Medium
**Estimated Effort:** 1.5 hours
**Dependencies:** TODO 1, TODO 3

**Description:**
Create `awesome-science.md` skill file for statistical analysis and ML.

**File to Create:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-science.md`

**Tool Operations:**
| Command | Description |
|---------|-------------|
| `science stats <operation>` | Statistical analysis |
| `science ml <operation>` | Machine learning |
| `science export <format>` | Export data |

**Stats Operations:** ttest, anova, chi_square, correlation, regression, mann_whitney
**ML Operations:** linear_regression, logistic_regression, random_forest, xgboost, svm, kmeans
**Export Formats:** csv, excel, json, parquet, html, pdf, notebook

**Acceptance Criteria:**
- [ ] Skill file created at `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-science.md`
- [ ] All statistical operations documented
- [ ] All ML operations documented
- [ ] Export formats listed
- [ ] Token count under 800

---

#### TODO 10: Specialists Skill File
**Priority:** Medium
**Estimated Effort:** 2 hours
**Dependencies:** TODO 5 (shares agent spawn)

**Description:**
Create `awesome-specialists.md` skill file with detailed prompts for each specialist agent type.

**File to Create:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-specialists.md`

**Specialist Types:**
1. **Architect** - System design, patterns, scalability
2. **Frontend** - UI/UX, React/Vue, CSS, accessibility
3. **Backend** - APIs, services, business logic
4. **Database** - Schema design, queries, optimization
5. **DevOps** - CI/CD, deployment, infrastructure
6. **Security** - Audits, vulnerabilities, hardening
7. **Performance** - Profiling, optimization, caching
8. **Documentation** - Technical writing, API docs
9. **Bugfix** - Debugging, root cause analysis
10. **Refactor** - Code improvement, patterns
11. **Testing** - Test strategies, coverage
12. **Code-Review** - Review guidelines, feedback
13. **Integration** - System integration, APIs
14. **API-Design** - REST/GraphQL design

**Acceptance Criteria:**
- [ ] Skill file created at `/Users/hyunsoo/personal-projects/awesome-pulgin/skills/awesome-specialists.md`
- [ ] All 14 specialist types documented
- [ ] Each specialist has: role, capabilities, best practices
- [ ] Usage examples for common scenarios
- [ ] Token count under 800

---

### Phase 3: Integration

#### TODO 11: Cross-System Integration Testing
**Priority:** High
**Estimated Effort:** 3 hours
**Dependencies:** TODOs 4-10

**Description:**
Verify all cross-system integrations work through the new CLI interface.

**Files to Modify:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/tests/integration/`

**Test Scenarios:**
1. Agent spawns with `--save-to-memory` flag
2. Agent spawns with `--create-todo` flag
3. TDD workflow creates planning TODOs
4. Guide completion saves to memory
5. Science results persist to memory
6. `planning delete` removes TODOs correctly

**Acceptance Criteria:**
- [ ] All integration scenarios tested
- [ ] Tests pass via CLI invocation
- [ ] Database persistence verified
- [ ] Error handling validated

---

#### TODO 12: Token Measurement and Optimization
**Priority:** High
**Estimated Effort:** 2 hours
**Dependencies:** TODOs 4-10

**Description:**
Measure actual token usage for each skill file and optimize if needed.

**Implementation Steps:**
1. Use Claude tokenizer to count tokens per skill file
2. Compare against 800 token target
3. Optimize verbose skills by:
   - Condensing examples
   - Using tables instead of prose
   - Removing redundant information
4. Document final token counts

**Acceptance Criteria:**
- [ ] All skill files measured
- [ ] All skills under 800 tokens
- [ ] Total combined tokens documented
- [ ] Comparison with MCP baseline (10,200 tokens)

---

#### TODO 13: Documentation and Migration Guide
**Priority:** High
**Estimated Effort:** 3 hours
**Dependencies:** TODOs 11-12

**Description:**
Create comprehensive documentation for the new plugin system.

**Files to Create/Modify:**
- `/Users/hyunsoo/personal-projects/awesome-pulgin/README.md`
- `/Users/hyunsoo/personal-projects/awesome-pulgin/docs/MIGRATION.md`
- `/Users/hyunsoo/personal-projects/awesome-pulgin/docs/PLUGIN_GUIDE.md`

**Documentation Sections:**
1. **Migration Guide:**
   - Why migrate (token savings)
   - Step-by-step installation
   - Using `npx awesome-plugin install-skills` command
   - Using `--link` for development
   - Database migration (if needed)
   - Breaking changes (none expected)

2. **Plugin Guide:**
   - Skill file locations (project `skills/` vs user `~/.claude/skills/`)
   - Installation command usage
   - Customization options
   - Environment variables
   - Troubleshooting

3. **Updated README:**
   - New architecture overview
   - Quick start for both MCP and Plugin modes
   - Feature comparison

**Acceptance Criteria:**
- [ ] Migration guide complete
- [ ] Plugin guide complete
- [ ] README updated
- [ ] All examples tested and working
- [ ] `install-skills` usage documented

---

## Commit Strategy

| Commit | Tasks | Description |
|--------|-------|-------------|
| 1 | TODO 0 | feat(planning): expose planning_delete as MCP tool |
| 2 | TODO 1 | feat(cli): add subcommand structure for all 22 operations |
| 3 | TODO 2 | refactor(exports): create clean plugin API, update package.json files |
| 4 | TODO 2.5 | feat(cli): add install-skills command with --link dev mode |
| 5 | TODO 3 | feat(plugin): add wrapper module with lazy initialization |
| 6 | TODO 4-6 | feat(skills): add memory, agents, planning skills |
| 7 | TODO 7-9 | feat(skills): add tdd, guide, science skills |
| 8 | TODO 10 | feat(skills): add specialists skill with all agent types |
| 9 | TODO 11 | test: add cross-system integration tests for CLI |
| 10 | TODO 12 | perf: optimize skill file token counts |
| 11 | TODO 13 | docs: add migration guide and update README |

---

## Success Criteria

### Quantitative
- [ ] Token reduction: >= 93% (10,200 -> ~700 per skill)
- [ ] All 22 operations functional via CLI (including planning delete)
- [ ] All existing tests pass
- [ ] No database migration required

### Qualitative
- [ ] Skill files are clear and well-documented
- [ ] CLI is intuitive and discoverable
- [ ] `install-skills` command works reliably
- [ ] Migration path is smooth for existing users
- [ ] Architecture enables future extensibility

---

## Risk Identification and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SQLite binary compatibility across platforms | Medium | High | Keep better-sqlite3, test on macOS/Linux/Windows |
| Skill file token count exceeds target | Medium | Medium | Use tables, condense examples, split if needed |
| Cross-system integration breaks | Low | High | Comprehensive integration tests before migration |
| CLI performance slower than MCP | Medium | Low | Lazy initialization, connection pooling |
| User confusion between MCP and Plugin modes | Medium | Medium | Clear documentation, deprecation timeline |
| CLI architecture takes longer than 10h estimate | Medium | Medium | Use Commander.js scaffolding, modular design |

---

## Verification Steps

### Pre-Implementation
1. Verify current test suite passes: `npm test`
2. Verify build works: `npm run build`
3. Document current token count baseline
4. Verify `planning_delete` implementation exists at line 207 in planning-manager.ts

### Post-Implementation
1. Run all tests: `npm test`
2. Test each CLI command manually
3. Test `install-skills` command with `--link` flag
4. Measure token counts for all skill files
5. Test database backward compatibility
6. Test on fresh installation
7. Verify skill file triggers in Claude Code

---

## Notes

### Architecture Decision: CLI vs Direct Node Module
Chose CLI approach because:
1. Skill files can only invoke Bash commands
2. CLI provides stable interface for future changes
3. Enables debugging and testing outside Claude
4. Matches existing plugin patterns (e.g., oh-my-claudecode)

### Database Location
Default: `~/.awesome-plugin/data.db`
Rationale: User-level persistence, shared across projects unless overridden.

### Skill File Location Strategy
- **Source:** Project `skills/` directory (bundled in npm package)
- **Installation:** `npx awesome-plugin install-skills` copies to `~/.claude/skills/`
- **Dev Mode:** `npx awesome-plugin install-skills --link` creates symlinks for live editing
- **Package.json:** Must include `"files": ["dist/", "skills/"]` for npm bundling

### CLI Starting Point
The current `src/cli.ts` has ZERO feature subcommands. TODO 1 builds the entire CLI from scratch, hence the 10-hour estimate.

### planning_delete Status
Implementation exists at line 207 in `planning-manager.ts` but is not exposed in `getToolDefinitions()`. TODO 0 adds the necessary wiring.

---

**Plan Ready for Execution**

To begin implementation, run:
```
/oh-my-claudecode:start-work mcp-to-plugin-migration
```
