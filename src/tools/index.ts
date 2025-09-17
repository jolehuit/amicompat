import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { writeFile } from 'fs/promises';
import chalk from 'chalk';
import {
  AuditProjectInput,
  AuditFileInput,
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

/**
 * MCP Tools implementation with full TypeScript support
 */
export class MCPTools {
  private fileWalker = new FileWalker();
  private lastReport: AuditReport | null = null;

  private readonly supportedExtensions = [
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
            allFeatureDetections.push({
              feature: feature.feature_name,
              locations: [feature.location]
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

      // Generate report with deduplicated detections
      const report = await this.generateReport(
        input.project_path,
        input.target,
        deduplicatedDetections,
        files.length
      );

      this.lastReport = report;

      // Format response
      const summary = this.formatAuditSummary(report);

      // Export if requested
      if (input.export_path) {
        await this.exportReport(report, input.export_path);
        return {
          content: [{
            type: 'text',
            text: summary + `\\n✅ Report exported to ${input.export_path}`
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

      const result = this.formatFileAuditResult(input.file_path, identifiedFeatures);

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
   * Export the last audit report
   */
  async exportLastReport(input: ExportLastReportInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
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
    // Calculate summary
    const summary: AuditSummary = {
      total_features: featureDetections.length,
      baseline_violations: featureDetections.length, // All detected features are violations for the target
      files_scanned: filesScanned,
    };

    return {
      project_path: projectPath,
      target,
      timestamp: new Date().toISOString(),
      features_detected: featureDetections,
      summary,
    };
  }

  private formatAuditSummary(report: AuditReport): string {
    const { summary } = report;

    let output = chalk.bold.green('🎯 Baseline Compatibility Report\\n\\n');

    output += chalk.cyan('📊 Summary:\\n');
    output += `   Target: ${report.target}\\n`;
    output += `   Features Detected: ${summary.total_features}\\n`;
    output += `   Baseline Violations: ${summary.baseline_violations}\\n`;
    output += `   Files Scanned: ${summary.files_scanned}\\n\\n`;

    if (summary.total_features > 0) {
      output += chalk.cyan('🔍 Detected Features:\\n');
      report.features_detected.slice(0, 10).forEach(feature => {
        output += `   • ${feature.feature} (${feature.locations.length} location${feature.locations.length > 1 ? 's' : ''})\\n`;
      });

      if (report.features_detected.length > 10) {
        output += `   ... and ${report.features_detected.length - 10} more\\n`;
      }
    }

    return output;
  }

  private formatFileAuditResult(filePath: string, features: any[]): string {
    let output = chalk.bold.blue(`📄 File Analysis: ${filePath}\\n\\n`);

    output += chalk.cyan(`Features detected: ${features.length}\\n\\n`);

    if (features.length > 0) {
      output += chalk.cyan('🔍 Detected Features:\\n');
      features.forEach((feature, index) => {
        output += `   ${index + 1}. ${feature.feature_name} at line ${feature.location.line}:${feature.location.column}\\n`;
        output += `      ${feature.location.context}\\n`;
      });
    }

    return output;
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
            locations: [location]
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
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'html': 'html',
      'htm': 'html',
    };

    return extension ? typeMap[extension] || null : null;
  }
}