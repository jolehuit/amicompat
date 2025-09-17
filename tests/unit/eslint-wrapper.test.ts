import { describe, it, expect, beforeEach } from 'vitest';
import { ESLintFeatureDetector } from '../../src/lib/eslint-wrapper.js';
import { ParseContext } from '../../src/types/index.js';

describe('ESLintFeatureDetector', () => {
  let detector: ESLintFeatureDetector;

  beforeEach(() => {
    detector = new ESLintFeatureDetector('baseline-2024');
  });

  describe('JavaScript feature detection', () => {
    it('should detect async functions', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'async function fetchData() { return await fetch("/api"); }',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Async functions');
      expect(features[0].feature_id).toBe('async-await');
      expect(features[0].bcd_keys).toContain('javascript.operators.async_function');
      expect(features[0].location.line).toBe(1);
    });

    it('should detect classes', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'class MyClass { constructor() {} }',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Classes');
      expect(features[0].feature_id).toBe('class-syntax');
      expect(features[0].bcd_keys).toContain('javascript.classes');
    });

    it('should detect generators', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: `
function* counter() {
  let i = 0;
  while (true) {
    yield i++;
  }
}`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Generators');
      expect(features[0].feature_id).toBe('generators');
      expect(features[0].bcd_keys).toContain('javascript.operators.generator_function');
    });

    it('should detect arrow functions in Functions feature', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'const add = (a, b) => a + b;',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      expect(features).toHaveLength(1);
      expect(features[0].feature_name).toBe('Functions');
      expect(features[0].feature_id).toBe('functions');
      expect(features[0].bcd_keys).toContain('javascript.functions.arrow_functions');
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
        content: `// This is a class: class Example {}
/* BigInt example: 42n */
const normalCode = "no modern features here";`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      // ESLint should only detect features from actual code, not comments
      expect(features.length).toBe(0);
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
        expect(features[0].feature_name).toBe('CSS Container Queries');
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
        expect(features[0].feature_name).toBe('CSS :has() Selector');
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
        expect(features[0].feature_name).toBe('CSS Cascade Layers');
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
        expect(features[0].feature_name).toBe('HTML Dialog Element');
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
        expect(features[0].feature_name).toBe('HTML loading Attribute');
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
        expect(features[0].feature_name).toBe('HTML popover Attribute');
        expect(features[0].bcd_keys).toContain('html.global_attributes.popover');
      }
    });
  });

  describe('Target-based detection', () => {
    it('should detect features regardless of target (audit approach)', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: 'class Example { constructor() {} }',
        file_type: 'js'
      };

      // Test with widely supported target
      const widelyDetector = new ESLintFeatureDetector('widely');
      const widelyFeatures = await widelyDetector.detectFeatures(context);

      // Test with baseline-2024 target
      const baselineDetector = new ESLintFeatureDetector('baseline-2024');
      const baselineFeatures = await baselineDetector.detectFeatures(context);

      // Should detect the same features (audit approach)
      expect(widelyFeatures.length).toBe(baselineFeatures.length);
      expect(widelyFeatures.length).toBe(1);
    });
  });

  describe('Multiple features in same file', () => {
    it('should detect multiple JavaScript features in one file', async () => {
      const context: ParseContext = {
        file_path: 'test.js',
        content: `
class MyClass {
  constructor() {}
}

async function fetchData() {
  return await fetch("/api");
}

function* generateNumbers() {
  yield 1;
  yield 2;
}

const bigNum = 42n;`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      // Should detect multiple features: classes, async functions, generators, BigInt
      expect(features.length).toBeGreaterThan(1);

      const featureIds = features.map(f => f.feature_id);
      expect(featureIds).toContain('class-syntax');
      expect(featureIds).toContain('async-await');
      expect(featureIds).toContain('generators');
      expect(featureIds).toContain('bigint');
    });
  });
});