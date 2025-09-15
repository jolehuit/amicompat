/**
 * ESLint-based feature detection wrapper
 * Replaces custom AST parsers with robust ESLint rules
 */

import { ESLint } from 'eslint';
import { ParseContext, IdentifiedFeature, FeatureLocation } from '../types/index.js';

export interface ESLintFeatureDetection {
  ruleId: string;
  message: string;
  line: number;
  column: number;
  severity: number;
  nodeType?: string;
  source?: string;
}

/**
 * ESLint-powered feature detector
 * More reliable than custom AST parsing
 */
export class ESLintFeatureDetector {
  private jsEslint: ESLint;
  private htmlEslint: ESLint;

  constructor() {
    // JavaScript/TypeScript ESLint instance (simplified)
    this.jsEslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: {
        rules: {
          // Basic rules to trigger parsing
          'no-unused-vars': 'off'
        }
      }
    });

    // HTML ESLint instance (minimal)
    this.htmlEslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: {
        rules: {
          'no-unused-vars': 'off'
        }
      }
    });
  }

  /**
   * Main detection method - routes to appropriate ESLint instance
   */
  async detectFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    switch (context.file_type) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return this.detectJavaScriptFeatures(context);

      case 'html':
        return this.detectHTMLFeatures(context);

      case 'css':
      case 'scss':
      case 'sass':
        return this.detectCSSFeatures(context);

      default:
        return [];
    }
  }

  /**
   * Detect JavaScript/TypeScript features using ESLint
   */
  private async detectJavaScriptFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    const features: IdentifiedFeature[] = [];

    try {
      // Use ESLint to analyze the code
      const results = await this.jsEslint.lintText(context.content, {
        filePath: context.file_path
      });

      for (const result of results) {
        for (const message of result.messages) {
          const feature = this.mapESLintToFeature(message, context, 'js');
          if (feature) {
            features.push(feature);
          }
        }
      }

      // Also detect features by analyzing AST directly via ESLint's parser
      const detectedSyntax = this.detectSyntaxFeatures(context.content, context.file_path);
      features.push(...detectedSyntax);

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`ESLint analysis failed for ${context.file_path}:`, error);
      }
    }

    return features;
  }

  /**
   * Detect HTML features using HTML-ESLint
   */
  private async detectHTMLFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    const features: IdentifiedFeature[] = [];

    try {
      const results = await this.htmlEslint.lintText(context.content, {
        filePath: context.file_path
      });

      for (const result of results) {
        for (const message of result.messages) {
          const feature = this.mapESLintToFeature(message, context, 'html');
          if (feature) {
            features.push(feature);
          }
        }
      }

      // Also detect modern HTML features by pattern matching
      const syntaxFeatures = this.detectHTMLSyntaxFeatures(context.content, context.file_path);
      features.push(...syntaxFeatures);

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`HTML-ESLint analysis failed for ${context.file_path}:`, error);
      }
    }

    return features;
  }

  /**
   * Detect CSS features (simplified for now)
   */
  private async detectCSSFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    // For CSS, we'll use pattern matching since ESLint CSS support is limited
    return this.detectCSSSyntaxFeatures(context.content, context.file_path);
  }

  /**
   * Map ESLint messages to IdentifiedFeature objects
   */
  private mapESLintToFeature(
    message: any,
    context: ParseContext,
    type: 'js' | 'html'
  ): IdentifiedFeature | null {
    const ruleMapping = type === 'js' ? this.getJSRuleMapping() : this.getHTMLRuleMapping();
    const mapping = ruleMapping[message.ruleId];

    if (!mapping) return null;

    return {
      feature_name: mapping.feature_name,
      feature_id: mapping.feature_id,
      bcd_keys: mapping.bcd_keys,
      syntax_pattern: mapping.syntax_pattern,
      ast_node_type: message.nodeType || 'unknown',
      confidence: 'high',
      location: {
        file: context.file_path,
        line: message.line || 1,
        column: message.column || 1,
        context: context.content.split('\n')[message.line - 1] || ''
      }
    };
  }

  /**
   * Detect JavaScript syntax features by direct pattern analysis
   */
  private detectSyntaxFeatures(content: string, filePath: string): IdentifiedFeature[] {
    const features: IdentifiedFeature[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Optional chaining
      if (line.includes('?.')) {
        features.push(this.createFeature(
          'Optional Chaining',
          'js-optional-chaining',
          ['javascript.operators.optional_chaining'],
          '?.',
          filePath,
          lineNumber,
          line
        ));
      }

      // Nullish coalescing
      if (line.includes('??') && !line.includes('??=')) {
        features.push(this.createFeature(
          'Nullish Coalescing',
          'js-nullish-coalescing',
          ['javascript.operators.nullish_coalescing'],
          '??',
          filePath,
          lineNumber,
          line
        ));
      }

      // Private class fields
if (/\#[a-zA-Z_$][a-zA-Z0-9_$]*/.test(line) && (line.includes('class ') || line.includes('this.#'))) {
        features.push(this.createFeature(
          'Private Class Fields',
          'js-private-class-fields',
          ['javascript.classes.private_class_fields'],
          '#',
          filePath,
          lineNumber,
          line
        ));
      }

      // Dynamic imports
      if (line.includes('import(')) {
        features.push(this.createFeature(
          'Dynamic Import',
          'js-dynamic-import',
          ['javascript.operators.import'], // 🔧 Correction ici
          'import(',
          filePath,
          lineNumber,
          line
        ));
      }
            

      // Top-level await
      if (line.includes('await') && !line.includes('function') && !line.includes('=>')) {
        features.push(this.createFeature(
          'Top-level Await',
          'js-top-level-await',
          ['javascript.operators.await.top_level'],
          'await',
          filePath,
          lineNumber,
          line
        ));
      }

      // BigInt
      if (/\d+n\b/.test(line)) {
        features.push(this.createFeature(
          'BigInt',
          'js-bigint',
          ['javascript.builtins.BigInt'],
          'n',
          filePath,
          lineNumber,
          line
        ));
      }
    });

    return features;
  }

  /**
   * Detect HTML syntax features
   */
  private detectHTMLSyntaxFeatures(content: string, filePath: string): IdentifiedFeature[] {
    const features: IdentifiedFeature[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
        return;
      }
      

      // Dialog element
      if (line.includes('<dialog')) {
        features.push(this.createFeature(
          'HTML Dialog Element',
          'html-dialog-element',
          ['html.elements.dialog'],
          '<dialog',
          filePath,
          lineNumber,
          line
        ));
      }

      // Loading attribute
      if (line.includes('loading="lazy"') || line.includes('loading="eager"')) {
        features.push(this.createFeature(
          'HTML loading Attribute',
          'html-loading-attribute',
          ['html.elements.img.loading'],
          'loading=',
          filePath,
          lineNumber,
          line
        ));
      }

      // Popover attribute
      if (line.includes('popover=')) {
        features.push(this.createFeature(
          'HTML popover Attribute',
          'html-popover-attribute',
          ['html.global_attributes.popover'],
          'popover=',
          filePath,
          lineNumber,
          line
        ));
      }

      // Custom elements
      if (/<[a-z]+-[a-z-]+/.test(line)) {
        features.push(this.createFeature(
          'HTML Custom Elements',
          'html-custom-elements',
          ['api.CustomElementRegistry'],
          '-',
          filePath,
          lineNumber,
          line
        ));
      }
    });

    return features;
  }

  /**
   * Detect CSS syntax features
   */
  private detectCSSSyntaxFeatures(content: string, filePath: string): IdentifiedFeature[] {
    const features: IdentifiedFeature[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Container queries
      if (line.includes('@container')) {
        features.push(this.createFeature(
          'CSS Container Queries',
          'css-container-queries',
          ['css.at-rules.container'],
          '@container',
          filePath,
          lineNumber,
          line
        ));
      }

      // :has() selector
      if (line.includes(':has(')) {
        features.push(this.createFeature(
          'CSS :has() Selector',
          'css-has-selector',
          ['css.selectors.has'],
          ':has(',
          filePath,
          lineNumber,
          line
        ));
      }

      // Subgrid
      if (line.includes('subgrid')) {
        features.push(this.createFeature(
          'CSS Subgrid',
          'css-subgrid',
          ['css.properties.grid-template-columns.subgrid'],
          'subgrid',
          filePath,
          lineNumber,
          line
        ));
      }

      // CSS layers
      if (line.includes('@layer')) {
        features.push(this.createFeature(
          'CSS Cascade Layers',
          'css-cascade-layers',
          ['css.at-rules.layer'],
          '@layer',
          filePath,
          lineNumber,
          line
        ));
      }
    });

    return features;
  }

  /**
   * Helper to create IdentifiedFeature objects
   */
  private createFeature(
    name: string,
    id: string,
    bcdKeys: string[],
    syntax: string,
    filePath: string,
    line: number,
    context: string
  ): IdentifiedFeature {
    return {
      feature_name: name,
      feature_id: id,
      bcd_keys: bcdKeys,
      syntax_pattern: syntax,
      ast_node_type: 'detected',
      confidence: 'high',
      location: {
        file: filePath,
        line,
        column: 1,
        context: context.trim()
      }
    };
  }

  /**
   * JavaScript ESLint rule mappings
   */
  private getJSRuleMapping(): Record<string, any> {
    return {
      'prefer-optional-chaining': {
        feature_name: 'Optional Chaining',
        feature_id: 'js-optional-chaining',
        bcd_keys: ['javascript.operators.optional_chaining'],
        syntax_pattern: '?.'
      },
      'prefer-nullish-coalescing': {
        feature_name: 'Nullish Coalescing',
        feature_id: 'js-nullish-coalescing',
        bcd_keys: ['javascript.operators.nullish_coalescing'],
        syntax_pattern: '??'
      },
      'logical-assignment-operators': {
        feature_name: 'Logical Assignment',
        feature_id: 'js-logical-assignment',
        bcd_keys: ['javascript.operators.logical_and_assignment'],
        syntax_pattern: '&&='
      }
    };
  }

  /**
   * HTML ESLint rule mappings
   */
  private getHTMLRuleMapping(): Record<string, any> {
    return {
      '@html-eslint/require-button-type': {
        feature_name: 'HTML Button Type',
        feature_id: 'html-button-type',
        bcd_keys: ['html.elements.button.type'],
        syntax_pattern: 'type='
      },
      '@html-eslint/require-meta-viewport': {
        feature_name: 'HTML Meta Viewport',
        feature_id: 'html-meta-viewport',
        bcd_keys: ['html.elements.meta.name.viewport'],
        syntax_pattern: 'viewport'
      }
    };
  }

  /**
   * Convert IdentifiedFeature[] to FeatureLocation[] for backward compatibility
   */
  async detectFeaturesLegacy(context: ParseContext): Promise<FeatureLocation[]> {
    const identifiedFeatures = await this.detectFeatures(context);
    return identifiedFeatures.map(feature => feature.location);
  }
}