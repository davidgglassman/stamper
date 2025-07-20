import { select, input } from '@inquirer/prompts';
import { getAllTemplates, getTemplate } from '../lib/config.js';
import { GitManager } from '../lib/git.js';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export const createCommand = async (options: { outputDir?: string }) => {
  try {
    // Get all available templates
    const templates = await getAllTemplates();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('📭 No templates available!'));
      console.log('');
      console.log('💡 To get started:');
      console.log('   • Run `stamper setup` to configure organization templates');
      console.log('   • Run `stamper add <name> <github-url>` to add user templates');
      return;
    }

    // Template selection
    console.log(chalk.blue('🎯 Select a template to create your project:'));
    console.log('');
    
    const templateChoices = templates.map(template => ({
      name: `${template.name}${template.source === 'organization' ? ' (org)' : ''}`,
      value: template.name,
      description: template.description || 'No description provided'
    }));

    const selectedTemplateName = await select({
      message: 'Choose template:',
      choices: templateChoices,
    });

    const selectedTemplate = await getTemplate(selectedTemplateName);
    if (!selectedTemplate) {
      console.error(chalk.red('❌ Template not found'));
      return;
    }

    // Output directory handling
    let outputDir = options.outputDir;
    if (!outputDir) {
      outputDir = await input({
        message: 'Output directory:',
        default: '.',
      });
    }

    const resolvedOutputDir = resolve(outputDir);
    
    // Check if output directory exists and is not empty
    if (existsSync(resolvedOutputDir)) {
      const { readdir } = await import('fs/promises');
      try {
        const files = await readdir(resolvedOutputDir);
        if (files.length > 0) {
          console.log(chalk.yellow('⚠️  Output directory is not empty!'));
          console.log(`   ${resolvedOutputDir}`);
          console.log('');
          console.log('💡 Consider using a new directory or cleaning the existing one');
          return;
        }
      } catch {
        // Directory exists but can't read it - probably a file, not a directory
        console.log(chalk.red('❌ Output path exists but is not a directory!'));
        console.log(`   ${resolvedOutputDir}`);
        return;
      }
    }

    console.log('');
    console.log(chalk.blue('🚀 Creating project from template...'));
    console.log(`   Template: ${chalk.bold(selectedTemplate.name)}`);
    console.log(`   Source: ${selectedTemplate.url}`);
    console.log(`   Output: ${resolvedOutputDir}`);
    console.log('');

    // Clone template using GitManager
    const gitManager = new GitManager();
    const spinner = ora('Cloning template repository...').start();
    
    try {
      const cloneDir = await gitManager.cloneTemplate(selectedTemplate.url);
      spinner.succeed('Template cloned successfully');
      
      // Show what was cloned
      const { readdir, mkdir, cp } = await import('fs/promises');
      const files = await readdir(cloneDir, { withFileTypes: true });
      
      console.log('');
      console.log(chalk.green('📁 Template contents:'));
      files.forEach(file => {
        const icon = file.isDirectory() ? '📂' : '📄';
        console.log(`   ${icon} ${file.name}`);
      });
      
      // Check for stamper.yaml
      const hasStamperYaml = files.some(file => file.name === 'stamper.yaml');
      console.log('');
      if (hasStamperYaml) {
        console.log(chalk.green('✅ stamper.yaml configuration found'));
      } else {
        console.log(chalk.yellow('⚠️  No stamper.yaml found - using default configuration'));
      }
      
      // Create output directory if it doesn't exist
      console.log('');
      const copySpinner = ora('Creating output directory...').start();
      try {
        await mkdir(resolvedOutputDir, { recursive: true });
        copySpinner.succeed('Output directory ready');
      } catch (error) {
        copySpinner.fail('Failed to create output directory');
        throw error;
      }
      
      // Copy template files to output directory
      const copyFilesSpinner = ora('Copying template files...').start();
      try {
        // Copy contents of cloneDir to resolvedOutputDir, not the directory itself
        for (const file of files) {
          const sourcePath = resolve(cloneDir, file.name);
          const destPath = resolve(resolvedOutputDir, file.name);
          
          await cp(sourcePath, destPath, { 
            recursive: true,
            force: false // Don't overwrite existing files
          });
        }
        copyFilesSpinner.succeed('Template files copied successfully');
      } catch (error) {
        copyFilesSpinner.fail('Failed to copy template files');
        throw error;
      }
      
      console.log('');
      console.log(chalk.green('🎉 Project created successfully!'));
      console.log(`   Location: ${chalk.bold(resolvedOutputDir)}`);
      console.log('');
      console.log(chalk.blue('🔜 Coming in future phases:'));
      console.log('   • Process template questions from stamper.yaml');
      console.log('   • Apply Nunjucks templating with user inputs');
      
    } catch (error) {
      spinner.fail('Failed to clone template');
      throw error;
    } finally {
      await gitManager.cleanup();
    }

  } catch (error) {
    console.error(chalk.red('❌ Error creating project:'));
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};