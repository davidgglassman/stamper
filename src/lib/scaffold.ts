import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises';
import nunjucks from 'nunjucks';
import { Ora } from 'ora';
import { resolve } from 'path';
import type { AnswerMap } from './questions.js';

export interface ScaffoldOptions {
  sourceDir: string;
  outputDir: string;
  variables: AnswerMap;
  progressSpinner?: Ora;
}

const isNunjucksFile = (filename: string): boolean => {
  return filename.endsWith('.njk');
};

const getOutputFilename = (filename: string): string => {
  if (isNunjucksFile(filename)) {
    // Remove .njk extension
    return filename.slice(0, -4);
  }
  return filename;
};

const processTemplate = (content: string, variables: AnswerMap, filename?: string): string => {
  try {
    // Configure Nunjucks environment
    const env = new nunjucks.Environment();

    // Render the template with variables
    return env.renderString(content, variables);
  } catch (error) {
    const fileInfo = filename ? ` in ${filename}` : '';
    throw new Error(
      `Template processing failed${fileInfo}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

const copyFile = async (sourcePath: string, destPath: string): Promise<void> => {
  const content = await readFile(sourcePath);
  await writeFile(destPath, content);
};

const processFile = async (
  sourcePath: string,
  destPath: string,
  variables: AnswerMap,
  filename?: string
): Promise<void> => {
  try {
    const content = await readFile(sourcePath, 'utf-8');
    const processedContent = processTemplate(content, variables, filename);
    await writeFile(destPath, processedContent, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to process file ${filename || sourcePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw error;
    }
  }
};

const scaffoldDirectory = async (
  sourceDir: string,
  outputDir: string,
  variables: AnswerMap,
  progressSpinner?: Ora,
  relativePath = ''
): Promise<void> => {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = resolve(sourceDir, entry.name);
    const currentPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (progressSpinner) {
      progressSpinner.text = `Processing ${currentPath}...`;
    }

    if (entry.isDirectory()) {
      // Handle subdirectories recursively
      const outputSubDir = resolve(outputDir, entry.name);
      await ensureDirectoryExists(outputSubDir);
      await scaffoldDirectory(sourcePath, outputSubDir, variables, progressSpinner, currentPath);
    } else if (entry.isFile()) {
      // Handle files
      const outputFilename = getOutputFilename(entry.name);
      const destPath = resolve(outputDir, outputFilename);

      if (isNunjucksFile(entry.name)) {
        // Process Nunjucks template
        await processFile(sourcePath, destPath, variables, entry.name);
      } else {
        // Copy file as-is
        await copyFile(sourcePath, destPath);
      }
    }
  }
};

export const scaffoldTemplate = async (options: ScaffoldOptions): Promise<void> => {
  const { sourceDir, outputDir, variables, progressSpinner } = options;

  try {
    if (progressSpinner) {
      progressSpinner.text = 'Validating source directory...';
    }

    // Verify source directory exists
    try {
      const sourceStat = await stat(sourceDir);
      if (!sourceStat.isDirectory()) {
        throw new Error(`Source path is not a directory: ${sourceDir}`);
      }
    } catch {
      throw new Error(
        `Source directory not found: ${sourceDir}\nPlease check that the template was cloned correctly.`
      );
    }

    if (progressSpinner) {
      progressSpinner.text = 'Creating output directory...';
    }

    // Ensure output directory exists
    await ensureDirectoryExists(outputDir);

    if (progressSpinner) {
      progressSpinner.text = 'Starting template processing...';
    }

    // Start scaffolding
    await scaffoldDirectory(sourceDir, outputDir, variables, progressSpinner);

    if (progressSpinner) {
      progressSpinner.text = 'Template processing completed';
    }
  } catch (error) {
    if (progressSpinner) {
      progressSpinner.fail('Template processing failed');
    }
    throw error;
  }
};

export const getTemplateFiles = async (sourceDir: string): Promise<string[]> => {
  const files: string[] = [];

  const collectFiles = async (dir: string, relativePath = ''): Promise<void> => {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await collectFiles(fullPath, relPath);
      } else if (entry.isFile()) {
        files.push(relPath);
      }
    }
  };

  await collectFiles(sourceDir);
  return files;
};
