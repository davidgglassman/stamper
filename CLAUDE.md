# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stamper is a TypeScript Node.js CLI tool for scaffolding projects from Nunjucks templates. It uses ES modules and is designed to be installed globally or run locally. Templates are stored as individual GitHub repositories, each containing a `stamper.yaml` configuration file that defines the template metadata and user questions.

### Core Functionality
- **Template Registry**: Local config stores template names and GitHub URLs
- **Dynamic Scaffolding**: Clones GitHub repos, processes Nunjucks templates with user-provided variables
- **Interactive CLI**: Uses Commander.js for commands and @inquirer/prompts for user interaction
- **Git Integration**: Clones templates (excluding .git) and optionally initializes new repos
- **Template Metadata**: Each template has a `stamper.yaml` file defining questions and configuration

### Tech Stack
- **Language**: TypeScript
- **CLI Framework**: Commander.js for commands, @inquirer/prompts for interactions
- **Template Engine**: Nunjucks
- **Git Operations**: simple-git
- **Configuration**: conf package for user settings
- **Code Quality**: ESLint + Prettier
- **Build**: TypeScript compiler

## CLI Commands

### Main Commands
- `stamper create [--output-dir <path>]` - Interactive template selection and scaffolding
- `stamper add <name> <github-url>` - Add template to registry
- `stamper list` - Show available templates
- `stamper remove <name>` - Remove template from registry

### Command Behavior
- `create`: Lists templates → prompts for selection → asks template questions → scaffolds to output directory
- Output directory: Uses `--output-dir` flag or prompts user (defaults to current directory)
- Template questions are defined in each template's `stamper.yaml` file

## Template Structure

### Template Repository Requirements
Each template repository must contain:
```
template-repo/
├── stamper.yaml          # Required metadata file
├── src/
│   ├── {{project_name}}.ts.njk
│   └── package.json.njk
└── README.md.njk
```

### stamper.yaml Format
```yaml
name: "React TypeScript Template"
description: "A modern React app with TypeScript"
questions:
  - name: "project_name"
    type: "input"
    message: "What's your project name?"
    default: "my-app"
  - name: "include_testing"
    type: "confirm"
    message: "Include testing setup?"
```

### Supported Question Types
- `input`: Text input with optional default
- `confirm`: Yes/no boolean questions
- `select`: Choose from predefined options
- Additional @inquirer/prompts types as needed

## Project Structure

```
stamper/
├── src/
│   ├── commands/
│   │   ├── create.ts        # Template selection & scaffolding
│   │   ├── add.ts           # Add template to registry
│   │   ├── list.ts          # List available templates
│   │   └── remove.ts        # Remove template from registry
│   ├── lib/
│   │   ├── config.ts        # Configuration management (conf)
│   │   ├── git.ts           # Git operations (simple-git)
│   │   ├── scaffold.ts      # Template processing & scaffolding
│   │   └── questions.ts     # Dynamic question generation
│   ├── utils/
│   │   └── validation.ts    # Input validation helpers
│   └── types/
│       └── index.ts         # TypeScript type definitions
├── bin/
│   └── index.js             # Compiled CLI entry point
├── dist/                    # Compiled TypeScript output
├── package.json
├── tsconfig.json
├── .eslintrc.js
└── .prettierrc
```

## Implementation Progress

### ✅ Completed Phases
- [x] Project planning and architecture

### 🚧 Current Phase: Setup & Infrastructure

#### Phase 1A: Basic CLI Structure
- [x] Add dependencies (simple-git, conf, js-yaml, commander)
- [x] Add TypeScript, ESLint, Prettier setup
- [x] Replace bin/index.js with Commander.js structure
- [x] Create basic command files with placeholder implementations
- [x] **Test Goal**: `stamper --help` shows all commands

#### Phase 1B: Configuration System
- [x] Implement config.ts using conf package
- [x] Add basic config initialization (empty template registry)
- [x] **Test Goal**: Config file created on first run

### 📋 Upcoming Phases

#### Phase 2A: Template Registry - Add Command
- [ ] Implement `stamper add <name> <url>` command
- [ ] Store templates in config (name + URL only)
- [ ] Basic duplicate name prevention
- [ ] **Test Goal**: `stamper add react https://github.com/user/react-template` works

#### Phase 2B: Template Registry - List & Remove Commands
- [ ] Implement `stamper list` - shows added templates
- [ ] Implement `stamper remove <name>` - removes from registry
- [ ] **Test Goal**: Complete registry CRUD operations work

#### Phase 3A: Basic Git Integration
- [ ] Implement git.ts wrapper using simple-git
- [ ] Add temp directory management
- [ ] Basic repo cloning (exclude .git folder)
- [ ] **Test Goal**: Can clone a real GitHub repo to temp folder

#### Phase 3B: Template Validation
- [ ] Add YAML parsing in scaffold.ts
- [ ] Check for stamper.yaml in cloned repos
- [ ] Basic YAML validation (name, description, questions exist)
- [ ] Error handling for missing/invalid files
- [ ] **Test Goal**: Validates template structure correctly

#### Phase 4A: Static Template Creation (No Questions)
- [ ] Implement basic scaffolding (copy files, no Nunjucks yet)
- [ ] Output directory handling (current dir or --output-dir)
- [ ] **Test Goal**: Can copy template files to target directory

#### Phase 4B: Question System
- [ ] Implement questions.ts - convert YAML to inquirer prompts
- [ ] Support basic question types (input, confirm)
- [ ] Collect user answers
- [ ] **Test Goal**: Questions are asked based on template config

#### Phase 4C: Nunjucks Integration
- [ ] Add Nunjucks rendering to scaffolding process
- [ ] Pass collected answers to template rendering
- [ ] Process .njk files, copy others as-is
- [ ] **Test Goal**: Variables are replaced in template files

#### Phase 5A: Enhanced UX
- [ ] Add progress indicators with ora during git operations
- [ ] Improve error messages and validation
- [ ] Success messaging with next steps
- [ ] **Test Goal**: Professional user experience

#### Phase 5B: Git Repository Initialization
- [ ] Add post-scaffold git init option
- [ ] Prompt user for repository initialization
- [ ] **Test Goal**: Complete workflow including optional git setup

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled, full type coverage
- **ESLint**: Enforce code quality and consistency
- **Prettier**: Auto-format all code
- **ES Modules**: Use import/export syntax
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Testing Strategy
Each sub-phase must be fully functional and testable:
- CLI commands should run without errors
- Help text should be accurate and complete
- Error cases should be handled gracefully
- User feedback should be clear and actionable

### Dependencies
- `commander`: CLI command structure
- `@inquirer/prompts`: Interactive user prompts
- `nunjucks`: Template processing
- `simple-git`: Git operations
- `conf`: User configuration management
- `js-yaml`: YAML parsing for stamper.yaml
- `ora`: Progress indicators
- `typescript`: TypeScript compilation
- `eslint`: Code linting
- `prettier`: Code formatting

## Important Instructions
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for achieving the goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files unless explicitly requested
- Each phase must result in a working, testable application
- Maintain backward compatibility within the same major version
- Keep code comments to a minimum except in the beginning of complex or non-obvious logic blocks
- Use arrow notation for functions wherever possible
- Break functionality into smaller, manageable chunks / functions. Each function should not do too many things on its own.

## Development Guidance

### Memory of Best Practices
- At the end of each phase when you are testing the Test Goal, also tell me the steps I would take to test on my own. I want to independently validate everything is working.