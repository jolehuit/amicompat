import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileWalker } from '../../src/lib/walker.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('FileWalker', () => {
  let walker: FileWalker;
  const testDir = join(process.cwd(), 'test-project');

  beforeEach(async () => {
    walker = new FileWalker();

    // Create test directory structure
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'src'), { recursive: true });
    await mkdir(join(testDir, 'node_modules'), { recursive: true });
    await mkdir(join(testDir, 'dist'), { recursive: true });

    // Create test files
    await writeFile(join(testDir, 'src/index.js'), 'console.log("test");');
    await writeFile(join(testDir, 'src/style.css'), '.test { color: red; }');
    await writeFile(join(testDir, 'src/page.html'), '<h1>Test</h1>');
    await writeFile(join(testDir, 'src/types.ts'), 'interface Test {}');
    await writeFile(join(testDir, 'src/component.tsx'), 'const Test = () => <div/>;');
    await writeFile(join(testDir, 'README.md'), '# Test Project');
    await writeFile(join(testDir, 'package.json'), '{"name": "test"}');
    await writeFile(join(testDir, 'node_modules/lib.js'), 'module.exports = {};');
    await writeFile(join(testDir, 'dist/bundle.js'), 'console.log("bundled");');
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('walkDirectory', () => {
    it('should find supported files', async () => {
      const options = {
        maxFiles: 100,
        supportedExtensions: ['.js', '.css', '.html', '.ts', '.tsx'],
        ignorePatterns: []
      };

      const files = await walker.walkDirectory(testDir, options);

      expect(files.length).toBeGreaterThan(0);

      const filenames = files.map(f => f.relativePath);
      expect(filenames.some(f => f.includes('index.js'))).toBe(true);
      expect(filenames.some(f => f.includes('style.css'))).toBe(true);
      expect(filenames.some(f => f.includes('page.html'))).toBe(true);
      expect(filenames.some(f => f.includes('types.ts'))).toBe(true);
      expect(filenames.some(f => f.includes('component.tsx'))).toBe(true);
    });

    it('should ignore node_modules by default', async () => {
      const options = {
        maxFiles: 100,
        supportedExtensions: ['.js'],
        ignorePatterns: []
      };

      const files = await walker.walkDirectory(testDir, options);

      const filenames = files.map(f => f.relativePath);
      expect(filenames.some(f => f.includes('node_modules'))).toBe(false);
    });

    it('should ignore dist directory by default', async () => {
      const options = {
        maxFiles: 100,
        supportedExtensions: ['.js'],
        ignorePatterns: []
      };

      const files = await walker.walkDirectory(testDir, options);

      const filenames = files.map(f => f.relativePath);
      expect(filenames.some(f => f.includes('dist'))).toBe(false);
    });

    it('should respect maxFiles limit', async () => {
      const options = {
        maxFiles: 2,
        supportedExtensions: ['.js', '.css', '.html', '.ts', '.tsx'],
        ignorePatterns: []
      };

      const files = await walker.walkDirectory(testDir, options);

      expect(files.length).toBeLessThanOrEqual(2);
    });

    it('should filter by supported extensions', async () => {
      const options = {
        maxFiles: 100,
        supportedExtensions: ['.js'],
        ignorePatterns: []
      };

      const files = await walker.walkDirectory(testDir, options);

      files.forEach(file => {
        expect(file.path.endsWith('.js')).toBe(true);
      });
    });

    it('should respect custom ignore patterns', async () => {
      const options = {
        maxFiles: 100,
        supportedExtensions: ['.js', '.ts'],
        ignorePatterns: ['*.ts']
      };

      const files = await walker.walkDirectory(testDir, options);

      const filenames = files.map(f => f.relativePath);
      expect(filenames.some(f => f.endsWith('.ts'))).toBe(false);
    });
  });

  describe('readFileContent', () => {
    it('should read file content', async () => {
      const filePath = join(testDir, 'src/index.js');
      const content = await walker.readFileContent(filePath);

      expect(content).toBe('console.log("test");');
    });

    it('should throw for non-existent file', async () => {
      const filePath = join(testDir, 'non-existent.js');

      await expect(walker.readFileContent(filePath)).rejects.toThrow();
    });
  });

  describe('getFileStats', () => {
    it('should return file stats', async () => {
      const filePath = join(testDir, 'src/index.js');
      const stats = await walker.getFileStats(filePath);

      expect(stats).toBeDefined();
      expect(stats?.size).toBeGreaterThan(0);
      expect(stats?.modified).toBeInstanceOf(Date);
    });

    it('should return null for non-existent file', async () => {
      const filePath = join(testDir, 'non-existent.js');
      const stats = await walker.getFileStats(filePath);

      expect(stats).toBe(null);
    });
  });

  describe('isDirectory', () => {
    it('should return true for directory', async () => {
      const result = await walker.isDirectory(testDir);
      expect(result).toBe(true);
    });

    it('should return false for file', async () => {
      const filePath = join(testDir, 'src/index.js');
      const result = await walker.isDirectory(filePath);
      expect(result).toBe(false);
    });

    it('should return false for non-existent path', async () => {
      const result = await walker.isDirectory('/non/existent/path');
      expect(result).toBe(false);
    });
  });

  describe('pathExists', () => {
    it('should return true for existing path', async () => {
      const result = await walker.pathExists(testDir);
      expect(result).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      const result = await walker.pathExists('/non/existent/path');
      expect(result).toBe(false);
    });
  });
});