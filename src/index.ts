#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';

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
  .description('Add a template to the registry')
  .action(addCommand);

program
  .command('list')
  .description('List available templates')
  .action(listCommand);

program
  .command('remove <name>')
  .description('Remove a template from the registry')
  .action(removeCommand);

program.parse();