/**
 * ESLint-based feature detection wrapper
 * Uses ESLint plugins for robust feature detection without false positives
 */

import { ESLint } from 'eslint';
import { ParseContext, IdentifiedFeature } from '../types/index.js';
import { dirname } from 'path';

/**
 * ESLint-powered feature detector
 * Eliminates false positives by using AST-based analysis
 */
export class ESLintFeatureDetector {
  private cssEslint?: ESLint;
  private htmlEslint?: ESLint;
  private target: 'widely' | 'newly';
  private initialized = false;
  private currentProjectPath?: string;

  constructor(target: 'widely' | 'newly' = 'widely') {
    this.target = target;
  }

  private async initialize(filePath: string) {
    // Use the directory of the file being analyzed as cwd
    const projectDir = dirname(filePath);
    
    // Re-initialize if project path changes
    if (this.initialized && this.currentProjectPath === projectDir) return;
    
    this.currentProjectPath = projectDir;

    // CSS ESLint instance with @eslint/css plugin
    try {
      const cssPlugin = await import('@eslint/css').then((m: any) => m.default || m);

      this.cssEslint = new ESLint({
        overrideConfigFile: true,
        cwd: projectDir, // Use the analyzed file's directory
        ignore: false,
        baseConfig: [
          {
            files: ['**/*.css'],
            plugins: {
              'css': cssPlugin
            },
            language: 'css/css',
            rules: {
              'css/use-baseline': ['error', { available: this.target }]
            }
          }
        ]
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
        cwd: projectDir, // Use the analyzed file's directory
        ignore: false,
        baseConfig: [
          {
            files: ['**/*.html'],
            languageOptions: {
              parser: htmlParser
            },
            plugins: {
              '@html-eslint': htmlPlugin
            },
            rules: {
              '@html-eslint/use-baseline': ['error', { available: this.target }]
            }
          }
        ]
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
    // Initialize with the current file's path
    await this.initialize(context.file_path);

    switch (context.file_type) {
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
              const feature = this.parseBaselineMessage(message, context, 'html');
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

    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('HTML ESLint not available, no features detected');
      }
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
              const feature = this.parseBaselineMessage(message, context, 'css');
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

    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('CSS ESLint not available, no features detected');
      }
    }

    return features;
  }

  /**
   * Parse baseline message to extract feature information
   */
  private parseBaselineMessage(message: any, context: ParseContext, type: 'css' | 'html'): IdentifiedFeature | null {
    const messageText = message.message;
    let syntaxPattern: string | undefined;
    let featureName: string | undefined;

    if (type === 'css') {
      // Try to match patterns like "Property 'container-type' is not widely available"
      const propertyMatch = messageText.match(/Property '([^']+)'/);
      const atRuleMatch = messageText.match(/At-rule '@([^']+)'/);
      const selectorMatch = messageText.match(/Selector '([^']+)'/);
      const valueMatch = messageText.match(/Value '([^']+)'/);
      const functionMatch = messageText.match(/Function '([^']+)'/);

      if (propertyMatch) {
        syntaxPattern = propertyMatch[1];
        featureName = `CSS ${propertyMatch[1]} property`;
      } else if (atRuleMatch) {
        syntaxPattern = `@${atRuleMatch[1]}`;
        featureName = `CSS @${atRuleMatch[1]} at-rule`;
      } else if (selectorMatch) {
        syntaxPattern = selectorMatch[1];
        featureName = `CSS ${selectorMatch[1]} selector`;
      } else if (valueMatch) {
        syntaxPattern = valueMatch[1];
        featureName = `CSS ${valueMatch[1]} value`;
      } else if (functionMatch) {
        syntaxPattern = `${functionMatch[1]}()`;
        featureName = `CSS ${functionMatch[1]}() function`;
      }
    } else if (type === 'html') {
      // Try to match patterns like "Element 'dialog' is not widely available"
      const elementMatch = messageText.match(/Element '([^']+)'/);
      const attributeMatch = messageText.match(/Attribute '([^']+)'/);
      const valueMatch = messageText.match(/Value '([^']+)'/);

      if (elementMatch) {
        syntaxPattern = `<${elementMatch[1]}>`;
        featureName = `HTML ${elementMatch[1]} element`;
      } else if (attributeMatch) {
        syntaxPattern = `${attributeMatch[1]}=`;
        featureName = `HTML ${attributeMatch[1]} attribute`;
      } else if (valueMatch) {
        syntaxPattern = valueMatch[1];
        featureName = `HTML ${valueMatch[1]} value`;
      }
    }

    if (!syntaxPattern || !featureName) {
      // Log unmatched messages for debugging
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Could not parse baseline message: ${messageText}`);
      }
      return null;
    }

    return {
      feature_name: featureName,
      feature_id: `${type}-${syntaxPattern.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      bcd_keys: [],
      syntax_pattern: syntaxPattern,
      ast_node_type: type,
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
   * Get line context from content
   */
  private getLineContext(content: string, lineNumber: number): string {
    const lines = content.split('\n');
    const line = lines[lineNumber - 1];
    return line ? line.trim() : '';
  }
}