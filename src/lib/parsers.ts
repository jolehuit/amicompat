import { parse as babelParse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import * as postcss from 'postcss';
import * as selectorParser from 'postcss-selector-parser';
import * as cheerio from 'cheerio';
import { ParseContext, FeatureLocation, FileType } from '../types/index.js';

/**
 * AST-based parsers replacing all regex-based detection
 */
export class ASTParser {

  /**
   * Parse JavaScript/TypeScript files using Babel
   */
  async parseJavaScript(context: ParseContext): Promise<FeatureLocation[]> {
    const features: FeatureLocation[] = [];

    try {
      const ast = babelParse(context.content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'dynamicImport',
          'optionalChaining',
          'nullishCoalescingOperator',
          'topLevelAwait',
          'classPrivateProperties',
          'classPrivateMethods',
        ],
      });

      (traverse.default || traverse)(ast, {
        // Optional chaining (?.)
        OptionalMemberExpression: (path: NodePath<t.OptionalMemberExpression>) => {
          const loc = path.node.loc;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.start.line,
              column: loc.start.column,
              context: context.content.split('\n')[loc.start.line - 1] || '',
            });
          }
        },

        // Nullish coalescing (??)
        LogicalExpression: (path: NodePath<t.LogicalExpression>) => {
          if (path.node.operator === '??') {
            const loc = path.node.loc;
            if (loc) {
              features.push({
                file: context.file_path,
                line: loc.start.line,
                column: loc.start.column,
                context: context.content.split('\n')[loc.start.line - 1] || '',
              });
            }
          }
        },

        // Private class fields
        ClassPrivateProperty: (path: NodePath<t.ClassPrivateProperty>) => {
          const loc = path.node.loc;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.start.line,
              column: loc.start.column,
              context: context.content.split('\n')[loc.start.line - 1] || '',
            });
          }
        },

        // Top-level await
        AwaitExpression: (path: NodePath<t.AwaitExpression>) => {
          // Check if await is at the top level (not inside a function)
          const functionParent = path.getFunctionParent();
          if (!functionParent) {
            const loc = path.node.loc;
            if (loc) {
              features.push({
                file: context.file_path,
                line: loc.start.line,
                column: loc.start.column,
                context: context.content.split('\n')[loc.start.line - 1] || '',
              });
            }
          }
        },

        // Dynamic imports
        CallExpression: (path: NodePath<t.CallExpression>) => {
          if (t.isImport(path.node.callee)) {
            const loc = path.node.loc;
            if (loc) {
              features.push({
                file: context.file_path,
                line: loc.start.line,
                column: loc.start.column,
                context: context.content.split('\n')[loc.start.line - 1] || '',
              });
            }
          }
        },
      });

    } catch (error) {
      console.warn(`Failed to parse JavaScript file ${context.file_path}:`, error);
    }

    return features;
  }

  /**
   * Parse CSS files using PostCSS
   */
  async parseCSS(context: ParseContext): Promise<FeatureLocation[]> {
    const features: FeatureLocation[] = [];

    try {
      const root = postcss.parse(context.content, { from: context.file_path });

      root.walkRules((rule) => {
        // CSS Container Queries - detect rules inside @container
        if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'container') {
          const loc = rule.parent.source?.start || rule.source?.start;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.line,
              column: loc.column,
              context: rule.parent.toString().split('\n')[0] || '',
            });
          }
        }

        // :has() selector
        try {
          // @ts-expect-error - postcss-selector-parser type issues
          const processor = selectorParser((selectors: any) => {
            selectors.walkPseudos((pseudo: any) => {
              if (pseudo.value === ':has') {
                const loc = rule.source?.start;
                if (loc) {
                  features.push({
                    file: context.file_path,
                    line: loc.line,
                    column: loc.column,
                    context: rule.selector,
                  });
                }
              }
            });
          });
          processor.processSync(rule.selector);
        } catch {
          // Skip invalid selectors
        }
      });

      root.walkAtRules((atRule) => {
        // CSS Container Queries
        if (atRule.name === 'container') {
          const loc = atRule.source?.start;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.line,
              column: loc.column,
              context: atRule.toString().split('\n')[0] || '',
            });
          }
        }

        // CSS Grid Subgrid
        if (atRule.name === 'supports' && atRule.params.includes('subgrid')) {
          const loc = atRule.source?.start;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.line,
              column: loc.column,
              context: atRule.toString().split('\n')[0] || '',
            });
          }
        }

        // CSS Cascade Layers
        if (atRule.name === 'layer') {
          const loc = atRule.source?.start;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.line,
              column: loc.column,
              context: atRule.toString().split('\n')[0] || '',
            });
          }
        }

        // CSS @property
        if (atRule.name === 'property') {
          const loc = atRule.source?.start;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.line,
              column: loc.column,
              context: atRule.toString().split('\n')[0] || '',
            });
          }
        }
      });

      root.walkDecls((decl) => {
        // CSS custom properties with color-mix()
        if (decl.value.includes('color-mix(')) {
          const loc = decl.source?.start;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.line,
              column: loc.column,
              context: `${decl.prop}: ${decl.value}`,
            });
          }
        }

        // CSS Grid subgrid value
        if (decl.value === 'subgrid') {
          const loc = decl.source?.start;
          if (loc) {
            features.push({
              file: context.file_path,
              line: loc.line,
              column: loc.column,
              context: `${decl.prop}: ${decl.value}`,
            });
          }
        }
      });

    } catch (error) {
      console.warn(`Failed to parse CSS file ${context.file_path}:`, error);
    }

    return features;
  }

  /**
   * Parse HTML files using Cheerio
   */
  async parseHTML(context: ParseContext): Promise<FeatureLocation[]> {
    const features: FeatureLocation[] = [];

    try {
      const $ = cheerio.load(context.content, null, false);

      // Dialog element
      $('dialog').each((_, element) => {
        // Simplified line detection without startIndex
        const elementText = $(element).toString();
        const line = context.content.indexOf(elementText);
        if (line !== -1) {
          const lineNumber = context.content.substring(0, line).split('\n').length;
          features.push({
            file: context.file_path,
            line: lineNumber,
            column: 0,
            context: elementText.split('\n')[0] || '',
          });
        }
      });

      // Helper function to get line number for element
      const getElementLine = (element: any): number => {
        const elementText = $(element).toString();
        const index = context.content.indexOf(elementText);
        return index !== -1 ? context.content.substring(0, index).split('\n').length : 1;
      };

      // Loading attribute
      $('[loading]').each((_, element) => {
        features.push({
          file: context.file_path,
          line: getElementLine(element),
          column: 0,
          context: $(element).toString().split('\n')[0] || '',
        });
      });

      // Modern input types
      const modernInputTypes = ['date', 'color', 'range', 'datetime-local', 'month', 'week', 'time'];
      modernInputTypes.forEach(inputType => {
        $(`input[type="${inputType}"]`).each((_, element) => {
          features.push({
            file: context.file_path,
            line: getElementLine(element),
            column: 0,
            context: $(element).toString().split('\n')[0] || '',
          });
        });
      });

      // Web Components (custom elements)
      $('*').each((_, element) => {
        const tagName = (element as any).name || (element as any).tagName;
        if (tagName && tagName.includes('-')) {
          features.push({
            file: context.file_path,
            line: getElementLine(element),
            column: 0,
            context: $(element).toString().split('\n')[0] || '',
          });
        }
      });

    } catch (error) {
      console.warn(`Failed to parse HTML file ${context.file_path}:`, error);
    }

    return features;
  }

  /**
   * Route to appropriate parser based on file type
   */
  async parseFile(context: ParseContext): Promise<FeatureLocation[]> {
    switch (context.file_type) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return this.parseJavaScript(context);

      case 'css':
      case 'scss':
      case 'sass':
        return this.parseCSS(context);

      case 'html':
        return this.parseHTML(context);

      default:
        console.warn(`Unsupported file type: ${context.file_type}`);
        return [];
    }
  }

  /**
   * Detect file type from extension
   */
  detectFileType(filePath: string): FileType | null {
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