import { select, input } from '@inquirer/prompts';
import { getAllTemplates, getTemplate } from '../lib/config.js';
import { GitManager } from '../lib/git.js';
import { askQuestions, parseTemplateConfig, type AnswerMap } from '../lib/questions.js';
import { scaffoldTemplate } from '../lib/scaffold.js';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import yaml from 'js-yaml';

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
      const { readdir } = await import('fs/promises');
      const files = await readdir(cloneDir, { withFileTypes: true });
      
      console.log('');
      console.log(chalk.green('📁 Template contents:'));
      files.forEach(file => {
        const icon = file.isDirectory() ? '📂' : '📄';
        console.log(`   ${icon} ${file.name}`);
      });
      
      // Check for stamper.yaml and process questions
      const hasStamperYaml = files.some(file => file.name === 'stamper.yaml');
      let userAnswers: AnswerMap = {};
      
      console.log('');
      if (hasStamperYaml) {
        console.log(chalk.green('✅ stamper.yaml configuration found'));
        
        try {
          // Read and parse stamper.yaml
          const { readFile } = await import('fs/promises');
          const stamperYamlPath = resolve(cloneDir, 'stamper.yaml');
          const yamlContent = await readFile(stamperYamlPath, 'utf-8');
          const parsedYaml = yaml.load(yamlContent);
          const templateConfig = parseTemplateConfig(parsedYaml);
          
          if (templateConfig.questions.length > 0) {
            console.log('');
            console.log(chalk.blue('📝 Template configuration:'));
            console.log(`   ${chalk.bold(templateConfig.name)}`);
            console.log(`   ${templateConfig.description}`);
            console.log('');
            console.log(chalk.blue('🤔 Please answer the following questions:'));
            console.log('');
            
            userAnswers = await askQuestions(templateConfig.questions);
            
            console.log('');
            console.log(chalk.green('✅ Questions completed!'));
            console.log('');
            console.log(chalk.blue('📊 Your answers:'));
            for (const [key, value] of Object.entries(userAnswers)) {
              console.log(`   ${chalk.bold(key)}: ${value}`);
            }
          } else {
            console.log(chalk.yellow('   No questions defined in template'));
          }
        } catch (error) {
          console.log(chalk.red('❌ Error processing stamper.yaml:'));
          console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.log('   Continuing without template questions...');
        }
      } else {
        console.log(chalk.yellow('⚠️  No stamper.yaml found - using default configuration'));
      }
      
      // Scaffold template with Nunjucks processing
      console.log('');
      const scaffoldSpinner = ora('Processing template files...').start();
      try {
        await scaffoldTemplate({
          sourceDir: cloneDir,
          outputDir: resolvedOutputDir,
          variables: userAnswers,
        });
        scaffoldSpinner.succeed('Template processed successfully');
      } catch (error) {
        scaffoldSpinner.fail('Failed to process template');
        throw error;
      }
      
      // Clean up stamper.yaml from output directory if it exists
      if (hasStamperYaml) {
        const cleanupSpinner = ora('Cleaning up template configuration...').start();
        try {
          const { unlink } = await import('fs/promises');
          const stamperYamlOutputPath = resolve(resolvedOutputDir, 'stamper.yaml');
          await unlink(stamperYamlOutputPath);
          cleanupSpinner.succeed('Template configuration removed');
        } catch {
          cleanupSpinner.warn('Could not remove stamper.yaml from output directory');
          // Non-fatal error, continue execution
        }
      }
      
      console.log('');
      console.log(chalk.green('🎉 Project created successfully!'));
      console.log(`   Location: ${chalk.bold(resolvedOutputDir)}`);
      
      if (Object.keys(userAnswers).length > 0) {
        console.log(`   Questions processed: ${Object.keys(userAnswers).length}`);
      }
      
      console.log('');
      console.log(chalk.green('✅ Features completed:'));
      console.log('   • Template questions processed');
      console.log('   • Nunjucks templating applied');
      console.log('   • Project files generated');
      
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