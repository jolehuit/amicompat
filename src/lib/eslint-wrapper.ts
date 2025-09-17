/**
 * ESLint-based feature detection wrapper
 * Uses ESLint plugins for robust feature detection without false positives
 */

import { ESLint } from 'eslint';
import { ParseContext, IdentifiedFeature, BaselineTarget } from '../types/index.js';
import { JS_FEATURES, ESLINT_RULE_TO_FEATURE, FEATURE_TO_ESLINT_RULE } from '../generated/js-features.generated.js';
import { CSS_FEATURES, BCD_KEY_TO_CSS_FEATURE } from '../generated/css-features.generated.js';
import { HTML_FEATURES, BCD_KEY_TO_HTML_FEATURE } from '../generated/html-features.generated.js';

/**
 * ESLint-powered feature detector
 * Eliminates false positives by using AST-based analysis
 */
export class ESLintFeatureDetector {
  private jsEslint?: ESLint;
  private cssEslint?: ESLint;
  private htmlEslint?: ESLint;
  private target: BaselineTarget;
  private initialized = false;

  constructor(target: BaselineTarget = 'baseline-2024') {
    this.target = target;
  }

  private async initialize() {
    if (this.initialized) return;

    // JavaScript/TypeScript ESLint instance with es-x plugin
    try {
      const esxPlugin = await import('eslint-plugin-es-x').then((m: any) => m.default || m);
      this.jsEslint = new ESLint({
        overrideConfigFile: true,
        ignore: false,
        baseConfig: {
          languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
              ecmaFeatures: {
                jsx: true
              }
            }
          },
          plugins: {
            'es-x': esxPlugin
          },
          rules: this.getJSRulesForTarget(this.target) as any
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Failed to initialize JS ESLint, falling back to basic detection:', error);
      }
    }

    // CSS ESLint instance with @eslint/css plugin
    try {
      const cssPlugin = await import('@eslint/css').then((m: any) => m.default || m);
      this.cssEslint = new ESLint({
        overrideConfigFile: true,
        baseConfig: {
          plugins: {
            'css': cssPlugin
          },
          processor: 'css/css',
          rules: {
            'css/use-baseline': ['error', { available: this.getBaselineAvailabilityForTarget(this.target) }]
          }
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Failed to initialize CSS ESLint, falling back to basic detection:', error);
      }
    }

    // HTML ESLint instance with @html-eslint plugin
    try {
      const htmlParser = await import('@html-eslint/parser').then((m: any) => m.default || m);
      const htmlPlugin = await import('@html-eslint/eslint-plugin').then((m: any) => m.default || m);
      this.htmlEslint = new ESLint({
        overrideConfigFile: true,
        baseConfig: {
          languageOptions: {
            parser: htmlParser
          },
          plugins: {
            '@html-eslint': htmlPlugin
          },
          rules: {
            '@html-eslint/use-baseline': ['error', { available: this.getBaselineAvailabilityForTarget(this.target) }]
          }
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Failed to initialize HTML ESLint, falling back to basic detection:', error);
      }
    }

    this.initialized = true;
  }

  /**
   * Main detection method - routes to appropriate ESLint instance
   */
  async detectFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    await this.initialize();

    switch (context.file_type) {
      case 'tsx':
      case 'jsx':
      case 'js':
      case 'ts':
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
   * Detect JavaScript/TypeScript features using ESLint es-x plugin
   */
  private async detectJavaScriptFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    const features: IdentifiedFeature[] = [];

    // Use ESLint if available, otherwise fallback to pattern matching
    if (this.jsEslint) {
      try {
        const results = await this.jsEslint.lintText(context.content, {
          filePath: context.file_path
        });

      for (const result of results) {
        for (const message of result.messages) {
          if (message.ruleId && ESLINT_RULE_TO_FEATURE[message.ruleId]) {
            const featureData = ESLINT_RULE_TO_FEATURE[message.ruleId];
            if (!featureData) continue;

            features.push({
              feature_name: featureData.name,
              feature_id: featureData.id,
              bcd_keys: featureData.bcd_keys,
              syntax_pattern: this.extractSyntaxFromMessage(message.message),
              ast_node_type: message.nodeType || 'unknown',
              confidence: 'high',
              location: {
                file: context.file_path,
                line: message.line || 1,
                column: message.column || 1,
                context: this.getLineContext(context.content, message.line || 1)
              }
            });
          }
        }
      }

      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`ESLint analysis failed for ${context.file_path}:`, error);
        }
      }

      // Always supplement with pattern matching for features not in web-features
      const patternFeatures = this.detectJavaScriptFeaturesPattern(context);
      features.push(...patternFeatures);
    } else {
      // Fallback to pattern matching when ESLint plugin is not available
      return this.detectJavaScriptFeaturesPattern(context);
    }

    return features;
  }

  /**
   * Detect HTML features using HTML-ESLint baseline rules
   */
  private async detectHTMLFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    const features: IdentifiedFeature[] = [];

    if (this.htmlEslint) {
      try {
        const results = await this.htmlEslint.lintText(context.content, {
          filePath: context.file_path
        });

      for (const result of results) {
        for (const message of result.messages) {
          if (message.ruleId === '@html-eslint/use-baseline') {
            const feature = this.parseHTMLBaselineMessage(message, context);
            if (feature) {
              features.push(feature);
            }
          }
        }
      }

      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`HTML-ESLint analysis failed for ${context.file_path}:`, error);
        }
      }

      // Always supplement with pattern matching for features not covered by ESLint
      const patternFeatures = this.detectHTMLFeaturesPattern(context);
      features.push(...patternFeatures);
    } else {
      // Fallback to pattern matching
      return this.detectHTMLFeaturesPattern(context);
    }

