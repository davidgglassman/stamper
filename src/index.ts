#!/usr/bin/env node

// ---------------------- Imports

import chalk from 'chalk';
import { Command } from 'commander';
import figlet from 'figlet';
import { addCommand } from './commands/add.js';
import { createCommand } from './commands/create.js';
import { listCommand } from './commands/list.js';
import { orgCommand } from './commands/org.js';
import { removeCommand } from './commands/remove.js';
import { setupCommand } from './commands/setup.js';
import { getUserTemplates, isSetupCompleted } from './lib/config.js';
import { print } from './utils/print.js';

// ---------------------- Config Setup

getUserTemplates();

// ---------------------- CLI Setup (Commander)

const program = new Command();

// ---------- Program Name and Version

program.name('stamper').version('1.0.0');

// ---------- Setup Command

program
  .command('setup')
  .description('Run first-time setup for Stamper')
  .addHelpText(
    'after',
    `
This command guides you through initial configuration:
  • Organization template repository setup (optional)
  • Validates repository and manifest.yaml file
  • Sets up template caching

Run this command when first using Stamper or to reconfigure organization settings.\r\n`
  )
  .action(async () => {
    await setupCommand();
  });

// ---------- Create Command
program
  .command('create')
  .description('Create a new project from a template')
  .option('-o, --output-dir <path>', 'Output directory for the new project')
  .addHelpText('after', `\r`)
  .action(async (options) => {
    await createCommand(options);
  });

// ---------- Add Command

program
  .command('add <name> <github-url>')
  .description('Add a user template to the registry')
  .addHelpText(
    'after',
    `
Notes: 
  Cannot override organization template names. Organization templates are read-only.

Examples:
  stamper add my-react https://github.com/user/react-template\r\n`
  )
  .action(async (name, githubUrl) => {
    await addCommand(name, githubUrl);
  });

// ---------- List Command
program
  .command('list')
  .description('List available templates (both organization and user)')
  .addHelpText(
    'after',
    `
Shows two types of templates:
  • Organization Templates (read-only) - Managed by your organization
  • User Templates - Your personal templates that you can modify\r\n`
  )
  .action(async () => {
    await listCommand();
  });

// ---------- Remove Command

program
  .command('remove <name>')
  .description('Remove a user template from the registry')
  .addHelpText(
    'after',
    `
Notes: 
  Can only remove user templates. Organization templates cannot be removed.

Examples:
  stamper remove my-template\r\n`
  )
  .action(async (name) => {
    await removeCommand(name);
  });

// ---------- Organization Command

program
  .command('org [action]')
  .description('Manage organization template configuration')
  .addHelpText(
    'after',
    `
Actions:
  (none)       Show current organization configuration
  set-url      Set organization repository URL
  refresh      Refresh organization templates from repository
  clear        Remove organization configuration

Examples:
  stamper org             Show organization status
  stamper org set-url     Update organization repository
  stamper org refresh     Force refresh templates
  stamper org clear       Remove organization setup\r\n`
  )
  .action(async (action) => {
    await orgCommand(action);
  });

// ---------- Execution Mode Handler

if (process.argv.length === 2) {
  // ---------- Welcome Mode (no args passed)

  // ----- Banner

  console.log(
    figlet.textSync('STAMPER', {
      font: 'Big',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    })
  );

  // ----- Welcome Message

  print.line(chalk.bold(`Welcome to Stamper!`));
  print.fullLine(chalk.gray(`The Node CLI for rapid project scaffolding from templates.`));

  // ----- Setup Hint

  if (!isSetupCompleted()) {
    print.line(chalk.yellow('First-time setup detected...'));
    print.fullLine('💡 You should run the "setup" command to configure organization templates.');
  }

  // ----- Help Menu

  program.outputHelp();
} else {
  // ---------- Command Mode (args passed)

  program.parse();
}
