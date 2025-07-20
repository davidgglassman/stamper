import { confirm, input } from '@inquirer/prompts';
import {
  fetchOrganizationManifest,
  getOrganizationRepoUrl,
  getOrganizationTemplates,
  refreshOrganizationManifest,
  setOrganizationRepoUrl,
  validateGitHubRepoUrl,
} from '../lib/config.js';

export const orgCommand = async (action?: string) => {
  if (!action) {
    // Show current organization status
    const currentUrl = getOrganizationRepoUrl();

    if (currentUrl) {
      console.log('🏢 Organization Configuration');
      console.log('');
      console.log(`Repository URL: ${currentUrl}`);

      const orgTemplates = await getOrganizationTemplates();
      console.log(`Templates: ${orgTemplates.length} available`);

      if (orgTemplates.length > 0) {
        console.log('');
        orgTemplates.forEach((template) => {
          console.log(`   • ${template.name}`);
        });
      }
    } else {
      console.log('📭 No organization configuration found');
      console.log('');
      console.log('💡 Set up organization templates with:');
      console.log('   stamper org set-url');
    }
    return;
  }

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
      console.error('❌ Unknown organization command');
      console.log('');
      console.log('Available commands:');
      console.log('   stamper org          - Show current organization configuration');
      console.log('   stamper org set-url  - Set organization repository URL');
      console.log('   stamper org refresh  - Refresh organization templates');
      console.log('   stamper org clear    - Remove organization configuration');
  }
};

const setUrlCommand = async () => {
  const currentUrl = getOrganizationRepoUrl();

  console.log('🔧 Update Organization Repository URL');
  console.log('');

  if (currentUrl) {
    console.log(`Current repository: ${currentUrl}`);
    console.log('');
  }

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
    },
  });

  console.log('');
  console.log('🔍 Testing repository and looking for manifest.yaml...');

  setOrganizationRepoUrl(repoUrl.trim());
  const manifest = await fetchOrganizationManifest();

  if (manifest) {
    console.log(`✅ Success! Found ${manifest.templates.length} organization template(s)`);
    console.log(`   Organization: ${manifest.name}`);
    if (manifest.description) {
      console.log(`   Description: ${manifest.description}`);
    }
  } else {
    console.log('❌ Could not find manifest.yaml in this repository');
    console.log('   Make sure the repository contains a manifest.yaml file in the root directory');
    console.log('   The URL has been saved but templates may not be available');
  }
};

const refreshCommand = async () => {
  const currentUrl = getOrganizationRepoUrl();

  if (!currentUrl) {
    console.error('❌ No organization repository URL configured');
    console.log('');
    console.log('💡 Set up organization templates with:');
    console.log('   stamper org set-url');
    return;
  }

  console.log('🔄 Refreshing organization templates...');
  console.log(`   Repository: ${currentUrl}`);
  console.log('');

  const success = await refreshOrganizationManifest();

  if (success) {
    const orgTemplates = await getOrganizationTemplates();
    console.log(`✅ Successfully refreshed ${orgTemplates.length} organization template(s)`);
  } else {
    console.log('❌ Failed to refresh organization templates');
    console.log('   Check your internet connection and repository URL');
    console.log('   Make sure the repository contains a manifest.yaml file');
  }
};

const clearCommand = async () => {
  const currentUrl = getOrganizationRepoUrl();

  if (!currentUrl) {
    console.log('📭 No organization configuration to clear');
    return;
  }

  console.log('⚠️  Remove Organization Configuration');
  console.log('');
  console.log(`Current repository: ${currentUrl}`);
  console.log('');

  const confirmed = await confirm({
    message: 'Are you sure you want to remove organization configuration?',
    default: false,
  });

  if (confirmed) {
    setOrganizationRepoUrl(undefined);
    console.log('✅ Organization configuration removed');
    console.log('');
    console.log('💡 You can set it up again with:');
    console.log('   stamper org set-url');
  } else {
    console.log('Cancelled');
  }
};
