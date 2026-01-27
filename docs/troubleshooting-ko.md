# 문제 해결 가이드

Awesome MCP Meta Plugin의 일반적인 문제와 해결 방법입니다.

전체 영문 가이드: [troubleshooting.md](troubleshooting.md)

## 주요 문제 빠른 링크

- [설치 문제](#설치-문제)
- [MCP 서버 연결 문제](#mcp-서버-연결-문제)
- [검색 문제](#검색-문제)
- [Claude Desktop 통합 문제](#claude-desktop-통합-문제)

---

## 설치 문제

### 오류: Cannot find module '@modelcontextprotocol/sdk'

**원인:** 의존성이 설치되지 않음.

**해결:**
```bash
npm install
npm run build
```

### TypeScript 컴파일 실패

**해결:**
```bash
npm install typescript@^5.7 --save-dev
npm run typecheck
npm run build
```

---

## MCP 서버 연결 문제

### 오류: "Tool not found: read_file"

**원인:** MCP 서버가 연결되지 않았거나 도구가 등록되지 않음.

**해결:**

1. 서버 연결 확인:
```typescript
const stats = gateway.getStatistics();
console.log('연결된 서버:', stats.connectedServers);
console.log('전체 도구:', stats.totalTools);
```

2. 서버 명령어 확인:
```bash
npx -y @modelcontextprotocol/server-filesystem /path/to/directory
```

### 오류: "MCP server not connected: filesystem"

**해결:** 절대 경로 사용

```typescript
await gateway.connectToServer({
  id: 'filesystem',
  name: 'Filesystem',
  command: '/usr/local/bin/node',
  args: ['/absolute/path/to/server/index.js', '/absolute/path/to/dir'],
});
```

---

## 검색 문제

### 검색 결과가 없음

**해결:** 더 넓은 검색어 사용

```typescript
// 너무 구체적 (X)
await gateway.searchTools('read_file_from_filesystem');

// 더 나음 (O)
await gateway.searchTools('read file');

// 가장 좋음 (O)
await gateway.searchTools('file');
```

### 검색이 느림 (>1ms)

**해결:** maxLayer2Tools 줄이기

```typescript
const gateway = new AwesomePluginGateway({
  maxLayer2Tools: 10,  // 기본값 15에서 줄임
});
```

---

## GitHub Discovery 문제

### 오류: GitHub API 요청 한도 초과

**해결:** GitHub 토큰 사용 (60 → 5000 요청/시간)

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

또는:
```typescript
const explorer = new GitHubExplorer({
  githubToken: 'ghp_your_token_here',
});
```

---

## Claude Desktop 통합 문제

### Claude에서 도구가 표시되지 않음

**해결 순서:**

1. **설정 파일 위치 확인**
```bash
# macOS
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
type %APPDATA%\Claude\claude_desktop_config.json
```

2. **JSON 문법 확인** (쉼표, 따옴표, 중괄호)

3. **Claude Desktop 완전 재시작**

4. **로그 확인**
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log
```

### 오류: "spawn ENOENT"

**해결:** 절대 경로 사용

```json
{
  "mcpServers": {
    "awesome-plugin": {
      "command": "/usr/local/bin/node",
      "args": ["/Users/you/awesome-pulgin/dist/index.mjs"]
    }
  }
}
```

경로 찾기:
```bash
which node   # node 경로
pwd         # 현재 디렉토리 경로
```

---

## 데이터베이스 문제

### 오류: "database is locked"

**해결:** 다른 데이터베이스 파일 사용 또는 인메모리 모드

```typescript
// 옵션 1: 다른 파일
const gateway = new AwesomePluginGateway({
  dbPath: './data/gateway1.db',
});

// 옵션 2: 인메모리
const gateway = new AwesomePluginGateway({
  dbPath: ':memory:',
});
```

---

## 디버그 모드

문제 진단을 위한 디버그 로깅:

```bash
export DEBUG=awesome-plugin:*
node your-script.js
```

또는:
```bash
export NODE_ENV=development
node your-script.js
```

---

## 도움 받기

### 이슈 보고 전 확인사항

1. [기존 이슈](https://github.com/yourusername/awesome-plugin/issues) 검색
2. [FAQ](faq-ko.md) 확인
3. 디버그 모드로 로그 수집

### 이슈 작성 시 포함할 내용

```bash
# 환경 정보
node --version
npm --version
uname -a  # 또는 Windows에서 ver
```

- 전체 오류 메시지
- 최소 재현 코드
- 설정 파일 (토큰 제거)
- 디버그 로그

---

## 자주 발생하는 오류 참조표

| 오류 메시지 | 원인 | 해결 |
|------------|------|------|
| Cannot find module | 의존성 누락 | `npm install` |
| spawn ENOENT | 명령어를 찾을 수 없음 | 절대 경로 사용 |
| database is locked | 다중 프로세스 접근 | 별도 DB 사용 |
| API rate limit | GitHub 요청 한도 | GITHUB_TOKEN 추가 |
| Tool not found | 서버 미연결 | `getStatistics()` 확인 |

---

**더 자세한 내용은 [영문 트러블슈팅 가이드](troubleshooting.md)를 참조하세요.**
