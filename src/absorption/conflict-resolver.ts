/**
 * ConflictResolver - 충돌 감지 및 해결
 *
 * Tool naming, 아키텍처 충돌을 감지하고 해결 방안을 제시합니다.
 * 우선순위: Merge > Namespace > Deprecate
 */

export interface ToolDefinition {
  name: string;
  description: string;
  domain: string; // memory, agent, planning, tdd, etc.
  parameters: Record<string, any>;
}

export interface Conflict {
  type: 'naming' | 'architecture' | 'functionality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  existing: ToolDefinition | string;
  incoming: ToolDefinition | string;
  description: string;
}

export interface ResolutionStrategy {
  type: 'merge' | 'namespace' | 'deprecate';
  action: string;
  rationale: string;
  implementation: string;
}

export interface ConflictResolution {
  conflicts: Conflict[];
  strategy: ResolutionStrategy;
  approved: boolean;
  notes: string[];
}

export class ConflictResolver {
  private existingTools: Map<string, ToolDefinition>;
  private existingDomains: Set<string>;

  constructor(existingTools: ToolDefinition[]) {
    this.existingTools = new Map(existingTools.map((t) => [t.name, t]));
    this.existingDomains = new Set(existingTools.map((t) => t.domain));
  }

  /**
   * 충돌 감지 및 해결 방안 제시
   */
  resolve(incomingTools: ToolDefinition[]): ConflictResolution {
    // 1. 충돌 감지
    const conflicts = this.detectConflicts(incomingTools);

    // 2. 해결 전략 결정
    const strategy = this.determineStrategy(conflicts, incomingTools);

    // 3. 승인 여부 결정
    const approved = this.shouldApprove(conflicts, strategy);

    // 4. 노트 생성
    const notes = this.generateNotes(conflicts, strategy);

    return {
      conflicts,
      strategy,
      approved,
      notes,
    };
  }

