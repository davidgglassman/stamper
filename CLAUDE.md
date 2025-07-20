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
- `stamper add <name> <github-url>` - Add user template to registry
- `stamper list` - Show available templates (organization + user)
- `stamper remove <name>` - Remove user template from registry
- `stamper setup` - First-run interactive setup and organization configuration
- `stamper org [action]` - Organization template management

### Organization Commands
- `stamper org` - Show current organization configuration
- `stamper org set-url` - Set organization repository URL
- `stamper org refresh` - Force refresh organization templates
- `stamper org clear` - Remove organization configuration

### Command Behavior
- `create`: Lists templates → prompts for selection → asks template questions → scaffolds to output directory
- `add`: Adds user templates only (cannot override organization templates)
- `list`: Shows organization templates (read-only) and user templates (editable) separately
- `remove`: Removes user templates only (organization templates protected)
- `setup`: Interactive first-run setup with optional organization repository configuration
- Output directory: Uses `--output-dir` flag or prompts user (defaults to current directory)
- Template questions are defined in each template's `stamper.yaml` file

### Template Types
- **Organization Templates**: Read-only, managed via GitHub repository with `manifest.yaml`
- **User Templates**: Fully editable, stored in local config, can be added/removed via CLI

## Template Structure

### Organization Manifest Repository
Organizations can provide approved templates via a GitHub repository containing a `manifest.yaml` file:

```
organization-templates/
├── manifest.yaml        # Required: Organization template manifest
└── README.md           # Optional: Documentation
```

#### manifest.yaml Format
```yaml
name: "Company Templates"
description: "Standard templates for our development team"
templates:
  - name: "react-typescript"
    url: "https://github.com/company/react-template"
    description: "Company React template with TypeScript and standards"
  - name: "express-api"
    url: "https://github.com/company/api-template"
    description: "Company Express API template with authentication"
```

#### Organization Setup
1. Create GitHub repository (public or internal)
2. Add `manifest.yaml` to repository root
3. Share repository URL with team: `https://github.com/company/templates`
4. Users run `stamper setup` and enter the repository URL

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
│   │   ├── add.ts           # Add user template to registry
│   │   ├── list.ts          # List available templates (org + user)
│   │   ├── remove.ts        # Remove user template from registry
│   │   ├── setup.ts         # First-run interactive setup
│   │   └── org.ts           # Organization template management
│   ├── lib/
│   │   ├── config.ts        # Dual template configuration system
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
├── eslint.config.js
└── .prettierrc
```

## Implementation Progress

- [x] Project planning and architecture

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

#### Phase 2A: Template Registry - Add Command
- [x] Implement `stamper add <name> <url>` command
- [x] Store templates in config (name + URL only)
- [x] Basic duplicate name prevention
- [x] **Test Goal**: `stamper add react https://github.com/user/react-template` works

#### Phase 2B: Template Registry - List & Remove Commands
- [x] Implement `stamper list` - shows added templates
- [x] Implement `stamper remove <name>` - removes from registry
- [x] **Test Goal**: Complete registry CRUD operations work

#### Phase 2C: Dual Template System
- [x] Implement organization vs user template separation
- [x] Add organization manifest repository URL system
- [x] Organization templates are read-only, user templates editable
- [x] Template name conflict protection (org templates cannot be overridden)
- [x] YAML manifest format support for organization templates
- [x] Automatic GitHub repository URL handling (main/master branch detection)
- [x] **Test Goal**: Organization templates protected, user templates fully manageable

#### Phase 2D: Organization Management Commands
- [x] Implement `stamper setup` - first-run interactive setup
- [x] Implement `stamper org` - show organization status
- [x] Implement `stamper org set-url` - set organization repository URL
- [x] Implement `stamper org refresh` - force refresh organization templates
- [x] Implement `stamper org clear` - remove organization configuration
- [x] Add comprehensive help documentation for all commands
- [x] **Test Goal**: Complete organization template lifecycle management

#### Phase 3A: Basic Git Integration
- [x] Implement git.ts wrapper using simple-git
- [x] Add temp directory management
- [x] Basic repo cloning (exclude .git folder)
- [x] **Test Goal**: Can clone a real GitHub repo to temp folder

#### Phase 3B: Template Validation
- [x] Add YAML parsing in scaffold.ts
- [x] Check for stamper.yaml in cloned repos
- [x] Basic YAML validation (name, description, questions exist)
- [x] Error handling for missing/invalid files
- [x] **Test Goal**: Validates template structure correctly

#### Phase 4A: Static Template Creation (No Questions)
- [x] Implement basic scaffolding (copy files, no Nunjucks yet)
- [x] Output directory handling (current dir or --output-dir)
- [x] **Test Goal**: Can copy template files to target directory

#### Phase 4B: Question System
- [x] Implement questions.ts - convert YAML to inquirer prompts
- [x] Support basic question types (input, confirm)
- [x] Collect user answers
- [x] **Test Goal**: Questions are asked based on template config

#### Phase 4C: Nunjucks Integration
- [x] Add Nunjucks rendering to scaffolding process
- [x] Pass collected answers to template rendering
- [x] Process .njk files, copy others as-is
- [x] **Test Goal**: Variables are replaced in template files

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
- **Update Help Documentation**: Always update the help documentation for a command whenever it has new or updated flags/options