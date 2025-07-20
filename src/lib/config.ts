import Conf from 'conf';
import yaml from 'js-yaml';

export interface Template {
  name: string;
  url: string;
  description?: string;
}

export interface OrganizationTemplate extends Template {
  readonly: true;
  source: 'organization';
}

export interface UserTemplate extends Template {
  source: 'user';
}

export interface OrganizationManifest {
  name: string;
  description?: string;
  templates: Template[];
}

export interface StamperConfig {
  userTemplates: UserTemplate[];
  organizationRepoUrl?: string;
  lastOrgManifestFetch?: number;
  organizationManifestCache?: OrganizationManifest;
  setupCompleted?: boolean;
}

// GitHub repository URL utilities
const isValidGitHubRepoUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'github.com') {
      return false;
    }

    const pathParts = parsedUrl.pathname.split('/').filter((part) => part.length > 0);
    return pathParts.length >= 2; // Should have at least owner/repo
  } catch {
    return false;
  }
};

const constructManifestUrl = (repoUrl: string, branch = 'main'): string => {
  try {
    const parsedUrl = new URL(repoUrl);
    const pathParts = parsedUrl.pathname.split('/').filter((part) => part.length > 0);

    if (pathParts.length < 2) {
      throw new Error('Invalid repository URL');
    }

    const owner = pathParts[0];
    const repo = pathParts[1];

    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/manifest.yaml`;
  } catch {
    throw new Error('Failed to construct manifest URL');
  }
};

const tryFetchFromBranches = async (
  repoUrl: string
): Promise<{ url: string; content: string } | null> => {
  const branches = ['main', 'master'];

  for (const branch of branches) {
    try {
      const manifestUrl = constructManifestUrl(repoUrl, branch);
      const response = await fetch(manifestUrl);

      if (response.ok) {
        const content = await response.text();
        return { url: manifestUrl, content };
      }
    } catch {
      // Continue to next branch
    }
  }

  return null;
};

const defaultConfig: StamperConfig = {
  userTemplates: [],
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

// Organization template functions
export const fetchOrganizationManifest = async (): Promise<OrganizationManifest | null> => {
  try {
    const repoUrl = config.get('organizationRepoUrl');
    if (!repoUrl) {
      return null;
    }

    const result = await tryFetchFromBranches(repoUrl);
    if (!result) {
      console.warn('⚠️  Could not fetch manifest.yaml from repository');
      console.warn(
        '   Make sure the repository contains a manifest.yaml file in the root directory'
      );
      return null;
    }

    const manifest = yaml.load(result.content) as OrganizationManifest;

    // Cache the manifest with timestamp
    config.set('organizationManifestCache', manifest);
    config.set('lastOrgManifestFetch', Date.now());

    return manifest;
  } catch (error) {
    console.warn(
      '⚠️  Could not fetch organization manifest:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
};

export const getOrganizationTemplates = async (): Promise<OrganizationTemplate[]> => {
  try {
    // Check if we have a cached manifest that's less than 1 hour old
    const lastFetch = config.get('lastOrgManifestFetch', 0);
    const cacheAge = Date.now() - lastFetch;
    const oneHour = 60 * 60 * 1000;

    let manifest = cacheAge < oneHour ? config.get('organizationManifestCache') : null;

    if (!manifest) {
      manifest = await fetchOrganizationManifest();
    }

    if (!manifest) {
      return [];
    }

    return manifest.templates.map((template) => ({
      ...template,
      readonly: true as const,
      source: 'organization' as const,
    }));
  } catch {
    return [];
  }
};

// User template functions
export const getUserTemplates = (): UserTemplate[] => {
  try {
    return config.get('userTemplates', []);
  } catch {
    return handleConfigError('reading user templates');
  }
};

export const getAllTemplates = async (): Promise<(OrganizationTemplate | UserTemplate)[]> => {
  const orgTemplates = await getOrganizationTemplates();
  const userTemplates = getUserTemplates();
  return [...orgTemplates, ...userTemplates];
};

export const addUserTemplate = (template: Omit<UserTemplate, 'source'>): void => {
  try {
    const userTemplates = getUserTemplates();
    const existingIndex = userTemplates.findIndex((t) => t.name === template.name);

    const newTemplate: UserTemplate = {
      ...template,
      source: 'user',
    };

    if (existingIndex >= 0) {
      userTemplates[existingIndex] = newTemplate;
    } else {
      userTemplates.push(newTemplate);
    }

    config.set('userTemplates', userTemplates);
  } catch {
    return handleConfigError('adding user template');
  }
};

export const removeUserTemplate = (name: string): boolean => {
  try {
    const userTemplates = getUserTemplates();
    const filteredTemplates = userTemplates.filter((t) => t.name !== name);

    if (filteredTemplates.length < userTemplates.length) {
      config.set('userTemplates', filteredTemplates);
      return true;
    }

    return false;
  } catch {
    return handleConfigError('removing user template');
  }
};

export const hasUserTemplate = (name: string): boolean => {
  try {
    const userTemplates = getUserTemplates();
    return userTemplates.some((t) => t.name === name);
  } catch {
    return handleConfigError('checking user template');
  }
};

export const hasAnyTemplate = async (name: string): Promise<boolean> => {
  const allTemplates = await getAllTemplates();
  return allTemplates.some((t) => t.name === name);
};

export const getTemplate = async (
  name: string
): Promise<OrganizationTemplate | UserTemplate | null> => {
  const allTemplates = await getAllTemplates();
  return allTemplates.find((t) => t.name === name) || null;
};

// Setup and initialization
export const isSetupCompleted = (): boolean => {
  try {
    return config.get('setupCompleted', false);
  } catch {
    return handleConfigError('checking setup status');
  }
};

export const markSetupCompleted = (): void => {
  try {
    config.set('setupCompleted', true);
  } catch {
    return handleConfigError('marking setup completed');
  }
};

// Organization repository URL management
export const getOrganizationRepoUrl = (): string | undefined => {
  try {
    return config.get('organizationRepoUrl');
  } catch {
    return handleConfigError('reading organization repository URL');
  }
};

export const setOrganizationRepoUrl = (url: string | undefined): void => {
  try {
    if (url) {
      if (!isValidGitHubRepoUrl(url)) {
        throw new Error('Invalid GitHub repository URL');
      }
      config.set('organizationRepoUrl', url);
    } else {
      config.delete('organizationRepoUrl');
    }
    // Clear cache when URL changes
    config.delete('organizationManifestCache');
    config.delete('lastOrgManifestFetch');
  } catch {
    return handleConfigError('setting organization repository URL');
  }
};

// Export validation function for use in commands
export const validateGitHubRepoUrl = isValidGitHubRepoUrl;

export const refreshOrganizationManifest = async (): Promise<boolean> => {
  try {
    // Clear cache to force refresh
    config.delete('organizationManifestCache');
    config.delete('lastOrgManifestFetch');

    const manifest = await fetchOrganizationManifest();
    return manifest !== null;
  } catch {
    return false;
  }
};

// Legacy functions for backward compatibility
export const getTemplates = getUserTemplates;
export const addTemplate = addUserTemplate;
export const removeTemplate = removeUserTemplate;
export const hasTemplate = hasUserTemplate;
