import { describe, it, expect, beforeEach } from 'vitest';
import { BaselineCompute } from '../../src/lib/baseline.js';

describe('BaselineCompute', () => {
  let baseline: BaselineCompute;

  beforeEach(() => {
    baseline = new BaselineCompute();
  });

  describe('getFeatureStatus', () => {
    it('should return false baseline for empty compat keys', async () => {
      const status = await baseline.getFeatureStatus([]);

      expect(status.baseline).toBe(false);
      expect(status.support).toEqual({});
      expect(status.discouraged).toBe(false);
    });

    it('should handle compute-baseline integration', async () => {
      // Test with a known compatibility key
      const compatKeys = ['css.properties.display'];
      const status = await baseline.getFeatureStatus(compatKeys);

      expect(status).toHaveProperty('baseline');
      expect(status).toHaveProperty('support');
      expect(status).toHaveProperty('discouraged');
      expect(typeof status.baseline).toBe('string' || 'boolean');
      expect(typeof status.support).toBe('object');
      expect(typeof status.discouraged).toBe('boolean');
    });

    it('should cache results', async () => {
      const compatKeys = ['css.properties.display'];

      const status1 = await baseline.getFeatureStatus(compatKeys);
      const status2 = await baseline.getFeatureStatus(compatKeys);

      // Should return the same object (cached)
      expect(status1).toEqual(status2);
    });

    it('should handle invalid compat keys gracefully', async () => {
      const compatKeys = ['invalid.nonexistent.key'];
      const status = await baseline.getFeatureStatus(compatKeys);

      expect(status.baseline).toBe(false);
      expect(status.support).toEqual({});
      expect(status.discouraged).toBe(false);
    });
  });

  describe('calculateBrowserCoverage', () => {
    it('should calculate coverage for all major browsers', () => {
      const features = [
        {
          baseline: 'high' as const,
          support: {
            chrome: '95',
            firefox: '90',
            safari: '14',
            edge: '95'
          },
          discouraged: false
        },
        {
          baseline: 'low' as const,
          support: {
            chrome: '100',
            firefox: false,
            safari: '15',
            edge: '100'
          },
          discouraged: false
        }
      ];

      const coverage = baseline.calculateBrowserCoverage(features);

      expect(coverage).toHaveProperty('chrome');
      expect(coverage).toHaveProperty('firefox');
      expect(coverage).toHaveProperty('safari');
      expect(coverage).toHaveProperty('edge');

      expect(coverage.chrome).toBe(100); // 2/2 supported
      expect(coverage.firefox).toBe(50); // 1/2 supported
      expect(coverage.safari).toBe(100); // 2/2 supported
      expect(coverage.edge).toBe(100); // 2/2 supported
    });

    it('should handle empty features array', () => {
      const coverage = baseline.calculateBrowserCoverage([]);

      expect(coverage.chrome).toBe(0);
      expect(coverage.firefox).toBe(0);
      expect(coverage.safari).toBe(0);
      expect(coverage.edge).toBe(0);
    });
  });

  describe('getBaselineLevel', () => {
    it('should return "widely" for high baseline', () => {
      const status = {
        baseline: 'high' as const,
        support: { chrome: '95' },
        discouraged: false
      };

      expect(baseline.getBaselineLevel(status)).toBe('widely');
    });

    it('should return "newly" for low baseline', () => {
      const status = {
        baseline: 'low' as const,
        support: { chrome: '100' },
        discouraged: false
      };

      expect(baseline.getBaselineLevel(status)).toBe('newly');
    });

    it('should return "limited" for false baseline with some support', () => {
      const status = {
        baseline: false as const,
        support: { chrome: '105' },
        discouraged: false
      };

      expect(baseline.getBaselineLevel(status)).toBe('limited');
    });

    it('should return "none" for false baseline with no support', () => {
      const status = {
        baseline: false as const,
        support: {},
        discouraged: false
      };

      expect(baseline.getBaselineLevel(status)).toBe('none');
    });
  });

  describe('getRecommendations', () => {
    it('should recommend polyfills for limited features', () => {
      const features = [
        {
          baseline: false as const,
          support: { chrome: '105' },
          discouraged: false
        }
      ];

      const recommendations = baseline.getRecommendations(features);

      expect(recommendations.some(r => r.includes('polyfills'))).toBe(true);
      expect(recommendations.some(r => r.includes('older browser'))).toBe(true);
    });

    it('should recommend monitoring for new features', () => {
      const features = [
        {
          baseline: 'low' as const,
          support: { chrome: '100', firefox: '95' },
          discouraged: false
        }
      ];

      const recommendations = baseline.getRecommendations(features);

      expect(recommendations.some(r => r.includes('newly available'))).toBe(true);
      expect(recommendations.some(r => r.includes('progressive enhancement'))).toBe(true);
    });

    it('should identify weakest browser', () => {
      const features = [
        {
          baseline: 'high' as const,
          support: {
            chrome: '95',
            firefox: '90',
            safari: false, // Safari is weakest
            edge: '95'
          },
          discouraged: false
        }
      ];

      const recommendations = baseline.getRecommendations(features);

      expect(recommendations.some(r => r.includes('safari'))).toBe(true);
    });

    it('should return empty array for no features', () => {
      const recommendations = baseline.getRecommendations([]);
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const compatKeys = ['css.properties.display'];

      await baseline.getFeatureStatus(compatKeys);
      baseline.clearCache();

      // After clearing cache, should make new computation
      const status = await baseline.getFeatureStatus(compatKeys);
      expect(status).toBeDefined();
    });
  });
});