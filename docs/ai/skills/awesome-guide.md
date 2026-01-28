---
name: awesome-guide
description: Interactive tutorial and guide system
triggers:
  - guide
  - tutorial
  - learn
  - help
---

# Awesome Guide

Interactive tutorial and guide system for learning and onboarding.

## When to Use
- Search for guides and tutorials
- Follow interactive learning paths
- Get step-by-step instructions

## Commands

### Search Guides
```bash
npx awesome-plugin guide search "<query>" --category <cat> --difficulty <level> --limit 10 [--json]
```
Difficulty levels: `beginner`, `intermediate`, `advanced`

### Interactive Tutorial
```bash
npx awesome-plugin guide tutorial <action> --guide-id <id> [--json]
```
Tutorial actions: `start`, `next`, `previous`, `hint`, `check`, `status`, `complete`, `reset`

## Examples

### Example 1: Search Beginner Guides
```bash
npx awesome-plugin guide search "getting started" --difficulty beginner --limit 5
```

### Example 2: Start Interactive Tutorial
```bash
npx awesome-plugin guide tutorial start --guide-id intro-claude-code
```

### Example 3: Follow Tutorial Steps
```bash
npx awesome-plugin guide tutorial next --guide-id intro-claude-code
npx awesome-plugin guide tutorial hint --guide-id intro-claude-code
npx awesome-plugin guide tutorial check --guide-id intro-claude-code
npx awesome-plugin guide tutorial complete --guide-id intro-claude-code
```
