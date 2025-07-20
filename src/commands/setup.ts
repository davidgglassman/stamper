import { confirm, input } from '@inquirer/prompts';
import {
  fetchOrganizationManifest,
  markSetupCompleted,
  setOrganizationRepoUrl,
  validateGitHubRepoUrl,
} from '../lib/config.js';

export const setupCommand = async () => {
  console.log('🚀 Welcome to Stamper!');
  console.log('');
  console.log("Let's set up your template configuration.");
  console.log('');

  // Ask about organization templates
  const hasOrganization = await confirm({
    message: 'Does your organization provide template manifests?',
    default: false,
  });

  if (hasOrganization) {
    console.log('');
    console.log('💡 Your organization should provide a GitHub repository that contains');
    console.log('   a manifest.yaml file with approved templates. This looks like:');
    console.log('   https://github.com/yourcompany/stamper-templates');
    console.log('');

    let repoUrl: string;
    let urlValid = false;

    do {
      repoUrl = await input({
        message: "Enter your organization's template repository URL:",
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

      repoUrl = repoUrl.trim();

      console.log('');
      console.log('🔍 Testing repository and looking for manifest.yaml...');

      // Test the URL by trying to fetch the manifest
      setOrganizationRepoUrl(repoUrl);
      const manifest = await fetchOrganizationManifest();

      if (manifest) {
        console.log(`✅ Success! Found ${manifest.templates.length} organization template(s)`);
        console.log(`   Organization: ${manifest.name}`);
        if (manifest.description) {
          console.log(`   Description: ${manifest.description}`);
        }
        urlValid = true;
      } else {
        console.log('❌ Could not find manifest.yaml in this repository');
        console.log(
          '   Make sure the repository contains a manifest.yaml file in the root directory'
        );
        const retry = await confirm({
          message: 'Would you like to try a different repository?',
          default: true,
        });

        if (!retry) {
          const continueWithoutOrg = await confirm({
            message: 'Continue setup without organization templates?',
            default: true,
          });

          if (continueWithoutOrg) {
            setOrganizationRepoUrl(undefined);
            urlValid = true;
          } else {
            console.log('Setup cancelled. Run "stamper setup" to try again.');
            return;
          }
        }
      }
    } while (!urlValid);
  } else {
    setOrganizationRepoUrl(undefined);
  }

  markSetupCompleted();

  console.log('');
  console.log('🎉 Setup completed successfully!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   • List templates: stamper list');
  console.log('   • Add your own template: stamper add <name> <github-url>');
  console.log('   • Create a project: stamper create');
  console.log('');
};
