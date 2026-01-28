# 🔄 재흡수(Re-absorption) 시스템 구현 가이드

> 흡수한 프로젝트의 업데이트를 자동으로 추적하고 개선된 기능을 재흡수하는 시스템

## 📋 목차

1. [현재 상태](#현재-상태)
2. [구현 목표](#구현-목표)
3. [Phase 1: Database 통합](#phase-1-database-통합)
4. [Phase 2: CLI 명령어](#phase-2-cli-명령어)
5. [Phase 3: 자동화 (GitHub Actions)](#phase-3-자동화-github-actions)
6. [Phase 4: 웹 대시보드 (선택)](#phase-4-웹-대시보드-선택)
7. [테스트 계획](#테스트-계획)

---

## 현재 상태

### ✅ 구현된 것

**UpstreamMonitor 클래스** ([src/absorption/upstream-monitor.ts](../src/absorption/upstream-monitor.ts)):
- ✅ GitHub API 통합
- ✅ 버전 추적 및 changelog 분석
- ✅ 품질 평가 (70점 이상만 재흡수 추천)
- ✅ GitHub Issue 자동 생성

### ❌ 구현되지 않은 것

- ❌ **Database 통합**: 흡수 이력이 SQLite에 저장되지 않음
- ❌ **CLI 명령어**: `check-updates`, `sync-upstream` 등 없음
- ❌ **자동 실행**: GitHub Actions / Cron job 없음
- ❌ **실제 사용**: `absorbed` 명령어가 하드코딩된 목록만 표시

### 📊 문제점

```typescript
// src/cli.ts - Line 1092
const absorbed = [
  { name: 'claude-mem', version: 'v0.1.0', ... }, // 하드코딩!
  { name: 'oh-my-claudecode', version: 'v0.1.0', ... },
  // ...
];
```

**결과**: UpstreamMonitor가 사용되지 않음 → 업데이트 추적 불가

---

## 구현 목표

### 핵심 요구사항

1. **자동 업데이트 감지**: 주 1회 자동으로 upstream 체크
2. **품질 평가**: 70점 이상만 재흡수 추천
3. **Issue 자동 생성**: 재흡수 가치가 있으면 GitHub Issue 생성
4. **승인 워크플로우**: 자동 승인 (80+점) vs 수동 검토 (70-79점)
5. **Database 통합**: 모든 이력을 SQLite에 저장

---

## Phase 1: Database 통합

### 1.1 Schema 설계

```typescript
// src/storage/absorption-store.ts (신규 파일)

import Database from 'better-sqlite3';

export interface AbsorbedProject {
  id: number;
  name: string;
  repo: string; // "owner/repo" format
  absorbed_version: string;
  absorbed_at: Date;
  last_sync: Date;
  quality_score: number;
  tools_absorbed: number;
  improvements: string[]; // JSON array
}

export interface UpstreamUpdate {
  id: number;
  project_id: number;
  version: string;
  release_date: Date;
  quality_score: number;
  worth_absorbing: boolean;
  reasons: string[]; // JSON array
  changelog: string;
  github_issue_url?: string;
  created_at: Date;
}

export class AbsorptionStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.init();
  }

  private init(): void {
    // absorbed_projects 테이블
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS absorbed_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        repo TEXT NOT NULL,
        absorbed_version TEXT NOT NULL,
        absorbed_at DATETIME NOT NULL,
        last_sync DATETIME NOT NULL,
        quality_score INTEGER NOT NULL,
        tools_absorbed INTEGER NOT NULL,
        improvements TEXT NOT NULL -- JSON array
      );

      CREATE INDEX IF NOT EXISTS idx_projects_name ON absorbed_projects(name);
      CREATE INDEX IF NOT EXISTS idx_projects_sync ON absorbed_projects(last_sync);
    `);

    // upstream_updates 테이블
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS upstream_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        release_date DATETIME NOT NULL,
        quality_score INTEGER NOT NULL,
        worth_absorbing BOOLEAN NOT NULL,
        reasons TEXT NOT NULL, -- JSON array
        changelog TEXT,
        github_issue_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES absorbed_projects(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_updates_project ON upstream_updates(project_id);
      CREATE INDEX IF NOT EXISTS idx_updates_date ON upstream_updates(release_date);
      CREATE INDEX IF NOT EXISTS idx_updates_worth ON upstream_updates(worth_absorbing);
    `);
  }

  // CRUD operations
  saveAbsorbedProject(project: Omit<AbsorbedProject, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO absorbed_projects
        (name, repo, absorbed_version, absorbed_at, last_sync, quality_score, tools_absorbed, improvements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      project.name,
      project.repo,
      project.absorbed_version,
      project.absorbed_at.toISOString(),
      project.last_sync.toISOString(),
      project.quality_score,
      project.tools_absorbed,
      JSON.stringify(project.improvements)
    );

    return result.lastInsertRowid as number;
  }

  getAbsorbedProjects(): AbsorbedProject[] {
    const stmt = this.db.prepare(`
      SELECT * FROM absorbed_projects ORDER BY absorbed_at DESC
    `);

    const rows = stmt.all() as any[];

    return rows.map(row => ({
      ...row,
      absorbed_at: new Date(row.absorbed_at),
      last_sync: new Date(row.last_sync),
      improvements: JSON.parse(row.improvements),
    }));
  }

  saveUpdate(update: Omit<UpstreamUpdate, 'id' | 'created_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO upstream_updates
        (project_id, version, release_date, quality_score, worth_absorbing, reasons, changelog, github_issue_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      update.project_id,
      update.version,
      update.release_date.toISOString(),
      update.quality_score,
      update.worth_absorbing ? 1 : 0,
      JSON.stringify(update.reasons),
      update.changelog,
      update.github_issue_url
    );

    return result.lastInsertRowid as number;
  }

  getUpdates(projectId?: number): UpstreamUpdate[] {
    const stmt = projectId
      ? this.db.prepare('SELECT * FROM upstream_updates WHERE project_id = ? ORDER BY release_date DESC')
      : this.db.prepare('SELECT * FROM upstream_updates ORDER BY release_date DESC');

    const rows = projectId ? stmt.all(projectId) : stmt.all();

    return (rows as any[]).map(row => ({
      ...row,
      release_date: new Date(row.release_date),
      created_at: new Date(row.created_at),
      worth_absorbing: row.worth_absorbing === 1,
      reasons: JSON.parse(row.reasons),
    }));
  }

  updateLastSync(projectId: number): void {
    this.db.prepare(`
      UPDATE absorbed_projects SET last_sync = ? WHERE id = ?
    `).run(new Date().toISOString(), projectId);
  }

  close(): void {
    this.db.close();
  }
}
```

### 1.2 Gateway 통합

```typescript
// src/core/gateway.ts에 추가

import { AbsorptionStore } from '../storage/absorption-store.js';

export class AwesomePluginGateway {
  private absorptionStore: AbsorptionStore;

  constructor(options: GatewayOptions = {}) {
    // ... existing code

    this.absorptionStore = new AbsorptionStore(
      options.dbPath || path.join(os.homedir(), '.flux', 'flux.db')
    );
  }

  // Getter for CLI access
  get absorption(): AbsorptionStore {
    return this.absorptionStore;
  }

  async stop(): Promise<void> {
    // ... existing cleanup

    try {
      this.absorptionStore.close();
    } catch (error) {
      logger.error('Failed to close absorption store:', error);
    }
  }
}
```

### 1.3 초기 데이터 마이그레이션

```typescript
// scripts/migrate-absorption-data.ts (신규 스크립트)

import { AwesomePluginGateway } from '../src/index.js';

async function migrate() {
  const gateway = new AwesomePluginGateway();

  // 현재 하드코딩된 데이터를 DB에 저장
  const projects = [
    {
      name: 'claude-mem',
      repo: 'supermemoryai/claude-mem',
      absorbed_version: 'v0.1.0',
      absorbed_at: new Date('2025-01-28'),
      last_sync: new Date('2025-01-28'),
      quality_score: 95,
      tools_absorbed: 4,
      improvements: [
        'BM25 search (0.2-0.7ms) vs vector DB',
        'SQLite vs file storage',
        'Unified tool schema',
      ],
    },
    {
      name: 'oh-my-claudecode',
      repo: 'Yeachan-Heo/oh-my-claudecode',
      absorbed_version: 'v0.1.0',
      absorbed_at: new Date('2025-01-28'),
      last_sync: new Date('2025-01-28'),
      quality_score: 95,
      tools_absorbed: 5,
      improvements: [
        'Parallel async execution',
        'Real-time progress monitoring',
        'Background task support',
      ],
    },
    // ... 나머지 프로젝트들
  ];

  for (const project of projects) {
    gateway.absorption.saveAbsorbedProject(project);
    console.log(`✅ Migrated: ${project.name}`);
  }

  await gateway.stop();
  console.log('\n🎉 Migration complete!');
}

migrate().catch(console.error);
```

**실행**:
```bash
npm run migrate-absorption
```

---

## Phase 2: CLI 명령어

### 2.1 absorbed 명령어 개선

```typescript
// src/cli.ts 수정

program
  .command('absorbed')
  .description('Show absorption history and progress')
  .option('-d, --detailed', 'Show detailed information')
  .action(async (options) => {
    const gateway = new AwesomePluginGateway();

    console.log('🧬 Absorption History\n');

    // DB에서 로드 (하드코딩 제거)
    const projects = gateway.absorption.getAbsorbedProjects();

    projects.forEach((project, index) => {
      console.log(`✅ ${project.name} (${project.absorbed_version})`);
      console.log(`   Repo: ${project.repo}`);
      console.log(`   Quality Score: ${project.quality_score}/100`);
      console.log(`   Tools: ${project.tools_absorbed}`);
      console.log(`   Absorbed: ${project.absorbed_at.toISOString().split('T')[0]}`);
      console.log(`   Last Sync: ${project.last_sync.toISOString().split('T')[0]}`);

      if (options.detailed) {
        console.log(`   Improvements:`);
        project.improvements.forEach(imp => {
          console.log(`     - ${imp}`);
        });
      }

      if (index < projects.length - 1) console.log('');
    });

    console.log(`\n📊 Progress: ${projects.length}/8 projects completed`);
    console.log(`🔧 Total tools: ${projects.reduce((sum, p) => sum + p.tools_absorbed, 0)}`);

    await gateway.stop();
  });
```

### 2.2 check-updates 명령어 (신규)

```typescript
// src/cli.ts 추가

program
  .command('check-updates')
  .description('Check for upstream updates of absorbed projects')
  .option('-a, --auto-approve', 'Auto-approve updates with score >= 80')
  .option('--create-issues', 'Create GitHub issues for worthy updates')
  .action(async (options) => {
    const gateway = new AwesomePluginGateway();
    const monitor = new UpstreamMonitor(process.env.GITHUB_TOKEN);

    console.log('🔍 Checking for upstream updates...\n');

    // Load absorbed projects from DB
    const projects = gateway.absorption.getAbsorbedProjects();

    if (projects.length === 0) {
      console.log('⚠️  No absorbed projects found. Run migration first.');
      await gateway.stop();
      return;
    }

    // Register with monitor
    projects.forEach(p => {
      monitor.registerAbsorbedProject({
        name: p.name,
        repo: p.repo,
        absorbedVersion: p.absorbed_version,
        absorbedAt: p.absorbed_at,
        lastSync: p.last_sync,
        improvements: p.improvements,
      });
    });

    // Check all updates
    const updates = await monitor.checkAllUpdates();

    if (updates.length === 0) {
      console.log('✅ All projects are up to date!\n');
      await gateway.stop();
      return;
    }

    console.log(`📦 Found ${updates.length} update(s):\n`);

    for (const update of updates) {
      console.log(`${'='.repeat(60)}`);
      console.log(`📦 ${update.project.name} ${update.latestVersion}`);
      console.log(`   Released: ${update.releaseDate.toISOString().split('T')[0]}`);
      console.log(`   Quality Score: ${update.qualityScore}/100`);
      console.log(`   Worth Absorbing: ${update.worthAbsorbing ? '✅ YES' : '❌ NO'}`);

      console.log(`\n   Reasons:`);
      update.reasons.forEach(reason => console.log(`     ${reason}`));

      // Save to DB
      const project = projects.find(p => p.name === update.project.name);
      if (project) {
        let issueUrl: string | undefined;

        // Create GitHub issue if requested and worthy
        if (options.createIssues && update.worthAbsorbing) {
          issueUrl = await monitor.createTrackingIssue(
            update,
            process.env.GITHUB_REPO || 'your-org/flux'
          );
          console.log(`   📝 Issue created: ${issueUrl}`);
        }

        gateway.absorption.saveUpdate({
          project_id: project.id,
          version: update.latestVersion,
          release_date: update.releaseDate,
          quality_score: update.qualityScore,
          worth_absorbing: update.worthAbsorbing,
          reasons: update.reasons,
          changelog: update.changelog,
          github_issue_url: issueUrl,
        });

        gateway.absorption.updateLastSync(project.id);
      }

      // Auto-approve if score >= 80
      if (options.autoApprove && update.qualityScore >= 80) {
        console.log(`   ✅ AUTO-APPROVED (score >= 80)`);
      } else if (update.worthAbsorbing) {
        console.log(`   ⚠️  Manual review required (score < 80)`);
      }

      console.log('');
    }

    // Rate limit info
    const rateLimit = await monitor.getRateLimit();
    console.log(`\n⚡ GitHub API Rate Limit:`);
    console.log(`   Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
    console.log(`   Resets: ${rateLimit.reset.toLocaleString()}\n`);

    await gateway.stop();
  });
```

### 2.3 update-history 명령어 (신규)

```typescript
// src/cli.ts 추가

program
  .command('update-history')
  .description('Show upstream update history')
  .option('-p, --project <name>', 'Filter by project name')
  .option('-w, --worthy', 'Show only worthy updates')
  .action(async (options) => {
    const gateway = new AwesomePluginGateway();

    console.log('📜 Upstream Update History\n');

    let updates: UpstreamUpdate[];

    if (options.project) {
      const projects = gateway.absorption.getAbsorbedProjects();
      const project = projects.find(p => p.name === options.project);

      if (!project) {
        console.log(`❌ Project "${options.project}" not found`);
        await gateway.stop();
        return;
      }

      updates = gateway.absorption.getUpdates(project.id);
    } else {
      updates = gateway.absorption.getUpdates();
    }

    if (options.worthy) {
      updates = updates.filter(u => u.worth_absorbing);
    }

    if (updates.length === 0) {
      console.log('No updates found.\n');
      await gateway.stop();
      return;
    }

    updates.forEach((update, index) => {
      const projects = gateway.absorption.getAbsorbedProjects();
      const project = projects.find(p => p.id === update.project_id);

      console.log(`${index + 1}. ${project?.name || 'Unknown'} ${update.version}`);
      console.log(`   Date: ${update.release_date.toISOString().split('T')[0]}`);
      console.log(`   Score: ${update.quality_score}/100`);
      console.log(`   Worth: ${update.worth_absorbing ? '✅' : '❌'}`);

      if (update.github_issue_url) {
        console.log(`   Issue: ${update.github_issue_url}`);
      }

      console.log('');
    });

    await gateway.stop();
  });
```

### 2.4 sync-upstream 명령어 (신규)

```typescript
// src/cli.ts 추가

program
  .command('sync-upstream <project>')
  .description('Manually sync with upstream project')
  .action(async (projectName) => {
    const gateway = new AwesomePluginGateway();
    const monitor = new UpstreamMonitor(process.env.GITHUB_TOKEN);

    const projects = gateway.absorption.getAbsorbedProjects();
    const project = projects.find(p => p.name === projectName);

    if (!project) {
      console.log(`❌ Project "${projectName}" not found`);
      await gateway.stop();
      return;
    }

    console.log(`🔄 Syncing ${projectName}...\n`);

    monitor.registerAbsorbedProject({
      name: project.name,
      repo: project.repo,
      absorbedVersion: project.absorbed_version,
      absorbedAt: project.absorbed_at,
      lastSync: project.last_sync,
      improvements: project.improvements,
    });

    const update = await monitor.checkProjectUpdate({
      name: project.name,
      repo: project.repo,
      absorbedVersion: project.absorbed_version,
      absorbedAt: project.absorbed_at,
      lastSync: project.last_sync,
      improvements: project.improvements,
    });

    if (!update) {
      console.log('✅ Already up to date!\n');
      await gateway.stop();
      return;
    }

    console.log(`📦 New version available: ${update.latestVersion}`);
    console.log(`   Score: ${update.qualityScore}/100`);
    console.log(`   Worth: ${update.worthAbsorbing ? '✅' : '❌'}`);

    // TODO: Interactive re-absorption workflow
    console.log('\n⚠️  Manual re-absorption not yet implemented.');
    console.log('   Please review the changelog and integrate manually.\n');

    await gateway.stop();
  });
```

---

## Phase 3: 자동화 (GitHub Actions)

### 3.1 GitHub Actions Workflow

```yaml
# .github/workflows/upstream-monitor.yml (신규)

name: Upstream Monitor

on:
  schedule:
    # 매주 일요일 자정 (UTC)
    - cron: '0 0 * * 0'
  workflow_dispatch: # 수동 실행 가능

jobs:
  check-updates:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Check upstream updates
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPO: ${{ github.repository }}
        run: |
          npm run cli check-updates --auto-approve --create-issues

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: upstream-check-results
          path: |
            ~/.flux/flux.db
            logs/*.log

      - name: Notify on Slack (optional)
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "⚠️ Upstream monitor failed for FLUX",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Upstream Monitor Failed*\nCheck the workflow logs for details."
                  }
                }
              ]
            }
```

### 3.2 package.json Scripts

```json
// package.json에 추가

{
  "scripts": {
    // ... existing scripts
    "migrate-absorption": "tsx scripts/migrate-absorption-data.ts",
    "check-updates": "npm run cli check-updates",
    "check-updates:auto": "npm run cli check-updates --auto-approve --create-issues",
    "update-history": "npm run cli update-history"
  }
}
```

### 3.3 환경 변수 설정

```bash
# .env.example (신규)

# GitHub Token (for upstream monitoring)
GITHUB_TOKEN=ghp_your_token_here

# GitHub Repository (for issue creation)
GITHUB_REPO=your-org/flux

# Slack Webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**GitHub Secrets 설정**:
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. `GITHUB_TOKEN`: GitHub Personal Access Token (repo scope)
3. `SLACK_WEBHOOK_URL` (선택): Slack 알림용

---

## Phase 4: 웹 대시보드 (선택)

### 4.1 Express Server

```typescript
// src/absorption/web-dashboard/server.ts (신규)

import express from 'express';
import { AwesomePluginGateway } from '../../core/gateway.js';

export class AbsorptionDashboard {
  private app = express();
  private gateway: AwesomePluginGateway;

  constructor(gateway: AwesomePluginGateway) {
    this.gateway = gateway;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // GET /api/projects - 흡수된 프로젝트 목록
    this.app.get('/api/projects', (req, res) => {
      const projects = this.gateway.absorption.getAbsorbedProjects();
      res.json(projects);
    });

    // GET /api/updates - 업데이트 이력
    this.app.get('/api/updates', (req, res) => {
      const projectId = req.query.project_id
        ? parseInt(req.query.project_id as string)
        : undefined;

      const updates = this.gateway.absorption.getUpdates(projectId);
      res.json(updates);
    });

    // GET /api/stats - 통계
    this.app.get('/api/stats', (req, res) => {
      const projects = this.gateway.absorption.getAbsorbedProjects();
      const updates = this.gateway.absorption.getUpdates();

      const stats = {
        totalProjects: projects.length,
        totalTools: projects.reduce((sum, p) => sum + p.tools_absorbed, 0),
        avgQualityScore: projects.reduce((sum, p) => sum + p.quality_score, 0) / projects.length,
        totalUpdates: updates.length,
        worthyUpdates: updates.filter(u => u.worth_absorbing).length,
      };

      res.json(stats);
    });

    // Serve static files
    this.app.use(express.static('src/absorption/web-dashboard/public'));
  }

  start(port = 8080): void {
    this.app.listen(port, () => {
      console.log(`📊 Absorption Dashboard: http://localhost:${port}`);
    });
  }
}
```

### 4.2 CLI 명령어

```typescript
// src/cli.ts 추가

program
  .command('dashboard')
  .description('Start absorption dashboard web server')
  .option('-p, --port <port>', 'Port number', '8080')
  .action(async (options) => {
    const gateway = new AwesomePluginGateway();
    const dashboard = new AbsorptionDashboard(gateway);

    dashboard.start(parseInt(options.port));

    console.log('\nPress Ctrl+C to stop\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down...');
      await gateway.stop();
      process.exit(0);
    });
  });
```

---

## 테스트 계획

### Unit Tests

```typescript
// tests/unit/absorption-store.test.ts (신규)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AbsorptionStore } from '../../src/storage/absorption-store.js';

describe('AbsorptionStore', () => {
  let store: AbsorptionStore;

  beforeEach(() => {
    store = new AbsorptionStore(':memory:');
  });

  afterEach(() => {
    store.close();
  });

  it('should save and retrieve absorbed projects', () => {
    const project = {
      name: 'test-project',
      repo: 'test/project',
      absorbed_version: 'v1.0.0',
      absorbed_at: new Date(),
      last_sync: new Date(),
      quality_score: 85,
      tools_absorbed: 5,
      improvements: ['Improvement 1', 'Improvement 2'],
    };

    const id = store.saveAbsorbedProject(project);
    expect(id).toBeGreaterThan(0);

    const projects = store.getAbsorbedProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('test-project');
  });

  it('should save and retrieve updates', () => {
    // First save a project
    const projectId = store.saveAbsorbedProject({
      name: 'test-project',
      repo: 'test/project',
      absorbed_version: 'v1.0.0',
      absorbed_at: new Date(),
      last_sync: new Date(),
      quality_score: 85,
      tools_absorbed: 5,
      improvements: [],
    });

    // Then save an update
    const updateId = store.saveUpdate({
      project_id: projectId,
      version: 'v2.0.0',
      release_date: new Date(),
      quality_score: 90,
      worth_absorbing: true,
      reasons: ['New features', 'Performance improvements'],
      changelog: 'Major update',
    });

    expect(updateId).toBeGreaterThan(0);

    const updates = store.getUpdates(projectId);
    expect(updates).toHaveLength(1);
    expect(updates[0].version).toBe('v2.0.0');
  });

  it('should update last sync time', () => {
    const projectId = store.saveAbsorbedProject({
      name: 'test-project',
      repo: 'test/project',
      absorbed_version: 'v1.0.0',
      absorbed_at: new Date(),
      last_sync: new Date('2025-01-01'),
      quality_score: 85,
      tools_absorbed: 5,
      improvements: [],
    });

    store.updateLastSync(projectId);

    const projects = store.getAbsorbedProjects();
    const lastSync = projects[0].last_sync;

    // Should be updated to now
    expect(lastSync.getTime()).toBeGreaterThan(new Date('2025-01-01').getTime());
  });
});
```

### Integration Tests

```typescript
// tests/integration/upstream-monitor.test.ts (신규)

import { describe, it, expect } from 'vitest';
import { UpstreamMonitor } from '../../src/absorption/upstream-monitor.js';

describe('UpstreamMonitor Integration', () => {
  it('should check real upstream updates', async () => {
    const monitor = new UpstreamMonitor(process.env.GITHUB_TOKEN);

    monitor.registerAbsorbedProject({
      name: 'claude-mem',
      repo: 'supermemoryai/claude-mem',
      absorbedVersion: 'v0.1.0', // Old version
      absorbedAt: new Date('2025-01-28'),
      lastSync: new Date('2025-01-28'),
      improvements: [],
    });

    const updates = await monitor.checkAllUpdates();

    // Should find updates (or empty if no new releases)
    expect(updates).toBeDefined();
    expect(Array.isArray(updates)).toBe(true);
  }, 30000); // 30s timeout for API calls
});
```

---

## 실행 계획

### Week 1: Database + CLI

- [ ] `AbsorptionStore` 구현
- [ ] Gateway 통합
- [ ] 마이그레이션 스크립트
- [ ] CLI 명령어 4개 구현
- [ ] Unit tests

### Week 2: 자동화 + 테스트

- [ ] GitHub Actions workflow
- [ ] Integration tests
- [ ] 실제 데이터로 테스트
- [ ] 문서화

### Week 3 (선택): 웹 대시보드

- [ ] Express server
- [ ] REST API
- [ ] 간단한 HTML UI
- [ ] Deployment 가이드

---

## Sources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [Express.js Documentation](https://expressjs.com/)

---

**📅 최종 업데이트**: 2026-01-29
**📝 작성자**: FLUX Team