    return features;
  }

  /**
   * Detect CSS features using @eslint/css baseline rules
   */
  private async detectCSSFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    const features: IdentifiedFeature[] = [];

    if (this.cssEslint) {
      try {
        const results = await this.cssEslint.lintText(context.content, {
          filePath: context.file_path
        });

      for (const result of results) {
        for (const message of result.messages) {
          if (message.ruleId === 'css/use-baseline') {
            const feature = this.parseCSSBaselineMessage(message, context);
            if (feature) {
              features.push(feature);
            }
          }
        }
      }

      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`CSS-ESLint analysis failed for ${context.file_path}:`, error);
        }
      }

      // Always supplement with pattern matching for features not covered by ESLint
      const patternFeatures = this.detectCSSFeaturesPattern(context);
      features.push(...patternFeatures);
    } else {
      // Fallback to pattern matching
      return this.detectCSSFeaturesPattern(context);
    }

    return features;
  }

  /**
   * Get JavaScript ESLint rules based on target baseline
   */
  private getJSRulesForTarget(target: BaselineTarget): Record<string, string> {
    const rules: Record<string, string> = {};

    for (const feature of JS_FEATURES) {
      if (!feature.eslint_rule) continue;

      // Only activate rules for features that are beyond the target
      const shouldActivate = this.shouldActivateRuleForTarget(feature.baseline, target);
      if (shouldActivate) {
        rules[`es-x/${feature.eslint_rule}`] = 'error';
      }
    }

    return rules;
  }

  /**
   * Determine baseline availability setting for CSS/HTML rules
   */
  private getBaselineAvailabilityForTarget(target: BaselineTarget): string | number {
    switch (target) {
      case 'baseline-2025':
        return 'newly';
      case 'baseline-2024':
      case 'baseline-2023':
      case 'widely':
        return 'widely';
      default:
        return 'widely';
    }
  }

  /**
   * Determine if a rule should be activated based on feature baseline vs target
   */
  private shouldActivateRuleForTarget(featureBaseline: 'high' | 'low' | false, target: BaselineTarget): boolean {
    switch (target) {
      case 'widely':
      case 'baseline-2023':
      case 'baseline-2024':
        // Activate for features that are not yet widely available
        return featureBaseline !== 'high';
      case 'baseline-2025':
        // Activate only for features with limited/no support
        return featureBaseline === false;
      default:
        return featureBaseline !== 'high';
    }
  }

  /**
   * Parse CSS baseline message to extract feature information
   */
  private parseCSSBaselineMessage(message: any, context: ParseContext): IdentifiedFeature | null {
    // Extract CSS property/at-rule/selector from baseline message
    const messageText = message.message;

    // Try to match patterns like "Property 'container-type' is not widely available"
    const propertyMatch = messageText.match(/Property '([^']+)'/);
    const atRuleMatch = messageText.match(/At-rule '@([^']+)'/);
    const selectorMatch = messageText.match(/Selector '([^']+)'/);

    let bcdKey: string | undefined;
    let syntaxPattern: string | undefined;

    if (propertyMatch) {
      bcdKey = `css.properties.${propertyMatch[1]}`;
      syntaxPattern = propertyMatch[1];
    } else if (atRuleMatch) {
      bcdKey = `css.at-rules.${atRuleMatch[1]}`;
      syntaxPattern = `@${atRuleMatch[1]}`;
    } else if (selectorMatch) {
      bcdKey = `css.selectors.${selectorMatch[1]}`;
      syntaxPattern = selectorMatch[1];
    }

    if (!bcdKey || !BCD_KEY_TO_CSS_FEATURE[bcdKey]) {
      return null;
    }

    const featureData = BCD_KEY_TO_CSS_FEATURE[bcdKey];
    if (!featureData) return null;

    return {
      feature_name: featureData.name,
      feature_id: featureData.id,
      bcd_keys: [bcdKey],
      syntax_pattern: syntaxPattern || '',
      ast_node_type: 'css',
      confidence: 'high',
      location: {
        file: context.file_path,
        line: message.line || 1,
        column: message.column || 1,
        context: this.getLineContext(context.content, message.line || 1)
      }
    };
  }

  /**
   * Parse HTML baseline message to extract feature information
   */
  private parseHTMLBaselineMessage(message: any, context: ParseContext): IdentifiedFeature | null {
    // Extract HTML element/attribute from baseline message
    const messageText = message.message;

    // Try to match patterns like "Element 'dialog' is not widely available"
    const elementMatch = messageText.match(/Element '([^']+)'/);
    const attributeMatch = messageText.match(/Attribute '([^']+)'/);

    let bcdKey: string | undefined;
    let syntaxPattern: string | undefined;

    if (elementMatch) {
      bcdKey = `html.elements.${elementMatch[1]}`;
      syntaxPattern = `<${elementMatch[1]}`;
    } else if (attributeMatch) {
      bcdKey = `html.global_attributes.${attributeMatch[1]}`;
      syntaxPattern = `${attributeMatch[1]}=`;
    }

    if (!bcdKey || !BCD_KEY_TO_HTML_FEATURE[bcdKey]) {
      return null;
    }

    const featureData = BCD_KEY_TO_HTML_FEATURE[bcdKey];
    if (!featureData) return null;

    return {
      feature_name: featureData.name,
      feature_id: featureData.id,
      bcd_keys: [bcdKey],
      syntax_pattern: syntaxPattern || '',
      ast_node_type: 'html',
      confidence: 'high',
      location: {
        file: context.file_path,
        line: message.line || 1,
        column: message.column || 1,
        context: this.getLineContext(context.content, message.line || 1)
      }
    };
  }

  /**
   * Extract syntax pattern from ESLint error message
   */
  private extractSyntaxFromMessage(message: string): string {
    // Extract common patterns from es-x error messages
    if (message.includes('optional chaining')) return '?.';
    if (message.includes('nullish coalescing')) return '??';
    if (message.includes('private class fields')) return '#';
    if (message.includes('dynamic import')) return 'import()';
    if (message.includes('top-level await')) return 'await';
    if (message.includes('bigint')) return 'n';
    if (message.includes('logical assignment')) return '&&=';

    return '';
  }

  /**
   * Get line context from content
   */
  private getLineContext(content: string, lineNumber: number): string {
    const lines = content.split('\n');
    const line = lines[lineNumber - 1];
    return line ? line.trim() : '';
  }

  /**
   * Fallback JavaScript pattern-based detection
   */
  private detectJavaScriptFeaturesPattern(context: ParseContext): IdentifiedFeature[] {
    const features: IdentifiedFeature[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Skip comments and check for block comments
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') ||
          line.trim().includes('/*') || line.trim().includes('*/')) {
        return;
      }

      // Optional chaining
      if (line.includes('?.')) {
        features.push(this.createFeature(
          'Optional chaining',
          'optional-chaining',
          ['javascript.operators.optional_chaining'],
          '?.',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Nullish coalescing
      if (line.includes('??') && !line.includes('??=')) {
        features.push(this.createFeature(
          'Nullish coalescing assignment (??=)',
          'nullish-coalescing',
          ['javascript.operators.nullish_coalescing'],
          '??',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Private class fields
      if (/[#][a-zA-Z_$][a-zA-Z0-9_$]*/.test(line) && (line.includes('class ') || line.includes('this.#'))) {
        features.push(this.createFeature(
          'Private class fields',
          'private-class-fields',
          ['javascript.classes.private_class_fields'],
          '#',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Dynamic imports
      if (line.includes('import(')) {
        features.push(this.createFeature(
          'Dynamic import',
          'dynamic-import',
          ['javascript.operators.import'],
          'import(',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Top-level await
      if (line.includes('await') && !line.includes('function') && !line.includes('=>')) {
        features.push(this.createFeature(
          'Top-level await',
          'top-level-await',
          ['javascript.operators.await.top_level'],
          'await',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // BigInt
      if (/\d+n\b/.test(line)) {
        features.push(this.createFeature(
          'BigInt',
          'bigint',
          ['javascript.builtins.BigInt'],
          'n',
          context.file_path,
          lineNumber,
          line
        ));
      }
    });

    return features;
  }

  /**
   * Fallback CSS pattern-based detection
   */
  private detectCSSFeaturesPattern(context: ParseContext): IdentifiedFeature[] {
    const features: IdentifiedFeature[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Container queries
      if (line.includes('@container')) {
        features.push(this.createFeature(
          'CSS Container Queries',
          'container-queries',
          ['css.at-rules.container'],
          '@container',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // :has() selector
      if (line.includes(':has(')) {
        features.push(this.createFeature(
          'CSS :has() Selector',
          'has-selector',
          ['css.selectors.has'],
          ':has(',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Cascade layers
      if (line.includes('@layer')) {
        features.push(this.createFeature(
          'CSS Cascade Layers',
          'cascade-layers',
          ['css.at-rules.layer'],
          '@layer',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Subgrid
      if (line.includes('subgrid')) {
        features.push(this.createFeature(
          'CSS Subgrid',
          'subgrid',
          ['css.properties.grid-template-columns.subgrid'],
          'subgrid',
          context.file_path,
          lineNumber,
          line
        ));
      }
    });

    return features;
  }

  /**
   * Fallback HTML pattern-based detection
   */
  private detectHTMLFeaturesPattern(context: ParseContext): IdentifiedFeature[] {
    const features: IdentifiedFeature[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Dialog element
      if (line.includes('<dialog')) {
        features.push(this.createFeature(
          'HTML Dialog Element',
          'dialog-element',
          ['html.elements.dialog'],
          '<dialog',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Loading attribute
      if (line.includes('loading=')) {
        features.push(this.createFeature(
          'HTML loading Attribute',
          'loading-attribute',
          ['html.elements.img.loading'],
          'loading=',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Popover attribute
      if (line.includes('popover=')) {
        features.push(this.createFeature(
          'HTML popover Attribute',
          'popover-attribute',
          ['html.global_attributes.popover'],
          'popover=',
          context.file_path,
          lineNumber,
          line
        ));
      }

      // Custom elements
      if (/<[a-z]+-[a-z-]+/.test(line)) {
        features.push(this.createFeature(
          'HTML Custom Elements',
          'custom-elements',
          ['api.CustomElementRegistry'],
          '-',
          context.file_path,
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
      ast_node_type: 'pattern-detected',
      confidence: 'high',
      location: {
        file: filePath,
        line,
        column: 1,
        context: context.trim()
      }
    };
  }
}