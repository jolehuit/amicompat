import { describe, it, expect } from 'vitest';
import { ASTParser } from '../../src/lib/parsers.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('ASTParser', () => {
  const parser = new ASTParser();

  describe('JavaScript/TypeScript parsing', () => {
    it('should detect modern JavaScript features', async () => {
      const content = await readFile(join(__dirname, '../fixtures/test.js'), 'utf-8');
      const context = {
        file_path: 'test.js',
        content,
        file_type: 'js' as const,
      };

      const features = await parser.parseJavaScript(context);

      expect(features.length).toBeGreaterThan(0);

      // Check for specific features
      const contexts = features.map(f => f.context);
      expect(contexts.some(c => c.includes('?.') || c.includes('??'))).toBe(true);
      expect(contexts.some(c => c.includes('#privateField'))).toBe(true);
      expect(contexts.some(c => c.includes('await import'))).toBe(true);
    });

    it('should detect TypeScript features', async () => {
      const content = await readFile(join(__dirname, '../fixtures/test.ts'), 'utf-8');
      const context = {
        file_path: 'test.ts',
        content,
        file_type: 'ts' as const,
      };

      const features = await parser.parseJavaScript(context);

      expect(features.length).toBeGreaterThan(0);

      // Check for TypeScript-specific features
      const contexts = features.map(f => f.context);
      expect(contexts.some(c => c.includes('??') || c.includes('?.'))).toBe(true);
      expect(contexts.some(c => c.includes('#apiKey'))).toBe(true);
    });

    it('should handle malformed JavaScript gracefully', async () => {
      const context = {
        file_path: 'malformed.js',
        content: 'const x = {{{ invalid syntax',
        file_type: 'js' as const,
      };

      const features = await parser.parseJavaScript(context);
      // Should not throw, should return empty array
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe('CSS parsing', () => {
    it('should detect modern CSS features', async () => {
      const content = await readFile(join(__dirname, '../fixtures/test.css'), 'utf-8');
      const context = {
        file_path: 'test.css',
        content,
        file_type: 'css' as const,
      };

      const features = await parser.parseCSS(context);

      expect(features.length).toBeGreaterThan(0);

      // Check for specific CSS features
      const contexts = features.map(f => f.context);
      expect(contexts.some(c => c.includes('@container'))).toBe(true);
      expect(contexts.some(c => c.includes('@layer'))).toBe(true);
      expect(contexts.some(c => c.includes('subgrid'))).toBe(true);
      expect(contexts.some(c => c.includes('color-mix'))).toBe(true);
      expect(contexts.some(c => c.includes('@property'))).toBe(true);
    });

    it('should handle invalid CSS gracefully', async () => {
      const context = {
        file_path: 'invalid.css',
        content: '.invalid { color: ; border: 1px }',
        file_type: 'css' as const,
      };

      const features = await parser.parseCSS(context);
      // Should not throw
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe('HTML parsing', () => {
    it('should detect modern HTML features', async () => {
      const content = await readFile(join(__dirname, '../fixtures/test.html'), 'utf-8');
      const context = {
        file_path: 'test.html',
        content,
        file_type: 'html' as const,
      };

      const features = await parser.parseHTML(context);

      expect(features.length).toBeGreaterThan(0);

      // Check for specific HTML features
      const contexts = features.map(f => f.context);
      expect(contexts.some(c => c.includes('<dialog'))).toBe(true);
      expect(contexts.some(c => c.includes('loading="lazy"'))).toBe(true);
      expect(contexts.some(c => c.includes('type="date"'))).toBe(true);
      expect(contexts.some(c => c.includes('type="color"'))).toBe(true);
      expect(contexts.some(c => c.includes('<my-custom-element'))).toBe(true);
    });

    it('should handle malformed HTML gracefully', async () => {
      const context = {
        file_path: 'malformed.html',
        content: '<div><span>unclosed tags<p>',
        file_type: 'html' as const,
      };

      const features = await parser.parseHTML(context);
      // Should not throw
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe('File type detection', () => {
    it('should detect JavaScript file types', () => {
      expect(parser.detectFileType('script.js')).toBe('js');
      expect(parser.detectFileType('module.mjs')).toBe('js');
      expect(parser.detectFileType('component.jsx')).toBe('jsx');
    });

    it('should detect TypeScript file types', () => {
      expect(parser.detectFileType('script.ts')).toBe('ts');
      expect(parser.detectFileType('module.mts')).toBe('ts');
      expect(parser.detectFileType('component.tsx')).toBe('tsx');
    });

    it('should detect CSS file types', () => {
      expect(parser.detectFileType('styles.css')).toBe('css');
      expect(parser.detectFileType('styles.scss')).toBe('scss');
      expect(parser.detectFileType('styles.sass')).toBe('sass');
    });

    it('should detect HTML file types', () => {
      expect(parser.detectFileType('index.html')).toBe('html');
      expect(parser.detectFileType('page.htm')).toBe('html');
    });

    it('should return null for unsupported file types', () => {
      expect(parser.detectFileType('image.png')).toBe(null);
      expect(parser.detectFileType('document.pdf')).toBe(null);
      expect(parser.detectFileType('archive.zip')).toBe(null);
    });
  });

  describe('parseFile routing', () => {
    it('should route to correct parser based on file type', async () => {
      const jsContext = {
        file_path: 'test.js',
        content: 'const x = a?.b;',
        file_type: 'js' as const,
      };

      const cssContext = {
        file_path: 'test.css',
        content: '.test { display: grid; }',
        file_type: 'css' as const,
      };

      const htmlContext = {
        file_path: 'test.html',
        content: '<dialog>Test</dialog>',
        file_type: 'html' as const,
      };

      const jsFeatures = await parser.parseFile(jsContext);
      const cssFeatures = await parser.parseFile(cssContext);
      const htmlFeatures = await parser.parseFile(htmlContext);

      expect(Array.isArray(jsFeatures)).toBe(true);
      expect(Array.isArray(cssFeatures)).toBe(true);
      expect(Array.isArray(htmlFeatures)).toBe(true);
    });

    it('should handle unsupported file types', async () => {
      const context = {
        file_path: 'test.unknown',
        content: 'some content',
        file_type: 'unknown' as any,
      };

      const features = await parser.parseFile(context);
      expect(features).toEqual([]);
    });
  });
});