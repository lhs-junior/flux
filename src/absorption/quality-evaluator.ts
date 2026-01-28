/**
 * QualityEvaluator - 120점 평가 시스템 (100점 기본 + 20점 Fusion)
 *
 * 흡수 대상 프로젝트를 평가하여 84점 이상(70% of 120)만 흡수합니다.
 * Fusion 점수는 기존 feature들과의 통합 가능성을 평가합니다.
 */

import { FusionEvaluator } from '../fusion/fusion-evaluator.js';

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

/**
 * Enhanced Quality Score with Fusion evaluation (120-point system)
 */
export interface EnhancedQualityScore extends QualityScore {
  fusionScore: number; // 0-20점
  fusionOpportunities: Array<{
    features: [string, string];
    potentialScore: number;
    synergy: number;
    recommendation: string;
  }>;
}

export interface EvaluationContext {
  existingTools: string[]; // 기존 tool 이름들
  existingFeatures: string[]; // 기존 feature 목록 (memory, agent, etc.)
  currentComplexity: number; // 현재 시스템 복잡도
}

export class QualityEvaluator {
  private context: EvaluationContext;
  private fusionEvaluator: FusionEvaluator;

  constructor(context: EvaluationContext) {
    this.context = context;
    this.fusionEvaluator = new FusionEvaluator(context.existingFeatures);
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
   * 프로젝트 평가 with Fusion (120점 만점: 기본 100점 + Fusion 20점)
   *
   * 새 프로젝트가 기존 feature들과 어떤 Fusion 가능성을 가지는지 평가합니다.
   */
  evaluateWithFusion(project: ProjectInfo): EnhancedQualityScore {
    // 1. 기존 100점 평가
    const baseScore = this.evaluate(project);

    // 2. Fusion 평가 (0-20점)
    const fusionResult = this.evaluateFusionPotential(project);

    // 3. 120점 체계로 통합
    const total = baseScore.total + fusionResult.fusionScore;
    const grade = this.calculateGradeFor120(total);
    const recommendation = this.calculateRecommendationFor120(total);

    // 4. Enhanced reasons (Fusion 정보 포함)
    const enhancedReasons = [
      ...baseScore.reasons,
      ...this.generateFusionReasons(fusionResult),
    ];

    return {
      ...baseScore,
      total,
      grade,
      recommendation,
      reasons: enhancedReasons,
      fusionScore: fusionResult.fusionScore,
      fusionOpportunities: fusionResult.fusionOpportunities,
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
   * 등급 계산 (100점 체계)
   */
  private calculateGrade(total: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (total >= 90) return 'A';
    if (total >= 80) return 'B';
    if (total >= 70) return 'C';
    if (total >= 60) return 'D';
    return 'F';
  }

  /**
   * 등급 계산 (120점 체계)
   */
  private calculateGradeFor120(total: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (total >= 108) return 'A'; // 90% of 120
    if (total >= 96) return 'B';  // 80% of 120
    if (total >= 84) return 'C';  // 70% of 120
    if (total >= 72) return 'D';  // 60% of 120
    return 'F';
  }

  /**
   * 권장 사항 계산 (100점 체계)
   */
  private calculateRecommendation(total: number): 'approve' | 'consider' | 'reject' {
    if (total >= 80) return 'approve'; // 바로 흡수
    if (total >= 70) return 'consider'; // 신중히 고려
    return 'reject'; // 흡수 금지
  }

  /**
   * 권장 사항 계산 (120점 체계)
   */
  private calculateRecommendationFor120(total: number): 'approve' | 'consider' | 'reject' {
    if (total >= 96) return 'approve';   // 80% of 120 - 바로 흡수
    if (total >= 84) return 'consider';  // 70% of 120 - 신중히 고려
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

  /**
   * Fusion 가능성 평가
   *
   * 새 프로젝트가 기존 feature들과 얼마나 잘 통합될 수 있는지 평가합니다.
   * 반환값: { fusionScore: 0-20, opportunities: [...] }
   */
  private evaluateFusionPotential(project: ProjectInfo): {
    fusionScore: number;
    fusionOpportunities: EnhancedQualityScore['fusionOpportunities'];
  } {
    const opportunities: EnhancedQualityScore['fusionOpportunities'] = [];
    let totalFusionScore = 0;

    // 프로젝트가 제공하는 기능을 feature 이름으로 변환
    const projectFeature = this.inferProjectFeature(project);

    // 각 기존 feature와의 Fusion 가능성 평가
    for (const existingFeature of this.context.existingFeatures) {
      const fusionPotential = this.fusionEvaluator.evaluatePair(
        projectFeature,
        existingFeature
      );

      // Synergy score를 0-20 스케일로 정규화
      const normalizedScore = (fusionPotential.metrics.synergy / 20) * 4; // 각 feature당 최대 4점

      if (fusionPotential.metrics.synergy >= 12) {
        // 의미 있는 synergy가 있는 경우에만 추가
        opportunities.push({
          features: [projectFeature, existingFeature],
          potentialScore: fusionPotential.metrics.total,
          synergy: fusionPotential.metrics.synergy,
          recommendation: fusionPotential.recommendation,
        });

        totalFusionScore += normalizedScore;
      }
    }

    // 최대 20점으로 제한
    const fusionScore = Math.min(Math.round(totalFusionScore), 20);

    // 점수순으로 정렬
    opportunities.sort((a, b) => b.synergy - a.synergy);

    return {
      fusionScore,
      fusionOpportunities: opportunities.slice(0, 5), // 상위 5개만 반환
    };
  }

  /**
   * 프로젝트 정보로부터 feature 이름 추론
   *
   * 프로젝트의 description, name 등을 분석하여
   * 어떤 feature 카테고리에 속하는지 추론합니다.
   */
  private inferProjectFeature(project: ProjectInfo): string {
    const desc = project.description.toLowerCase();
    const name = project.name.toLowerCase();
    const combined = `${name} ${desc}`;

    // Memory-related
    if (
      combined.includes('memory') ||
      combined.includes('context') ||
      combined.includes('recall') ||
      combined.includes('storage')
    ) {
      return 'memory';
    }

    // Agent-related
    if (
      combined.includes('agent') ||
      combined.includes('autonomous') ||
      combined.includes('workflow') ||
      combined.includes('automation')
    ) {
      return 'agents';
    }

    // Planning-related
    if (
      combined.includes('plan') ||
      combined.includes('task') ||
      combined.includes('todo') ||
      combined.includes('roadmap')
    ) {
      return 'planning';
    }

    // TDD-related
    if (
      combined.includes('test') ||
      combined.includes('tdd') ||
      combined.includes('coverage') ||
      combined.includes('quality')
    ) {
      return 'tdd';
    }

    // Guide-related
    if (
      combined.includes('guide') ||
      combined.includes('tutorial') ||
      combined.includes('learn') ||
      combined.includes('documentation')
    ) {
      return 'guide';
    }

    // Science-related
    if (
      combined.includes('analysis') ||
      combined.includes('science') ||
      combined.includes('research') ||
      combined.includes('experiment')
    ) {
      return 'science';
    }

    // Default: 가장 일반적인 카테고리
    return 'general';
  }

  /**
   * Fusion 평가 결과를 사람이 읽을 수 있는 reasons로 변환
   */
  private generateFusionReasons(fusionResult: {
    fusionScore: number;
    fusionOpportunities: EnhancedQualityScore['fusionOpportunities'];
  }): string[] {
    const reasons: string[] = [];

    if (fusionResult.fusionScore >= 18) {
      reasons.push(`🔥 Exceptional fusion potential (${fusionResult.fusionScore}/20)`);
    } else if (fusionResult.fusionScore >= 15) {
      reasons.push(`✅ Strong fusion potential (${fusionResult.fusionScore}/20)`);
    } else if (fusionResult.fusionScore >= 10) {
      reasons.push(`Good fusion potential (${fusionResult.fusionScore}/20)`);
    } else if (fusionResult.fusionScore >= 5) {
      reasons.push(`Moderate fusion potential (${fusionResult.fusionScore}/20)`);
    } else {
      reasons.push(`Limited fusion potential (${fusionResult.fusionScore}/20)`);
    }

    // 상위 3개 opportunity 언급
    const topOpportunities = fusionResult.fusionOpportunities.slice(0, 3);
    if (topOpportunities.length > 0) {
      const featurePairs = topOpportunities
        .map((opp) => `${opp.features[0]}↔${opp.features[1]}`)
        .join(', ');
      reasons.push(`🔗 Best integration opportunities: ${featurePairs}`);
    }

    return reasons;
  }
}
