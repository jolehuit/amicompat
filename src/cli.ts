#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';

// Get package.json for version info

async function getPackageVersion(): Promise<string> {
  try {
    // Use Node's resolver to load JSON reliably in ESM
    const require = createRequire(import.meta.url);
    const pkg = require('../package.json');
    if (pkg && typeof pkg.version === 'string' && pkg.version.length > 0) {
      return pkg.version as string;
    }
    throw new Error('package.json is missing a valid version');
  } catch (err) {
    throw new Error(`Unable to read package version: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  const version = await getPackageVersion();

  const program = new Command();

  program
    .name('amicompat-mcp')
    .description('AmICompat MCP Server - Web Baseline Compatibility Auditor')
    .version(version);

  program
    .command('server')
    .description('Start the MCP server')
    .action(async () => {
      console.error(chalk.blue.bold('🚀 Starting AmICompat MCP Server...'));
      console.error(chalk.gray('Use Ctrl+C to stop the server\n'));

      // Import and start the server
      await import('./server.js');
      // The server will be started automatically via the main() call in server.ts
    });

  // Add help command if no arguments provided
  if (process.argv.length === 2) {
    process.argv.push('server'); // Default to server command
  }

  program
    .command('info')
    .description('Show server information')
    .action(() => {
      console.log(chalk.blue.bold('📋 AmICompat MCP Server Information\n'));

      console.log(chalk.cyan('Version:'), version);
      console.log(chalk.cyan('Architecture:'), 'TypeScript Native');
      console.log(chalk.cyan('Parsing:'), 'ESLint-based feature detection');
      console.log(chalk.cyan('Baseline Data:'), 'Local via web-features');
      console.log(chalk.cyan('Validation:'), 'Zod schemas');
      console.log('');

      console.log(chalk.green.bold('🛠️  Available MCP Tools:'));
      console.log(chalk.green('  • audit_project') + ' - Comprehensive project audit (with --export option)');
      console.log(chalk.green('  • audit_file') + ' - Single file analysis');
      console.log('');

      console.log(chalk.yellow.bold('📁 Supported File Types:'));
      console.log(chalk.yellow('  • CSS:'), '.css, .scss, .sass');
      console.log(chalk.yellow('  • HTML:'), '.html, .htm');
      console.log('');

      console.log(chalk.magenta.bold('🔧 Configuration:'));
      console.log(chalk.magenta('Set environment variables in your MCP client config:'));
      console.log(chalk.gray('  AMICOMPAT_DEFAULT_TARGET=widely'));
      console.log(chalk.gray('  AMICOMPAT_MAX_FILES=10000'));
      console.log(chalk.gray('  AMICOMPAT_MAX_CONCURRENCY=5'));
    });
    
  program
  .command('audit')
  .description('Audit project for web baseline compatibility')
  .argument('<project>', 'Project directory path')
  .option('--target <target>', 'Baseline target', 'widely')
  .option('--export <path>', 'Export report to JSON file')
  .action(async (projectPath: string, options) => {
    try {
      console.log(chalk.blue.bold(`🔍 Auditing project: ${projectPath}\n`));

      const { MCPTools } = await import('./tools/index.js');
      const tools = new MCPTools();

      const result = await tools.auditProject({
        project_path: projectPath,
        target: options.target,
        max_files: 10000,
        export_path: options.export
      });

      console.log(result.content[0]?.text || 'No content available');

    } catch (error) {
      console.error(chalk.red('❌ Audit failed:'), error);
      process.exit(1);
    }
  });


  program
    .command('audit-file')
    .description('Audit single file for web features')
    .argument('<file>', 'Path to CSS/HTML file')
    .action(async (filePath: string) => {
      try {
        console.log(chalk.blue.bold(`📄 Auditing file: ${filePath}\n`));

        const { MCPTools } = await import('./tools/index.js');
        const tools = new MCPTools();

        const result = await tools.auditFile({
          file_path: filePath,
        });

        console.log(result.content[0]?.text?.replace(/\\n/g, '\n') || 'No content available');

      } catch (error) {
        console.error(chalk.red('❌ File audit failed:'), error);
        process.exit(1);
      }
    });


  program
    .command('test-parse')
    .description('Test parsing capabilities on a file')
    .argument('<file>', 'File path to test')
    .action(async (filePath: string) => {
      try {
        console.log(chalk.blue.bold(`🧪 Testing parser on: ${filePath}\n`));

        const { ESLintFeatureDetector } = await import('./lib/eslint-wrapper.js');
        const { readFile } = await import('fs/promises');

        const detector = new ESLintFeatureDetector();
        const content = await readFile(filePath, 'utf-8');
        const fileType = detectFileType(filePath);

        if (!fileType) {
          console.error(chalk.red('❌ Unsupported file type'));
          process.exit(1);
        }

        console.log(chalk.cyan('File type:'), fileType);
        console.log(chalk.cyan('Content length:'), content.length, 'characters\n');

        const features = await detector.detectFeatures({
          file_path: filePath,
          content,
          file_type: fileType,
        });

        if (features.length === 0) {
          console.log(chalk.yellow('⚠️  No modern web features detected'));
        } else {
          console.log(chalk.green.bold(`✅ Detected ${features.length} features:\n`));
          features.forEach((feature, index) => {
            console.log(chalk.green(`${index + 1}.`), `${feature.feature_name} - Line ${feature.location.line}:${feature.location.column}`);
            console.log(chalk.gray(`   ${feature.location.context.trim()}\n`));
          });
        }

      } catch (error) {
        console.error(chalk.red('❌ Parse test failed:'), error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}


/**
 * Detect file type from extension
 */
function detectFileType(filePath: string): any {
  const extension = filePath.split('.').pop()?.toLowerCase();

  const typeMap: Record<string, string> = {
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'html': 'html',
    'htm': 'html',
  };

  return extension ? typeMap[extension] || null : null;
}

main().catch((error) => {
  console.error(chalk.red('❌ CLI error:'), error);
  process.exit(1);
});
