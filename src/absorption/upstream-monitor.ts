/**
 * UpstreamMonitor - 원본 프로젝트 모니터링
 *
 * 흡수한 프로젝트의 원본을 모니터링하고 새 버전이 나오면 자동 평가합니다.
 */

import { Octokit } from '@octokit/rest';
import { QualityEvaluator, type ProjectInfo, type QualityScore } from './quality-evaluator.js';

export interface AbsorbedProject {
  name: string;
  repo: string; // owner/repo format
  absorbedVersion: string;
  absorbedAt: Date;
  lastSync: Date;
  improvements: string[]; // 우리가 추가한 개선 사항
}

export interface UpstreamUpdate {
  project: AbsorbedProject;
  latestVersion: string;
  changelog: string;
  releaseDate: Date;
  worthAbsorbing: boolean;
  qualityScore: number;
  reasons: string[];
}

export class UpstreamMonitor {
  private octokit: Octokit;
  private absorbedProjects: Map<string, AbsorbedProject>;

  constructor(githubToken?: string) {
    this.octokit = new Octokit({
      auth: githubToken || process.env.GITHUB_TOKEN,
    });
    this.absorbedProjects = new Map();
  }

  /**
   * 흡수된 프로젝트 등록
   */
  registerAbsorbedProject(project: AbsorbedProject): void {
    this.absorbedProjects.set(project.name, project);
  }

  /**
   * 모든 프로젝트 업데이트 확인
   */
  async checkAllUpdates(): Promise<UpstreamUpdate[]> {
    const updates: UpstreamUpdate[] = [];

    for (const project of this.absorbedProjects.values()) {
      try {
        const update = await this.checkProjectUpdate(project);
        if (update) {
          updates.push(update);
        }
      } catch (error: any) {
        console.error(`Failed to check updates for ${project.name}:`, error.message);
      }
    }

    return updates;
  }

  /**
   * 특정 프로젝트 업데이트 확인
   */
  async checkProjectUpdate(project: AbsorbedProject): Promise<UpstreamUpdate | null> {
    const [owner, repo] = project.repo.split('/');

    try {
      // Get latest release
      const { data: release } = await this.octokit.repos.getLatestRelease({
        owner,
        repo,
      });

      const latestVersion = release.tag_name;

      // Version 비교
      if (this.isNewerVersion(latestVersion, project.absorbedVersion)) {
        console.log(`🆕 ${project.name} has new version: ${latestVersion}`);

        // Changelog 분석
        const changelog = release.body || '';
        const changes = this.analyzeChangelog(changelog);

        // 흡수 가치 평가
        const evaluation = await this.evaluateUpgrade(
          project,
          latestVersion,
          changes
        );

        return {
          project,
          latestVersion,
          changelog,
          releaseDate: new Date(release.published_at || Date.now()),
          worthAbsorbing: evaluation.worthAbsorbing,
          qualityScore: evaluation.score,
          reasons: evaluation.reasons,
        };
      }

      return null;
    } catch (error: any) {
      if (error.status === 404) {
        // No releases yet
        return null;
      }
      throw error;
    }
  }

  /**
   * Changelog 분석
   */
  private analyzeChangelog(changelog: string): {
    newFeatures: string[];
    improvements: string[];
    bugFixes: string[];
    breakingChanges: string[];
  } {
    const lines = changelog.split('\n');

    const changes = {
      newFeatures: [] as string[],
      improvements: [] as string[],
      bugFixes: [] as string[],
      breakingChanges: [] as string[],
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('breaking') || lowerLine.includes('breaking change')) {
        changes.breakingChanges.push(line);
      } else if (lowerLine.includes('feat') || lowerLine.includes('feature')) {
        changes.newFeatures.push(line);
      } else if (lowerLine.includes('improve') || lowerLine.includes('enhance')) {
        changes.improvements.push(line);
      } else if (lowerLine.includes('fix') || lowerLine.includes('bug')) {
        changes.bugFixes.push(line);
      }
    }

