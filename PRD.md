# Awesome Plugin - Product Requirements Document (PRD)

**Version**: 1.0
**Date**: 2025-01-28
**Status**: Approved for Implementation

---

## 🎯 Executive Summary

### What is awesome-plugin?

**The Absorption Engine**: 좋은 Claude Code 프로젝트를 지속적으로 발견하고, 평가하고, 개선해서 흡수하는 Built-in MCP Plugin

### Core Value Proposition

```
Anthropic Skills (What to do) + awesome-plugin (How + Data)
────────────────────────────────────────────────────────────
Skills = "데이터를 분석하세요" (Prompt)
awesome-plugin = 실제 분석 실행 + 결과 저장 + 검색 가능 + 재사용
```

**독점 가치**:
- ✅ **Stateful**: SQLite persistence (Skills는 stateless)
- ✅ **Integrated**: Memory ↔ Agent ↔ Planning ↔ TDD (Skills는 독립적)
- ✅ **Long-running**: Background async execution (Skills는 즉시 응답)
- ✅ **Quality-driven**: 70점 이상만 흡수 (Skills는 검증 없음)

---

## 🧬 Product Vision

### "좋은게 있으면 흡수한다!"

**하지만 아무거나 먹지 않는다.**

| 원칙 | 설명 |
|------|------|
| **전략적 발견** | 100점 평가 시스템 (70점 이상만 흡수) |
| **개선된 재구현** | 원본보다 더 나은 성능/UX/API |
| **충돌 제로** | Merge > Namespace > Deprecate 전략 |
| **시너지 검증** | 기존 기능과 통합 (30점 배점) |
| **업스트림 동기화** | 매달 원본 모니터링, 선택적 재흡수 |
| **원작자 존중** | 크레딧, PR 기여, 협업 제안 |

---

## 📊 Market Analysis

### Competitive Landscape

| Product | Type | Strengths | Weaknesses |
|---------|------|-----------|------------|
| **Anthropic Skills** | Prompt-based | 공식, Marketplace, Claude.ai 통합 | Stateless, No persistence, No integration |
| **oh-my-claudecode** | Built-in | 31 skills, 95% token reduction | Static (고정), No evolution |
| **MCP Gateway** | Proxy pattern | 유연성 | 토큰 폭발 (10 servers = 45K tokens) |
| **awesome-plugin** | Absorption Engine | Stateful, Integrated, Evolving | 공식 아님, Marketplace 없음 |

### Positioning

```
        Stateless ←→ Stateful
              │
    Skills    │    awesome-plugin
              │
   ───────────┼───────────────
              │
 oh-my-claude │    MCP Gateway
              │
        Static ←→ Dynamic
```

**우리의 위치**: Stateful + Dynamic (유일한 quadrant)

---

## 🎯 Success Metrics

### Phase 0 (Week 1) - v0.1.1

| Metric | Target | Measurement |
|--------|--------|-------------|
| DB bug 제거 | 100% | No cleanup errors in test |
| 흡수 인프라 구축 | 100% | QualityEvaluator, ConflictResolver, UpstreamMonitor 작동 |
| CLI `absorbed` 명령어 | Working | Users can see absorption history |
| CLI `vote` 명령어 | Working | Users can vote for next absorption |

### Phase 1-5 (Week 2-13)

| Metric | Target | Status |
|--------|--------|--------|
| Absorbed projects | 6/8 | 2/8 → 6/8 |
| Total tools | 28+ | 9 → 28+ |
| Quality score avg | 85+ | N/A → 85+ |
| Test coverage | 85%+ | 70% → 85%+ |
| BM25 search | <0.5ms | 0.2-0.7ms → <0.5ms |

### User Experience

- [ ] "Absorption" visible in every release
- [ ] Voting system drives roadmap
- [ ] Users feel continuous growth
- [ ] Better than oh-my-claudecode (quality > quantity)
- [ ] Zero forced external dependencies
- [ ] Seamless integration (zero conflicts)

---

## 🧬 Absorption Quality Criteria

### 100점 평가 시스템

| 평가 항목 | 점수 | 설명 |
|----------|------|------|
| **기능 개선도** | 0-30점 | 원본보다 더 나은가? (성능, UX, API) |
| **시너지 점수** | 0-30점 | 기존 기능(Memory/Agent)과 잘 맞는가? |
| **충돌 위험도** | -20~0점 | Tool naming, 아키텍처 충돌 가능성 |
| **유지보수성** | 0-20점 | 코드 복잡도, 의존성 수 |
| **라이선스 적합성** | 0-20점 | MIT/Apache-2.0, 상업적 이용 가능 |
| **합계** | 0-100점 | **70점 이상만 흡수** |

