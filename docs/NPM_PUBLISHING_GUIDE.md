# npm Publishing Guide for v2.0.0

## Pre-Publishing Checklist

✅ **All checks passed:**

- [x] Version updated to 2.0.0 in package.json
- [x] CHANGELOG.md updated with v2.0.0 release notes
- [x] README.md updated with architecture changes
- [x] ARCHITECTURE.md created
- [x] Git tag v2.0.0 created
- [x] Build successful: `npm run build`
- [x] All tests passing: `npm test` (327/327)
- [x] Dry-run successful: `npm pack --dry-run`

## Package Contents

```
awesome-plugin@2.0.0.tgz (354.8 KB)
├── dist/               # Built TypeScript files
│   ├── cli.mjs        # CLI executable
│   ├── index.mjs      # Library entry point
│   ├── *.d.mts        # TypeScript declarations
│   └── *.map          # Source maps
├── skills/             # Claude Code skill files (7 files)
│   ├── awesome-memory.md
│   ├── awesome-agents.md
│   ├── awesome-planning.md
│   ├── awesome-tdd.md
│   ├── awesome-guide.md
│   ├── awesome-science.md
│   └── awesome-specialists.md
├── README.md           # Project documentation
├── LICENSE             # MIT License
└── package.json        # Package metadata
```

## Publishing Steps

### 1. Verify npm credentials

```bash
npm whoami
# Should show your npm username
```

### 2. Final verification

```bash
# Build one more time
npm run build

# Run tests
npm test

# Check package contents
npm pack --dry-run
```

### 3. Publish to npm

```bash
# Publish to npm registry
npm publish

# Or publish with public access if scoped package
npm publish --access public
```

### 4. Push git tags

```bash
# Push commits
git push origin main

# Push tag
git push origin v2.0.0
```

### 5. Create GitHub Release

1. Go to: https://github.com/yourusername/awesome-plugin/releases/new
2. Select tag: v2.0.0
3. Use content from RELEASE_NOTES_v2.0.0.md
4. Mark as "Latest release"
5. Publish release

## Post-Publishing

### Verify installation

```bash
# Install globally
npm install -g awesome-plugin

# Verify version
awesome-plugin --version
# Should show: 2.0.0

# Test CLI
awesome-plugin discover mcp-server

# Install skills
awesome-plugin install-skills
```

### Update documentation

- [ ] Update repository URL in package.json if needed
- [ ] Announce release on social media / forums
- [ ] Update any related documentation sites

## Rollback (if needed)

```bash
# Deprecate version
npm deprecate awesome-plugin@2.0.0 "Reason for deprecation"

# Unpublish (only within 72 hours)
npm unpublish awesome-plugin@2.0.0
```

## Notes

- npm registry: https://www.npmjs.com/package/awesome-plugin
- Published versions cannot be modified
- Unpublish only available for 72 hours
- Major version bumps should be well-tested

## Support

For issues with the package:
- GitHub Issues: https://github.com/yourusername/awesome-plugin/issues
- npm package: https://www.npmjs.com/package/awesome-plugin
