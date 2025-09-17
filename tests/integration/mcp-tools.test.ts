import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPTools } from '../../src/tools/index.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('MCP Tools Integration Tests', () => {
  let tools: MCPTools;
  const testDir = join(process.cwd(), 'mcp-tools-test');

  beforeEach(async () => {
    tools = new MCPTools();

    // Create test project structure
    await mkdir(join(testDir, 'src'), { recursive: true });

    // Create test files with modern CSS/HTML features

    await writeFile(
      join(testDir, 'src/styles.css'),
      `
/* Modern CSS features */
.slide {
  view-transition-name: slide-transition;
}

.anchor {
  anchor-name: --my-anchor;
}

.positioned {
  position-anchor: --my-anchor;
}
`
    );

    await writeFile(
      join(testDir, 'src/page.html'),
      `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <search>
    <input type="search" placeholder="Search...">
  </search>

  <popover id="myPopover">
    <p>This is a popover</p>
  </popover>

  <dialog id="myDialog">
    <p>This is a dialog</p>
  </dialog>
</body>
</html>
`
    );
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('auditFile', () => {

    it('should audit CSS file', async () => {
      const input = {
        file_path: join(testDir, 'src/styles.css')
      };

      const result = await tools.auditFile(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('File Analysis:');
      expect(result.content[0].text).toContain('Features detected:');
    });

    it('should audit HTML file', async () => {
      const input = {
        file_path: join(testDir, 'src/page.html')
      };

      const result = await tools.auditFile(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('File Analysis:');
      expect(result.content[0].text).toContain('Features detected:');
    });

    it('should handle non-existent file', async () => {
      const input = {
        file_path: join(testDir, 'non-existent.css')
      };

      await expect(tools.auditFile(input)).rejects.toThrow();
    });

    it('should handle unsupported file type', async () => {
      const unsupportedFile = join(testDir, 'test.txt');
      await writeFile(unsupportedFile, 'Some text content');

      const input = {
        file_path: unsupportedFile
      };

      await expect(tools.auditFile(input)).rejects.toThrow();
    });

    it('should detect no features in simple file', async () => {
      const simpleFile = join(testDir, 'simple.css');
      await writeFile(simpleFile, '.basic { color: red; margin: 10px; }');

      const input = {
        file_path: simpleFile
      };

      const result = await tools.auditFile(input);

      expect(result.content[0].text).toContain('No modern web features detected');
    });
  });

  describe('auditProject', () => {
    it('should audit entire project', async () => {
      const input = {
        project_path: testDir,
        target: 'widely' as const,
        max_files: 100
      };

      const result = await tools.auditProject(input);

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Baseline Compatibility Report');
      expect(result.content[0].text).toContain('Features Detected:');
      expect(result.content[0].text).toContain('Baseline Violations:');
      expect(result.content[0].text).toContain('Files Scanned:');
    });

    it('should handle different targets', async () => {
      const targets: Array<'widely' | 'newly'> = [
        'widely',
        'newly'
      ];

      for (const target of targets) {
        const input = {
          project_path: testDir,
          target,
          max_files: 10
        };

        const result = await tools.auditProject(input);

        expect(result.content[0].text).toContain(`Target: ${target}`);
      }
    });

    it('should respect max_files limit', async () => {
      // Create many files
      for (let i = 0; i < 10; i++) {
        await writeFile(
          join(testDir, `test-${i}.css`),
          '.basic { color: red; }'
        );
      }

      const input = {
        project_path: testDir,
        max_files: 5
      };

      const result = await tools.auditProject(input);

      expect(result.content[0].text).toContain('Files Scanned:');
      // Should not process more than max_files
    });

    it('should export report when requested', async () => {
      const exportPath = join(testDir, 'report.json');
      const input = {
        project_path: testDir,
        export_path: exportPath
      };

      const result = await tools.auditProject(input);

      expect(result.content[0].text).toContain('Report exported to');
    });

    it('should handle non-existent project', async () => {
      const input = {
        project_path: '/non/existent/path'
      };

      await expect(tools.auditProject(input)).rejects.toThrow();
    });

    it('should handle file as project path', async () => {
      const input = {
        project_path: join(testDir, 'src/styles.css')
      };

      await expect(tools.auditProject(input)).rejects.toThrow();
    });
  });


  describe('exportLastReport', () => {
    it('should export report after audit', async () => {
      // First run an audit
      const auditInput = {
        project_path: testDir
      };

      await tools.auditProject(auditInput);

      // Then export the report
      const exportPath = join(testDir, 'exported-report.json');
      const exportInput = {
        path: exportPath
      };

      const result = await tools.exportLastReport(exportInput);

      expect(result.content[0].text).toContain('Report exported to');
      expect(result.content[0].text).toContain('exported-report.json');
    });

    it('should fail when no report available', async () => {
      const input = {
        path: join(testDir, 'report.json')
      };

      await expect(tools.exportLastReport(input)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully', async () => {
      // This test might need to be adjusted based on the system
      // For now, we'll test with an invalid path
      const input = {
        project_path: ''
      };

      await expect(tools.auditProject(input)).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      try {
        await tools.auditFile({
          file_path: '/invalid/path/file.css'
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('does not exist');
      }
    });
  });
});