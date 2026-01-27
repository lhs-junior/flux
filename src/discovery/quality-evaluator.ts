import type { GitHubRepoInfo } from './github-explorer.js';

export interface QualityScore {
  total: number; // 0-100
  breakdown: {
    popularity: number; // 0-25
    maintenance: number; // 0-25
    documentation: number; // 0-25
    reliability: number; // 0-25
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: 'highly_recommended' | 'recommended' | 'acceptable' | 'not_recommended';
  reasons: string[];
}

export interface EvaluationOptions {
  minScore?: number; // Minimum score to be considered (default: 70)
  weights?: {
    popularity?: number;
    maintenance?: number;
    documentation?: number;
    reliability?: number;
  };
}

export class QualityEvaluator {
  private minScore: number;
  private weights: {
    popularity: number;
    maintenance: number;
    documentation: number;
    reliability: number;
  };

  constructor(options: EvaluationOptions = {}) {
    this.minScore = options.minScore ?? 70;
    this.weights = {
      popularity: options.weights?.popularity ?? 1.0,
      maintenance: options.weights?.maintenance ?? 1.0,
      documentation: options.weights?.documentation ?? 1.0,
      reliability: options.weights?.reliability ?? 1.0,
    };
  }

  /**
   * Evaluate a single repository
   */
  evaluate(repo: GitHubRepoInfo): QualityScore {
    const popularity = this.evaluatePopularity(repo);
    const maintenance = this.evaluateMaintenance(repo);
    const documentation = this.evaluateDocumentation(repo);
    const reliability = this.evaluateReliability(repo);

    const breakdown = {
      popularity: Math.round(popularity * this.weights.popularity),
      maintenance: Math.round(maintenance * this.weights.maintenance),
      documentation: Math.round(documentation * this.weights.documentation),
      reliability: Math.round(reliability * this.weights.reliability),
    };

    const total = breakdown.popularity + breakdown.maintenance + breakdown.documentation + breakdown.reliability;

    const grade = this.calculateGrade(total);
    const recommendation = this.calculateRecommendation(total);
    const reasons = this.generateReasons(repo, breakdown);

    return {
      total,
      breakdown,
      grade,
      recommendation,
      reasons,
    };
  }

  /**
   * Evaluate multiple repositories and return sorted by score
   */
  evaluateAll(repos: GitHubRepoInfo[]): Array<{ repo: GitHubRepoInfo; score: QualityScore }> {
    const evaluated = repos.map((repo) => ({
      repo,
      score: this.evaluate(repo),
    }));

    // Sort by total score (descending)
    evaluated.sort((a, b) => b.score.total - a.score.total);

    return evaluated;
  }

  /**
   * Filter repositories that meet minimum quality score
   */
  filterRecommended(repos: GitHubRepoInfo[]): Array<{ repo: GitHubRepoInfo; score: QualityScore }> {
    return this.evaluateAll(repos).filter((item) => item.score.total >= this.minScore);
  }

  /**
   * Evaluate popularity based on stars and forks
   * Max score: 25 points
   */
  private evaluatePopularity(repo: GitHubRepoInfo): number {
    let score = 0;

    // Stars (0-20 points)
    // Linear scale: 10 stars = 5pts, 50 stars = 10pts, 100 stars = 15pts, 200+ stars = 20pts
    if (repo.stars >= 200) {
      score += 20;
    } else if (repo.stars >= 100) {
      score += 15;
    } else if (repo.stars >= 50) {
      score += 10;
    } else if (repo.stars >= 10) {
      score += 5 + ((repo.stars - 10) / 40) * 5; // Interpolate
    }

    // Forks (0-5 points)
    // Forks indicate community engagement
    if (repo.forks >= 20) {
      score += 5;
    } else if (repo.forks >= 10) {
      score += 3;
    } else if (repo.forks >= 5) {
      score += 2;
    } else if (repo.forks >= 1) {
      score += 1;
    }

    return Math.min(score, 25);
  }

