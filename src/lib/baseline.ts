import { computeBaseline } from 'compute-baseline';
import { BaselineStatus, BaselineTarget } from '../types/index.js';

/**
 * Local Baseline data integration using web-features
 * Consumes Baseline data locally instead of API calls
 */
export class BaselineCompute {
  private cache = new Map<string, BaselineStatus>();

  /**
   * Normalize compat keys to forms supported by compute-baseline/BCD
   * Example: map dynamic import subkey to the parent statement key
   */
  private normalizeCompatKeys(compatKeys: string[]): string[] {
    return compatKeys.map((key) => {
      // Map unsupported sub-features to known ancestors
      if (key === 'javascript.statements.import.dynamic') {
        return 'javascript.statements.import';
      }
      return key;
    });
  }

  /**
   * Get baseline status for a feature using local compute-baseline
   */
  async getFeatureStatus(compatKeys: string[], target: BaselineTarget = 'baseline-2024'): Promise<BaselineStatus> {
    if (compatKeys.length === 0) {
      return {
        baseline: false,
        support: {},
        discouraged: false,
      };
    }
    const normalizedKeys = this.normalizeCompatKeys(compatKeys);
    const cacheKey = `${normalizedKeys.join(',')}:${target}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const result = computeBaseline({
        compatKeys: normalizedKeys as [string, ...string[]],
        checkAncestors: true,
      });

      const status: BaselineStatus = {
        baseline: result.baseline as 'high' | 'low' | false,
        baseline_low_date: result.baseline_low_date || undefined,
        baseline_high_date: result.baseline_high_date || undefined,
        support: this.extractSupportData(result),
        discouraged: result.discouraged || false,
      };

      this.cache.set(cacheKey, status);
      return status;
    } catch (error) {
      // Silently handle compute errors in tests, warn in other environments
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Failed to compute baseline for ${compatKeys.join(', ')}:`, error);
      }
      return {
        baseline: false,
        support: {},
        discouraged: false,
      };
    }
  }

  /**
   * Extract support data from compute-baseline result
   */
  private extractSupportData(result: any): Record<string, string | boolean> {
    const support: Record<string, string | boolean> = {};
  
    try {
      const raw = result?.support;
  
      // Handle Map returned by compute-baseline
      if (raw instanceof Map) {
        for (const [browser, initial] of raw.entries()) {
          let browserId: string;
          
          // Extract browser ID more robustly
          if (typeof browser === 'string') {
            browserId = browser;
          } else if (browser && typeof browser === 'object' && 'id' in browser) {
            browserId = String(browser.id);
          } else if (browser && typeof browser === 'object' && 'name' in browser) {
            browserId = String(browser.name).toLowerCase();
          } else {
            browserId = String(browser);
          }
  
          // Extract version/support info more robustly
          let value: string | boolean | undefined;
          if (typeof initial === 'string' || typeof initial === 'boolean' || typeof initial === 'number') {
            value = String(initial);
          } else if (initial && typeof initial === 'object') {
            // Try multiple properties
            if ('version_added' in initial && initial.version_added) {
              value = String(initial.version_added);
            } else if ('text' in initial && initial.text) {
              value = String(initial.text);
            } else if ('version' in initial && initial.version) {
              value = String(initial.version);
            } else {
              value = true; // Supported but no version info
            }
          }
  
          if (value !== undefined && value !== '' && value !== 'false') {
            support[browserId] = value;
          }
        }
        return support;
      }
  
      // Handle plain object
      if (raw && typeof raw === 'object') {
        for (const [browser, version] of Object.entries(raw)) {
          if (version && version !== 'false') {
            support[browser] = String(version);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to extract support data:', error);
    }
  
    return support;
  }  
  /**
   * Calculate browser coverage percentage based on support data
   */
  calculateBrowserCoverage(features: BaselineStatus[]): Record<string, number> {
    const browsers = ['chrome', 'firefox', 'safari', 'edge'];
    const coverage: Record<string, number> = {};
  
    for (const browser of browsers) {
      let supportedCount = 0;
      let totalCount = 0;
  
      for (const feature of features) {
        totalCount++;
        const support = feature.support[browser];
        if (support && typeof support === 'string' && support !== '') {
          supportedCount++;
        }
      }
        coverage[browser] = totalCount > 0 ? (supportedCount / totalCount) * 100 : 100;
    }
  
    return coverage;
  }
  
  /**
   * Determine the target baseline level based on support
   */
  getBaselineLevel(status: BaselineStatus): 'widely' | 'newly' | 'limited' | 'none' {
    if (status.baseline === 'high') return 'widely';
    if (status.baseline === 'low') return 'newly';
    if (status.baseline === false) {
      // Check if there's any browser support
      const hasSomeSupport = Object.values(status.support).some(
        support => support && typeof support === 'string' && support !== ''
      );
      return hasSomeSupport ? 'limited' : 'none';
    }
    return 'none';
  }

  /**
   * Get recommendations based on baseline status
   */
  getRecommendations(features: BaselineStatus[]): string[] {
    const recommendations: string[] = [];
    const limitedFeatures = features.filter(f => this.getBaselineLevel(f) === 'limited');
    const newFeatures = features.filter(f => this.getBaselineLevel(f) === 'newly');

    if (limitedFeatures.length > 0) {
      recommendations.push('Consider adding polyfills for limited support features');
      recommendations.push('Test thoroughly in older browser versions');
    }

    if (newFeatures.length > 0) {
      recommendations.push('Monitor newly available features for wider adoption');
      recommendations.push('Consider progressive enhancement strategies');
    }

    const coverage = this.calculateBrowserCoverage(features);
    const weakestBrowser = Object.entries(coverage).reduce((min, [browser, score]) =>
      score < min.score ? { browser, score } : min,
      { browser: 'unknown', score: 100 }
    );

    if (weakestBrowser.score < 80) {
      recommendations.push(`Pay special attention to ${weakestBrowser.browser} compatibility (${weakestBrowser.score.toFixed(1)}%)`);
    }

    return recommendations;
  }

  /**
   * Clear the internal cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
