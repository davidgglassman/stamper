// ---------------------- Imports

import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import {
  fetchOrganizationManifest,
  getOrganizationRepoUrl,
  getOrganizationTemplates,
  refreshOrganizationManifest,
  setOrganizationRepoUrl,
  validateGitHubRepoUrl
} from '../lib/config.js';
import { print } from '../utils/print.js';

// ---------------------- Command Handler

// ---------- No Sub-Command

export const orgCommand = async (action?: string) => {
  if (!action) {
    // ---------- Display Saved Configuration Details

    const currentUrl = getOrganizationRepoUrl();

    if (currentUrl) {
      const orgTemplates = await getOrganizationTemplates();

      print.line(`${chalk.bold('Organization Configuration')}`);
      print.line(`   • ${chalk.whiteBright('Repository URL')}: ${currentUrl}`, false);
      print.line(`   • ${chalk.whiteBright('Templates')}: ${orgTemplates.length} available`, false);

      if (orgTemplates.length > 0) {
        orgTemplates.forEach((template) => {
          print.line(`   • ${chalk.whiteBright('Repository URL')}: ${template.name}`, false);
        });
      }
    } else {
      print.line('No organization configuration found');
      print.line('💡 Set up organization templates with: stamper org set-url');
    }

    return;
  }

  // ---------- Sub-Command Routing

  switch (action) {
    case 'set-url':
      await setUrlCommand();
      break;
    case 'refresh':
      await refreshCommand();
      break;
    case 'clear':
      await clearCommand();
      break;
    default:
      print.error('Unknown organization command');

      print.line(`${chalk.bold('Available commands')}`, false);
      print.line('   stamper org          - Show current organization configuration', false);
      print.line('   stamper org set-url  - Set organization repository URL', false);
      print.line('   stamper org refresh  - Refresh organization templates', false);
      print.line('   stamper org clear    - Remove organization configuration');
  }
};

// ---------------------- Sub-Command Handlers

// ---------- Set URL Sub-Command

const setUrlCommand = async () => {
  // ---------- Display Saved Configuration Details

  const currentUrl = getOrganizationRepoUrl();

  print.line('🔧 Update Organization Repository URL');

  if (currentUrl) {
    print.line(`Current repository: ${currentUrl}`);
  }

  // ----- Get Repo URL from User

  const repoUrl = await input({
    message: 'Enter organization repository URL:',
    default: currentUrl,
    validate: (url: string) => {
      if (!url.trim()) {
        return 'URL cannot be empty';
      }

      if (!validateGitHubRepoUrl(url.trim())) {
        return 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)';
      }

      return true;
    }
  });

  setOrganizationRepoUrl(repoUrl.trim());

  // ----- Test Repository / Get Manifest

  print.line('🔍 Testing repository and looking for manifest.yaml...');

  const manifest = await fetchOrganizationManifest();

  if (manifest) {
    // ----- Success / Display Manifest Info

    print.success(`Found manifest!`);

    print.line(`${chalk.whiteBright('Organization')}: ${manifest.name}`, false);

    if (manifest.description) {
      print.line(`${chalk.whiteBright('Description')}: ${manifest.description}`, false);
    }

    print.line(`${chalk.whiteBright('Template Count')}: ${manifest.templates.length}`);
  } else {
    // ----- Error / No Manifest

    print.error(
      'Could not find manifest.yaml in this repository',
      'Make sure the repository contains a manifest.yaml file in the root directory'
    );

    print.line('The URL has been saved but templates may not be available');
  }
};

// ---------- Refresh Sub-Command

const refreshCommand = async () => {
  // ---------- Validate Configuration

  const currentUrl = getOrganizationRepoUrl();

  if (!currentUrl) {
    print.error('No organization repository URL configured');
    print.line('💡 Set up organization templates with: stamper org set-url');

    return;
  }

  // ----- Perform Refresh

  print.line('Refreshing organization templates...', false);
  print.line(`Repository: ${currentUrl}`);

  const success = await refreshOrganizationManifest();

  if (success) {
    // ----- Success

    const orgTemplates = await getOrganizationTemplates();

    print.success(`Successfully refreshed ${orgTemplates.length} organization template(s)`);
  } else {
    // ----- Error

    print.error('Failed to refresh organization templates');

    print.line('Check your internet connection and repository URL', false);
    print.line('Make sure the repository contains a manifest.yaml file');
  }
};

// ---------- Clear Sub-Command

const clearCommand = async () => {
  // ---------- Validate Configuration

  const currentUrl = getOrganizationRepoUrl();

  if (!currentUrl) {
    print.line('📭 No organization configuration to clear');
    return;
  }

  // ----- Confirm / Perform Clear

  print.line('⚠️ Remove Organization Configuration');
  print.line(`Current repository: ${currentUrl}`);

  const confirmed = await confirm({
    message: 'Are you sure you want to remove organization configuration?',
    default: false
  });

  if (confirmed) {
    // ----- Proceed

    setOrganizationRepoUrl(undefined);

    print.success('Organization configuration removed');
    print.line('💡 You can set it up again with: stamper org set-url');
  } else {
    // ----- Cancel

    print.line('Cancelled');
  }
};
