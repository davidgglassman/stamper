import { removeUserTemplate, hasUserTemplate, getOrganizationTemplates } from '../lib/config.js';

export const removeCommand = async (name: string) => {
  if (!name || name.trim().length === 0) {
    console.error('❌ Error: Template name cannot be empty');
    return;
  }

  const templateName = name.trim();

  // Check if this is an organization template
  const orgTemplates = await getOrganizationTemplates();
  const isOrgTemplate = orgTemplates.some(t => t.name === templateName);
  
  if (isOrgTemplate) {
    console.error(`❌ Error: Cannot remove organization template "${templateName}"`);
    console.error('   Organization templates are read-only and managed by your organization.');
    return;
  }

  // Check if user template exists
  if (!hasUserTemplate(templateName)) {
    console.error(`❌ Error: User template "${templateName}" not found`);
    console.log('');
    console.log('💡 List available templates with:');
    console.log('   stamper list');
    return;
  }

  // Remove user template
  const removed = removeUserTemplate(templateName);
  
  if (removed) {
    console.log(`✅ User template "${templateName}" removed successfully!`);
  } else {
    console.error(`❌ Error: Failed to remove template "${templateName}"`);
  }
};