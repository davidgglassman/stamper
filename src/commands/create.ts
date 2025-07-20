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
    const spinner = ora('Preparing to clone template...').start();
    
    try {
      const cloneDir = await gitManager.cloneTemplate(selectedTemplate.url, spinner);
      spinner.succeed('Template repository cloned successfully');
      
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
      const scaffoldSpinner = ora('Initializing template processing...').start();
      await scaffoldTemplate({
        sourceDir: cloneDir,
        outputDir: resolvedOutputDir,
        variables: userAnswers,
        progressSpinner: scaffoldSpinner,
      });
      scaffoldSpinner.succeed('All template files processed successfully');
      
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
      
      // Enhanced success messaging with next steps
      console.log('');
      console.log(chalk.green.bold('🎉 Project created successfully!'));
      console.log('');
      console.log(chalk.blue('📍 Project Details:'));
      console.log(`   ${chalk.bold('Name:')} ${userAnswers.project_name || 'Generated Project'}`);
      console.log(`   ${chalk.bold('Location:')} ${chalk.underline(resolvedOutputDir)}`);
      console.log(`   ${chalk.bold('Template:')} ${selectedTemplate.name}`);
      
      if (Object.keys(userAnswers).length > 0) {
        console.log(`   ${chalk.bold('Customizations:')} ${Object.keys(userAnswers).length} options configured`);
      }
      
      console.log('');
      console.log(chalk.green('✅ What was completed:'));
      console.log('   • Template repository cloned');
      console.log('   • Configuration questions answered');
      console.log('   • Variables applied to templates');
      console.log('   • Project files generated');
      console.log('   • Development environment ready');
      
      console.log('');
      console.log(chalk.blue('🚀 Next steps:'));
      console.log(`   1. ${chalk.bold('cd')} ${resolvedOutputDir.split('/').pop() || resolvedOutputDir}`);
      console.log('   2. Install dependencies: ' + chalk.bold('npm install'));
      
      // Add template-specific next steps
      if (selectedTemplate.name.toLowerCase().includes('react')) {
        const port = userAnswers.port_number || 3000;
        console.log(`   3. Start development: ${chalk.bold(`npm run dev`)} (port ${port})`);
        if (userAnswers.include_testing) {
          console.log(`   4. Run tests: ${chalk.bold('npm test')}`);
        }
      } else if (selectedTemplate.name.toLowerCase().includes('svelte')) {
        console.log(`   3. Start development: ${chalk.bold('npm run dev')}`);
        if (userAnswers.include_pwa) {
          console.log(`   4. Build PWA: ${chalk.bold('npm run build')}`);
        }
      } else {
        console.log(`   3. Start development: ${chalk.bold('npm run dev')}`);
      }
      
      // Check for environment file
      const { existsSync } = await import('fs');
      const envExamplePath = resolve(resolvedOutputDir, '.env.example');
      if (existsSync(envExamplePath)) {
        console.log('');
        console.log(chalk.yellow('⚠️  Environment setup required:'));
        console.log(`   • Copy ${chalk.bold('.env.example')} to ${chalk.bold('.env')}`);
        console.log('   • Configure your environment variables');
      }
      
      console.log('');
      console.log(chalk.green('Happy coding! 🚀'));
      
    } catch (error) {
      // Enhanced error handling with helpful suggestions
      console.log('');
      console.error(chalk.red.bold('❌ Project creation failed'));
      console.log('');
      
      if (error instanceof Error) {
        // Parse error message for better formatting
        const errorLines = error.message.split('\n');
        console.error(chalk.red('💥 Error details:'));
        errorLines.forEach(line => {
          console.error(`   ${line}`);
        });
        
        console.log('');
        console.error(chalk.yellow('💡 Troubleshooting suggestions:'));
        
        if (error.message.includes('Repository not found') || error.message.includes('not found')) {
          console.error('   • Verify the repository URL is correct');
          console.error('   • Check that the repository exists and is public');
          console.error('   • Ensure you have internet connectivity');
        } else if (error.message.includes('Access denied') || error.message.includes('Permission denied')) {
          console.error('   • Check that the repository is public');
          console.error('   • Verify your GitHub access if using private repositories');
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          console.error('   • Check your internet connection');
          console.error('   • Try again in a few moments');
          console.error('   • Verify the repository URL is accessible');
        } else if (error.message.includes('Template processing failed')) {
          console.error('   • Check the template files for syntax errors');
          console.error('   • Verify all required variables are defined');
          console.error('   • Review the stamper.yaml configuration');
        } else if (error.message.includes('Output directory')) {
          console.error('   • Choose a different output directory');
          console.error('   • Ensure you have write permissions');
          console.error('   • Clear the existing directory if needed');
        } else {
          console.error('   • Try running the command again');
          console.error('   • Check the template repository is valid');
          console.error('   • Ensure sufficient disk space is available');
        }
        
        console.log('');
        console.error(chalk.gray('If the problem persists, please report it at:'));
        console.error(chalk.gray('https://github.com/your-org/stamper/issues'));
      } else {
        console.error(chalk.red('   Unknown error occurred'));
      }
      
      process.exit(1);
    } finally {
      // Always cleanup, even on error
      try {
        await gitManager.cleanup();
      } catch {
        // Silent cleanup failure - don't mask the main error
      }
    }

  } catch (error) {
    // Fallback error handler for unexpected errors
    console.error(chalk.red('❌ Unexpected error creating project:'));
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};