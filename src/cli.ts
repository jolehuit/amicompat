#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getPackageVersion(): Promise<string> {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
  }
}

async function main(): Promise<void> {
  const version = await getPackageVersion();

  const program = new Command();

  program
    .name('amicompat')
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
      console.log(chalk.green('  • audit_project') + ' - Comprehensive project audit');
      console.log(chalk.green('  • audit_file') + ' - Single file analysis');
      console.log(chalk.green('  • get_feature_status') + ' - Feature Baseline status');
      console.log(chalk.green('  • export_last_report') + ' - Export audit results');
      console.log('');

      console.log(chalk.yellow.bold('📁 Supported File Types:'));
      console.log(chalk.yellow('  • JavaScript:'), '.js, .mjs, .cjs, .jsx');
      console.log(chalk.yellow('  • TypeScript:'), '.ts, .mts, .cts, .tsx');
      console.log(chalk.yellow('  • CSS:'), '.css, .scss, .sass');
      console.log(chalk.yellow('  • HTML:'), '.html, .htm');
      console.log('');

      console.log(chalk.magenta.bold('🔧 Configuration:'));
      console.log(chalk.magenta('Set environment variables in your MCP client config:'));
      console.log(chalk.gray('  AMICOMPAT_DEFAULT_TARGET=baseline-2024'));
      console.log(chalk.gray('  AMICOMPAT_MAX_FILES=10000'));
      console.log(chalk.gray('  AMICOMPAT_MAX_CONCURRENCY=5'));
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

main().catch((error) => {
  console.error(chalk.red('❌ CLI error:'), error);
  process.exit(1);
});