    return changes;
  }

  /**
   * 업그레이드 평가
   */
  private async evaluateUpgrade(
    project: AbsorbedProject,
    newVersion: string,
    changes: ReturnType<typeof UpstreamMonitor.prototype.analyzeChangelog>
  ): Promise<{
    worthAbsorbing: boolean;
    score: number;
    reasons: string[];
  }> {
    let score = 0;
    const reasons: string[] = [];

    // 새 기능이 있으면 가치 있음
    if (changes.newFeatures.length > 0) {
      score += 30;
      reasons.push(`✅ ${changes.newFeatures.length} new feature(s)`);
    }

    // 성능 개선이 있으면 가치 있음
    if (changes.improvements.length > 0) {
      score += 20;
      reasons.push(`✅ ${changes.improvements.length} improvement(s)`);
    }

    // Breaking change는 감점 (우리 사용자에게 영향)
    if (changes.breakingChanges.length > 0) {
      score -= 20;
      reasons.push(`⚠️  ${changes.breakingChanges.length} breaking change(s)`);
    }

    // UI/React 변경은 무시 (우리는 CLI/MCP)
    const hasUIChanges = changes.newFeatures.some(
      (f) =>
        f.toLowerCase().includes('ui') ||
        f.toLowerCase().includes('react') ||
        f.toLowerCase().includes('component')
    );

    if (hasUIChanges) {
      score -= 10;
      reasons.push('⚠️  UI changes (not relevant for MCP)');
    }

    // 70점 이상이면 흡수 가치 있음
    const worthAbsorbing = score >= 70;

    if (worthAbsorbing) {
      reasons.push(`✅ Score ${score}/100 - Worth absorbing`);
    } else {
      reasons.push(`❌ Score ${score}/100 - Not worth absorbing`);
    }

    return {
      worthAbsorbing,
      score,
      reasons,
    };
  }

  /**
   * Version 비교
   */
  private isNewerVersion(latest: string, current: string): boolean {
    // Simple semver comparison
    const latestParts = this.parseVersion(latest);
    const currentParts = this.parseVersion(current);

    for (let i = 0; i < 3; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }

    return false;
  }

  /**
   * Version 파싱
   */
  private parseVersion(version: string): [number, number, number] {
    const cleaned = version.replace(/^v/, '');
    const parts = cleaned.split('.').map((p) => parseInt(p) || 0);

    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  }

  /**
   * GitHub issue 생성 (tracking용)
   */
  async createTrackingIssue(update: UpstreamUpdate, targetRepo: string): Promise<string> {
    const [owner, repo] = targetRepo.split('/');

    const title = `[Upstream Update] ${update.project.name} ${update.latestVersion}`;
    const body = `## Upstream Update Detected

**Project**: ${update.project.name}
**Latest Version**: ${update.latestVersion}
**Release Date**: ${update.releaseDate.toISOString()}

### Evaluation

**Quality Score**: ${update.qualityScore}/100
**Worth Absorbing**: ${update.worthAbsorbing ? '✅ Yes' : '❌ No'}

**Reasons**:
${update.reasons.map((r) => `- ${r}`).join('\n')}

### Changelog

${update.changelog}

### Our Improvements (Current)

${update.project.improvements.map((i) => `- ${i}`).join('\n')}

---

**Action Required**: ${update.worthAbsorbing ? 'Review and absorb new features' : 'Monitor for future updates'}
`;

    try {
      const { data: issue } = await this.octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels: update.worthAbsorbing ? ['absorption', 'upstream-update'] : ['upstream-update'],
      });

      return issue.html_url;
    } catch (error: any) {
      console.error('Failed to create tracking issue:', error.message);
      throw error;
    }
  }

  /**
   * 흡수된 프로젝트 목록
   */
  getAbsorbedProjects(): AbsorbedProject[] {
    return Array.from(this.absorbedProjects.values());
  }

  /**
   * Rate limit 확인
   */
  async getRateLimit() {
    const { data } = await this.octokit.rateLimit.get();
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
    };
  }
}
