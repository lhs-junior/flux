---
slug: troubleshooting
title: FLUX Troubleshooting Guide
category: guide
difficulty: intermediate
estimatedTime: 30
tags: [troubleshooting, debugging, help, issues]
relatedGuides: [getting-started, memory-guide, agents-guide]
version: 2.0.0
excerpt: Comprehensive solutions for the 10 most common FLUX issues with step-by-step troubleshooting for each problem.
---

Comprehensive solutions for the 10 most common FLUX issues. If your problem isn't here, check your installation and enable debug logging.

## Table of Contents

1. [Memory Search is Slow](#1-memory-search-is-slow)
2. [Agent Not Responding](#2-agent-not-responding)
3. [Skills Not Loading](#3-skills-not-loading)
4. [Database Corruption](#4-database-corruption)
5. [Memory Not Saving](#5-memory-not-saving)
6. [Installation Fails](#6-installation-fails)
7. [High Token Usage](#7-high-token-usage)
8. [Agent Results Incomplete](#8-agent-results-incomplete)
9. [Permission Errors](#9-permission-errors)
10. [Claude Code Not Finding FLUX](#10-claude-code-not-finding-flux)

---

## 1. Memory Search is Slow

**Symptom**: Recalling memories takes 5+ seconds, or search results are irrelevant.

**Common Causes**:
- Database file is on slow storage (network drive, USB drive)
- Index hasn't been rebuilt (happens when you have 1000+ memories)
- You're searching with very short queries (1-2 words)
- Database has excessive fragmentation

### Solution A: Check Database Location

**Step 1**: Verify your database path

```bash
echo $FLUX_DB_PATH
# If empty, it defaults to ~/.flux/flux.db
ls -lh ~/.flux/flux.db
```

Check the file size. If it's larger than 50MB, you may have performance issues.

**Step 2**: Move database to fast storage (SSD)

If your database is on slow storage:

```bash
# Stop Claude Code first
# Move database to SSD
mv /slow-path/flux.db ~/.flux/flux.db

# Update environment variable in ~/.zshrc or ~/.bashrc
export FLUX_DB_PATH=$HOME/.flux/flux.db
```

Restart Claude Code and try searching again. Search should be sub-second now.

### Solution B: Rebuild BM25 Index

If moving storage doesn't help, rebuild the search index:

```bash
flux maintenance --rebuild-index
```

This:
- Deletes the current index
- Rescans all memories
- Rebuilds the BM25 index from scratch
- May take 30-60 seconds for large databases

### Solution C: Improve Query Specificity

Short queries are slower. Instead of:
```
Recall API
```

Try:
```
Recall API endpoint information for user service
```

More specific queries find results faster.

### Solution D: Archive Old Memories

If you have 2000+ memories, consider archiving old ones:

```
Forget all memories from 2024
```

Or selectively:

```
Forget the old staging server credentials memory
```

Fewer memories = faster searches.

### Solution E: Enable Performance Debug

See exactly where time is spent:

```bash
FLUX_DEBUG=true flux stats
```

Output shows:
```
Memory Search Performance:
- Query parsing: 0.5ms
- Index lookup: 0.8ms
- Scoring: 2.3ms
- Result ranking: 1.2ms
- Total: 4.8ms
```

If any one step is slow (>100ms), that's your bottleneck.

---

## 2. Agent Not Responding

**Symptom**: Agent starts but never returns results, or status shows "stuck at X%".

**Common Causes**:
- Agent timed out (default 30 minutes)
- Claude Code lost connection
- Agent is in infinite loop
- Memory resources exhausted

### Solution A: Check Agent Status

```bash
flux agent-status
```

Shows:
- How long agent has been running
- Last update time
- Current task percentage
- Estimated time remaining

If "Last update: 10+ minutes ago", agent is stuck.

### Solution B: Terminate and Restart

```
Stop the backend developer agent
```

Then spawn a new agent with a shorter task scope:

```
Spawn a backend agent to implement just the user registration endpoint (not entire user service)
```

Smaller tasks complete faster and are less likely to get stuck.

### Solution C: Set Agent Timeout

If you work on long tasks, increase the timeout:

```bash
export FLUX_AGENT_TIMEOUT=60  # minutes
```

Add to `~/.zshrc` or `~/.bashrc` to make permanent.

### Solution D: Check System Resources

Agents may fail if your computer is out of memory:

```bash
# Check memory usage
free -h  # Linux
vm_stat  # macOS
```

If free memory is less than 500MB:
1. Close other applications
2. Restart Claude Code
3. Try agent again

### Solution E: Enable Debug Logging

See what the agent is doing:

```bash
FLUX_DEBUG=true flux agent-status
```

Output shows:
```
Agent: backend-dev
Status: In Progress (67%)
Debug Output:
[15:23:45] Analyzing code structure
[15:23:47] Generated middleware setup
[15:23:49] Writing route handlers
[15:23:52] Currently: Adding error handling
```

If you see "Currently: X" hasn't changed for 5+ minutes, agent is stuck. Terminate and restart.

### Solution F: Break Down the Task

If agent consistently fails on a complex task:

```
Spawn an agent to implement ONLY the password validation function
```

Then:
```
Spawn another agent to implement ONLY the email validation function
```

Smaller, focused tasks have higher success rates.

---

## 3. Skills Not Loading

**Symptom**: You type "Remember..." but Claude doesn't load Memory skill. Or agent-related commands don't work.

**Common Causes**:
- Skills not installed properly
- Claude Code cache not refreshed
- Version mismatch between CLI and skills
- Claude Code doesn't have plugin directory permissions

### Solution A: Reinstall Skills

```bash
flux install-skills
```

This:
1. Creates skill directory if needed
2. Copies all 7 skills
3. Registers with Claude Code
4. Verifies installation

After running, restart Claude Code completely:
1. Close Claude Code
2. Wait 5 seconds
3. Reopen Claude Code

### Solution B: Verify Installation

Check that skills are actually installed:

```bash
flux verify
```

Output should show:
```
FLUX Installation Verification
✓ awesome-memory skill installed
✓ awesome-agents skill installed
✓ awesome-planning skill installed
✓ awesome-tdd skill installed
✓ awesome-guide skill installed
✓ awesome-science skill installed
✓ awesome-specialists skill installed

All 7 skills installed successfully!
```

If any show ✗, reinstall with `flux install-skills`.

### Solution C: Check Skill Directory

Verify skills are actually in Claude Code's directory:

```bash
ls -la ~/.claude-code/skills/
```

Should show 7 skill files:
- awesome-memory.md
- awesome-agents.md
- awesome-planning.md
- awesome-tdd.md
- awesome-guide.md
- awesome-science.md
- awesome-specialists.md

If any are missing:

```bash
flux install-skills --force
```

The `--force` flag overwrites existing files in case they're corrupted.

### Solution D: Update FLUX

Your CLI version might be older than your skills:

```bash
npm install -g flux@latest
flux install-skills
```

Then restart Claude Code.

### Solution E: Clear Claude Code Cache

Claude Code sometimes caches old plugin data:

1. Close Claude Code
2. Delete cache directory:
   ```bash
   rm -rf ~/.claude-code/plugins-cache
   ```
3. Restart Claude Code

Claude will rebuild the plugin cache on startup.

### Solution F: Check Skill Keyword Triggers

Sometimes Claude doesn't recognize trigger keywords. If you say:

```
Store this information
```

It won't trigger Memory (no "remember" keyword). Instead:

```
Remember this information
```

Keywords that trigger skills:
- **Memory**: remember, recall, memorize, save information
- **Agents**: spawn, agent, orchestrate, parallel
- **Planning**: todo, task, plan, roadmap, schedule
- **TDD**: test, tdd, red-green, failing test
- **Guide**: guide, tutorial, teach, learn, how-to
- **Science**: analyze, statistics, python, data, plot, ml
- **Specialists**: specialist, architect, reviewer, debugger

---

## 4. Database Corruption

**Symptom**: Getting "database locked" errors, or memories randomly disappear.

**Common Causes**:
- Improper shutdown while writing
- Claude Code crashed during database operation
- Multiple instances of FLUX running
- File system issues (power loss, connection dropped)

### Solution A: Verify Database Integrity

```bash
flux maintenance --check-db
```

Output:
```
Database Integrity Check
├─ Memory table: OK (1,234 entries)
├─ Agent table: OK (45 entries)
├─ Planning table: OK (89 tasks)
├─ TDD table: OK (234 test runs)
└─ Overall: HEALTHY

No corruption detected.
```

If it shows issues:

### Solution B: Repair Database

```bash
flux maintenance --repair-db
```

This:
1. Backs up your database to `flux-backup-<date>.db`
2. Scans for corruption
3. Repairs corrupted sections
4. Optimizes tables

Takes 30-60 seconds depending on size.

### Solution C: Restore from Backup

If repair fails, restore the backup:

```bash
# List available backups
ls -lh ~/.flux/flux-backup-*.db

# Restore specific backup
cp ~/.flux/flux-backup-2025-01-25.db ~/.flux/flux.db
```

Then restart Claude Code.

### Solution D: Reset Database (Last Resort)

If corruption is severe, reset everything:

```bash
# Back up current database
cp ~/.flux/flux.db ~/.flux/flux-broken-backup.db

# Delete corrupted database
rm ~/.flux/flux.db

# FLUX creates new empty database on next use
flux stats
```

All your memories, agents, and tasks are lost, but FLUX works again.

**Note**: Do this only if repair fails.

### Solution E: Prevent Future Corruption

1. **Regular Backups**:
   ```bash
   cp ~/.flux/flux.db ~/.backups/flux-$(date +%Y%m%d).db
   ```

2. **Proper Shutdown**: Always close Claude Code normally, don't force quit

3. **Monitor Integrity**: Check occasionally
   ```bash
   flux maintenance --check-db
   ```

---

## 5. Memory Not Saving

**Symptom**: You save a memory but when you recall, it's not there. Or save command returns "undefined" error.

**Common Causes**:
- Database permissions problem
- FLUX_DB_PATH points to non-existent directory
- Disk full
- Database write lock timeout

### Solution A: Check Database Directory

```bash
# Show database path
echo $FLUX_DB_PATH
# Default if empty: ~/.flux/flux.db

# Check directory exists
ls -ld ~/.flux/
# Should show: drwxr-xr-x  ... .flux/
```

If directory doesn't exist:

```bash
mkdir -p ~/.flux
flux stats  # This initializes database
```

### Solution B: Check Disk Space

Database needs free space to write:

```bash
# Check free space
df -h
# Look for "/" row - should have >100MB free
```

If disk is full (0% free):
1. Delete large files
2. Clear application caches
3. Backup old database if over 100MB:
   ```bash
   mv ~/.flux/flux.db ~/backups/flux-old.db
   ```

### Solution C: Check File Permissions

Ensure FLUX can write to database:

```bash
# Check file permissions
ls -l ~/.flux/flux.db
# Should show: -rw-r--r-- (at least)

# If permissions wrong:
chmod 600 ~/.flux/flux.db
```

### Solution D: Try Manual Save

In Claude Code:

```
Remember: test message 12345
```

Wait 2-3 seconds. Then:

```
Recall test message
```

Should return the memory. If not:

```bash
flux maintenance --check-db
```

If errors appear, run:

```bash
flux maintenance --repair-db
```

### Solution E: Check for Multiple Instances

Multiple FLUX instances can cause lock errors:

```bash
# Check running node processes
ps aux | grep flux

# Check for locked database
lsof ~/.flux/flux.db
```

If multiple processes lock the database, close all Claude Code windows and restart.

### Solution F: Reset Database Connection

Sometimes the connection gets stuck:

```bash
# Close Claude Code completely
killall "Claude Code"  # or on macOS: killall Claude

# Wait 5 seconds
sleep 5

# Delete stale connection info
rm ~/.flux/.lock

# Restart Claude Code
```

---

## 6. Installation Fails

**Symptom**: `npm install -g flux` fails with errors, or installation hangs.

**Common Causes**:
- npm registry unavailable
- Node version incompatible
- Package corruption
- npm cache corrupt

### Solution A: Check Node Version

```bash
node --version
# Must be 18.0.0 or higher

npm --version
# Must be 8.0.0 or higher
```

If versions are too old:
1. Update Node.js from https://nodejs.org/
2. Try installation again

### Solution B: Clear npm Cache

```bash
npm cache clean --force
```

Then reinstall:

```bash
npm install -g flux
```

### Solution C: Use Different npm Registry

If default npm registry is slow/unavailable:

```bash
npm install -g flux --registry https://registry.npmjs.org/
```

Or use a mirror:

```bash
npm install -g flux --registry https://mirrors.aliyun.com/npm/  # China
npm install -g flux --registry https://mirrors.tsinghua.edu.cn/npm/ # China
```

### Solution D: Remove Old Installation

```bash
# Remove any existing flux
npm uninstall -g flux

# Wait 5 seconds
sleep 5

# Fresh install
npm install -g flux
```

### Solution E: Install with Verbose Output

See what's happening:

```bash
npm install -g flux --verbose
```

If specific errors appear, search the error message in troubleshooting or GitHub issues.

### Solution F: Use npm Link for Development

If you're on Windows or having issues, try:

```bash
git clone https://github.com/your-username/flux.git
cd flux
npm install
npm link
```

This creates a local development installation.

---

## 7. High Token Usage

**Symptom**: You're using 3000+ tokens per request, instead of the expected 400-900.

**Common Causes**:
- All skills loading (not on-demand)
- BM25 search disabled or ineffective
- Using all agents simultaneously
- Loading entire agent conversation history

### Solution A: Check What's Loading

```bash
FLUX_DEBUG=true
```

Then in Claude Code:

```
Remember: test
```

Check logs:
```
[DEBUG] Skills loaded: awesome-memory (270 tokens)
[DEBUG] Total tokens: 270
```

If showing all 7 skills (2,900 tokens), on-demand loading isn't working.

### Solution B: Reinstall Skills

```bash
flux install-skills --force
```

On-demand loading may have been disabled accidentally.

### Solution C: Check BM25 Configuration

```bash
FLUX_DEBUG=true flux stats
```

Look for:
```
BM25 Search: ENABLED
Tool Indexing: ACTIVE
```

If disabled, on-demand loading won't work properly. Reinstall:

```bash
flux install-skills
```

### Solution D: Limit Concurrent Agents

Running 5 agents simultaneously loads extra tokens:

```
Spawn a database optimization agent
```

Wait for first agent to complete before spawning more. Queue them instead of parallelizing.

### Solution E: Check Agent History

Old agent conversations in context use tokens. Ask Claude:

```
Forget the previous agent conversation history
```

This clears context for new agents.

### Solution F: Use Specialized Agents

Instead of "general agent", use specialists:

```
Spawn a backend specialist to implement the API
```

Specialist agents are smaller (450 tokens) vs general (550 tokens).

---

## 8. Agent Results Incomplete

**Symptom**: Agent returns partial results, or cuts off in the middle of a sentence.

**Common Causes**:
- Task was too large for agent scope
- Agent hit token limit
- Claude Code timeout
- Agent crashed mid-execution

### Solution A: Check Agent Log

```
Get result from the backend developer agent
```

If response cuts off, check the status:

```
Check status of the backend developer agent
```

Shows:
```
Status: FAILED
Error: Token limit exceeded
Last output: ... (incomplete)
```

### Solution B: Break Down Task

Agent hit limit because task was too big. Split it:

```
Spawn an agent to implement ONLY password hashing
```

Wait for completion, then:

```
Spawn an agent to implement ONLY JWT token generation
```

Smaller tasks complete fully.

### Solution C: Increase Token Allowance

Some agents support token limits:

```
Spawn a backend agent with 8K token limit for API implementation
```

Or configure globally:

```bash
export FLUX_AGENT_MAX_TOKENS=8000
```

### Solution D: Get Partial Results

If agent times out partway, retrieve what it has:

```
Get the partial result from the backend developer agent
```

Then:

```
Complete the agent's work: [paste partial code] continue implementing...
```

### Solution E: Simplify Agent Instructions

Complex instructions use more tokens, leaving less for output:

```
Spawn a backend agent to create the login endpoint
```

Not:

```
Spawn a backend agent to create the login endpoint with detailed error handling, comprehensive logging, TypeScript strict mode compliance, JSDoc comments, unit test compatibility, and production-ready architecture
```

Simple instructions = more space for results.

### Solution F: Review Agent Output Format

Sometimes Claude truncates responses. Ask explicitly for structure:

```
Spawn an agent to implement task creation:
Return ONLY code with comments. No explanations. Format as: [Code section]
```

---

## 9. Permission Errors

**Symptom**: Getting "Permission denied" when running FLUX commands or accessing database.

**Common Causes**:
- Database file owned by different user (often after using sudo)
- Directory permissions incorrect
- Running FLUX from restricted directory
- Node global installation issue

### Solution A: Check File Ownership

```bash
ls -l ~/.flux/flux.db
ls -ld ~/.flux/
```

Should show your username, not "root" or another user.

If owned by root:

```bash
sudo chown $USER:$GROUP ~/.flux/
sudo chown $USER:$GROUP ~/.flux/flux.db
```

### Solution B: Fix Directory Permissions

```bash
chmod 700 ~/.flux/
chmod 600 ~/.flux/flux.db
```

This gives you full permissions, others have none.

### Solution C: Check npm Global Permissions

If `npm install -g` fails with permission issues:

```bash
# Check npm global directory
npm config get prefix
# Usually: /usr/local/bin or ~/.nvm/versions/node/...

# If /usr/local, you may need sudo
# Better: Configure npm to use local directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to PATH in ~/.zshrc or ~/.bashrc
export PATH="~/.npm-global/bin:$PATH"

# Then install without sudo
npm install -g flux
```

### Solution D: Run from Accessible Directory

Never run FLUX from protected directories:

```bash
# Bad: runs from root-owned directory
cd /usr/local
flux stats  # Permission denied

# Good: runs from your home directory
cd ~
flux stats  # Works
```

### Solution E: Reset Permissions Completely

If permissions are completely messed up:

```bash
# Backup database first
cp ~/.flux/flux.db ~/flux-backup.db

# Remove and recreate with correct permissions
rm -rf ~/.flux/
mkdir -p ~/.flux
chmod 700 ~/.flux/

# Restore if needed
cp ~/flux-backup.db ~/.flux/flux.db
chmod 600 ~/.flux/flux.db
```

---

## 10. Claude Code Not Finding FLUX

**Symptom**: Claude Code works, but it doesn't mention FLUX or respond to FLUX commands.

**Common Causes**:
- FLUX skills not installed
- Claude Code version too old (pre-plugin support)
- Plugin directory not set up correctly
- Claude Code can't find Node.js

### Solution A: Verify Claude Code Version

You need Claude Code with plugin support (recent versions only).

Check inside Claude Code:

```
What version of Claude Code are you running?
```

If it doesn't support plugins, update Claude Code.

### Solution B: Install Skills Explicitly

```bash
flux install-skills
```

Then restart Claude Code:
1. Close Claude Code completely
2. Wait 10 seconds
3. Reopen Claude Code

### Solution C: Check Skill Directory

Claude Code looks for skills in specific location:

```bash
# Show where Claude Code looks for skills
echo $HOME/.claude-code/skills/

# Verify skills are there
ls -la ~/.claude-code/skills/
```

Should show 7 .md files.

### Solution D: Manually Add Skills

If automatic installation didn't work:

```bash
# Create directory if needed
mkdir -p ~/.claude-code/skills/

# Copy skills manually
cp ~/.flux/skills/*.md ~/.claude-code/skills/
```

Then restart Claude Code.

### Solution E: Check Environment Variables

Claude Code might need PATH variables set:

```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="/usr/local/bin:$PATH"  # where npm installs -g packages
export NODE_PATH="/usr/local/lib/node_modules"
```

Then reload:

```bash
source ~/.zshrc  # or ~/.bashrc
```

### Solution F: Verify FLUX is Installed Globally

```bash
which flux
# Should show: /usr/local/bin/flux (or ~/.npm-global/bin/flux)

flux --version
# Should show version number, not "command not found"
```

If not found:

```bash
npm install -g flux
```

---

## Getting Help Beyond This Guide

If your issue isn't here:

1. **Check Debug Output**:
   ```bash
   FLUX_DEBUG=true flux stats
   ```

2. **Check Logs**:
   ```bash
   tail -f ~/.flux/flux.log
   ```

3. **Run Diagnostic**:
   ```bash
   flux maintenance --diagnose
   ```
   This generates a full diagnostic report.

4. **Search Issues**:
   Check GitHub issues for similar problems

5. **Provide Debug Info**:
   When asking for help, include:
   - Output from `flux stats`
   - Output from `flux --version`
   - Output from `node --version` and `npm --version`
   - Error message (exact text)
   - Steps to reproduce

---

## Prevention Tips

1. **Regular Maintenance**: Run monthly
   ```bash
   flux maintenance --check-db
   ```

2. **Backup Database**: Weekly backups
   ```bash
   cp ~/.flux/flux.db ~/backups/flux-$(date +%Y%m%d).db
   ```

3. **Keep FLUX Updated**: Monthly
   ```bash
   npm install -g flux@latest
   ```

4. **Monitor Performance**: Watch for slow searches
   ```bash
   FLUX_DEBUG=true  # enable debug to track performance
   ```

5. **Review Logs**: Check occasionally for warnings
   ```bash
   tail ~/.flux/flux.log
   ```

---

Most FLUX issues resolve with these solutions. If you're still stuck after trying these, provide debug output and the FLUX team can help diagnose further.
