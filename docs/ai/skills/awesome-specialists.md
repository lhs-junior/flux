---
name: awesome-specialists
description: Specialized agent types for focused tasks
triggers:
  - specialist
  - architect
  - frontend
  - backend
  - devops
  - security
---

# Awesome Specialists

Specialized agent types with domain expertise for focused task execution.

## When to Use
- Need domain-specific expertise
- Complex specialized tasks
- High-quality focused work

## Specialist Types

### Architect
**Capabilities:** System design, architectural patterns, scalability planning
**Best For:** Designing system architecture, reviewing technical decisions, planning for scale
```bash
npx awesome-plugin agent spawn architect "Design microservices architecture for payment system"
```

### Frontend
**Capabilities:** UI/UX implementation, React/Vue development, CSS styling, accessibility
**Best For:** Building user interfaces, responsive design, component architecture
```bash
npx awesome-plugin agent spawn frontend "Build responsive dashboard with dark mode"
```

### Backend
**Capabilities:** API development, service layer design, business logic implementation
**Best For:** REST/GraphQL APIs, data processing, service orchestration
```bash
npx awesome-plugin agent spawn backend "Implement user authentication service"
```

### Database
**Capabilities:** Schema design, query optimization, indexing strategies
**Best For:** Database modeling, performance tuning, migration planning
```bash
npx awesome-plugin agent spawn database "Optimize slow queries in orders table"
```

### DevOps
**Capabilities:** CI/CD pipelines, deployment automation, infrastructure as code
**Best For:** Build automation, container orchestration, cloud infrastructure
```bash
npx awesome-plugin agent spawn devops "Setup CI/CD pipeline for Node.js app"
```

### Security
**Capabilities:** Security audits, vulnerability assessment, hardening strategies
**Best For:** Code security review, penetration testing, compliance checks
```bash
npx awesome-plugin agent spawn security "Audit authentication and authorization flow"
```

### Performance
**Capabilities:** Performance profiling, optimization techniques, caching strategies
**Best For:** Bottleneck identification, load testing, resource optimization
```bash
npx awesome-plugin agent spawn performance "Optimize API response times under load"
```

### Documentation
**Capabilities:** Technical writing, API documentation, user guides
**Best For:** README files, API references, architecture documentation
```bash
npx awesome-plugin agent spawn documentation "Document REST API endpoints"
```

### Bugfix
**Capabilities:** Debugging, root cause analysis, issue resolution
**Best For:** Investigating bugs, fixing defects, troubleshooting errors
```bash
npx awesome-plugin agent spawn bugfix "Debug memory leak in worker process"
```

### Refactor
**Capabilities:** Code improvement, design patterns, maintainability enhancements
**Best For:** Code cleanup, pattern implementation, technical debt reduction
```bash
npx awesome-plugin agent spawn refactor "Refactor user service to use repository pattern"
```

### Testing
**Capabilities:** Test strategy design, coverage improvement, test automation
**Best For:** Unit/integration tests, E2E testing, test infrastructure
```bash
npx awesome-plugin agent spawn testing "Add unit tests for payment module"
```

### Code-Review
**Capabilities:** Code review guidelines, feedback generation, quality assessment
**Best For:** Pull request reviews, code quality checks, best practice enforcement
```bash
npx awesome-plugin agent spawn code-review "Review authentication implementation PR"
```

### Integration
**Capabilities:** System integration, API connectivity, third-party service integration
**Best For:** Connecting systems, API client implementation, webhook handling
```bash
npx awesome-plugin agent spawn integration "Integrate Stripe payment gateway"
```

### API-Design
**Capabilities:** REST/GraphQL design, API versioning, contract definition
**Best For:** API specification, endpoint design, schema definition
```bash
npx awesome-plugin agent spawn api-design "Design REST API for inventory system"
```

## Usage Patterns

### Single Specialist
```bash
npx awesome-plugin agent spawn security "Audit authentication flow"
```

### With Integration
```bash
npx awesome-plugin agent spawn frontend "Build dashboard" --create-todo --save-to-memory
```

### Multiple Specialists
```bash
# Design first, then implement
npx awesome-plugin agent spawn architect "Design payment system"
npx awesome-plugin agent spawn backend "Implement payment API"
npx awesome-plugin agent spawn testing "Add payment tests"
```

## Examples

### Full-Stack Feature
```bash
# Design and architecture
npx awesome-plugin agent spawn architect "Design user profile system"

# Implementation
npx awesome-plugin agent spawn backend "Implement profile API endpoints"
npx awesome-plugin agent spawn frontend "Build profile UI components"

# Quality assurance
npx awesome-plugin agent spawn testing "Add profile feature tests"
npx awesome-plugin agent spawn security "Audit profile security"
```

### Performance Optimization
```bash
# Identify and fix
npx awesome-plugin agent spawn performance "Profile slow dashboard load"
npx awesome-plugin agent spawn database "Optimize dashboard queries"
npx awesome-plugin agent spawn frontend "Reduce bundle size"
```

### Code Quality Improvement
```bash
# Review and improve
npx awesome-plugin agent spawn code-review "Review user module implementation"
npx awesome-plugin agent spawn refactor "Apply review feedback to user module"
npx awesome-plugin agent spawn testing "Increase user module test coverage"
```
