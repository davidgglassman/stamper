import chalk from 'chalk';
import { getOrganizationTemplates, getUserTemplates, Template } from '../lib/config.js';
import { print } from '../utils/print.js';

// ---------------------- Helpers

const printTemplateSection = (title: string, subtitle: string = '', templates: Template[]) => {
  if (templates.length > 0) {
    const st: string = subtitle ? `(${subtitle})` : '';

    print.fullLine(`${chalk.bold(title)} ${st}`);

    templates.forEach((template) => {
      print.line(`   • ${chalk.whiteBright('Name')}: ${template.name}`);

      if (template.description) {
        print.line(`     ${chalk.whiteBright('Description')}: ${template.description}`);
      }

      print.fullLine(`     ${chalk.whiteBright('URL')}: ${template.url}`);
    });
  }
};

// ---------------------- Command Handler

export const listCommand = async () => {
  // ---------- Get Templates

  const orgTemplates = await getOrganizationTemplates();
  const userTemplates = getUserTemplates();

  // ---------- No Templates Found

  if (orgTemplates.length === 0 && userTemplates.length === 0) {
    print.fullLine('📭 No templates available');
    print.line('💡 Link an organization with templates or add a custom template with:');
    print.fullLine('      stamper add <name> <github-url>');
    return;
  }

  // ---------- Display Found Template Information

  // ----- Header

  print.fullLine('📋 Available Templates');

  // ----- Organization Templates Section

  printTemplateSection('Organization', 'read-only', orgTemplates);

  // ----- User Templates Section

  printTemplateSection('User', 'custom', userTemplates);

  // ----- Summary

  const totalCount = orgTemplates.length + userTemplates.length;

  print.fullLine(
    `${chalk.bold('Total')}: ${totalCount} template${totalCount === 1 ? '' : 's'} available`
  );
};
