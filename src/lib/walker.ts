import { readdir, stat, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { FileType } from '../types/index.js';

export interface WalkOptions {
  maxFiles: number;
  supportedExtensions: string[];
  ignorePatterns: string[];
}

export interface FileInfo {
  path: string;
  relativePath: string;
  fileType: FileType;
  size: number;
}

/**
 * File system walker with proper async handling and limits
 */
export class FileWalker {
  private readonly defaultIgnorePatterns = [
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'coverage',
    '.nyc_output',
    '.cache',
    'tmp',
    'temp',
    '*.min.js',
    '*.min.css',
    'vendor',
  ];

  async walkDirectory(
    projectPath: string,
    options: WalkOptions
  ): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const ignorePatterns = [...this.defaultIgnorePatterns, ...options.ignorePatterns];

    await this.walkRecursive(
      projectPath,
      projectPath,
      files,
      options,
      ignorePatterns
    );

    return files.slice(0, options.maxFiles);
  }

  private async walkRecursive(
    currentPath: string,
    basePath: string,
    files: FileInfo[],
    options: WalkOptions,
    ignorePatterns: string[]
  ): Promise<void> {
    if (files.length >= options.maxFiles) {
      return;
    }

    try {
      const entries = await readdir(currentPath);

      for (const entry of entries) {
        if (files.length >= options.maxFiles) {
          break;
        }

        const fullPath = join(currentPath, entry);
        const relativePath = relative(basePath, fullPath);

        // Check ignore patterns
        if (this.shouldIgnore(relativePath, entry, ignorePatterns)) {
          continue;
        }

        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await this.walkRecursive(fullPath, basePath, files, options, ignorePatterns);
        } else if (stats.isFile()) {
          const fileType = this.detectFileType(entry);

          if (fileType && this.isSupportedExtension(entry, options.supportedExtensions)) {
            files.push({
              path: fullPath,
              relativePath,
              fileType,
              size: stats.size,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${currentPath}:`, error);
    }
  }

  private shouldIgnore(relativePath: string, filename: string, ignorePatterns: string[]): boolean {
    for (const pattern of ignorePatterns) {
      if (pattern.startsWith('*')) {
        // Glob pattern
        const extension = pattern.slice(1);
        if (filename.endsWith(extension)) {
          return true;
        }
      } else {
        // Directory or file pattern
        if (relativePath.includes(pattern) || filename === pattern) {
          return true;
        }
      }
    }
    return false;
  }

  private isSupportedExtension(filename: string, supportedExtensions: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? supportedExtensions.includes(`.${extension}`) : false;
  }

  private detectFileType(filename: string): FileType | null {
    const extension = filename.split('.').pop()?.toLowerCase();

    const typeMap: Record<string, FileType> = {
      'js': 'js',
      'mjs': 'js',
      'cjs': 'js',
      'jsx': 'jsx',
      'ts': 'ts',
      'mts': 'ts',
      'cts': 'ts',
      'tsx': 'tsx',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'html': 'html',
      'htm': 'html',
    };

    return extension ? typeMap[extension] || null : null;
  }

  /**
   * Read file content with encoding detection
   */
  async readFileContent(filePath: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf-8');
    } catch (error) {
      console.warn(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<{ size: number; modified: Date } | null> {
    try {
      const stats = await stat(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
      };
    } catch (error) {
      console.warn(`Error getting stats for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Check if path is a directory
   */
  async isDirectory(path: string): Promise<boolean> {
    try {
      const stats = await stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if path exists and is accessible
   */
  async pathExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }
}