### 예시: planning-with-files

```
기능 개선: +25점 (파일 → SQLite, BM25 검색 통합)
시너지: +28점 (Agents가 TODO 생성, Memory에 저장)
충돌: -5점 (agent_list 유사)
유지보수: +18점 (의존성 없음)
라이선스: +20점 (MIT)
─────────
총점: 86점 ✅ 흡수 승인
```

---

## 🛡️ Risk Management

### 5개 카테고리 리스크

#### 1. 법적 리스크

- 라이선스 위반 → MIT/Apache-2.0만, Clean Room 재구현
- Patent troll → 독자적 구현
- 저작권 침해 → "Inspired by" 명시

#### 2. 기술적 리스크

- Tool 수 폭발 → 3-Layer loading, 70점 이상만
- 복잡도 증가 → 모듈화
- 성능 저하 → 벤치마크

#### 3. UX 리스크

- API 복잡도 → Naming convention 강제
- Breaking changes → Semantic versioning
- 학습 곡선 → guide_tutorial 흡수

#### 4. 커뮤니티 리스크

- 원작자 반발 → 사전 연락, 크레딧
- "copy-cat" 이미지 → 개선점 강조
- Voting 조작 → GitHub auth

#### 5. 운영 리스크

- 유지보수 부담 → 자동화, 선별적 흡수
- 릴리즈 지연 → 2주 sprint
- 버그 증가 → 80%+ 커버리지

---

## 🏗️ Technical Architecture

### Built-in Only Architecture

```
Awesome Plugin (ONE MCP Server)
├─ Core Infrastructure
│  ├─ 3-Layer Tool Loading (95% token reduction)
│  ├─ BM25 Search Engine (0.2-0.7ms)
│  ├─ SQLite Storage (persistent data layer)
│  └─ Quality Gate System (70점 필터)
│
├─ Absorbed Features (Built-in)
│  ├─ Memory Management (claude-mem) ✅
│  ├─ Agent Orchestration (oh-my-claudecode) ✅
│  ├─ Planning (planning-with-files) ← v0.2.0
│  ├─ TDD (superpowers) ← v0.3.0
│  ├─ Specialists (agents/wshobson) ← v0.4.0
│  ├─ Guide (claude-code-guide) ← v0.5.0
│  └─ Science (claude-scientific-skills) ← v0.6.0
│
└─ Absorption Infrastructure
   ├─ QualityEvaluator (100점 평가)
   ├─ ConflictResolver (충돌 감지/해결)
   ├─ UpstreamMonitor (원본 모니터링)
   └─ VotingSystem (사용자 투표)
```

### Token Usage

```
v0.1.0: 9 tools = ~1,350 tokens
v0.2.0: 12 tools = ~1,800 tokens
v0.3.0: 16 tools = ~2,400 tokens
v0.4.0: 26 tools = ~3,900 tokens
v0.5.0: 28 tools = ~4,200 tokens
v0.6.0: 34 tools = ~5,100 tokens

여전히 95% 절감 (vs External MCP 방식)
```

---

## 📋 Implementation Roadmap

### Phase 0: Foundation (Week 1) - v0.1.1

**긴급 수정**:
- DB cleanup 버그 수정 (TypeError: database connection is not open)
- Graceful shutdown 보장

**흡수 인프라**:
- `src/absorption/quality-evaluator.ts` - 100점 평가
- `src/absorption/conflict-resolver.ts` - 충돌 감지
- `src/absorption/upstream-monitor.ts` - 원본 모니터링
- CLI `absorbed` 명령어
- CLI `vote` 명령어

**Deliverables**:
- ✅ DB 안정성 확보
- ✅ 흡수 품질 보장 시스템
- ✅ 사용자가 "흡수" 느낌

### Phase 1: planning-with-files (Week 2-3) - v0.2.0

**평가**: 86점 ✅
- 기능 개선: +25 (SQLite, BM25)
- 시너지: +28 (Agent ↔ TODO)
- 충돌: -5 (agent_list 유사)
- 유지보수: +18
- 라이선스: +20

**Tools**: 3개
- `planning_create` - TODO with dependencies
- `planning_update` - Status update
- `planning_tree` - Dependency visualization

**시너지**:
- Agents가 TODO 생성
- Memory에 TODO 저장
- BM25로 TODO 검색

### Phase 2: superpowers (Week 4-5) - v0.3.0

**평가**: 80점 ✅
- TDD workflow automation
- Planning과 통합

**Tools**: 4개
- `tdd_red`, `tdd_green`, `tdd_refactor`, `tdd_verify`

