/**
 * QualityEvaluator - 100점 평가 시스템
 *
 * 흡수 대상 프로젝트를 평가하여 70점 이상만 흡수합니다.
 */

export interface ProjectInfo {
  name: string;
  repo: string;
  description: string;
  stars: number;
  forks: number;
  lastCommit: Date;
  license: string;
  dependencies: string[];
  complexity: 'low' | 'medium' | 'high';
}

export interface QualityScore {
  total: number; // 0-100
  breakdown: {
    functionalImprovement: number; // 0-30점
    synergyScore: number; // 0-30점
    conflictRisk: number; // -20~0점
    maintainability: number; // 0-20점
    license: number; // 0-20점
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: 'approve' | 'consider' | 'reject';
  reasons: string[];
}

export interface EvaluationContext {
  existingTools: string[]; // 기존 tool 이름들
  existingFeatures: string[]; // 기존 feature 목록 (memory, agent, etc.)
  currentComplexity: number; // 현재 시스템 복잡도
}

export class QualityEvaluator {
  private context: EvaluationContext;

  constructor(context: EvaluationContext) {
    this.context = context;
  }

  /**
   * 프로젝트 평가 (100점 만점)
   */
  evaluate(project: ProjectInfo): QualityScore {
    const functionalImprovement = this.evaluateFunctionalImprovement(project);
    const synergyScore = this.evaluateSynergy(project);
    const conflictRisk = this.evaluateConflictRisk(project);
    const maintainability = this.evaluateMaintainability(project);
    const licenseScore = this.evaluateLicense(project);

    const breakdown = {
      functionalImprovement,
      synergyScore,
      conflictRisk,
      maintainability,
      license: licenseScore,
    };

    const total = Math.max(
      0,
      functionalImprovement + synergyScore + conflictRisk + maintainability + licenseScore
    );

    const grade = this.calculateGrade(total);
    const recommendation = this.calculateRecommendation(total);
    const reasons = this.generateReasons(project, breakdown);

    return {
      total,
      breakdown,
      grade,
      recommendation,
      reasons,
    };
  }

  /**
   * 기능 개선도 평가 (0-30점)
   * 원본보다 더 나은 성능, UX, API를 제공하는가?
   */
  private evaluateFunctionalImprovement(project: ProjectInfo): number {
    let score = 0;

    // Base: 프로젝트가 제공하는 기능의 가치
    if (project.stars >= 100) {
      score += 10; // 검증된 프로젝트
    } else if (project.stars >= 50) {
      score += 7;
    } else if (project.stars >= 10) {
      score += 5;
    }

    // Improvement potential: 우리가 개선할 여지
    // SQLite로 개선 가능? → +5
    // BM25 search 통합 가능? → +5
    // Performance 개선 가능? → +5
    // API 단순화 가능? → +5

    // 예시: planning-with-files는 파일 기반 → SQLite로 개선 가능
    if (project.description.toLowerCase().includes('file')) {
      score += 5; // SQLite 개선 가능
    }

    if (project.description.toLowerCase().includes('search')) {
      score += 5; // BM25 개선 가능
    }

    // Complexity reduction
    if (project.complexity === 'high') {
      score += 5; // 단순화 가능
    } else if (project.complexity === 'medium') {
      score += 3;
    }

    return Math.min(score, 30);
  }

  /**
   * 시너지 점수 평가 (0-30점)
   * 기존 기능(Memory/Agent)과 얼마나 잘 통합되는가?
   */
  private evaluateSynergy(project: ProjectInfo): number {
    let score = 0;

    // Memory와 시너지
    if (
      project.description.toLowerCase().includes('data') ||
      project.description.toLowerCase().includes('store') ||
      project.description.toLowerCase().includes('save')
    ) {
      score += 10; // Memory에 저장 가능
    }

    // Agent와 시너지
    if (
      project.description.toLowerCase().includes('task') ||
      project.description.toLowerCase().includes('workflow') ||
      project.description.toLowerCase().includes('automation')
    ) {
      score += 10; // Agent가 자동 실행 가능
    }

    // BM25 Search와 시너지
    if (
      project.description.toLowerCase().includes('search') ||
      project.description.toLowerCase().includes('query') ||
      project.description.toLowerCase().includes('find')
    ) {
      score += 5; // BM25로 검색 가능
    }

    // Cross-feature integration
    const features = this.context.existingFeatures;
    if (features.length > 0) {
      score += 5; // 기존 feature와 통합 가능
    }

    return Math.min(score, 30);
  }

  /**
   * 충돌 위험도 평가 (-20~0점)
   * Tool naming, 아키텍처 충돌 가능성
   */
  private evaluateConflictRisk(project: ProjectInfo): number {
    let penalty = 0;

    // Tool name conflicts
    const projectTools = this.extractToolNames(project);
    const conflicts = projectTools.filter((tool) =>
      this.context.existingTools.some((existing) =>
        this.isSimilarToolName(existing, tool)
      )
    );

    penalty -= conflicts.length * 2; // 충돌 1개당 -2점

    // Architecture conflicts
    if (project.description.toLowerCase().includes('gateway')) {
      penalty -= 5; // Gateway pattern은 우리와 충돌
    }

    if (project.dependencies.length > 10) {
      penalty -= 3; // 의존성 많으면 충돌 가능성 높음
    }

    return Math.max(penalty, -20);
  }

