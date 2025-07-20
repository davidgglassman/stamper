import { simpleGit, SimpleGit } from 'simple-git';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Ora } from 'ora';

export class GitManager {
  private git: SimpleGit;
  private tempDir?: string;

  constructor() {
    this.git = simpleGit();
  }

  /**
   * Creates a temporary directory for git operations
   */
  async createTempDir(): Promise<string> {
    const tempPrefix = join(tmpdir(), 'stamper-');
    this.tempDir = await mkdtemp(tempPrefix);
    return this.tempDir;
  }

  /**
   * Clones a repository to a temporary directory, excluding the .git folder
   */
  async cloneTemplate(repoUrl: string, progressSpinner?: Ora): Promise<string> {
    try {
      if (progressSpinner) {
        progressSpinner.text = 'Creating temporary directory...';
      }
      
      if (!this.tempDir) {
        await this.createTempDir();
      }

      const cloneDir = join(this.tempDir!, 'template');
      
      if (progressSpinner) {
        progressSpinner.text = `Cloning repository from ${this.shortenUrl(repoUrl)}...`;
      }
      
      // Clone the repository
      await this.git.clone(repoUrl, cloneDir, ['--depth', '1']);
      
      if (progressSpinner) {
        progressSpinner.text = 'Cleaning up git metadata...';
      }
      
      // Remove the .git directory to exclude version control
      const gitDir = join(cloneDir, '.git');
      await rm(gitDir, { recursive: true, force: true });
      
      if (progressSpinner) {
        progressSpinner.text = 'Template cloned successfully';
      }
      
      return cloneDir;
    } catch (error) {
      if (progressSpinner) {
        progressSpinner.fail('Failed to clone template repository');
      }
      
      // Enhanced error messages
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          throw new Error(`Repository not found: ${repoUrl}\nPlease check that the URL is correct and the repository exists.`);
        }
        if (error.message.includes('Authentication failed') || error.message.includes('Permission denied')) {
          throw new Error(`Access denied to repository: ${repoUrl}\nPlease check that the repository is public or you have access rights.`);
        }
        if (error.message.includes('network') || error.message.includes('connection')) {
          throw new Error(`Network error while cloning: ${repoUrl}\nPlease check your internet connection and try again.`);
        }
      }
      
      throw new Error(`Failed to clone repository: ${repoUrl}\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cleans up temporary directories
   */
  async cleanup(): Promise<void> {
    if (this.tempDir) {
      await rm(this.tempDir, { recursive: true, force: true });
      this.tempDir = undefined;
    }
  }

  /**
   * Gets the temporary directory path
   */
  getTempDir(): string | undefined {
    return this.tempDir;
  }

  /**
   * Shortens a URL for display purposes
   */
  private shortenUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length >= 2) {
        return `${pathParts[0]}/${pathParts[1]}`;
      }
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
}

/**
 * Validates if a URL appears to be a valid GitHub repository URL
 */
export const validateGitHubUrl = (url: string): boolean => {
  const githubPattern = /^https:\/\/github\.com\/[\w\-.]+\/[\w\-.]+\/?$/;
  return githubPattern.test(url);
};

/**
 * Normalizes a GitHub URL to ensure consistent format
 */
export const normalizeGitHubUrl = (url: string): string => {
  // Remove trailing slash if present
  return url.replace(/\/$/, '');
};