### Phase 3: agents (wshobson) (Week 6-9) - v0.4.0

**평가**: 85점+ (예상)
- 72개 중 Top 10 선별

**Tools**: 10개
- architect, frontend, backend, database, devops, security, performance, documentation, bugfix, refactor

### Phase 4: claude-code-guide (Week 10) - v0.5.0

**평가**: 92점 ✅
- Self-documenting plugin

**Tools**: 2개
- `guide_search`, `guide_tutorial`

### Phase 5: claude-scientific-skills (Week 11-13) - v0.6.0

**평가**: 75-80점 (예상)
- Python REPL integration

**Tools**: 6개
- science_setup, science_analyze, science_visualize, science_stats, science_ml, science_export

### Phase 6: Continuous Monitoring (Ongoing)

- 매달 업스트림 동기화
- 커뮤니티 관리
- 기술 부채 관리

---

## 🎨 User Experience

### CLI Commands

```bash
# 흡수 히스토리 확인
$ awesome-plugin absorbed

🧬 Absorption History

✅ claude-mem (v0.1.0 - 2025-01-28)
   Memory management with BM25 semantic search
   4 tools absorbed

✅ oh-my-claudecode (v0.1.0 - 2025-01-28)
   Multi-agent orchestration
   5 tools absorbed

📊 Total: 2 projects absorbed, 9 tools available
⏳ Next: planning-with-files (scheduled Feb 2025)

# 다음 흡수 투표
$ awesome-plugin vote planning-with-files

✅ Voted for "planning-with-files"!

📊 Next Absorption Vote:
  1. planning-with-files (156 votes) ← You voted
  2. superpowers (89 votes)
  3. agents (67 votes)
```

### Release Notes Template

```markdown
# v0.2.0 (2025-02-15)

## 🧬 ABSORBED: planning-with-files

We've absorbed the excellent TODO tracking concept from @OthmanAdi!

**Inspired by**: [planning-with-files](https://github.com/OthmanAdi/planning-with-files) (MIT License)

**Quality Score**: 86/100
- Function improvement: +25 (File → SQLite)
- Synergy: +28 (Agent ↔ TODO ↔ Memory)
- No conflicts: Resolved with `planning_*` namespace

**New Tools**:
- `planning_create` - Create tasks with dependencies
- `planning_update` - Update status
- `planning_tree` - Visualize dependency tree

**Synergies**:
```typescript
// Agents can create TODOs
agent_spawn({ type: 'architect', task: 'Design API' })
  → Auto-creates planning_create({ content: 'Design API' })

// Memory stores TODOs
memory_save({ key: 'current_todos', value: planning_tree() })

// BM25 searches TODOs
planning_search('authentication tasks')
```

**Total Absorbed**: 3 projects, 12 tools

🙏 **Credits**: @OthmanAdi
🎨 **Our improvements**: SQLite, BM25, Agent integration
```

---

## 🚫 What We Don't Do

### vs MCP Gateway

- ❌ External MCP 서버 연결 (토큰 폭발)
- ❌ GitHub 자동 발견
- ❌ npm install 플러그인

### vs Copy-Cat

- ❌ 코드 그냥 복사
- ❌ 아무거나 흡수 (70점 미만 거부)
- ❌ 충돌 방치

### vs Anthropic Skills Competition

- ❌ Skills 대체제 주장
- ❌ Marketplace 경쟁
- ❌ Claude.ai 통합 시도

---

## ✅ What We Do

### Core Competencies

1. **Stateful Execution Layer**
   - SQLite persistence (Skills는 stateless)
   - BM25 semantic search
   - Long-running async tasks

2. **Cross-Feature Integration**
   - Memory ↔ Agent ↔ Planning ↔ TDD
   - Synergy verification (30점 배점)
   - Unified data layer

3. **Quality-Driven Absorption**
   - 100점 평가 시스템
   - Conflict resolution (Merge > Namespace > Deprecate)
   - Upstream sync (매달 체크)

4. **Community Collaboration**
   - Original author credits
   - PR contributions
   - Voting system

---

## 🎯 Differentiation

### vs Anthropic Skills

| Feature | Anthropic Skills | awesome-plugin |
|---------|------------------|----------------|
| Type | Prompt-based | Tool-based (executable) |
| Data | Stateless | **Stateful (SQLite)** |
| Integration | Independent | **Cross-feature** |
| Execution | Immediate | **Long-running** |
| Evolution | Static | **Continuous absorption** |
| Quality | No verification | **70+ score required** |

### vs oh-my-claudecode