  /**
   * 유지보수성 평가 (0-20점)
   * 코드 복잡도, 의존성 수
   */
  private evaluateMaintainability(project: ProjectInfo): number {
    let score = 0;

    // Complexity
    if (project.complexity === 'low') {
      score += 10;
    } else if (project.complexity === 'medium') {
      score += 6;
    } else {
      score += 2;
    }

    // Dependencies
    if (project.dependencies.length === 0) {
      score += 10; // Zero deps!
    } else if (project.dependencies.length <= 3) {
      score += 6;
    } else if (project.dependencies.length <= 10) {
      score += 3;
    }

    // Recent activity
    const daysSinceCommit = Math.floor(
      (Date.now() - project.lastCommit.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCommit <= 30) {
      score += 5; // 최근 활동
    } else if (daysSinceCommit <= 90) {
      score += 3;
    }

    return Math.min(score, 20);
  }

  /**
   * 라이선스 평가 (0-20점)
   * MIT/Apache-2.0만 허용
   */
  private evaluateLicense(project: ProjectInfo): number {
    const license = project.license.toLowerCase();

    if (license.includes('mit')) {
      return 20; // MIT - Perfect
    }

    if (license.includes('apache')) {
      return 20; // Apache 2.0 - Perfect
    }

    if (license.includes('bsd')) {
      return 15; // BSD - Good
    }

    if (license.includes('isc')) {
      return 15; // ISC - Good
    }

    // GPL, AGPL 등은 낮은 점수
    if (license.includes('gpl')) {
      return 5;
    }

    // License 없음
    return 0;
  }

  /**
   * 등급 계산
   */
  private calculateGrade(total: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (total >= 90) return 'A';
    if (total >= 80) return 'B';
    if (total >= 70) return 'C';
    if (total >= 60) return 'D';
    return 'F';
  }

  /**
   * 권장 사항 계산
   */
  private calculateRecommendation(total: number): 'approve' | 'consider' | 'reject' {
    if (total >= 80) return 'approve'; // 바로 흡수
    if (total >= 70) return 'consider'; // 신중히 고려
    return 'reject'; // 흡수 금지
  }

  /**
   * 평가 이유 생성
   */
  private generateReasons(project: ProjectInfo, breakdown: QualityScore['breakdown']): string[] {
    const reasons: string[] = [];

    // Functional Improvement
    if (breakdown.functionalImprovement >= 25) {
      reasons.push(`✅ Excellent improvement potential (${breakdown.functionalImprovement}/30)`);
    } else if (breakdown.functionalImprovement >= 20) {
      reasons.push(`Good improvement potential (${breakdown.functionalImprovement}/30)`);
    } else if (breakdown.functionalImprovement < 15) {
      reasons.push(`⚠️  Limited improvement potential (${breakdown.functionalImprovement}/30)`);
    }

    // Synergy
    if (breakdown.synergyScore >= 25) {
      reasons.push(`✅ Strong synergy with existing features (${breakdown.synergyScore}/30)`);
    } else if (breakdown.synergyScore >= 20) {
      reasons.push(`Good synergy potential (${breakdown.synergyScore}/30)`);
    } else if (breakdown.synergyScore < 15) {
      reasons.push(`⚠️  Weak synergy (${breakdown.synergyScore}/30)`);
    }

    // Conflicts
    if (breakdown.conflictRisk === 0) {
      reasons.push('✅ No conflicts detected');
    } else if (breakdown.conflictRisk >= -5) {
      reasons.push(`Minor conflicts (${breakdown.conflictRisk} penalty)`);
    } else {
      reasons.push(`⚠️  Significant conflicts (${breakdown.conflictRisk} penalty)`);
    }

    // Maintainability
    if (breakdown.maintainability >= 15) {
      reasons.push(`✅ Highly maintainable (${breakdown.maintainability}/20)`);
    } else if (breakdown.maintainability < 10) {
      reasons.push(`⚠️  Maintainability concerns (${breakdown.maintainability}/20)`);
    }

    // License
    if (breakdown.license === 20) {
      reasons.push(`✅ Perfect license (${project.license})`);
    } else if (breakdown.license < 15) {
      reasons.push(`⚠️  License concerns (${project.license})`);
    }

    return reasons;
  }

  /**
   * Tool 이름 추출 (간단한 휴리스틱)
   */
  private extractToolNames(project: ProjectInfo): string[] {
    // 실제로는 README, package.json 등을 파싱해야 하지만
    // 여기서는 프로젝트 이름에서 추출
    const name = project.name.toLowerCase();
    return [
      `${name}_create`,
      `${name}_update`,
      `${name}_delete`,
      `${name}_list`,
    ];
  }

  /**
   * Tool 이름 유사도 체크
   */
  private isSimilarToolName(existing: string, candidate: string): boolean {
    // 정확히 같거나
    if (existing === candidate) return true;

    // 접두사가 같으면 (예: agent_list vs agent_spawn)
    const existingPrefix = existing.split('_')[0];
    const candidatePrefix = candidate.split('_')[0];

    return existingPrefix === candidatePrefix;
  }
}
