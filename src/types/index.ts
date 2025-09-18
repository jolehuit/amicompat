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


// Types derived from schemas
export type AuditProjectInput = z.infer<typeof AuditProjectInputSchema>;
export type AuditFileInput = z.infer<typeof AuditFileInputSchema>;

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
  detailed_support?: DetailedSupport; // Added: compute-baseline enrichment
}

// Detailed browser support data from compute-baseline
export interface DetailedSupport {
  baseline_status: 'high' | 'low' | false;
  baseline_low_date?: string | null;
  baseline_high_date?: string | null;
  browser_support: BrowserSupport;
  discouraged?: boolean;
}

// Browser-specific support information
export interface BrowserSupport {
  chrome?: string;
  chrome_android?: string;
  edge?: string;
  firefox?: string;
  firefox_android?: string;
  safari?: string;
  safari_ios?: string;
  [key: string]: string | undefined;
}

// Feature detection result for compatibility reporting
export interface FeatureDetection {
  feature: string;
  locations: FeatureLocation[];
  detailed_support?: DetailedSupport; // Include browser compatibility data
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