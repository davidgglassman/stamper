#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { setupCommand } from './commands/setup.js';
import { orgCommand } from './commands/org.js';
import { getUserTemplates, isSetupCompleted } from './lib/config.js';

// Initialize config (creates config file on first run)
getUserTemplates();

// Check if first-run setup is needed
const setupCompleted = isSetupCompleted();

const program = new Command();

program
  .name('stamper')
  .description('CLI for scaffolding projects from templates')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new project from a template')
  .option('-o, --output-dir <path>', 'Output directory for the new project')
  .action(createCommand);

program
  .command('add <name> <github-url>')
  .description('Add a user template to the registry')
  .addHelpText('after', `
Note: Cannot override organization template names. Organization templates are read-only.

Example:
  stamper add my-react https://github.com/user/react-template`)
  .action(async (name, githubUrl) => {
    await addCommand(name, githubUrl);
  });

program
  .command('list')
  .description('List available templates (both organization and user)')
  .addHelpText('after', `
Shows two types of templates:
  🏢 Organization Templates (read-only) - Managed by your organization
  👤 User Templates - Your personal templates that you can modify`)
  .action(async () => {
    await listCommand();
  });

program
  .command('remove <name>')
  .description('Remove a user template from the registry')
  .addHelpText('after', `
Note: Can only remove user templates. Organization templates cannot be removed.

Example:
  stamper remove my-template`)
  .action(async (name) => {
    await removeCommand(name);
  });

program
  .command('setup')
  .description('Run first-time setup for Stamper')
  .addHelpText('after', `
This command guides you through initial configuration:
  • Organization template repository setup (optional)
  • Validates repository and manifest.yaml file
  • Sets up template caching

Run this command when first using Stamper or to reconfigure organization settings.`)
  .action(async () => {
    await setupCommand();
  });

program
  .command('org [action]')
  .description('Manage organization template configuration')
  .addHelpText('after', `
Actions:
  (none)       Show current organization configuration
  set-url      Set organization repository URL
  refresh      Refresh organization templates from repository
  clear        Remove organization configuration

Examples:
  stamper org                    Show organization status
  stamper org set-url           Update organization repository
  stamper org refresh           Force refresh templates
  stamper org clear             Remove organization setup`)
  .action(async (action) => {
    await orgCommand(action);
  });

// Handle first-run setup
if (!setupCompleted && process.argv.length === 2) {
  // User ran 'stamper' with no arguments and setup is not completed
  console.log('👋 Welcome to Stamper! Looks like this is your first time.');
  console.log('');
  console.log('💡 Run "stamper setup" to get started, or use any command directly.');
  console.log('');
}

program.parse();