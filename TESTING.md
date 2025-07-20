# Local Testing Guide for Stamper CLI

This guide shows how to test the Stamper CLI npm package locally using yalc.

## Setup for Local Testing

1. **Install yalc globally** (if not already installed):
   ```bash
   npm install -g yalc
   ```

2. **Build and publish to yalc** from the stamper project root:
   ```bash
   npm run build
   yalc publish
   ```

## Testing the Package

### Test 1: Direct Installation
```bash
# Create a test directory
mkdir test-stamper
cd test-stamper
npm init -y

# Install from yalc
yalc add stamper-cli
npm install

# Test the command
npx stamper-cli --help
npx stamper-cli list
```

### Test 2: Simulate npx workflow
```bash
# From the stamper project root
node bin/index.js
```

This simulates what happens when users run `npx stamper-cli`.

### Test 3: Global Installation Simulation
```bash
# Link globally from yalc
yalc publish
npm install -g $(yalc dir)/stamper-cli

# Test global command
stamper-cli --help
stamper-cli list
```

## Updating Local Changes

When you make changes to the stamper source code:

1. **Rebuild and republish**:
   ```bash
   npm run build
   yalc publish
   ```

2. **Update in test projects**:
   ```bash
   cd your-test-project
   yalc update
   ```

## Key Test Commands

- `stamper-cli --help` - Should show all commands
- `stamper-cli list` - Should show organization and user templates
- `stamper-cli create` - Should start interactive template selection
- `node bin/index.js` - Should auto-run create mode

## Expected Behaviors

### npx mode (no arguments):
- Shows welcome message
- Detects first-time setup
- Automatically runs create command
- Shows template selection

### Normal CLI mode (with arguments):
- Runs specific commands as requested
- All commands work as documented

## Troubleshooting

### "stamper-cli: not found" with npx
- Ensure `npm install` was run after `yalc add`
- Check that `node_modules/.bin/stamper-cli` symlink exists

### Line ending issues (WSL/Windows)
- Check that `bin/index.js` has Unix line endings
- Run `sed -i 's/\r$//' bin/index.js` if needed

### ESLint errors during build
- Ensure test directories are in eslint ignore patterns
- Check `eslint.config.js` ignores array