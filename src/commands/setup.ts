// ---------------------- Imports

import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import {
  fetchOrganizationManifest,
  markSetupCompleted,
  setOrganizationRepoUrl,
  validateGitHubRepoUrl,
} from '../lib/config.js';
import { print } from '../utils/print.js';

// ---------------------- Command Handler

export const setupCommand = async () => {
  // ---------- Welcome Messages

  print.line('🚀 Welcome to Stamper!');
  print.line("Let's set up your template configuration.");

  // ---------- Organization Templates Available

  const hasOrganization = await confirm({
    message: 'Does your organization provide template manifests?',
    default: false,
  });

  if (hasOrganization) {
    // ---------- Organization Setup

    print.line('💡 Your organization should provide a GitHub repository that contains', false);
    print.line('   a manifest.yaml file with approved templates. This looks like:', false);
    print.line('   https://github.com/yourcompany/stamper-templates');

    let repoUrl: string;
    let urlValid = false;

    // ----- Repo URL Validation Loop

    do {
      // ----- Get Repo URL from User

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

      setOrganizationRepoUrl(repoUrl);

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

        urlValid = true;
      } else {
        // ----- Error / No Manifest

        print.error(
          'Could not find manifest.yaml in this repository',
          'Make sure the repository contains a manifest.yaml file in the root directory'
        );

        // ----- Retry different repo?

        const retry = await confirm({
          message: 'Would you like to try a different repository?',
          default: true,
        });

        // ----- No Retry

        if (!retry) {
          // ----- Continue without org?

          const continueWithoutOrg = await confirm({
            message: 'Continue setup without organization templates?',
            default: true,
          });

          if (continueWithoutOrg) {
            setOrganizationRepoUrl(undefined);
            urlValid = true;
          } else {
            print.line('Setup cancelled. Run "stamper setup" to try again.');
            return;
          }
        }
      }
    } while (!urlValid);
  } else {
    // ---------- No Organization

    setOrganizationRepoUrl(undefined);
  }

  // ---------- Setup Complete

  markSetupCompleted();

  print.line('🎉 Setup completed successfully!');
  print.line('💡 Next steps:', false);
  print.line('   • List templates: stamper list', false);
  print.line('   • Add your own template: stamper add <name> <github-url>', false);
  print.line('   • Create a project: stamper create');
};
