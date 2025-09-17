import { z } from 'zod';

// MCP Tool Input Schemas (validated with Zod)
export const AuditProjectInputSchema = z.object({
  project_path: z.string().describe('Path to the project directory'),
  target: z.enum(['widely', 'newly']).default('widely').describe('Baseline compatibility target'),
  max_files: z.number().int().positive().default(10000).describe('Maximum number of files to scan'),
  export_path: z.string().optional().describe('Export results to JSON file'),
});

export const AuditFileInputSchema = z.object({
  file_path: z.string().describe('Path to the CSS/JS/HTML file'),
});


export const ExportLastReportInputSchema = z.object({
  path: z.string().describe('Output file path for the report'),
});

// Types derived from schemas
export type AuditProjectInput = z.infer<typeof AuditProjectInputSchema>;
export type AuditFileInput = z.infer<typeof AuditFileInputSchema>;
export type ExportLastReportInput = z.infer<typeof ExportLastReportInputSchema>;

// Baseline compatibility targets
export type BaselineTarget = 'widely' | 'newly';

// ESLint-detected feature with complete metadata
export interface IdentifiedFeature {
  feature_name: string;       // "CSS container queries"
  feature_id: string;         // "css-container-queries"
  bcd_keys: string[];         // ["css.properties.container-type"]
  syntax_pattern: string;     // "container-type"
  ast_node_type: string;      // "css"
  confidence: 'high' | 'medium' | 'low';
  location: FeatureLocation;
}

// Feature detection result for compatibility reporting
export interface FeatureDetection {
  feature: string;
  locations: FeatureLocation[];
}

export interface FeatureLocation {
  file: string;
  line: number;
  column: number;
  context: string;
}

// Audit report structure
export interface AuditReport {
  project_path: string;
  target: BaselineTarget;
  timestamp: string;
  features_detected: FeatureDetection[];
  summary: AuditSummary;
}

export interface AuditSummary {
  total_features: number;
  baseline_violations: number;
  files_scanned: number;
}

// File parsing context
export interface ParseContext {
  file_path: string;
  content: string;
  file_type: FileType;
}

export type FileType = 'css' | 'html' | 'scss' | 'sass';

// Note: AST parsing is now handled by ESLint internally
// These legacy AST types are no longer used

// Configuration
export interface MCPConfig {
  default_target: BaselineTarget;
  max_files: number;
  max_concurrency: number;
  supported_extensions: string[];
}