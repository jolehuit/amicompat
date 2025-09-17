import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { writeFile } from 'fs/promises';
// import { join } from 'path'; // unused for now
import chalk from 'chalk';
import {
  AuditProjectInput,
  AuditFileInput,
  GetFeatureStatusInput,
  ExportLastReportInput,
  AuditReport,
  FeatureDetection,
  ParseContext,
  BaselineTarget,
  AuditSummary,
  FileType
} from '../types/index.js';
import { FileWalker } from '../lib/walker.js';
import { ESLintFeatureDetector } from '../lib/eslint-wrapper.js';
import { BaselineCompute } from '../lib/baseline.js';

/**
 * MCP Tools implementation with full TypeScript support
 */
export class MCPTools {
  private fileWalker = new FileWalker();
  private baselineCompute = new BaselineCompute();
  private lastReport: AuditReport | null = null;

  private readonly supportedExtensions = [
    '.js', '.mjs', '.cjs', '.jsx',
    '.ts', '.mts', '.cts', '.tsx',
    '.css', '.scss', '.sass',
    '.html', '.htm'
  ];

  /**
   * Audit entire project for Baseline compatibility
   */
  async auditProject(input: AuditProjectInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    try {
      if (!await this.fileWalker.pathExists(input.project_path)) {
        throw new McpError(ErrorCode.InvalidParams, `Project path does not exist: ${input.project_path}`);
      }

      if (!await this.fileWalker.isDirectory(input.project_path)) {
        throw new McpError(ErrorCode.InvalidParams, `Path is not a directory: ${input.project_path}`);
      }

      console.log(chalk.blue(`🔍 Scanning project: ${input.project_path}`));

      // Walk files
      const files = await this.fileWalker.walkDirectory(input.project_path, {
        maxFiles: input.max_files,
        supportedExtensions: this.supportedExtensions,
        ignorePatterns: [],
      });

      console.log(chalk.green(`📁 Found ${files.length} files to analyze`));

      // Process files and detect features
      const allFeatureDetections: FeatureDetection[] = [];
      let processedCount = 0;

      // Create feature detector with target
      const featureDetector = new ESLintFeatureDetector(input.target);

      for (const file of files) {
        try {
          const content = await this.fileWalker.readFileContent(file.path);
          const context: ParseContext = {
            file_path: file.path,
            content,
            file_type: file.fileType,
          };

          // Use modern ESLint-based feature detection
          const identifiedFeatures = await featureDetector.detectFeatures(context);

          for (const feature of identifiedFeatures) {
            const baselineStatus = await this.baselineCompute.getFeatureStatus(feature.bcd_keys, input.target);

            allFeatureDetections.push({
              feature: feature.feature_name,
              locations: [feature.location],
              baseline_status: baselineStatus,
            });
          }

          processedCount++;
          if (processedCount % 10 === 0) {
            console.log(chalk.yellow(`⚡ Processed ${processedCount}/${files.length} files`));
          }
        } catch (error) {
          console.warn(chalk.red(`❌ Failed to process ${file.path}:`), error);
        }
      }

      // Deduplicate feature detections by {file, line, feature} key
      const deduplicatedDetections = this.deduplicateFeatureDetections(allFeatureDetections);

     // Après la boucle de traitement des fichiers
console.log(`📊 Total feature detections collected: ${allFeatureDetections.length}`);
console.log(`📊 First few features:`, allFeatureDetections.slice(0, 3));

// Generate report with deduplicated detections
const report = await this.generateReport(
  input.project_path,
  input.target,
  deduplicatedDetections,
  files.length
);

console.log(`📊 Report generated with ${report.features_detected.length} features`);

this.lastReport = report;
console.log(`🐛 lastReport saved with ${this.lastReport.features_detected.length} features`);
console.log(`🐛 lastReport global score: ${this.lastReport.global_score}`);

      // Format response
      const summary = this.formatAuditSummary(report);

      // Export if requested
      if (input.export_path) {
        await this.exportReport(report, input.export_path);
        return {
          content: [{
            type: 'text',
            text: summary + `\n✅ Report exported to ${input.export_path}`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };

    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InternalError, `Audit failed: ${error}`);
    }
  }

  /**
   * Audit single file for web features
   */
  async auditFile(input: AuditFileInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    try {
      if (!await this.fileWalker.pathExists(input.file_path)) {
        throw new McpError(ErrorCode.InvalidParams, `File does not exist: ${input.file_path}`);
      }

      const fileType = this.detectFileType(input.file_path);
      if (!fileType) {
        throw new McpError(ErrorCode.InvalidParams, `Unsupported file type: ${input.file_path}`);
      }

      const content = await this.fileWalker.readFileContent(input.file_path);
      const context: ParseContext = {
        file_path: input.file_path,
        content,
        file_type: fileType,
      };

      // Use modern ESLint-based feature detection
      const featureDetector = new ESLintFeatureDetector();
      const identifiedFeatures = await featureDetector.detectFeatures(context);

      if (identifiedFeatures.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No modern web features detected in ${input.file_path}`
          }]
        };
      }

      // Get baseline status for the first detected feature
      const feature = identifiedFeatures[0];
      if (!feature) {
        return {
          content: [{
            type: 'text',
            text: `No valid features found in ${input.file_path}`
          }]
        };
      }
      const baselineStatus = await this.baselineCompute.getFeatureStatus(feature.bcd_keys);

      const result = this.formatFileAuditResult(input.file_path, [feature.location], baselineStatus);

      return {
        content: [{
          type: 'text',
          text: result
        }]
      };

    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InternalError, `File audit failed: ${error}`);
    }
  }

  /**
   * Get Baseline status for specific feature
   */
  async getFeatureStatus(input: GetFeatureStatusInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    try {
      // Convert feature ID to compat keys (simplified mapping)
      const compatKeys = this.featureIdToCompatKeys(input.feature);
      const status = await this.baselineCompute.getFeatureStatus(compatKeys);

      const result = this.formatFeatureStatus(input.feature, status);

      return {
        content: [{
          type: 'text',
          text: result
        }]
      };

    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Feature status lookup failed: ${error}`);
    }
  }

  /**
   * Export the last audit report
   */
  async exportLastReport(input: ExportLastReportInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    console.log(`🐛 Exporting report with ${this.lastReport?.features_detected.length} features`);

    try {
      if (!this.lastReport) {
        throw new McpError(ErrorCode.InvalidRequest, 'No audit report available to export');
      }

      await writeFile(input.path, this.safeStringify(this.lastReport), 'utf-8');

      return {
        content: [{
          type: 'text',
          text: `✅ Report exported to ${input.path}`
        }]
      };

    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InternalError, `Export failed: ${error}`);
    }
  }

  // Helper methods

  /**
   * Safe JSON stringify that handles circular references
   */
  private safeStringify(obj: any): string {
    const seen = new WeakSet();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
  }

  private async generateReport(
    projectPath: string,
    target: BaselineTarget,
    featureDetections: FeatureDetection[],
    filesScanned: number
  ): Promise<AuditReport> {
    const baselineStatuses = featureDetections.map(f => f.baseline_status);
    const browserCoverage = this.baselineCompute.calculateBrowserCoverage(baselineStatuses);
    const recommendations = this.baselineCompute.getRecommendations(baselineStatuses);

    // Calculate summary
    const summary: AuditSummary = {
      total_features: featureDetections.length,
      widely_supported: baselineStatuses.filter(s => this.baselineCompute.getBaselineLevel(s) === 'widely').length,
      newly_available: baselineStatuses.filter(s => this.baselineCompute.getBaselineLevel(s) === 'newly').length,
      limited_support: baselineStatuses.filter(s => this.baselineCompute.getBaselineLevel(s) === 'limited').length,
      no_support: baselineStatuses.filter(s => this.baselineCompute.getBaselineLevel(s) === 'none').length,
      files_scanned: filesScanned,
      weakest_browser: this.findWeakestBrowser(browserCoverage),
    };

    // Calculate global score
    const globalScore = this.calculateGlobalScore(summary);

    return {
      project_path: projectPath,
      target,
      timestamp: new Date().toISOString(),
      global_score: globalScore,
      browser_coverage: browserCoverage,
      features_detected: featureDetections,
      summary,
      recommendations,
    };
  }

  private calculateGlobalScore(summary: AuditSummary): number {
    if (summary.total_features === 0) return 100;

    const widelyWeight = 1.0;
    const newlyWeight = 0.8;
    const limitedWeight = 0.4;
    const noneWeight = 0.0;

    const score = (
      summary.widely_supported * widelyWeight +
      summary.newly_available * newlyWeight +
      summary.limited_support * limitedWeight +
      summary.no_support * noneWeight
    ) / summary.total_features * 100;

    return Math.round(score * 10) / 10;
  }

  private findWeakestBrowser(browserCoverage: Record<string, number>): string {
    return Object.entries(browserCoverage).reduce(
      (min, [browser, score]) => score < min.score ? { browser, score } : min,
      { browser: 'unknown', score: 100 }
    ).browser;
  }

  private formatAuditSummary(report: AuditReport): string {
    const { summary, browser_coverage, recommendations } = report;

    let output = chalk.bold.green('🎯 Baseline Compatibility Report\n\n');

    output += chalk.cyan('📊 Summary:\n');
    output += `   Global Score: ${chalk.bold(report.global_score.toFixed(1) + '%')} (Target: ${report.target})\n`;
    output += `   Features Detected: ${summary.total_features}\n`;
    output += `   Files Scanned: ${summary.files_scanned}\n\n`;

    output += chalk.cyan('🌐 Browser Coverage:\n');
    Object.entries(browser_coverage).forEach(([browser, score]) => {
      const color = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
      output += `   ${browser}: ${color(score.toFixed(1) + '%')}\n`;
    });

    output += chalk.cyan('\n📈 Feature Distribution:\n');
    output += `   ${chalk.green('●')} Widely Supported: ${summary.widely_supported}\n`;
    output += `   ${chalk.yellow('●')} Newly Available: ${summary.newly_available}\n`;
    output += `   ${chalk.hex('#FFA500')('●')} Limited Support: ${summary.limited_support}\n`;
    output += `   ${chalk.red('●')} No Support: ${summary.no_support}\n`;

    if (recommendations.length > 0) {
      output += chalk.cyan('\n💡 Recommendations:\n');
      recommendations.forEach(rec => {
        output += `   • ${rec}\n`;
      });
    }

    return output;
  }

  private formatFileAuditResult(filePath: string, locations: any[], status: any): string {
    let output = chalk.bold.blue(`📄 File Analysis: ${filePath}\n\n`);

    output += chalk.cyan(`Features detected: ${locations.length}\n`);
    output += `Baseline status: ${this.formatBaselineStatus(status)}\n\n`;

    output += chalk.cyan('🔍 Detected Features:\n');
    locations.forEach((loc, index) => {
      output += `   ${index + 1}. Line ${loc.line}:${loc.column} - ${loc.context}\n`;
    });

    return output;
  }

  private formatFeatureStatus(featureId: string, status: any): string {
    let output = chalk.bold.blue(`🔧 Feature Status: ${featureId}\n\n`);

    output += `Baseline: ${this.formatBaselineStatus(status)}\n`;

    if (status.baseline_low_date) {
      output += `Available since: ${status.baseline_low_date}\n`;
    }

    if (status.baseline_high_date) {
      output += `Widely available since: ${status.baseline_high_date}\n`;
    }

    output += chalk.cyan('\n🌐 Browser Support:\n');
    Object.entries(status.support).forEach(([browser, version]) => {
      output += `   ${browser}: ${version}\n`;
    });

    return output;
  }

  private formatBaselineStatus(status: any): string {
    if (status.baseline === 'high') return chalk.green('Widely Available');
    if (status.baseline === 'low') return chalk.yellow('Newly Available');
    return chalk.red('Limited Support');
  }

  /**
   * Deduplicate feature detections by file, line, and feature combination
   */
  private deduplicateFeatureDetections(detections: FeatureDetection[]): FeatureDetection[] {
    const uniqueDetections = new Map<string, FeatureDetection>();

    for (const detection of detections) {
      for (const location of detection.locations) {
        const key = `${location.file}:${location.line}:${detection.feature}`;

        if (!uniqueDetections.has(key)) {
          uniqueDetections.set(key, {
            feature: detection.feature,
            locations: [location],
            baseline_status: detection.baseline_status,
          });
        } else {
          // Merge locations if the same feature is detected multiple times
          const existing = uniqueDetections.get(key)!;
          if (!existing.locations.some(loc =>
            loc.file === location.file &&
            loc.line === location.line &&
            loc.column === location.column
          )) {
            existing.locations.push(location);
          }
        }
      }
    }

    return Array.from(uniqueDetections.values());
  }

  // Note: Legacy feature extraction methods removed
  // All feature detection is now handled by ESLintFeatureDetector

  private featureIdToCompatKeys(featureId: string): string[] {
    // Map feature IDs to BCD compat keys
    const mapping: Record<string, string[]> = {
      'css-container-queries': ['css.at-rules.container'],
      'css-has-selector': ['css.selectors.has'],
      'js-optional-chaining': ['javascript.operators.optional_chaining'],
      'js-nullish-coalescing': ['javascript.operators.nullish_coalescing'],
      // Add more mappings as needed
    };

    return mapping[featureId] || [featureId];
  }

  private async exportReport(report: AuditReport, exportPath: string): Promise<void> {
    await writeFile(exportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(chalk.green(`📊 Report exported to ${exportPath}`));
  }

  /**
   * Detect file type from extension
   */
  private detectFileType(filePath: string): FileType | null {
    const extension = filePath.split('.').pop()?.toLowerCase();

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
}