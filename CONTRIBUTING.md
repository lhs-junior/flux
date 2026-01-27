# Contributing to Awesome MCP Meta Plugin

Thank you for your interest in contributing to Awesome MCP Meta Plugin! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

## 🤝 Code of Conduct

This project follows a Code of Conduct to ensure a welcoming environment for all contributors. Please:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 7.0.0 or higher
- **Git** 2.0.0 or higher
- Basic knowledge of TypeScript and MCP protocol

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/awesome-pulgin.git
cd awesome-pulgin
```

3. Add the original repository as upstream:

```bash
git remote add upstream https://github.com/yourusername/awesome-pulgin.git
```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

This will compile TypeScript files to `dist/` directory.

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Run type checking
npm run typecheck
```

### 4. Development Mode

```bash
# Watch mode (auto-rebuild on changes)
npm run dev
```

## 📂 Project Structure

```
awesome-pulgin/
├── src/
│   ├── core/               # Core gateway and MCP client
│   │   ├── gateway.ts      # Main MCP gateway
│   │   ├── mcp-client.ts   # MCP server client
│   │   ├── session-manager.ts
│   │   └── tool-loader.ts  # 3-layer tool loading
│   ├── search/             # Search and classification
│   │   ├── bm25-indexer.ts # BM25 search engine
│   │   └── query-processor.ts
│   ├── storage/            # Data persistence
│   │   └── metadata-store.ts
│   ├── discovery/          # Plugin discovery
│   │   ├── github-explorer.ts
│   │   ├── quality-evaluator.ts
│   │   └── plugin-installer.ts
│   ├── cli.ts              # CLI interface
│   └── index.ts            # Main exports
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── docs/                   # Documentation
└── examples/               # Example code
```

## 🎨 Code Style

### TypeScript Guidelines

1. **Strict Mode**: All code must pass TypeScript strict mode checks
2. **Type Safety**: Avoid `any` type; use specific types or `unknown`
3. **Naming Conventions**:
   - Classes: `PascalCase`
   - Functions/variables: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`
   - Interfaces: `PascalCase` (no `I` prefix)
   - Private members: prefix with `private` keyword

### ESLint Rules

Follow the project's ESLint configuration:

```bash
npm run lint        # Check for issues
npm run lint -- --fix  # Auto-fix issues
```

Key rules:
- No unused variables (except those prefixed with `_`)
- Prefer `const` over `let`
- Use arrow functions for callbacks
- Semicolons required
- Single quotes for strings

### Code Comments

- Add JSDoc comments for all public classes and methods
- Use inline comments for complex logic
- Keep comments up-to-date with code changes

Example:
```typescript
/**
 * Search for tools using BM25 algorithm
 * @param query - Search query string
 * @param options - Search options
 * @returns Array of matching tools sorted by relevance
 */
async searchTools(query: string, options?: SearchOptions): Promise<ToolMetadata[]> {
  // Implementation
}
```

## 🧪 Testing

### Test Requirements

- All new features must include tests
- Bug fixes should include regression tests
- Maintain minimum 80% test coverage
- Tests must pass before submitting PR

### Test Types

1. **Unit Tests** (`tests/unit/`):
   - Test individual components in isolation
   - Mock external dependencies
   - Fast execution (<100ms per test)

2. **Integration Tests** (`tests/integration/`):
   - Test interaction between components
   - May use real SQLite database
   - Moderate execution time (<1s per test)

3. **E2E Tests** (`tests/e2e/`):
   - Test complete workflows
   - May connect to real MCP servers
   - Longer execution time (<10s per test)

### Writing Tests

Use Vitest for testing:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BM25Indexer } from '../src/search/bm25-indexer.js';

describe('BM25Indexer', () => {
  let indexer: BM25Indexer;

  beforeEach(() => {
    indexer = new BM25Indexer();
  });

  it('should index tools correctly', () => {
    indexer.addDocument({ name: 'read_file', description: 'Read a file' });
    const results = indexer.search('read file');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('read_file');
  });
});
```

### Running Specific Tests

```bash
# Run specific test file
npx vitest tests/unit/bm25-indexer.test.ts

# Run tests matching pattern
npx vitest --grep "BM25"
```

## 📬 Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `test/` - Test additions/changes
- `refactor/` - Code refactoring

### 2. Make Your Changes

- Write clean, maintainable code
- Add tests for new functionality
- Update documentation as needed
- Follow code style guidelines

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature"
```

See [Commit Message Guidelines](#commit-message-guidelines) below.

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template:
   - **Description**: What does this PR do?
   - **Motivation**: Why is this change needed?
   - **Testing**: How did you test this?
   - **Screenshots**: If applicable
   - **Related Issues**: Link to related issues

### 6. Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged

## 📝 Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(search): add BM25 search algorithm

Implement Okapi BM25 algorithm for tool ranking.
Includes document frequency calculation and relevance scoring.

Closes #123

fix(gateway): handle connection errors gracefully

Add retry logic and error callbacks for MCP server connections.

docs: update API reference with new methods

test(indexer): add tests for edge cases
```

### Rules

- Use imperative mood ("add" not "added" or "adds")
- First line ≤ 72 characters
- Reference issues in footer (e.g., "Closes #123")
- Explain what and why, not how

## 📚 Documentation

### When to Update Documentation

- Adding new public API
- Changing existing behavior
- Adding new features
- Fixing bugs that affect usage

### Documentation Locations

- **API Reference**: `docs/api-reference.md`
- **Examples**: `docs/examples/`
- **README**: `README.md`
- **Code Comments**: JSDoc in source files

### Documentation Guidelines

- Use clear, concise language
- Include code examples
- Keep examples up-to-date
- Add links to related documentation

## 🐛 Reporting Issues

### Before Reporting

1. Search existing issues
2. Check [FAQ](docs/faq.md)
3. Read [Troubleshooting Guide](docs/troubleshooting.md)

### Issue Template

Include:
- **Description**: Clear description of the issue
- **Steps to Reproduce**: Minimal reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**:
  - Node.js version
  - OS and version
  - Package version
- **Additional Context**: Logs, screenshots, etc.

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed

## 🎯 Areas for Contribution

### High Priority

- Additional unit tests for edge cases
- Performance optimizations
- Documentation improvements
- Bug fixes

### Feature Ideas

- Additional MCP server integrations
- Web UI for plugin management
- Enhanced query processing
- Docker support
- CI/CD pipeline improvements

### Documentation Needs

- More usage examples
- Video tutorials
- API reference expansion
- Translation to other languages

## 💡 Development Tips

### Debugging

Enable debug mode:
```bash
export DEBUG=awesome-plugin:*
node your-script.js
```

### Testing Against Local MCP Servers

```bash
# Terminal 1: Start your MCP server
node your-mcp-server.js

# Terminal 2: Run gateway with test config
node dist/cli.mjs start
```

### Database Inspection

```bash
# Open SQLite database
sqlite3 ./data/plugins.db

# View tables
.tables

# Query tools
SELECT * FROM tools;
```

## 🙏 Recognition

Contributors will be:
- Listed in release notes
- Added to GitHub contributors page
- Mentioned in project documentation (for significant contributions)

## 📧 Getting Help

- **GitHub Discussions**: For questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Check [docs/](docs/) directory

Thank you for contributing to Awesome MCP Meta Plugin! 🚀
