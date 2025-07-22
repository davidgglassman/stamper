// ---------------------- Imports

import { getOrganizationTemplates, hasUserTemplate, removeUserTemplate } from '../lib/config.js';
import { print } from '../utils/print.js';

// ---------------------- Command Handler

export const removeCommand = async (name: string) => {
  // ---------- Input Validation

  if (!name || name.trim().length === 0) {
    print.error('Template name cannot be empty!');
    return;
  }

  const templateName = name.trim();

  // ---------- Protect Organization Templates

  const orgTemplates = await getOrganizationTemplates();
  const isOrgTemplate = orgTemplates.some((t) => t.name === templateName);

  if (isOrgTemplate) {
    print.error(
      `Cannot remove organization template: ${templateName}`,
      'Organization templates are read-only and managed by your organization.'
    );
    return;
  }

  // ---------- Confirm User Template Exists

  if (!hasUserTemplate(templateName)) {
    print.error(`User template not found: ${templateName}`);
    print.fullLine('💡 List available templates with: ');
    console.log('💡 To check available templates: stamper list');
    return;
  }

  // ---------- Remove Template

  const removed = removeUserTemplate(templateName);

  if (removed) {
    print.success(`User template removed successfully: ${templateName}`);
  } else {
    print.error(`Failed to remove template: ${templateName}`);
  }
};
