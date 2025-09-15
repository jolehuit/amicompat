import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

describe('CLI Integration Tests', () => {
  const testDir = join(process.cwd(), 'cli-test-project');
  const cliPath = join(process.cwd(), 'dist/cli.js');

  beforeEach(async () => {
    // Ensure project is built
    try {
      await execAsync('npm run build');
    } catch (error) {
      console.warn('Build failed, assuming already built:', error);
    }

    // Create test project
    await mkdir(testDir, { recursive: true });
    await writeFile(
      join(testDir, 'test.js'),
      'const data = user?.profile?.name ?? "Anonymous";'
    );
    await writeFile(
      join(testDir, 'test.css'),
      '@container (min-width: 400px) { .test { display: flex; } }'
    );
    await writeFile(
      join(testDir, 'test.html'),
      '<dialog>Test</dialog><input type="date">'
    );
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('info command', () => {
    it('should display server information', async () => {
      const { stdout, stderr } = await execAsync(`node ${cliPath} info`);

      expect(stdout).toContain('AmICompat MCP Server Information');
      expect(stdout).toContain('Version: 2.0.0');
      expect(stdout).toContain('Architecture: TypeScript Native');
      expect(stdout).toContain('Parsing: AST-based');
      expect(stdout).toContain('Baseline Data: Local via web-features');
      expect(stdout).toContain('Available MCP Tools:');
      expect(stdout).toContain('audit_project');
      expect(stdout).toContain('audit_file');
      expect(stdout).toContain('get_feature_status');
      expect(stdout).toContain('export_last_report');
    });
  });

  describe('test-parse command', () => {
    it('should parse JavaScript files', async () => {
      const jsFile = join(testDir, 'test.js');
      const { stdout } = await execAsync(`node ${cliPath} test-parse ${jsFile}`);

      expect(stdout).toContain('Testing parser on:');
      expect(stdout).toContain('test.js');
      expect(stdout).toContain('File type: js');
      expect(stdout).toContain('Detected');
      expect(stdout).toContain('features:');
    });

    it('should parse CSS files', async () => {
      const cssFile = join(testDir, 'test.css');
      const { stdout } = await execAsync(`node ${cliPath} test-parse ${cssFile}`);

      expect(stdout).toContain('Testing parser on:');
      expect(stdout).toContain('test.css');
      expect(stdout).toContain('File type: css');
      expect(stdout).toContain('Detected');
      expect(stdout).toContain('features:');
    });

    it('should parse HTML files', async () => {
      const htmlFile = join(testDir, 'test.html');
      const { stdout } = await execAsync(`node ${cliPath} test-parse ${htmlFile}`);

      expect(stdout).toContain('Testing parser on:');
      expect(stdout).toContain('test.html');
      expect(stdout).toContain('File type: html');
      expect(stdout).toContain('Detected');
      expect(stdout).toContain('features:');
    });

    it('should handle unsupported file types', async () => {
      const txtFile = join(testDir, 'test.txt');
      await writeFile(txtFile, 'Some text content');

      try {
        await execAsync(`node ${cliPath} test-parse ${txtFile}`);
        expect.fail('Should have thrown for unsupported file type');
      } catch (error: any) {
        expect(error.stderr).toContain('❌ Unsupported file type');
      }
    });

    it('should handle non-existent files', async () => {
      const nonExistentFile = join(testDir, 'non-existent.js');

      try {
        await execAsync(`node ${cliPath} test-parse ${nonExistentFile}`);
        expect.fail('Should have thrown for non-existent file');
      } catch (error: any) {
        expect(error.stderr).toContain('❌ Parse test failed:');
      }
    });
  });

  describe('default server command', () => {
    it('should start server and exit gracefully', async () => {
      // This is tricky to test as the server runs indefinitely
      // We'll just verify it can start without immediate errors
      const child = exec(`node ${cliPath}`, { timeout: 2000 });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data;
      });

      child.stderr?.on('data', (data) => {
        stderr += data;
      });

      // Kill after short delay
      setTimeout(() => {
        child.kill('SIGINT');
      }, 1000);

      try {
        await new Promise((resolve, reject) => {
          child.on('exit', resolve);
          child.on('error', reject);
        });
      } catch {
        // Expected to be killed
      }

      expect(stderr).toContain('🚀 Starting AmICompat MCP Server');
      expect(stderr).toContain('Use Ctrl+C to stop the server');
    });
  });

  describe('CLI error handling', () => {
    it('should handle invalid commands gracefully', async () => {
      try {
        await execAsync(`node ${cliPath} invalid-command`);
        expect.fail('Should have failed for invalid command');
      } catch (error: any) {
        // Command should throw an error for invalid commands
        expect(error).toBeDefined();
        // Should have either an exit code or error message
        expect(error.code !== undefined || error.stderr || error.stdout).toBeTruthy();
      }
    });
  });
});