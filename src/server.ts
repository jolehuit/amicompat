#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  AuditProjectInputSchema,
  AuditFileInputSchema,
  GetFeatureStatusInputSchema,
  ExportLastReportInputSchema,
  type AuditProjectInput,
  type AuditFileInput,
  type GetFeatureStatusInput,
  type ExportLastReportInput
} from './types/index.js';
import { MCPTools } from './tools/index.js';

/**
 * AmICompat MCP Server - TypeScript Native Implementation
 *
 * Migrated from Python to TypeScript with:
 * - Native MCP TypeScript SDK
 * - ESLint-based feature detection
 * - Local Baseline data via web-features
 * - Zod validation for all I/O
 */
class AmICompatMCPServer {
  private server: McpServer;
  private tools: MCPTools;

  constructor() {
    this.tools = new MCPTools();

    this.server = new McpServer({
      name: 'amicompat-mcp',
      version: '1.1.0',
    });

    this.setupTools();
  }

  private setupTools(): void {
    // Tool: audit_project
    this.server.registerTool(
      'audit_project',
      {
        title: 'Audit Project',
        description: 'Comprehensive project audit for Baseline compatibility',
        inputSchema: {
          project_path: AuditProjectInputSchema.shape.project_path,
          target: AuditProjectInputSchema.shape.target,
          max_files: AuditProjectInputSchema.shape.max_files,
          export_path: AuditProjectInputSchema.shape.export_path,
        },
      },
      async (input: unknown) => {
        const validatedInput = AuditProjectInputSchema.parse(input) as AuditProjectInput;
        return await this.tools.auditProject(validatedInput);
      }
    );

    // Tool: audit_file
    this.server.registerTool(
      'audit_file',
      {
        title: 'Audit File',
        description: 'Analyze single file for web features',
        inputSchema: {
          file_path: AuditFileInputSchema.shape.file_path,
        },
      },
      async (input: unknown) => {
        const validatedInput = AuditFileInputSchema.parse(input) as AuditFileInput;
        return await this.tools.auditFile(validatedInput);
      }
    );

    // Tool: get_feature_status
    this.server.registerTool(
      'get_feature_status',
      {
        title: 'Get Feature Status',
        description: 'Get Baseline status for specific feature',
        inputSchema: {
          feature: GetFeatureStatusInputSchema.shape.feature,
        },
      },
      async (input: unknown) => {
        const validatedInput = GetFeatureStatusInputSchema.parse(input) as GetFeatureStatusInput;
        return await this.tools.getFeatureStatus(validatedInput);
      }
    );

    // Tool: export_last_report
    this.server.registerTool(
      'export_last_report',
      {
        title: 'Export Last Report',
        description: 'Export the most recent audit to JSON file',
        inputSchema: {
          path: ExportLastReportInputSchema.shape.path,
        },
      },
      async (input: unknown) => {
        const validatedInput = ExportLastReportInputSchema.parse(input) as ExportLastReportInput;
        return await this.tools.exportLastReport(validatedInput);
      }
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log startup info to stderr (not interfering with MCP protocol on stdout)
    console.error('🚀 AmICompat MCP Server v2.0.0 started');
    console.error('📚 TypeScript native with ESLint parsing');
    console.error('🌐 Local Baseline data via web-features');
    console.error('✅ All I/O validated with Zod');
    console.error('');
    console.error('Available tools:');
    console.error('  • audit_project - Comprehensive project audit');
    console.error('  • audit_file - Single file analysis');
    console.error('  • get_feature_status - Feature Baseline status');
    console.error('  • export_last_report - Export audit results');
    console.error('');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\n👋 Shutting down AmICompat MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n👋 Shutting down AmICompat MCP Server...');
  process.exit(0);
});

// Exported starter so the CLI can run the server
export async function startServer(): Promise<void> {
  try {
    const server = new AmICompatMCPServer();
    await server.start();
  } catch (error) {
    console.error('❌ Failed to start AmICompat MCP Server:', error);
    process.exit(1);
  }
}

// Only run if this is the main module
// Always start when imported/executed (works with CLI importing this module)
startServer().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
