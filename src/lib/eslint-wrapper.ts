import { ESLint } from 'eslint';
import { computeBaseline } from 'compute-baseline';
import { ParseContext, IdentifiedFeature, DetailedSupport, BrowserSupport } from '../types/index.js';

export class ESLintFeatureDetector {
  private cssEslint?: ESLint;
  private htmlEslint?: ESLint;
  private target: 'widely' | 'newly';
  private initialized = false;

  constructor(target: 'widely' | 'newly' = 'widely') {
    this.target = target;
    console.log(`[ESLintFeatureDetector] Created with target: ${target}`);
  }

  private async initialize() {
    if (this.initialized) {
      console.log(`[ESLintFeatureDetector] Already initialized, skipping...`);
      return;
    }

    console.log(`[ESLintFeatureDetector] Starting initialization...`);

    try {
      const cssPlugin = await import('@eslint/css').then((m: any) => m.default || m);
      const projectRoot = new URL('../../..', import.meta.url).pathname;
      
      console.log(`[ESLintFeatureDetector] CSS Plugin loaded:`, !!cssPlugin);
      console.log(`[ESLintFeatureDetector] Project root: ${projectRoot}`);

      this.cssEslint = new ESLint({
        overrideConfigFile: true,
        cwd: projectRoot,
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
      
      console.log(`[ESLintFeatureDetector] CSS ESLint initialized successfully`);
    } catch (error) {
      console.error('[ESLintFeatureDetector] Failed to initialize CSS ESLint:', error);
    }

    try {
      const htmlParser = await import('@html-eslint/parser').then((m: any) => m.default || m);
      const htmlPlugin = await import('@html-eslint/eslint-plugin').then((m: any) => m.default || m);
      const projectRoot = new URL('../../..', import.meta.url).pathname;
      
      console.log(`[ESLintFeatureDetector] HTML Parser loaded:`, !!htmlParser);
      console.log(`[ESLintFeatureDetector] HTML Plugin loaded:`, !!htmlPlugin);

      this.htmlEslint = new ESLint({
        overrideConfigFile: true,
        cwd: projectRoot,
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
      
      console.log(`[ESLintFeatureDetector] HTML ESLint initialized successfully`);
    } catch (error) {
      console.error('[ESLintFeatureDetector] Failed to initialize HTML ESLint:', error);
    }

    this.initialized = true;
    console.log(`[ESLintFeatureDetector] Initialization complete`);
  }

  async detectFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    console.log(`[ESLintFeatureDetector.detectFeatures] Starting detection for file: ${context.file_path}`);
    console.log(`[ESLintFeatureDetector.detectFeatures] File type: ${context.file_type}`);
    console.log(`[ESLintFeatureDetector.detectFeatures] Content length: ${context.content.length} characters`);
    console.log(`[ESLintFeatureDetector.detectFeatures] First 200 chars:`, context.content.substring(0, 200));
    
    await this.initialize();

    let features: IdentifiedFeature[] = [];
    
    switch (context.file_type) {
      case 'html':
        console.log(`[ESLintFeatureDetector.detectFeatures] Routing to HTML detector`);
        features = await this.detectHTMLFeatures(context);
        break;

      case 'css':
      case 'scss':
      case 'sass':
        console.log(`[ESLintFeatureDetector.detectFeatures] Routing to CSS detector`);
        features = await this.detectCSSFeatures(context);
        break;

      default:
        console.log(`[ESLintFeatureDetector.detectFeatures] Unsupported file type: ${context.file_type}`);
    }
    
    console.log(`[ESLintFeatureDetector.detectFeatures] Detection complete. Found ${features.length} features`);
    return features;
  }

  private async detectHTMLFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    const features: IdentifiedFeature[] = [];
    
    console.log(`[detectHTMLFeatures] Starting HTML detection for: ${context.file_path}`);
    console.log(`[detectHTMLFeatures] HTML ESLint available: ${!!this.htmlEslint}`);

    if (this.htmlEslint) {
      try {
        const virtualPath = 'virtual.html';
        console.log(`[detectHTMLFeatures] Using virtual path: ${virtualPath} instead of: ${context.file_path}`);
        
        const results = await this.htmlEslint.lintText(context.content, {
          filePath: virtualPath
        });
        
        console.log(`[detectHTMLFeatures] ESLint returned ${results.length} results`);
        
        for (const [i, result] of results.entries()) {
          console.log(`[detectHTMLFeatures] Result ${i}:`, {
            filePath: result.filePath,
            messageCount: result.messages.length,
            errorCount: result.errorCount,
            warningCount: result.warningCount,
            suppressedMessages: result.suppressedMessages?.length || 0
          });

          for (const [j, message] of result.messages.entries()) {
            console.log(`[detectHTMLFeatures] Message ${j}:`, {
              ruleId: message.ruleId,
              severity: message.severity,
              message: message.message,
              line: message.line,
              column: message.column
            });

            if (message.ruleId === '@html-eslint/use-baseline') {
              const feature = await this.parseBaselineMessage(message, context, 'html');
              if (feature) {
                console.log(`[detectHTMLFeatures] Parsed feature:`, feature);
                features.push(feature);
              } else {
                console.log(`[detectHTMLFeatures] Failed to parse message: ${message.message}`);
              }
            }
          }
        }

      } catch (error) {
        console.error(`[detectHTMLFeatures] HTML-ESLint analysis failed:`, error);
      }
    } else {
      console.warn('[detectHTMLFeatures] HTML ESLint not available');
    }

    console.log(`[detectHTMLFeatures] Returning ${features.length} features`);
    return features;
  }

  private async detectCSSFeatures(context: ParseContext): Promise<IdentifiedFeature[]> {
    const features: IdentifiedFeature[] = [];
    
    console.log(`[detectCSSFeatures] Starting CSS detection for: ${context.file_path}`);
    console.log(`[detectCSSFeatures] CSS ESLint available: ${!!this.cssEslint}`);

    if (this.cssEslint) {
      try {
        const virtualPath = 'virtual.css';
        console.log(`[detectCSSFeatures] Using virtual path: ${virtualPath} instead of: ${context.file_path}`);
        
        const results = await this.cssEslint.lintText(context.content, {
          filePath: virtualPath
        });
        
        console.log(`[detectCSSFeatures] ESLint returned ${results.length} results`);
        
        for (const [i, result] of results.entries()) {
          console.log(`[detectCSSFeatures] Result ${i}:`, {
            filePath: result.filePath,
            messageCount: result.messages.length,
            errorCount: result.errorCount,
            warningCount: result.warningCount,
            suppressedMessages: result.suppressedMessages?.length || 0
          });

          for (const [j, message] of result.messages.entries()) {
            console.log(`[detectCSSFeatures] Message ${j}:`, {
              ruleId: message.ruleId,
              severity: message.severity,
              message: message.message,
              line: message.line,
              column: message.column
            });

            if (message.ruleId === 'css/use-baseline') {
              const feature = await this.parseBaselineMessage(message, context, 'css');
              if (feature) {
                console.log(`[detectCSSFeatures] Parsed feature:`, feature);
                features.push(feature);
              } else {
                console.log(`[detectCSSFeatures] Failed to parse message: ${message.message}`);
              }
            }
          }
        }

      } catch (error) {
        console.error(`[detectCSSFeatures] CSS-ESLint analysis failed:`, error);
      }
    } else {
      console.warn('[detectCSSFeatures] CSS ESLint not available');
    }

    console.log(`[detectCSSFeatures] Returning ${features.length} features`);
    return features;
  }

  private async parseBaselineMessage(message: any, context: ParseContext, type: 'css' | 'html'): Promise<IdentifiedFeature | null> {
    const messageText = message.message;
    console.log(`[parseBaselineMessage] Parsing message: "${messageText}" for type: ${type}`);
    
    let syntaxPattern: string | undefined;
    let featureName: string | undefined;
    let bcdKey: string | undefined;

    if (type === 'css') {
      const propertyMatch = messageText.match(/Property '([^']+)'/);
      const atRuleMatch = messageText.match(/At-rule '@([^']+)'/);
      const selectorMatch = messageText.match(/Selector '([^']+)'/);
      const valueMatch = messageText.match(/Value '([^']+)' of property '([^']+)'/);
      const typeMatch = messageText.match(/Type '([^']+)'/);

