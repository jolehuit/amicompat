import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
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
  AuditSummary
} from '../types/index.js';
import { FileWalker } from '../lib/walker.js';
import { ASTParser } from '../lib/parsers.js';
import { BaselineCompute } from '../lib/baseline.js';

/**
 * MCP Tools implementation with full TypeScript support
 */
export class MCPTools {
  private fileWalker = new FileWalker();
  private astParser = new ASTParser();
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

      for (const file of files) {
        try {
          const content = await this.fileWalker.readFileContent(file.path);
          const context: ParseContext = {
            file_path: file.path,
            content,
            file_type: file.fileType,
          };

          const locations = await this.astParser.parseFile(context);

          if (locations.length > 0) {
            // Map features to their baseline status
            const compatKeys = this.mapFeaturesToCompatKeys(locations);
            const baselineStatus = await this.baselineCompute.getFeatureStatus(compatKeys, input.target);

            allFeatureDetections.push({
              feature: this.extractFeatureName(locations[0]), // Use first location for feature name
              locations,
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

      // Generate report
      const report = await this.generateReport(
        input.project_path,
        input.target,
        allFeatureDetections,
        files.length
      );

      this.lastReport = report;

      // Export if requested
      if (input.export_path) {
        await this.exportReport(report, input.export_path);
      }

      // Format response
      const summary = this.formatAuditSummary(report);

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

      const fileType = this.astParser.detectFileType(input.file_path);
      if (!fileType) {
        throw new McpError(ErrorCode.InvalidParams, `Unsupported file type: ${input.file_path}`);
      }

      const content = await this.fileWalker.readFileContent(input.file_path);
      const context: ParseContext = {
        file_path: input.file_path,
        content,
        file_type: fileType,
      };

      const locations = await this.astParser.parseFile(context);

      if (locations.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No modern web features detected in ${input.file_path}`
          }]
        };
      }

      // Get baseline status for detected features
      const compatKeys = this.mapFeaturesToCompatKeys(locations);
      const baselineStatus = await this.baselineCompute.getFeatureStatus(compatKeys);

      const result = this.formatFileAuditResult(input.file_path, locations, baselineStatus);

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
    try {
      if (!this.lastReport) {
        throw new McpError(ErrorCode.InvalidRequest, 'No audit report available to export');
      }

      await writeFile(input.path, JSON.stringify(this.lastReport, null, 2), 'utf-8');

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

  private mapFeaturesToCompatKeys(locations: any[]): string[] {
    // Simplified mapping - in production this would be more comprehensive
    return ['css.properties.container', 'css.selectors.has'];
  }

  private extractFeatureName(location: any): string {
    // Extract feature name from location context
    return 'detected-feature';
  }

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
}