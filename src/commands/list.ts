import { getOrganizationTemplates, getUserTemplates } from '../lib/config.js';

export const listCommand = async () => {
  const orgTemplates = await getOrganizationTemplates();
  const userTemplates = getUserTemplates();

  if (orgTemplates.length === 0 && userTemplates.length === 0) {
    console.log('📭 No templates available');
    console.log('');
    console.log('💡 Add a template with:');
    console.log('   stamper add <name> <github-url>');
    return;
  }

  console.log('📋 Available Templates');
  console.log('');

  if (orgTemplates.length > 0) {
    console.log('🏢 Organization Templates (read-only):');
    orgTemplates.forEach((template) => {
      console.log(`   • ${template.name}`);
      if (template.description) {
        console.log(`     ${template.description}`);
      }
      console.log(`     ${template.url}`);
    });
    console.log('');
  }

  if (userTemplates.length > 0) {
    console.log('👤 User Templates:');
    userTemplates.forEach((template) => {
      console.log(`   • ${template.name}`);
      if (template.description) {
        console.log(`     ${template.description}`);
      }
      console.log(`     ${template.url}`);
    });
    console.log('');
  }

  const totalCount = orgTemplates.length + userTemplates.length;
  console.log(`Total: ${totalCount} template${totalCount === 1 ? '' : 's'} available`);
};
