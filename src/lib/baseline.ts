import { computeBaseline } from 'compute-baseline';
import { BaselineStatus, BaselineTarget } from '../types/index.js';

/**
 * Local Baseline data integration using web-features
 * Consumes Baseline data locally instead of API calls
 */
export class BaselineCompute {
  private cache = new Map<string, BaselineStatus>();

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
    const cacheKey = `${compatKeys.join(',')}:${target}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const result = computeBaseline({
        compatKeys: compatKeys as [string, ...string[]],
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

      // Preferred: handle Map returned by compute-baseline directly
      // Map keys are Browser objects (with `id`), values are InitialSupport objects (with `text`)
      if (raw instanceof Map) {
        for (const [browser, initial] of raw.entries()) {
          const browserId = typeof browser === 'string'
            ? browser
            : (browser && typeof browser === 'object' && 'id' in browser)
              ? String((browser as any).id)
              : String(browser);

          let value: string | boolean | undefined;
          if (typeof initial === 'string' || typeof initial === 'boolean' || typeof initial === 'number') {
            value = String(initial);
          } else if (initial && typeof initial === 'object') {
            // compute-baseline exposes a `.text` representation on InitialSupport
            if ('text' in initial && typeof (initial as any).text === 'string') {
              value = (initial as any).text as string;
            }
          }

          if (value !== undefined && value !== '') {
            support[browserId] = value;
          }
        }
        return support;
      }

      // Fallback: handle plain-object output (e.g., from JSON.parse(result.toJSON()))
      if (raw && typeof raw === 'object') {
        for (const [browser, version] of Object.entries(raw)) {
          if (
            typeof version === 'string' ||
            typeof version === 'boolean' ||
            typeof version === 'number'
          ) {
            const value = String(version);
            if (value !== '') {
              support[browser] = value;
            }
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

      coverage[browser] = totalCount > 0 ? (supportedCount / totalCount) * 100 : 0;
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