      if (propertyMatch) {
        syntaxPattern = propertyMatch[1];
        featureName = `CSS ${propertyMatch[1]} property`;
        bcdKey = `css.properties.${syntaxPattern}`;
      } else if (atRuleMatch) {
        syntaxPattern = `@${atRuleMatch[1]}`;
        featureName = `CSS @${atRuleMatch[1]} at-rule`;
        bcdKey = `css.at-rules.${atRuleMatch[1]}`;
      } else if (selectorMatch) {
        syntaxPattern = selectorMatch[1];
        featureName = `CSS ${syntaxPattern} selector`;
        bcdKey = `css.selectors.${syntaxPattern}`;
      } else if (valueMatch) {
        syntaxPattern = valueMatch[1];
        featureName = `CSS ${valueMatch[1]} value`;
        bcdKey = `css.properties.${valueMatch[2]}`;
      } else if (typeMatch) {
        syntaxPattern = typeMatch[1];
        featureName = `CSS ${typeMatch[1]} function`;
        bcdKey = `css.types.${syntaxPattern.replace(/\(\)$/, '')}`;
      }
    } else if (type === 'html') {
      const inputTypeMatch = messageText.match(/Attribute 'type="([^"]+)"' on '<input>'/);
      const elementMatch = messageText.match(/Element '<([^>]+)>'/);
      const attributeMatch = messageText.match(/Attribute '([^']+)'/);

      if (inputTypeMatch) {
        const typeValue = inputTypeMatch[1];
        syntaxPattern = `type=${typeValue}`;
        featureName = `HTML type="${typeValue}" attribute`;
        bcdKey = `html.elements.input.type_${typeValue}`;
      } else if (elementMatch) {
        syntaxPattern = elementMatch[1];
        featureName = `HTML <${syntaxPattern}> element`;
        bcdKey = `html.elements.${syntaxPattern}`;
      } else if (attributeMatch) {
        syntaxPattern = `${attributeMatch[1]}=`;
        featureName = `HTML ${attributeMatch[1]} attribute`;
        bcdKey = `html.global_attributes.${attributeMatch[1]}`;
      }
    }

    if (!syntaxPattern || !featureName) {
      console.warn(`[parseBaselineMessage] Could not parse message: no pattern matched`);
      return null;
    }

    const feature: IdentifiedFeature = {
      feature_name: featureName,
      feature_id: `${type}-${syntaxPattern!.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      bcd_keys: bcdKey ? [bcdKey] : [],
      syntax_pattern: syntaxPattern!,
      ast_node_type: type,
      confidence: 'high' as const,
      location: {
        file: context.file_path,
        line: message.line || 1,
        column: message.column || 1,
        context: this.getLineContext(context.content, message.line || 1)
      }
    };

    if (bcdKey) {
      const detailedSupport = await this.enrichWithComputeBaseline(bcdKey);
      if (detailedSupport) {
        feature.detailed_support = detailedSupport;
      }
    }

    console.log(`[parseBaselineMessage] Successfully parsed feature:`, feature);
    return feature;
  }

  private getLineContext(content: string, lineNumber: number): string {
    const lines = content.split('\n');
    const line = lines[lineNumber - 1];
    return line ? line.trim() : '';
  }

  private async enrichWithComputeBaseline(bcdKey: string): Promise<DetailedSupport | undefined> {
    try {
      console.log(`[enrichWithComputeBaseline] Computing baseline for: ${bcdKey}`);

      const result = computeBaseline({
        compatKeys: [bcdKey],
        checkAncestors: true,
      });

      const browserSupport = this.extractBrowserSupport(result.support);

      const detailedSupport: DetailedSupport = {
        baseline_status: result.baseline,
        baseline_low_date: result.baseline_low_date || null,
        baseline_high_date: result.baseline_high_date || null,
        browser_support: browserSupport,
        discouraged: result.discouraged || false,
      };

      console.log(`[enrichWithComputeBaseline] Enriched data:`, detailedSupport);
      return detailedSupport;

    } catch (error) {
      console.warn(`[enrichWithComputeBaseline] Failed to compute baseline for ${bcdKey}:`, error);
      return undefined;
    }
  }

  private extractBrowserSupport(supportData: any): BrowserSupport {
    const browserSupport: BrowserSupport = {};

    if (!supportData) {
      return browserSupport;
    }

    try {
      if (supportData instanceof Map) {
        for (const [browser, version] of supportData.entries()) {
          const browserId = this.normalizeBrowserId(browser);
          const versionString = this.extractVersion(version);

          if (browserId && versionString) {
            browserSupport[browserId] = versionString;
          }
        }
      } else if (typeof supportData === 'object') {
        for (const [browser, version] of Object.entries(supportData)) {
          const browserId = this.normalizeBrowserId(browser);
          const versionString = this.extractVersion(version);

          if (browserId && versionString) {
            browserSupport[browserId] = versionString;
          }
        }
      }
    } catch (error) {
      console.warn('[extractBrowserSupport] Failed to extract support data:', error);
    }

    return browserSupport;
  }

  private normalizeBrowserId(browser: any): string | null {
    if (typeof browser === 'string') {
      return browser;
    } else if (browser && typeof browser === 'object' && 'id' in browser) {
      return String(browser.id);
    }
    return null;
  }

  private extractVersion(version: any): string | null {
    if (typeof version === 'string' || typeof version === 'number') {
      return String(version);
    } else if (version && typeof version === 'object') {
      if ('text' in version && version.text) {
        return String(version.text);
      }
      if ('version_added' in version && version.version_added) {
        return String(version.version_added);
      }
      if ('version' in version && version.version) {
        return String(version.version);
      }
    }
    return null;
  }
}