| Feature | oh-my-claudecode | awesome-plugin |
|---------|------------------|----------------|
| Total | 31 skills (fixed) | 28+ tools (growing) |
| Quality | Good | **Quality-verified (70+)** |
| Evolution | Static | **Absorption engine** |
| User input | None | **Voting system** |
| Upstream | No sync | **Monthly monitoring** |

### Unique Value

```
Anthropic Skills (What) + awesome-plugin (How + Data)
══════════════════════════════════════════════════════

Example: "데이터를 분석하고 보고서 작성"

Skills says:
  "분석하세요, 보고서 작성하세요"

awesome-plugin does:
  1. agent_spawn({ type: 'researcher' }) → 실제 분석 실행
  2. memory_save({ key: 'report' }) → 영구 저장
  3. planning_create({ task: 'review report' }) → TODO 생성
  4. 다음 실행 시 memory_recall로 재사용 가능

Result: Skills는 휘발성, 우리는 영구적 + 통합적
```

---

## 📊 Success Criteria (Final)

### Technical Metrics

| Metric | Current (v0.1.0) | Target (v0.6.0) | Status |
|--------|------------------|-----------------|--------|
| Token reduction | 95% | 95% | ✅ |
| BM25 search | 0.2-0.7ms | <0.5ms | ✅ |
| Absorbed projects | 2/8 | 6/8 | ⏳ |
| Total tools | 9 | 28+ | ⏳ |
| Test coverage | 70% | 85%+ | ⏳ |
| Quality score avg | N/A | 85+ | 🆕 |
| Upstream sync | None | Monthly | 🆕 |
| Zero conflicts | N/A | 100% | 🆕 |

### Quality Gates (Every Absorption)

**필수**:
- [ ] Quality score ≥ 70점
- [ ] Conflict resolution approved
- [ ] Test coverage ≥ 80%
- [ ] Performance regression < 10%
- [ ] License verified
- [ ] Original author contacted
- [ ] Documentation complete

**권장**:
- [ ] Synergy demonstration
- [ ] User voting > 50 votes
- [ ] Upstream contribution

### User Experience Goals

- [ ] Absorption visible in every release
- [ ] Voting drives roadmap
- [ ] Continuous growth feeling
- [ ] Better than oh-my-claudecode (quality)
- [ ] Zero forced dependencies
- [ ] Seamless integration
- [ ] Good community relationship

---

## 🚀 Go-to-Market Strategy

### Target Users

1. **Power Users**: Claude Code + MCP 사용자
2. **Developers**: Stateful execution 필요
3. **Teams**: Cross-feature integration 필요
4. **Data Scientists**: Scientific tools 필요

### Distribution

1. **GitHub**: Open source (MIT License)
2. **npm**: `npm install -g awesome-plugin`
3. **Docs**: Comprehensive documentation
4. **Community**: Discord, Reddit

### Messaging

**Primary**: "The Absorption Engine for Claude Code"

**Secondary**:
- "70점 이상만 흡수하는 품질 보장"
- "Stateful execution layer for Anthropic Skills"
- "One plugin, growing capabilities"

---

## 📝 Appendix

### Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Database**: SQLite (better-sqlite3)
- **Search**: BM25 (okapibm25)
- **Protocol**: MCP SDK
- **Testing**: Jest/Vitest
- **CI/CD**: GitHub Actions

### Key Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "better-sqlite3": "^11.0.0",
  "okapibm25": "^1.0.0",
  "commander": "^12.0.0"
}
```

### License

MIT License (allows commercial use, modification, distribution)

### Credits

**Inspired by** (features reimplemented):
- claude-mem (Memory management)
- oh-my-claudecode (Multi-agent)
- planning-with-files (TODO tracking)
- superpowers (TDD workflow)
- agents (wshobson) (Specialist agents)
- claude-code-guide (Documentation)
- claude-scientific-skills (Scientific research)

**Original authors**: Full credits in README and release notes

---

## 🎯 Next Steps

**Immediate (Phase 0)**:
1. Fix DB cleanup bug
2. Build absorption infrastructure
3. Add CLI commands (`absorbed`, `vote`)

**Short-term (Phase 1-2)**:
1. Absorb planning-with-files (86점)
2. Absorb superpowers (80점)
3. Release v0.2.0, v0.3.0

**Long-term (Phase 3-6)**:
1. Complete 6 absorptions
2. Establish monthly sync
3. Build community

---

**"좋은게 있으면 흡수한다. 하지만 아무거나 먹지 않는다. 70점 이상만, 충돌 없이, 시너지 내면서, 원작자 존중하며 흡수한다."**

**This is our identity. This is awesome-plugin.**

---

**End of PRD v1.0**
