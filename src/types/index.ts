import { z } from 'zod';

// MCP Tool Input Schemas (validated with Zod)
export const AuditProjectInputSchema = z.object({
  project_path: z.string().describe('Path to the project directory'),
  target: z.enum(['baseline-2025', 'baseline-2024', 'baseline-2023', 'widely', 'limited']).default('baseline-2025').describe('Baseline compatibility target'),
  max_files: z.number().int().positive().default(10000).describe('Maximum number of files to scan'),
  export_path: z.string().optional().describe('Export results to JSON file'),
});

export const AuditFileInputSchema = z.object({
  file_path: z.string().describe('Path to the CSS/JS/HTML file'),
});

export const GetFeatureStatusInputSchema = z.object({
  feature: z.string().describe('Feature ID like css-container-queries'),
});

export const ExportLastReportInputSchema = z.object({
  path: z.string().describe('Output file path for the report'),
});

// Types derived from schemas
export type AuditProjectInput = z.infer<typeof AuditProjectInputSchema>;
export type AuditFileInput = z.infer<typeof AuditFileInputSchema>;
export type GetFeatureStatusInput = z.infer<typeof GetFeatureStatusInputSchema>;
export type ExportLastReportInput = z.infer<typeof ExportLastReportInputSchema>;

// Baseline compatibility targets
export type BaselineTarget = 'baseline-2025' | 'baseline-2024' | 'baseline-2023' | 'widely' | 'limited';

// Feature detection result
export interface FeatureDetection {
  feature: string;
  locations: FeatureLocation[];
  baseline_status: BaselineStatus;
}

export interface FeatureLocation {
  file: string;
  line: number;
  column: number;
  context: string;
}

export interface BaselineStatus {
  baseline: 'high' | 'low' | false;
  baseline_low_date?: string | undefined;
  baseline_high_date?: string | undefined;
  support: Record<string, string | boolean>;
  discouraged: boolean;
}

// Audit report structure
export interface AuditReport {
  project_path: string;
  target: BaselineTarget;
  timestamp: string;
  global_score: number;
  browser_coverage: Record<string, number>;
  features_detected: FeatureDetection[];
  summary: AuditSummary;
  recommendations: string[];
}

export interface AuditSummary {
  total_features: number;
  widely_supported: number;
  newly_available: number;
  limited_support: number;
  no_support: number;
  files_scanned: number;
  weakest_browser: string;
}

// File parsing context
export interface ParseContext {
  file_path: string;
  content: string;
  file_type: FileType;
}

export type FileType = 'css' | 'js' | 'ts' | 'jsx' | 'tsx' | 'html' | 'scss' | 'sass';

// AST node types for different parsers
export interface ASTNode {
  type: string;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// CSS AST node (PostCSS)
export interface CSSNode extends ASTNode {
  source?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// JavaScript AST node (Babel)
export interface JSNode extends ASTNode {
  start?: number;
  end?: number;
}

// Configuration
export interface MCPConfig {
  default_target: BaselineTarget;
  max_files: number;
  max_concurrency: number;
  supported_extensions: string[];
}