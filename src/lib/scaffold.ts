import nunjucks from 'nunjucks';
import { resolve } from 'path';
import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import type { AnswerMap } from './questions.js';

export interface ScaffoldOptions {
  sourceDir: string;
  outputDir: string;
  variables: AnswerMap;
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

const processTemplate = (content: string, variables: AnswerMap): string => {
  // Configure Nunjucks environment
  const env = new nunjucks.Environment();
  
  // Render the template with variables
  return env.renderString(content, variables);
};

const copyFile = async (sourcePath: string, destPath: string): Promise<void> => {
  const content = await readFile(sourcePath);
  await writeFile(destPath, content);
};

const processFile = async (
  sourcePath: string,
  destPath: string,
  variables: AnswerMap
): Promise<void> => {
  const content = await readFile(sourcePath, 'utf-8');
  const processedContent = processTemplate(content, variables);
  await writeFile(destPath, processedContent, 'utf-8');
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
  variables: AnswerMap
): Promise<void> => {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = resolve(sourceDir, entry.name);
    
    if (entry.isDirectory()) {
      // Handle subdirectories recursively
      const outputSubDir = resolve(outputDir, entry.name);
      await ensureDirectoryExists(outputSubDir);
      await scaffoldDirectory(sourcePath, outputSubDir, variables);
    } else if (entry.isFile()) {
      // Handle files
      const outputFilename = getOutputFilename(entry.name);
      const destPath = resolve(outputDir, outputFilename);
      
      if (isNunjucksFile(entry.name)) {
        // Process Nunjucks template
        await processFile(sourcePath, destPath, variables);
      } else {
        // Copy file as-is
        await copyFile(sourcePath, destPath);
      }
    }
  }
};

export const scaffoldTemplate = async (options: ScaffoldOptions): Promise<void> => {
  const { sourceDir, outputDir, variables } = options;

  // Verify source directory exists
  try {
    const sourceStat = await stat(sourceDir);
    if (!sourceStat.isDirectory()) {
      throw new Error(`Source path is not a directory: ${sourceDir}`);
    }
  } catch {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  // Ensure output directory exists
  await ensureDirectoryExists(outputDir);

  // Start scaffolding
  await scaffoldDirectory(sourceDir, outputDir, variables);
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