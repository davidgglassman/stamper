import { simpleGit, SimpleGit } from 'simple-git';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

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
  async cloneTemplate(repoUrl: string): Promise<string> {
    if (!this.tempDir) {
      await this.createTempDir();
    }

    const cloneDir = join(this.tempDir!, 'template');
    
    // Clone the repository
    await this.git.clone(repoUrl, cloneDir, ['--depth', '1']);
    
    // Remove the .git directory to exclude version control
    const gitDir = join(cloneDir, '.git');
    await rm(gitDir, { recursive: true, force: true });
    
    return cloneDir;
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