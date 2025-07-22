// ---------------------- Imports

import { confirm, input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { existsSync } from 'fs';
import yaml from 'js-yaml';
import ora from 'ora';
import { resolve } from 'path';
import { getAllTemplates, getTemplate } from '../lib/config.js';
import { GitManager } from '../lib/git.js';
import { askQuestions, parseTemplateConfig, type AnswerMap } from '../lib/questions.js';
import { scaffoldTemplate } from '../lib/scaffold.js';
import { print } from '../utils/print.js';

// ---------------------- Command Handler

export const createCommand = async (options: { outputDir?: string }) => {
  try {
    // ---------- Template Availability Check

    const templates = await getAllTemplates();

    // ----- No Templates Found

    if (templates.length === 0) {
      print.line(chalk.yellow('📭 No templates available!'));

      print.line('💡 To get started:', false);
      print.line('   • Run `stamper setup` to configure organization templates', false);
      print.line('   • Run `stamper add <name> <github-url>` to add user templates');
      return;
    }

    // ---------- Template Selection

    // ----- Header

    print.line(chalk.blue('🎯 Select a template to create your project:'));

    // ----- Template Choices

    const templateChoices = templates.map((template) => ({
      name: `${template.name}${template.source === 'organization' ? ' (org)' : ''}`,
      value: template.name,
      description: template.description || 'No description provided',
    }));

    // ----- User Prompt

    const selectedTemplateName = await select({
      message: 'Choose template:',
      choices: templateChoices,
    });

    // ----- Get Template Details

    const selectedTemplate = await getTemplate(selectedTemplateName);

    if (!selectedTemplate) {
      print.error('Template not found');
      return;
    }

    // ---------- Output Directory Selection

    let outputDir = options.outputDir;

    if (!outputDir) {
      outputDir = await input({
        message: 'Output directory:',
        default: '.',
      });
    }

    const resolvedOutputDir = resolve(outputDir);

    // ----- Validate Output Directory

    if (existsSync(resolvedOutputDir)) {
      const { readdir } = await import('fs/promises');

      try {
        const files = await readdir(resolvedOutputDir);

        if (files.length > 0) {
          // ----- Not Empty

          print.error(`Output directory is not empty: ${resolvedOutputDir}`);
          print.line('💡 Consider using a new directory or cleaning the existing one');

          return;
        }
      } catch {
        // ----- Not a Directory

        print.error(`Output path exists but is not a directory: ${resolvedOutputDir}`);

        return;
      }
    }

    print.line(`${chalk.bold('Creating project from template...')}`);
    print.line(`   • ${chalk.whiteBright('Template')}: ${selectedTemplate.name}`, false);
    print.line(`   • ${chalk.whiteBright('Source')}: ${selectedTemplate.url}`, false);
    print.line(`   • ${chalk.whiteBright('Output')}: ${resolvedOutputDir}`);

    // ---------- Clone Template

    const gitManager = new GitManager();
    const spinner = ora('Preparing to clone template...').start();

    try {
      const cloneDir = await gitManager.cloneTemplate(selectedTemplate.url, spinner);

      spinner.succeed('Template repository cloned successfully');

      // ----- Check for Manifest File

      const { readdir } = await import('fs/promises');
      const files = await readdir(cloneDir, { withFileTypes: true });

      const hasStamperYaml = files.some((file) => file.name === 'stamper.yaml');
      let userAnswers: AnswerMap = {};

      if (hasStamperYaml) {
        print.success('stamper.yaml configuration found');

        try {
          // ----- Parse Manifest File

          const { readFile } = await import('fs/promises');
          const stamperYamlPath = resolve(cloneDir, 'stamper.yaml');
          const yamlContent = await readFile(stamperYamlPath, 'utf-8');
          const parsedYaml = yaml.load(yamlContent);
          const templateConfig = parseTemplateConfig(parsedYaml);

          if (templateConfig.questions.length > 0) {
            // ----- Handle Questions

            print.line(`${chalk.bold('Template configuration')}`);
            print.line(`   • ${chalk.whiteBright('Name')}: ${templateConfig.name}`, false);
            print.line(`   • ${chalk.whiteBright('Description')}: ${templateConfig.description}`);

            print.line(chalk.blue('Please answer the following questions:'));

            userAnswers = await askQuestions(templateConfig.questions);

            print.success('Questions completed!');

            print.line(`${chalk.bold('Your Answers')}`);

            for (const [key, value] of Object.entries(userAnswers)) {
              print.line(`   • ${chalk.whiteBright(key)}: ${value}`);
            }
          } else {
            // ----- No Questions Defined

            print.line(chalk.yellow('No questions defined in template'));
          }
        } catch (error) {
          // ----- Error Parsing Manifest File

          print.error(
            'Error processing stamper.yaml',
            `${error instanceof Error ? error.message : 'Unknown error'}`
          );
          print.line('Continuing without template questions...');
        }
      } else {
        // ----- No Manifest File Found

        print.line(chalk.yellow('⚠️ No stamper.yaml found - using default configuration'));
      }

      // ---------- Scaffold with Nunjucks Engine

      const scaffoldSpinner = ora('Initializing template processing...').start();

      await scaffoldTemplate({
        sourceDir: cloneDir,
        outputDir: resolvedOutputDir,
        variables: userAnswers,
        progressSpinner: scaffoldSpinner,
      });

      scaffoldSpinner.succeed('All template files processed successfully');

      // ---------- Delete Manifest File

      if (hasStamperYaml) {
        const cleanupSpinner = ora('Cleaning up template configuration...').start();

        try {
          const { unlink } = await import('fs/promises');
          const stamperYamlOutputPath = resolve(resolvedOutputDir, 'stamper.yaml');

          await unlink(stamperYamlOutputPath);

          cleanupSpinner.succeed('Template configuration removed');
        } catch {
          cleanupSpinner.warn('Could not remove stamper.yaml from output directory');
        }
      }

      // ---------- Initialize Git Repo

      let gitInitialized = false;
      const gitAvailable = await gitManager.isGitAvailable();
      const isAlreadyGitRepo = await gitManager.isGitRepository(resolvedOutputDir);

      if (gitAvailable && !isAlreadyGitRepo) {
        print.line(chalk.blue('🔧 Git Repository Setup'));

        const shouldInitGit = await confirm({
          message: 'Initialize a git repository for this project?',
          default: true,
        });

        if (shouldInitGit) {
          const gitSpinner = ora('Setting up git repository...').start();

          try {
            await gitManager.initializeRepository(resolvedOutputDir, gitSpinner);

            gitSpinner.succeed('Git repository initialized with initial commit');

            gitInitialized = true;
          } catch (error) {
            print.line(chalk.yellow('⚠️ Git initialization skipped'));

            if (error instanceof Error) {
              print.error(`${error.message.split('\n')[0]}`);
            }
          }
        } else {
          // ----- Repo Init skipped by user

          print.line(chalk.gray('Git initialization skipped by user'));
        }
      } else if (!gitAvailable) {
        // ----- Git Unavailable

        print.line(chalk.yellow('⚠️ Git not available - repository initialization skipped'));
        print.line('Install Git to enable automatic repository setup');
      } else if (isAlreadyGitRepo) {
        // ----- Repo already exists

        print.line(chalk.blue('ℹ️  Directory is already a git repository'));

        gitInitialized = true;
      }

      // ---------- Success / Summary Messaging

      print.success('Project created successfully!');

      print.line(`${chalk.bold('Project Details')}`);
      print.line(
        `   • ${chalk.whiteBright('Name')}: ${userAnswers.project_name || 'Generated Project'}`,
        false
      );
      print.line(
        `   • ${chalk.whiteBright('Location')}: ${chalk.underline(resolvedOutputDir)}`,
        false
      );
      print.line(`   • ${chalk.whiteBright('Template')}: ${selectedTemplate.name}`, false);

      if (Object.keys(userAnswers).length > 0) {
        print.line(
          `   • ${chalk.whiteBright('Customizations')}: ${Object.keys(userAnswers).length} options configured`,
          false
        );
      }

      print.line();

      print.line(`${chalk.bold('What was completed')}`);
      print.line(`   • Template repository cloned`, false);
      print.line(`   • Configuration questions answered`, false);
      print.line(`   • Variables applied to templates`, false);
      print.line(`   • Project files generated`, false);

      if (gitInitialized) {
        print.line(`   • Git repository initialized with initial commit`, false);
      }

      print.line();

      if (gitInitialized) {
        print.line(`${chalk.bold('Git repository ready')}`);

        print.line(`   • Initial commit created`, false);
        print.line(
          `   • Add remote: ${chalk.bold('git remote add origin <your-repo-url>')}`,
          false
        );
        print.line(`   • Push to remote: ${chalk.bold('git push -u origin main')}`);
      }

      print.line(chalk.green('Happy coding! 🚀'));
    } catch (error) {
      // ---------- Failure / Error Messaging

      print.error('Project creation failed');

      if (error instanceof Error) {
        const errorLines = error.message.split('\n');

        print.line(`${chalk.bold('Error Details')}`);

        errorLines.forEach((line) => {
          print.line(`   • ${line}`, false);
        });

        print.line();

        print.line(`${chalk.bold('Troubleshooting Suggestions')}`);

        if (error.message.includes('Repository not found') || error.message.includes('not found')) {
          print.line(`   • Verify the repository URL is correct`, false);
          print.line(`   • Check that the repository exists and is public`, false);
          print.line('   • Ensure you have internet connectivity', false);
        } else if (
          error.message.includes('Access denied') ||
          error.message.includes('Permission denied')
        ) {
          print.line('   • Check that the repository is public', false);
          print.line('   • Verify your GitHub access if using private repositories', false);
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          print.line('   • Check your internet connection', false);
          print.line('   • Try again in a few moments', false);
          print.line('   • Verify the repository URL is accessible', false);
        } else if (error.message.includes('Template processing failed')) {
          print.line('   • Check the template files for syntax errors', false);
          print.line('   • Verify all required variables are defined', false);
          print.line('   • Review the stamper.yaml configuration', false);
        } else if (error.message.includes('Output directory')) {
          print.line('   • Choose a different output directory', false);
          print.line('   • Ensure you have write permissions', false);
          print.line('   • Clear the existing directory if needed', false);
        } else {
          print.line('   • Try running the command again', false);
          print.line('   • Check the template repository is valid', false);
          print.line('   • Ensure sufficient disk space is available', false);
        }

        print.line();
      } else {
        print.error('   • No suggestions. Unknown error occurred');
      }

      process.exit(1);
    } finally {
      // ---------- Clean Up
      try {
        await gitManager.cleanup();
      } catch {
        // Silent cleanup failure - don't mask the main error
      }
    }
  } catch (error) {
    // ---------- Fallback Handler
    print.error('Unexpected error creating project');
    print.error(`${error instanceof Error ? error.message : 'Unknown error'}`);

    process.exit(1);
  }
};
