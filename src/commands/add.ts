import { addUserTemplate, getOrganizationTemplates, hasUserTemplate } from '../lib/config.js';

const isValidGitHubUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'github.com' && parsedUrl.pathname.split('/').length >= 3;
  } catch {
    return false;
  }
};

export const addCommand = async (name: string, githubUrl: string) => {
  // Validate template name
  if (!name || name.trim().length === 0) {
    console.error('❌ Error: Template name cannot be empty');
    return;
  }

  const templateName = name.trim();

  // Validate GitHub URL
  if (!isValidGitHubUrl(githubUrl)) {
    console.error('❌ Error: Invalid GitHub URL');
    console.error('   URL must be a valid GitHub repository (e.g., https://github.com/user/repo)');
    return;
  }

  // Check if this conflicts with an organization template
  const orgTemplates = await getOrganizationTemplates();
  const conflictsWithOrg = orgTemplates.some((t) => t.name === templateName);

  if (conflictsWithOrg) {
    console.error(`❌ Error: Template name "${templateName}" is reserved by your organization`);
    console.error(
      '   Organization templates cannot be overridden. Please choose a different name.'
    );
    return;
  }

  // Check for duplicate user template
  if (hasUserTemplate(templateName)) {
    console.log(`⚠️  User template "${templateName}" already exists. Updating URL...`);
  }

  // Add template to user templates
  addUserTemplate({ name: templateName, url: githubUrl });

  console.log(`✅ User template "${templateName}" added successfully!`);
  console.log(`   URL: ${githubUrl}`);
};
