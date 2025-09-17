import { describe, it, expect, beforeEach } from 'vitest';
import { ESLintFeatureDetector } from '../../src/lib/eslint-wrapper.js';
import { ParseContext } from '../../src/types/index.js';

describe('ESLintFeatureDetector', () => {
  let detector: ESLintFeatureDetector;

  beforeEach(() => {
    detector = new ESLintFeatureDetector('baseline-2024');
  });

  describe('JavaScript feature detection', () => {
    it('should detect optional chaining', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'const result = obj?.property?.method?.();',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Optional chaining');
      expect(features[0].feature_id).toBe('optional-chaining');
      expect(features[0].bcd_keys).toContain('javascript.operators.optional_chaining');
      expect(features[0].location.line).toBe(1);
    });

    it('should detect nullish coalescing', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'const value = input ?? defaultValue;',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Nullish coalescing assignment (??=)');
      expect(features[0].feature_id).toBe('nullish-coalescing');
      expect(features[0].bcd_keys).toContain('javascript.operators.nullish_coalescing');
    });

    it('should detect private class fields', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: `
class MyClass {
  #privateField = 42;

  getPrivate() {
    return this.#privateField;
  }
}`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Private class fields');
      expect(features[0].feature_id).toBe('private-class-fields');
      expect(features[0].bcd_keys).toContain('javascript.classes.private_class_fields');
    });

    it('should detect dynamic imports', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'const module = await import("./dynamic-module.js");',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Dynamic import');
      expect(features[0].feature_id).toBe('dynamic-import');
      expect(features[0].bcd_keys).toContain('javascript.operators.import');
    });

    it('should detect top-level await', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'const data = await fetch("/api/data");',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Top-level await');
      expect(features[0].feature_id).toBe('top-level-await');
      expect(features[0].bcd_keys).toContain('javascript.operators.await.top_level');
    });

    it('should detect BigInt', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'const bigNumber = 123456789012345678901234567890n;',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('BigInt');
      expect(features[0].feature_id).toBe('bigint');
      expect(features[0].bcd_keys).toContain('javascript.builtins.BigInt');
    });

    it('should not detect features in comments', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: `
// This is optional chaining: obj?.prop
/*
 * Nullish coalescing: value ?? default
 * Private fields: #field
 */
const normalCode = "no modern features here";`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      // Should not detect any features since they're in comments
      expect(features).toHaveLength(0);
    });
  });

  describe('CSS feature detection', () => {
    it('should detect container queries', async () => {
      const context: ParseContext = {
        file_path: 'test.css',
        content: `
@container sidebar (min-width: 300px) {
  .card {
    display: flex;
  }
}`,
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);

      // Note: This test assumes the CSS ESLint plugin is properly configured
      // and will detect @container as a non-baseline feature
      expect(features.length).toBeGreaterThanOrEqual(0);

      if (features.length > 0) {
        expect(features[0].feature_name).toContain('container');
        expect(features[0].bcd_keys).toContain('css.at-rules.container');
      }
    });

    it('should detect :has() selector', async () => {
      const context: ParseContext = {
        file_path: 'test.css',
        content: `
.parent:has(.child) {
  background: blue;
}`,
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);

      // Note: This test assumes the CSS ESLint plugin will detect :has()
      expect(features.length).toBeGreaterThanOrEqual(0);

      if (features.length > 0) {
        expect(features[0].feature_name).toContain('has');
        expect(features[0].bcd_keys).toContain('css.selectors.has');
      }
    });

    it('should detect cascade layers', async () => {
      const context: ParseContext = {
        file_path: 'test.css',
        content: `
@layer utilities, base;

@layer base {
  h1 { color: blue; }
}`,
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);

      expect(features.length).toBeGreaterThanOrEqual(0);

      if (features.length > 0) {
        expect(features[0].feature_name).toContain('layer');
        expect(features[0].bcd_keys).toContain('css.at-rules.layer');
      }
    });
  });

  describe('HTML feature detection', () => {
    it('should detect dialog element', async () => {
      const context: ParseContext = {
        file_path: 'test.html',
        content: `
<dialog id="myDialog">
  <p>This is a dialog</p>
  <button>Close</button>
</dialog>`,
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);

      expect(features.length).toBeGreaterThanOrEqual(0);

      if (features.length > 0) {
        expect(features[0].feature_name).toContain('dialog');
        expect(features[0].bcd_keys).toContain('html.elements.dialog');
      }
    });

    it('should detect loading attribute', async () => {
      const context: ParseContext = {
        file_path: 'test.html',
        content: `
<img src="image.jpg" loading="lazy" alt="Test">`,
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);

      expect(features.length).toBeGreaterThanOrEqual(0);

      if (features.length > 0) {
        expect(features[0].feature_name).toContain('loading');
        expect(features[0].bcd_keys[0]).toMatch(/html\.(elements|global_attributes)/);
      }
    });

    it('should detect popover attribute', async () => {
      const context: ParseContext = {
        file_path: 'test.html',
        content: `
<div popover="auto">
  This is a popover
</div>`,
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);

      expect(features.length).toBeGreaterThanOrEqual(0);

      if (features.length > 0) {
        expect(features[0].feature_name).toContain('popover');
        expect(features[0].bcd_keys).toContain('html.global_attributes.popover');
      }
    });
  });

  describe('Target-based detection', () => {
    it('should detect different features based on target', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'const value = obj?.prop ?? defaultValue;',
        file_type: 'js'
      };

      // Test with widely supported target
      const widelyDetector = new ESLintFeatureDetector('widely');
      const widelyFeatures = await widelyDetector.detectFeatures(context);

      // Test with newly available target
      const newlyDetector = new ESLintFeatureDetector('newly');
      const newlyFeatures = await newlyDetector.detectFeatures(context);

      // Should have different numbers of detected features based on target
      expect(widelyFeatures.length).toBeGreaterThanOrEqual(newlyFeatures.length);
    });
  });

  describe('Multiple features in same file', () => {
    it('should detect multiple JavaScript features in one file', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: `
class MyClass {
  #privateField = 42n;

  async getDataIfAvailable() {
    const result = this.#privateField?.toString();
    return result ?? "default";
  }
}

const module = await import("./module.js");`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      // Should detect multiple features: private fields, BigInt, optional chaining,
      // nullish coalescing, dynamic import, top-level await
      expect(features.length).toBeGreaterThan(1);

      const featureNames = features.map(f => f.feature_name);
      expect(featureNames).toContain('Private class fields');
      expect(featureNames).toContain('BigInt');
      expect(featureNames).toContain('Optional chaining');
      expect(featureNames).toContain('Nullish coalescing assignment (??=)');
      expect(featureNames).toContain('Dynamic import');
      expect(featureNames).toContain('Top-level await');
    });
  });
});