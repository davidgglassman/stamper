# Complete Publishing & Maintenance Guide for Stamper CLI

This comprehensive guide covers the entire lifecycle of publishing and maintaining the Stamper CLI npm package.

## Table of Contents
- [Initial Setup & Publishing](#initial-setup--publishing)
- [Local Development with Yalc](#local-development-with-yalc)
- [Publishing Updates](#publishing-updates)
- [Version Management](#version-management)
- [Testing Before Publishing](#testing-before-publishing)
- [Troubleshooting](#troubleshooting)

## Initial Setup & Publishing

### 1. Prepare for First Publish

```bash
# Ensure you're logged into npm
npm whoami
# If not logged in:
npm login

# Verify package name is available
npm search stamper-cli
# Check if the exact name is taken on npmjs.com
```

### 2. Pre-publish Checklist

```bash
# Clean build
npm run clean
npm run build

# Run all checks
npm run build  # This runs eslint + tsc
npm audit

# Test locally with yalc first
yalc publish
# (See Local Development section below)
```

### 3. Initial Publish

```bash
# For first publish, you might want to start with a beta
npm publish --tag beta

# Or publish normally
npm publish

# Check it worked
npm view stamper-cli
```

### 4. Set up npm create Support

The package is configured for direct npx usage:
- Package name: `stamper-cli`
- Bin configuration in package.json
- Auto-run create command when no arguments provided

Users can now run:
```bash
npx stamper-cli
# or install globally
npm install -g stamper-cli
stamper-cli
```

## Local Development with Yalc

Yalc allows you to test your package locally without publishing to npm.

### 1. Initial Yalc Setup

```bash
# Install yalc globally (one-time setup)
npm install -g yalc

# In your stamper project root
npm run build
yalc publish
```

### 2. Test in a New Project

```bash
# Create a test project anywhere
mkdir ~/test-stamper-project
cd ~/test-stamper-project
npm init -y

# Install from yalc
yalc add stamper-cli
npm install

# Test the commands
npx stamper-cli --help
npx stamper-cli list
npx stamper-cli create
```

### 3. Development Workflow

When making changes to stamper:

```bash
# 1. Make your code changes in src/
# 2. Rebuild and republish to yalc
npm run build
yalc publish

# 3. Update in your test project
cd ~/test-stamper-project
yalc update stamper-cli

# 4. Test your changes
npx stamper-cli list
# etc.
```

### 4. Test npx Mode

```bash
# From stamper project root
node bin/index.js

# This simulates: npx stamper-cli
```

### 5. Clean up Yalc

```bash
# Remove from test project
cd ~/test-stamper-project
yalc remove stamper-cli

# Remove from yalc store
yalc installations clean stamper-cli
```

## Publishing Updates

### 1. Version Bump Process

```bash
# Check current version
npm version

# Bump version (automatically updates package.json and creates git tag)
npm version patch    # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor    # 1.0.0 -> 1.1.0 (new features)
npm version major    # 1.0.0 -> 2.0.0 (breaking changes)

# Or set specific version
npm version 1.2.3
```

### 2. Pre-publish Testing

```bash
# Always test with yalc first
npm run build
yalc publish

# Test in a separate project
cd ~/test-stamper-project
yalc update stamper-cli
npx stamper-cli --version  # Should show new version
npx stamper-cli create     # Test functionality
```

### 3. Publish Update

```bash
# From stamper project root
npm publish

# For beta versions
npm publish --tag beta

# Check it published correctly
npm view stamper-cli version
npm view stamper-cli dist-tags
```

### 4. Post-publish Verification

```bash
# Test the published version
npx stamper-cli@latest

# Or in a fresh directory
mkdir ~/test-published-stamper
cd ~/test-published-stamper
npm init -y
npm install -g stamper-cli
stamper-cli --version
stamper-cli list
```

## Version Management

### Semantic Versioning Strategy

- **Patch (1.0.X)**: Bug fixes, documentation updates, internal refactoring
- **Minor (1.X.0)**: New features, new question types, new commands, template improvements
- **Major (X.0.0)**: Breaking changes, CLI API changes, config format changes

### Version Examples

```bash
# Bug fix: Fixed template processing error
npm version patch

# New feature: Added new question type
npm version minor

# Breaking change: Changed CLI command structure
npm version major
```

### Git Integration

```bash
# npm version automatically creates git tags
npm version minor  # Creates tag like v1.1.0

# Push tags to remote
git push origin main --tags

# Create GitHub release from tag
gh release create v1.1.0 --generate-notes
```

## Testing Before Publishing

### 1. Comprehensive Local Testing

```bash
# Test all major workflows with yalc
npm run build
yalc publish

# Test 1: npx simulation
node bin/index.js

# Test 2: Normal CLI usage
cd ~/test-project
yalc add stamper-cli && npm install
npx stamper-cli setup
npx stamper-cli list
npx stamper-cli create

# Test 3: All commands
npx stamper-cli add test-template https://github.com/user/template
npx stamper-cli list
npx stamper-cli remove test-template
npx stamper-cli org
```

### 2. Test Template Processing

```bash
# Use existing test templates
npx stamper-cli create
# Select react template and verify:
# - Questions are asked correctly
# - Files are processed with Nunjucks
# - Git repo is initialized (if chosen)
# - Next steps are shown
```

### 3. Test Edge Cases

```bash
# Test with no templates
npx stamper-cli list

# Test with invalid URLs
npx stamper-cli add bad-template invalid-url

# Test interrupted creation
npx stamper-cli create
# Press Ctrl+C during template selection

# Test permissions
npx stamper-cli create --output-dir /read-only-directory
```

## Troubleshooting

### Common Issues & Solutions

#### "Package not found" after publish
```bash
# Check npm registry
npm view stamper-cli

# Clear npm cache
npm cache clean --force

# Check if you're logged into correct registry
npm config get registry
```

#### Yalc not updating
```bash
# Force update
yalc remove stamper-cli
yalc add stamper-cli
npm install

# Or rebuild yalc store
yalc installations clean
yalc publish
```

#### Line ending issues (Windows/WSL)
```bash
# Fix before publishing
sed -i 's/\r$//' bin/index.js
npm run build
```

#### ESLint errors during build
```bash
# Check ignored paths in eslint.config.js
# Should include: test-project/**, dist/**, node_modules/**
```

### Development Environment Issues

#### VS Code on Windows/WSL
- Set `"files.eol": "\n"` in VS Code settings
- Use `git config core.autocrlf false` in the repo

#### Node version compatibility
- Test with Node 18, 20, and latest LTS
- Use `engines` field in package.json

### Publishing Failures

#### Authentication issues
```bash
npm logout
npm login
npm publish
```

#### Package name conflicts
```bash
npm search stamper
# If conflicts exist, consider scoped package: @yourname/stamper-cli
```

## Maintenance Schedule

### Regular Tasks

**Before each release:**
1. Update dependencies: `npm update`
2. Run security audit: `npm audit fix`
3. Test with yalc thoroughly
4. Update CHANGELOG.md
5. Test on multiple Node versions

**Monthly:**
1. Check for dependency updates
2. Review GitHub issues and PRs
3. Update documentation if needed
4. Test with latest Node.js LTS

**Before major releases:**
1. Update README with any new features
2. Test backwards compatibility
3. Update migration guides if needed
4. Consider beta release first

## Quick Reference Commands

```bash
# Development cycle
npm run build && yalc publish
cd ~/test-project && yalc update stamper-cli

# Publish cycle
npm version patch && npm publish

# Testing
node bin/index.js
npx stamper-cli create

# Cleanup
yalc remove stamper-cli
npm cache clean --force
```