  /**
   * 충돌 감지
   */
  private detectConflicts(incomingTools: ToolDefinition[]): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const incoming of incomingTools) {
      // Naming conflict
      const namingConflict = this.detectNamingConflict(incoming);
      if (namingConflict) {
        conflicts.push(namingConflict);
      }

      // Functionality conflict
      const funcConflict = this.detectFunctionalityConflict(incoming);
      if (funcConflict) {
        conflicts.push(funcConflict);
      }

      // Architecture conflict
      const archConflict = this.detectArchitectureConflict(incoming);
      if (archConflict) {
        conflicts.push(archConflict);
      }
    }

    return conflicts;
  }

  /**
   * Naming 충돌 감지
   */
  private detectNamingConflict(incoming: ToolDefinition): Conflict | null {
    // 정확히 같은 이름
    if (this.existingTools.has(incoming.name)) {
      return {
        type: 'naming',
        severity: 'critical',
        existing: this.existingTools.get(incoming.name)!,
        incoming,
        description: `Tool name "${incoming.name}" already exists`,
      };
    }

    // 유사한 이름 (예: agent_list vs agent_spawn)
    const similarTool = this.findSimilarToolName(incoming.name);
    if (similarTool) {
      return {
        type: 'naming',
        severity: 'medium',
        existing: similarTool,
        incoming,
        description: `Tool name "${incoming.name}" is similar to "${similarTool.name}"`,
      };
    }

    return null;
  }

  /**
   * Functionality 충돌 감지
   */
  private detectFunctionalityConflict(incoming: ToolDefinition): Conflict | null {
    // 같은 도메인에서 같은 기능을 하는 tool
    const similarFunc = this.findSimilarFunctionality(incoming);
    if (similarFunc) {
      return {
        type: 'functionality',
        severity: 'high',
        existing: similarFunc,
        incoming,
        description: `Similar functionality: "${similarFunc.name}" and "${incoming.name}" both ${this.extractAction(incoming.name)}`,
      };
    }

    return null;
  }

  /**
   * Architecture 충돌 감지
   */
  private detectArchitectureConflict(incoming: ToolDefinition): Conflict | null {
    // 예: 파일 기반 vs SQLite 기반
    if (incoming.description.toLowerCase().includes('file')) {
      return {
        type: 'architecture',
        severity: 'low',
        existing: 'SQLite-based storage',
        incoming: incoming.name,
        description: 'Incoming tool uses file storage, we use SQLite',
      };
    }

    return null;
  }

  /**
   * 해결 전략 결정
   */
  private determineStrategy(conflicts: Conflict[], incomingTools: ToolDefinition[]): ResolutionStrategy {
    // Critical naming conflict → Namespace
    const criticalNaming = conflicts.find((c) => c.type === 'naming' && c.severity === 'critical');
    if (criticalNaming) {
      return this.createNamespaceStrategy(criticalNaming, incomingTools);
    }

    // High functionality conflict → Merge
    const highFunc = conflicts.find((c) => c.type === 'functionality' && c.severity === 'high');
    if (highFunc) {
      return this.createMergeStrategy(highFunc, incomingTools);
    }

    // Medium conflicts → Namespace
    const mediumConflicts = conflicts.filter((c) => c.severity === 'medium');
    if (mediumConflicts.length > 0) {
      return this.createNamespaceStrategy(mediumConflicts[0], incomingTools);
    }

    // Low conflicts → Merge (architecture 차이는 무시)
    return this.createMergeStrategy(null, incomingTools);
  }

  /**
   * Merge 전략 생성
   */
  private createMergeStrategy(conflict: Conflict | null, incomingTools: ToolDefinition[]): ResolutionStrategy {
    if (!conflict) {
      return {
        type: 'merge',
        action: 'Integrate incoming tools as-is',
        rationale: 'No significant conflicts detected',
        implementation: 'Add tools with their original names',
      };
    }

    const existing = conflict.existing as ToolDefinition;
    const incoming = conflict.incoming as ToolDefinition;

    return {
      type: 'merge',
      action: `Merge "${existing.name}" and "${incoming.name}" into unified API`,
      rationale: 'Both tools provide similar functionality, merge for better UX',
      implementation: `Create unified tool that supports both use cases:
  - Add 'type' parameter to distinguish use cases
  - Combine parameters from both tools
  - Example: ${this.generateMergeExample(existing, incoming)}`,
    };
  }

  /**
   * Namespace 전략 생성
   */
  private createNamespaceStrategy(conflict: Conflict, incomingTools: ToolDefinition[]): ResolutionStrategy {
    const domain = incomingTools[0]?.domain || 'unknown';

    return {
      type: 'namespace',
      action: `Add "${domain}_" prefix to incoming tools`,
      rationale: `Prevent naming conflicts by using domain-specific prefix`,
      implementation: `Rename tools:
${incomingTools.map((t) => `  - ${t.name} → ${domain}_${t.name.split('_').slice(1).join('_')}`).join('\n')}`,
    };
  }

  /**
   * Deprecate 전략 생성
   */
  private createDeprecateStrategy(conflict: Conflict): ResolutionStrategy {
    const existing = conflict.existing as ToolDefinition;
    const incoming = conflict.incoming as ToolDefinition;

    return {
      type: 'deprecate',
      action: `Replace "${existing.name}" with "${incoming.name}"`,
      rationale: 'Incoming tool is superior, deprecate existing',
      implementation: `1. Mark "${existing.name}" as deprecated
2. Add "${incoming.name}" as replacement
3. Migration guide for users`,
    };
  }

  /**
   * 승인 여부 결정
   */
  private shouldApprove(conflicts: Conflict[], strategy: ResolutionStrategy): boolean {
    // Critical 충돌이 있으면 자동 승인 불가
    if (conflicts.some((c) => c.severity === 'critical')) {
      return false;
    }

    // Merge 전략은 승인
    if (strategy.type === 'merge') {
      return true;
    }

    // Namespace 전략도 승인
    if (strategy.type === 'namespace') {
      return true;
    }

    // Deprecate는 수동 검토 필요
    return false;
  }

  /**
   * 노트 생성
   */
  private generateNotes(conflicts: Conflict[], strategy: ResolutionStrategy): string[] {
    const notes: string[] = [];

    if (conflicts.length === 0) {
      notes.push('✅ No conflicts detected - safe to proceed');
    } else {
      notes.push(`⚠️  ${conflicts.length} conflict(s) detected`);
      conflicts.forEach((c) => {
        notes.push(`  - ${c.severity.toUpperCase()}: ${c.description}`);
      });
    }

    notes.push('');
    notes.push(`Recommended strategy: ${strategy.type.toUpperCase()}`);
    notes.push(`  ${strategy.action}`);
    notes.push('');
    notes.push(`Rationale: ${strategy.rationale}`);

    return notes;
  }

  /**
   * 유사한 tool 이름 찾기
   */
  private findSimilarToolName(name: string): ToolDefinition | null {
    const prefix = name.split('_')[0];

    for (const [existingName, tool] of this.existingTools) {
      if (existingName.startsWith(prefix + '_')) {
        return tool;
      }
    }

    return null;
  }

  /**
   * 유사한 기능 찾기
   */
  private findSimilarFunctionality(incoming: ToolDefinition): ToolDefinition | null {
    const incomingAction = this.extractAction(incoming.name);

    for (const [_, tool] of this.existingTools) {
      if (tool.domain === incoming.domain) {
        const existingAction = this.extractAction(tool.name);
        if (existingAction === incomingAction) {
          return tool;
        }
      }
    }

    return null;
  }

  /**
   * Tool 이름에서 action 추출
   */
  private extractAction(toolName: string): string {
    const parts = toolName.split('_');
    return parts[parts.length - 1]; // create, update, delete, list, etc.
  }

  /**
   * Merge 예제 생성
   */
  private generateMergeExample(existing: ToolDefinition, incoming: ToolDefinition): string {
    const mergedName = existing.name.replace(/_\w+$/, '') + '_unified';
    return `
${mergedName}({
  type: '${existing.domain}' | '${incoming.domain}',
  // Parameters from both tools
  ...
})`;
  }
}
