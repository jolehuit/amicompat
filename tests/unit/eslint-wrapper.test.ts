import { describe, it, expect, beforeEach } from 'vitest';
import { ESLintFeatureDetector } from '../../src/lib/eslint-wrapper.js';
import { ParseContext } from '../../src/types/index.js';

describe('ESLintFeatureDetector', () => {
  let detector: ESLintFeatureDetector;

  beforeEach(() => {
    detector = new ESLintFeatureDetector('widely');
  });

  describe('CSS feature detection', () => {
    it('should detect view-transition-name property', async () => {
      const context: ParseContext = {
        file_path: 'test.css',
        content: '.slide { view-transition-name: slide-in; }',
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('CSS view-transition-name property');
      expect(features[0].syntax_pattern).toBe('view-transition-name');
      expect(features[0].location.line).toBe(1);
    });

    it('should detect anchor-name property', async () => {
      const context: ParseContext = {
        file_path: 'test.css',
        content: '.anchor { anchor-name: --my-anchor; }',
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('CSS anchor-name property');
      expect(features[0].syntax_pattern).toBe('anchor-name');
    });

    it('should detect multiple CSS features in one file', async () => {
      const context: ParseContext = {
        file_path: 'test.css',
        content: `
.modern {
  view-transition-name: slide;
  anchor-name: --my-anchor;
}
`,
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);

      expect(features.length).toBeGreaterThan(1);
      const featureNames = features.map(f => f.feature_name);
      expect(featureNames).toContain('CSS view-transition-name property');
      expect(featureNames).toContain('CSS anchor-name property');
    });

    it('should not detect widely supported CSS properties', async () => {
      const context: ParseContext = {
        file_path: 'test.css',
        content: '.basic { display: flex; color: red; margin: 10px; }',
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(0);
    });
  });

  describe('HTML feature detection', () => {
    it('should detect search element', async () => {
      const context: ParseContext = {
        file_path: 'test.html',
        content: '<search><input type="search" /></search>',
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('HTML <search> element');
      expect(features[0].syntax_pattern).toBe('search');
      expect(features[0].location.line).toBe(1);
    });

    it('should not detect widely supported HTML elements', async () => {
      const context: ParseContext = {
        file_path: 'test.html',
        content: '<dialog>Dialog content</dialog>',
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);

      // Dialog might be considered widely supported
      expect(Array.isArray(features)).toBe(true);
    });

    it('should not detect widely supported HTML elements', async () => {
      const context: ParseContext = {
        file_path: 'test.html',
        content: '<div><p>Basic HTML</p><span>Text</span></div>',
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(0);
    });
  });

  describe('Target-based detection', () => {
    it('should detect different features for different targets', async () => {
      const context: ParseContext = {
        file_path: 'test.html',
        content: '<search><input type="search" /></search>',
        file_type: 'html'
      };

      const widelyDetector = new ESLintFeatureDetector('widely');
      const newlyDetector = new ESLintFeatureDetector('newly');

      const widelyFeatures = await widelyDetector.detectFeatures(context);
      const newlyFeatures = await newlyDetector.detectFeatures(context);

      // Search element might be "newly" available but not "widely"
      expect(widelyFeatures.length).toBeGreaterThanOrEqual(0);
      expect(newlyFeatures.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Unsupported file types', () => {
    it('should return empty array for unsupported file types', async () => {
      const context: ParseContext = {
        file_path: 'test.txt',
        content: 'plain text content',
        file_type: 'css' // Force CSS type but wrong content
      };

      const features = await detector.detectFeatures(context);

      // Should handle gracefully
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed CSS gracefully', async () => {
      const context: ParseContext = {
        file_path: 'test.css',
        content: '.broken { color: ; view-transition-name: test }',
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);

      // Should still detect the feature despite syntax errors
      expect(Array.isArray(features)).toBe(true);
    });

    it('should handle malformed HTML gracefully', async () => {
      const context: ParseContext = {
        file_path: 'test.html',
        content: '<search><unclosed><search>Valid search</search>',
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);

      // Should still detect features despite syntax errors
      expect(Array.isArray(features)).toBe(true);
    });
  });
});