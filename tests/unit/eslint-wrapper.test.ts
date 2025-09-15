import { describe, it, expect, beforeEach } from 'vitest';
import { ESLintFeatureDetector } from '../../src/lib/eslint-wrapper.js';
import { ParseContext } from '../../src/types/index.js';

describe('ESLintFeatureDetector', () => {
  let detector: ESLintFeatureDetector;

  beforeEach(() => {
    detector = new ESLintFeatureDetector();
  });

  describe('JavaScript Feature Detection', () => {
    it('should detect optional chaining', async () => {
      const context: ParseContext = {
        file_path: '/test/example.js',
        content: 'const name = user?.profile?.name;',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);
      const optionalChainingFeature = features.find(f => f.feature_id === 'js-optional-chaining');

      expect(optionalChainingFeature).toBeDefined();
      expect(optionalChainingFeature?.feature_name).toBe('Optional Chaining');
      expect(optionalChainingFeature?.bcd_keys).toContain('javascript.operators.optional_chaining');
      expect(optionalChainingFeature?.syntax_pattern).toBe('?.');
      expect(optionalChainingFeature?.confidence).toBe('high');
      expect(optionalChainingFeature?.location.line).toBe(1);
    });

    it('should detect nullish coalescing', async () => {
      const context: ParseContext = {
        file_path: '/test/example.js',
        content: 'const value = input ?? "default";',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);
      const nullishFeature = features.find(f => f.feature_id === 'js-nullish-coalescing');

      expect(nullishFeature).toBeDefined();
      expect(nullishFeature?.feature_name).toBe('Nullish Coalescing');
      expect(nullishFeature?.bcd_keys).toContain('javascript.operators.nullish_coalescing');
      expect(nullishFeature?.syntax_pattern).toBe('??');
    });

    it('should detect private class fields', async () => {
      const context: ParseContext = {
        file_path: '/test/example.js',
        content: `class MyClass {
  #privateField = 42;

  getField() {
    return this.#privateField;
  }
}`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);
      const privateFieldFeatures = features.filter(f => f.feature_id === 'js-private-class-fields');

      expect(privateFieldFeatures.length).toBeGreaterThan(0);
      expect(privateFieldFeatures[0]?.feature_name).toBe('Private Class Fields');
      expect(privateFieldFeatures[0]?.bcd_keys).toContain('javascript.classes.private_class_fields');
    });

    it('should detect dynamic imports', async () => {
      const context: ParseContext = {
        file_path: '/test/example.js',
        content: 'const module = await import("./module.js");',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);
      const dynamicImportFeature = features.find(f => f.feature_id === 'js-dynamic-import');

      expect(dynamicImportFeature).toBeDefined();
      expect(dynamicImportFeature?.feature_name).toBe('Dynamic Import');
      expect(dynamicImportFeature?.bcd_keys).toContain('javascript.statements.import.dynamic');
    });

    it('should detect top-level await', async () => {
      const context: ParseContext = {
        file_path: '/test/example.js',
        content: 'const data = await fetch("/api/data");',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);
      const topLevelAwaitFeature = features.find(f => f.feature_id === 'js-top-level-await');

      expect(topLevelAwaitFeature).toBeDefined();
      expect(topLevelAwaitFeature?.feature_name).toBe('Top-level Await');
      expect(topLevelAwaitFeature?.bcd_keys).toContain('javascript.operators.await.top_level');
    });

    it('should detect BigInt literals', async () => {
      const context: ParseContext = {
        file_path: '/test/example.js',
        content: 'const largeNumber = 123456789012345678901234567890n;',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);
      const bigintFeature = features.find(f => f.feature_id === 'js-bigint');

      expect(bigintFeature).toBeDefined();
      expect(bigintFeature?.feature_name).toBe('BigInt');
      expect(bigintFeature?.bcd_keys).toContain('javascript.builtins.BigInt');
    });

    it('should handle TypeScript files', async () => {
      const context: ParseContext = {
        file_path: '/test/example.ts',
        content: 'const name: string = user?.profile?.name ?? "Anonymous";',
        file_type: 'ts'
      };

      const features = await detector.detectFeatures(context);

      expect(features.length).toBeGreaterThan(0);
      expect(features.some(f => f.feature_id === 'js-optional-chaining')).toBe(true);
      expect(features.some(f => f.feature_id === 'js-nullish-coalescing')).toBe(true);
    });

    it('should handle JSX files', async () => {
      const context: ParseContext = {
        file_path: '/test/example.jsx',
        content: 'const Component = () => <div>{user?.name ?? "Guest"}</div>;',
        file_type: 'jsx'
      };

      const features = await detector.detectFeatures(context);

      expect(features.length).toBeGreaterThan(0);
      expect(features.some(f => f.feature_id === 'js-optional-chaining')).toBe(true);
      expect(features.some(f => f.feature_id === 'js-nullish-coalescing')).toBe(true);
    });
  });

  describe('HTML Feature Detection', () => {
    it('should detect dialog element', async () => {
      const context: ParseContext = {
        file_path: '/test/example.html',
        content: '<dialog><p>Modal content</p></dialog>',
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);
      const dialogFeature = features.find(f => f.feature_id === 'html-dialog-element');

      expect(dialogFeature).toBeDefined();
      expect(dialogFeature?.feature_name).toBe('HTML Dialog Element');
      expect(dialogFeature?.bcd_keys).toContain('html.elements.dialog');
      expect(dialogFeature?.syntax_pattern).toBe('<dialog');
    });

    it('should detect loading attribute', async () => {
      const context: ParseContext = {
        file_path: '/test/example.html',
        content: '<img src="image.jpg" loading="lazy" alt="Description">',
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);
      const loadingFeature = features.find(f => f.feature_id === 'html-loading-attribute');

      expect(loadingFeature).toBeDefined();
      expect(loadingFeature?.feature_name).toBe('HTML loading Attribute');
      expect(loadingFeature?.bcd_keys).toContain('html.elements.img.loading');
    });

    it('should detect popover attribute', async () => {
      const context: ParseContext = {
        file_path: '/test/example.html',
        content: '<div popover="auto">Popover content</div>',
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);
      const popoverFeature = features.find(f => f.feature_id === 'html-popover-attribute');

      expect(popoverFeature).toBeDefined();
      expect(popoverFeature?.feature_name).toBe('HTML popover Attribute');
      expect(popoverFeature?.bcd_keys).toContain('html.global_attributes.popover');
    });

    it('should detect custom elements', async () => {
      const context: ParseContext = {
        file_path: '/test/example.html',
        content: '<my-custom-element>Custom content</my-custom-element>',
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);
      const customElementFeature = features.find(f => f.feature_id === 'html-custom-elements');

      expect(customElementFeature).toBeDefined();
      expect(customElementFeature?.feature_name).toBe('HTML Custom Elements');
      expect(customElementFeature?.bcd_keys).toContain('api.CustomElementRegistry');
    });

    it('should handle multiple HTML features in one file', async () => {
      const context: ParseContext = {
        file_path: '/test/example.html',
        content: `
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
</head>
<body>
  <dialog id="modal">
    <p>Dialog content</p>
  </dialog>
  <img src="image.jpg" loading="lazy" alt="Test">
  <div popover="auto">Popover</div>
  <my-custom-component></my-custom-component>
</body>
</html>`,
        file_type: 'html'
      };

      const features = await detector.detectFeatures(context);

      expect(features.some(f => f.feature_id === 'html-dialog-element')).toBe(true);
      expect(features.some(f => f.feature_id === 'html-loading-attribute')).toBe(true);
      expect(features.some(f => f.feature_id === 'html-popover-attribute')).toBe(true);
      expect(features.some(f => f.feature_id === 'html-custom-elements')).toBe(true);
    });
  });

  describe('CSS Feature Detection', () => {
    it('should detect container queries', async () => {
      const context: ParseContext = {
        file_path: '/test/example.css',
        content: '@container (min-width: 400px) { .card { padding: 2rem; } }',
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);
      const containerFeature = features.find(f => f.feature_id === 'css-container-queries');

      expect(containerFeature).toBeDefined();
      expect(containerFeature?.feature_name).toBe('CSS Container Queries');
      expect(containerFeature?.bcd_keys).toContain('css.at-rules.container');
      expect(containerFeature?.syntax_pattern).toBe('@container');
    });

    it('should detect :has() selector', async () => {
      const context: ParseContext = {
        file_path: '/test/example.css',
        content: '.parent:has(.child) { background: red; }',
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);
      const hasFeature = features.find(f => f.feature_id === 'css-has-selector');

      expect(hasFeature).toBeDefined();
      expect(hasFeature?.feature_name).toBe('CSS :has() Selector');
      expect(hasFeature?.bcd_keys).toContain('css.selectors.has');
      expect(hasFeature?.syntax_pattern).toBe(':has(');
    });

    it('should detect subgrid', async () => {
      const context: ParseContext = {
        file_path: '/test/example.css',
        content: '.grid-item { grid-template-columns: subgrid; }',
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);
      const subgridFeature = features.find(f => f.feature_id === 'css-subgrid');

      expect(subgridFeature).toBeDefined();
      expect(subgridFeature?.feature_name).toBe('CSS Subgrid');
      expect(subgridFeature?.bcd_keys).toContain('css.properties.grid-template-columns.subgrid');
    });

    it('should detect CSS cascade layers', async () => {
      const context: ParseContext = {
        file_path: '/test/example.css',
        content: '@layer base, components, utilities;',
        file_type: 'css'
      };

      const features = await detector.detectFeatures(context);
      const layerFeature = features.find(f => f.feature_id === 'css-cascade-layers');

      expect(layerFeature).toBeDefined();
      expect(layerFeature?.feature_name).toBe('CSS Cascade Layers');
      expect(layerFeature?.bcd_keys).toContain('css.at-rules.layer');
    });

    it('should handle SCSS files', async () => {
      const context: ParseContext = {
        file_path: '/test/example.scss',
        content: `
$primary-color: blue;

.container {
  @container (min-width: 400px) {
    .card {
      color: $primary-color;
    }
  }
}`,
        file_type: 'scss'
      };

      const features = await detector.detectFeatures(context);
      const containerFeature = features.find(f => f.feature_id === 'css-container-queries');

      expect(containerFeature).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty files gracefully', async () => {
      const context: ParseContext = {
        file_path: '/test/empty.js',
        content: '',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });

    it('should handle invalid JavaScript gracefully', async () => {
      const context: ParseContext = {
        file_path: '/test/invalid.js',
        content: 'const invalid = { ( syntax error',
        file_type: 'js'
      };

      // Should not throw an error, but might not detect features
      const features = await detector.detectFeatures(context);
      expect(Array.isArray(features)).toBe(true);
    });

    it('should handle unsupported file types', async () => {
      const context: ParseContext = {
        file_path: '/test/unknown.xyz',
        content: 'some content',
        file_type: 'xyz' as any
      };

      const features = await detector.detectFeatures(context);
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(0);
    });

    it('should provide correct location information', async () => {
      const context: ParseContext = {
        file_path: '/test/multiline.js',
        content: `const a = 1;
const b = user?.name;
const c = value ?? "default";`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);
      const optionalChaining = features.find(f => f.feature_id === 'js-optional-chaining');
      const nullishCoalescing = features.find(f => f.feature_id === 'js-nullish-coalescing');

      expect(optionalChaining?.location.line).toBe(2);
      expect(nullishCoalescing?.location.line).toBe(3);
      expect(optionalChaining?.location.file).toBe('/test/multiline.js');
      expect(nullishCoalescing?.location.file).toBe('/test/multiline.js');
    });

    it('should handle comments and strings correctly', async () => {
      const context: ParseContext = {
        file_path: '/test/comments.js',
        content: `
// This is not actually optional chaining: "user?.name"
const comment = "This ?? is in a string";
const actual = user?.profile?.name ?? "default";`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      // Should detect the actual usage, not the ones in comments/strings
      const optionalChaining = features.filter(f => f.feature_id === 'js-optional-chaining');
      const nullishCoalescing = features.filter(f => f.feature_id === 'js-nullish-coalescing');

      expect(optionalChaining.length).toBeGreaterThan(0);
      expect(nullishCoalescing.length).toBeGreaterThan(0);

      // The actual features should be detected on line 4
      expect(optionalChaining.some(f => f.location.line === 4)).toBe(true);
      expect(nullishCoalescing.some(f => f.location.line === 4)).toBe(true);
    });
  });

  describe('Legacy Compatibility', () => {
    it('should support legacy detectFeaturesLegacy method for existing integrations', async () => {
      const context: ParseContext = {
        file_path: '/test/example.js',
        content: 'const name = user?.profile?.name;',
        file_type: 'js'
      };

      const locations = await detector.detectFeaturesLegacy(context);

      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeGreaterThan(0);
      expect(locations[0]).toHaveProperty('file');
      expect(locations[0]).toHaveProperty('line');
      expect(locations[0]).toHaveProperty('column');
      expect(locations[0]).toHaveProperty('context');
    });
  });

  describe('Feature Mapping Integration', () => {
    it('should provide proper BCD keys for all detected features', async () => {
      const context: ParseContext = {
        file_path: '/test/comprehensive.js',
        content: `
const name = user?.profile?.name ?? "Anonymous";
const module = await import("./module.js");
const bigNum = 123n;
class MyClass {
  #private = 42;
}`,
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      // All features should have valid BCD keys
      features.forEach(feature => {
        expect(feature.bcd_keys).toBeDefined();
        expect(Array.isArray(feature.bcd_keys)).toBe(true);
        expect(feature.bcd_keys.length).toBeGreaterThan(0);
        expect(feature.bcd_keys.every(key => typeof key === 'string')).toBe(true);
      });
    });

    it('should provide consistent feature structure', async () => {
      const context: ParseContext = {
        file_path: '/test/structure.js',
        content: 'const value = input ?? "default";',
        file_type: 'js'
      };

      const features = await detector.detectFeatures(context);

      features.forEach(feature => {
        expect(feature).toHaveProperty('feature_name');
        expect(feature).toHaveProperty('feature_id');
        expect(feature).toHaveProperty('bcd_keys');
        expect(feature).toHaveProperty('syntax_pattern');
        expect(feature).toHaveProperty('ast_node_type');
        expect(feature).toHaveProperty('confidence');
        expect(feature).toHaveProperty('location');

        expect(typeof feature.feature_name).toBe('string');
        expect(typeof feature.feature_id).toBe('string');
        expect(Array.isArray(feature.bcd_keys)).toBe(true);
        expect(typeof feature.syntax_pattern).toBe('string');
        expect(typeof feature.confidence).toBe('string');
        expect(typeof feature.location).toBe('object');
      });
    });
  });
});