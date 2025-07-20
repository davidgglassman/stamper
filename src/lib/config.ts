import Conf from 'conf';

export interface Template {
  name: string;
  url: string;
}

export interface StamperConfig {
  templates: Template[];
}

const defaultConfig: StamperConfig = {
  templates: [],
};

let config: Conf<StamperConfig>;
let configError: string | null = null;

try {
  config = new Conf<StamperConfig>({
    projectName: 'stamper',
    defaults: defaultConfig,
  });
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  configError = `Failed to initialize configuration: ${errorMessage}`;
  
  console.error('❌ Configuration Error:');
  console.error(`   ${configError}`);
  console.error('');
  console.error('💡 Possible solutions:');
  console.error('   • Check that you have write permissions to your home directory');
  console.error('   • Ensure sufficient disk space is available');
  console.error('   • Try running as administrator/sudo if permission issues persist');
  console.error('');
  
  process.exit(1);
}

const handleConfigError = (operation: string): never => {
  console.error(`❌ Configuration Error during ${operation}:`);
  console.error(`   Unable to access configuration file`);
  console.error('');
  console.error('💡 Try running the command again or check file permissions');
  process.exit(1);
};

export const getTemplates = (): Template[] => {
  try {
    return config.get('templates', []);
  } catch {
    return handleConfigError('reading templates');
  }
};

export const addTemplate = (template: Template): void => {
  try {
    const templates = getTemplates();
    const existingIndex = templates.findIndex(t => t.name === template.name);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    
    config.set('templates', templates);
  } catch {
    return handleConfigError('adding template');
  }
};

export const removeTemplate = (name: string): boolean => {
  try {
    const templates = getTemplates();
    const filteredTemplates = templates.filter(t => t.name !== name);
    
    if (filteredTemplates.length < templates.length) {
      config.set('templates', filteredTemplates);
      return true;
    }
    
    return false;
  } catch {
    return handleConfigError('removing template');
  }
};

export const hasTemplate = (name: string): boolean => {
  try {
    const templates = getTemplates();
    return templates.some(t => t.name === name);
  } catch {
    return handleConfigError('checking template');
  }
};