  /**
   * Evaluate maintenance based on recent commits
   * Max score: 25 points
   */
  private evaluateMaintenance(repo: GitHubRepoInfo): number {
    let score = 0;

    const now = Date.now();
    const daysSinceLastCommit = Math.floor((now - repo.lastCommit.getTime()) / (1000 * 60 * 60 * 24));

    // Recency of last commit (0-15 points)
    if (daysSinceLastCommit <= 7) {
      score += 15; // Very active
    } else if (daysSinceLastCommit <= 30) {
      score += 12; // Active
    } else if (daysSinceLastCommit <= 90) {
      score += 8; // Moderately active
    } else if (daysSinceLastCommit <= 180) {
      score += 4; // Somewhat maintained
    } else {
      score += 1; // Possibly abandoned
    }

    // Project age (0-5 points)
    // Mature projects are more stable
    const monthsSinceCreation = Math.floor((now - repo.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (monthsSinceCreation >= 12) {
      score += 5; // Mature
    } else if (monthsSinceCreation >= 6) {
      score += 3; // Established
    } else if (monthsSinceCreation >= 3) {
      score += 2; // Growing
    } else {
      score += 1; // New
    }

    // Open issues ratio (0-5 points)
    // Too many open issues might indicate poor maintenance
    const issueRatio = repo.stars > 0 ? repo.openIssues / repo.stars : 0;
    if (issueRatio < 0.1) {
      score += 5; // Well maintained
    } else if (issueRatio < 0.2) {
      score += 3; // Acceptable
    } else if (issueRatio < 0.5) {
      score += 1; // Many issues
    }
    // else 0 points for very high issue ratio

    return Math.min(score, 25);
  }

  /**
   * Evaluate documentation quality
   * Max score: 25 points
   */
  private evaluateDocumentation(repo: GitHubRepoInfo): number {
    let score = 0;

    // Has README (0-10 points)
    if (repo.hasReadme) {
      score += 10;
    }

    // Has description (0-5 points)
    if (repo.description && repo.description.length > 20) {
      score += 5;
    } else if (repo.description) {
      score += 2;
    }

    // Has package.json (0-5 points)
    // Indicates proper Node.js/TypeScript setup
    if (repo.packageJson) {
      score += 3;
      if (repo.packageJson.description) {
        score += 1;
      }
      if (repo.packageJson.keywords && repo.packageJson.keywords.length > 0) {
        score += 1;
      }
    }

    // Has topics/tags (0-3 points)
    // Topics help with discoverability
    if (repo.topics.length >= 3) {
      score += 3;
    } else if (repo.topics.length >= 1) {
      score += 2;
    }

    // Has license (0-2 points)
    // Important for open source usage
    if (repo.license) {
      score += 2;
    }

    return Math.min(score, 25);
  }

  /**
   * Evaluate reliability
   * Max score: 25 points
   */
  private evaluateReliability(repo: GitHubRepoInfo): number {
    let score = 0;

    // Star-to-issue ratio (0-10 points)
    // Lower ratio of issues to stars is better
    const issueRatio = repo.stars > 0 ? repo.openIssues / repo.stars : 1;
    if (issueRatio < 0.05) {
      score += 10; // Very reliable
    } else if (issueRatio < 0.15) {
      score += 7; // Reliable
    } else if (issueRatio < 0.3) {
      score += 4; // Acceptable
    } else {
      score += 1; // Many issues
    }

    // Fork-to-star ratio (0-5 points)
    // Active community contribution
    const forkRatio = repo.stars > 0 ? repo.forks / repo.stars : 0;
    if (forkRatio > 0.2) {
      score += 5; // High community engagement
    } else if (forkRatio > 0.1) {
      score += 3; // Good engagement
    } else if (forkRatio > 0.05) {
      score += 2; // Some engagement
    }

    // Has package.json with proper versioning (0-5 points)
    if (repo.packageJson) {
      score += 2;
      if (repo.packageJson.version && repo.packageJson.version !== '0.0.0') {
        score += 3; // Proper versioning
      }
    }

    // Recent activity (0-5 points)
    const daysSinceUpdate = Math.floor((Date.now() - repo.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate <= 30) {
      score += 5; // Recently updated
    } else if (daysSinceUpdate <= 90) {
      score += 3; // Somewhat recent
    } else if (daysSinceUpdate <= 180) {
      score += 1; // Not very recent
    }

    return Math.min(score, 25);
  }

  /**
   * Calculate letter grade from total score
   */
  private calculateGrade(total: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (total >= 90) return 'A';
    if (total >= 80) return 'B';
    if (total >= 70) return 'C';
    if (total >= 60) return 'D';
    return 'F';
  }

  /**
   * Calculate recommendation level
   */
  private calculateRecommendation(
    total: number
  ): 'highly_recommended' | 'recommended' | 'acceptable' | 'not_recommended' {
    if (total >= 85) return 'highly_recommended';
    if (total >= 75) return 'recommended';
    if (total >= 60) return 'acceptable';
    return 'not_recommended';
  }

  /**
   * Generate human-readable reasons for the score
   */
  private generateReasons(repo: GitHubRepoInfo, breakdown: QualityScore['breakdown']): string[] {
    const reasons: string[] = [];

    // Popularity
    if (breakdown.popularity >= 20) {
      reasons.push(`⭐ Highly popular (${repo.stars} stars)`);
    } else if (breakdown.popularity >= 10) {
      reasons.push(`⭐ Good popularity (${repo.stars} stars)`);
    } else {
      reasons.push(`Limited stars (${repo.stars})`);
    }

    // Maintenance
    const daysSinceCommit = Math.floor((Date.now() - repo.lastCommit.getTime()) / (1000 * 60 * 60 * 24));
    if (breakdown.maintenance >= 20) {
      reasons.push(`🔧 Actively maintained (last commit ${daysSinceCommit} days ago)`);
    } else if (breakdown.maintenance >= 15) {
      reasons.push(`🔧 Well maintained (last commit ${daysSinceCommit} days ago)`);
    } else if (breakdown.maintenance >= 10) {
      reasons.push(`Moderately maintained (last commit ${daysSinceCommit} days ago)`);
    } else {
      reasons.push(`⚠️  Possibly unmaintained (last commit ${daysSinceCommit} days ago)`);
    }

    // Documentation
    if (breakdown.documentation >= 20) {
      reasons.push('📚 Excellent documentation');
    } else if (breakdown.documentation >= 15) {
      reasons.push('📚 Good documentation');
    } else if (breakdown.documentation >= 10) {
      reasons.push('Basic documentation');
    } else {
      reasons.push('⚠️  Limited documentation');
    }

    // Reliability
    if (breakdown.reliability >= 20) {
      reasons.push('✅ Highly reliable');
    } else if (breakdown.reliability >= 15) {
      reasons.push('✅ Reliable');
    } else if (breakdown.reliability >= 10) {
      reasons.push('Acceptable reliability');
    } else {
      reasons.push('⚠️  Reliability concerns');
    }

    // Additional insights
    if (repo.license) {
      reasons.push(`Licensed: ${repo.license}`);
    }

    if (repo.openIssues > repo.stars * 0.3) {
      reasons.push(`⚠️  High number of open issues (${repo.openIssues})`);
    }

    return reasons;
  }
}
