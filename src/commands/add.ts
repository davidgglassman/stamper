// ---------------------- Imports

import { addUserTemplate, getOrganizationTemplates, hasUserTemplate } from '../lib/config.js';
import { print } from '../utils/print.js';

// ---------------------- Helpers

const isValidGitHubUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.hostname === 'github.com' && parsedUrl.pathname.split('/').length >= 3;
  } catch {
    return false;
  }
};

// ---------------------- Command Handler

export const addCommand = async (name: string, githubUrl: string) => {
  // ---------- Input Validation

  if (!name || name.trim().length === 0) {
    print.error('Template name cannot be empty!');
    return;
  }

  if (!isValidGitHubUrl(githubUrl)) {
    print.error(
      'Invalid GitHub URL!',
      'URL must be a valid GitHub repository (e.g., https://github.com/user/repo)'
    );
    return;
  }

  const templateName = name.trim();

  // ---------- Protect Organization Templates

  const orgTemplates = await getOrganizationTemplates();
  const conflictsWithOrg = orgTemplates.some((t) => t.name === templateName);

  if (conflictsWithOrg) {
    print.error(
      `Template is reserved by your organization: ${templateName}`,
      'Organization templates cannot be overridden. Please choose a different name.'
    );
    return;
  }

  // ---------- Duplicate Handling

  if (hasUserTemplate(templateName)) {
    print.fullLine(`⚠️ User template already exists: ${templateName}. Updating URL...`);
  }

  // ---------- Template Registration

  addUserTemplate({ name: templateName, url: githubUrl });

  print.success(`User template added successfully: ${templateName} | ${githubUrl}`);
};
