#!/usr/bin/env tsx
/**
 * Generate baseline data snapshot from web-features
 * Creates typed feature data for JS, CSS, and HTML detection
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { features as webFeatures } from 'web-features';

interface JSFeature {
  id: string;
  name: string;
  description?: string;
  bcd_keys: string[];
  baseline: 'high' | 'low' | false;
  baseline_low_date?: string;
  baseline_high_date?: string;
  eslint_rule?: string; // Mapping to eslint-plugin-es-x rules
}

interface CSSFeature {
  id: string;
  name: string;
  description?: string;
  bcd_keys: string[];
  baseline: 'high' | 'low' | false;
  baseline_low_date?: string;
  baseline_high_date?: string;
}

interface HTMLFeature {
  id: string;
  name: string;
  description?: string;
  bcd_keys: string[];
  baseline: 'high' | 'low' | false;
  baseline_low_date?: string;
  baseline_high_date?: string;
}

// Mapping of web-features IDs to eslint-plugin-es-x rules
const JS_ESLINT_MAPPING: Record<string, string> = {
  'optional-chaining': 'no-optional-chaining',
  'nullish-coalescing': 'no-nullish-coalescing-operators',
  'top-level-await': 'no-top-level-await',
  'dynamic-import': 'no-dynamic-import',
  'bigint': 'no-bigint',
  'private-class-fields': 'no-private-class-fields',
  'logical-assignment': 'no-logical-assignment-operators',
  'numeric-separators': 'no-numeric-separators',
  'public-class-fields': 'no-class-fields',
  'private-methods': 'no-private-methods',
  'class-static-block': 'no-class-static-block',
  'array-at': 'no-array-prototype-at',
  'object-hasown': 'no-object-hasown',
  'array-findlast': 'no-array-prototype-findlast-findlastindex',
};

function isJavaScriptFeature(bcdKeys: string[]): boolean {
  return bcdKeys.some(key =>
    key.startsWith('javascript.') ||
    key.startsWith('api.') && (
      key.includes('javascript') ||
      key.includes('ES') ||
      key.includes('Worker') ||
      key.includes('Promise') ||
      key.includes('Symbol')
    )
  );
}

function isCSSFeature(bcdKeys: string[]): boolean {
  return bcdKeys.some(key =>
    key.startsWith('css.') ||
    key.startsWith('svg.') && key.includes('css')
  );
}

function isHTMLFeature(bcdKeys: string[]): boolean {
  return bcdKeys.some(key =>
    key.startsWith('html.') ||
    key.startsWith('api.HTML') ||
    key.startsWith('api.') && (
      key.includes('Element') ||
      key.includes('Attribute') ||
      key.includes('DOM')
    )
  );
}

async function generateBaselineData() {
  const jsFeatures: JSFeature[] = [];
  const cssFeatures: CSSFeature[] = [];
  const htmlFeatures: HTMLFeature[] = [];

  console.log('🔍 Processing web-features data...');

  // Process all features
  for (const [featureId, feature] of Object.entries(webFeatures)) {
    if (!feature.compat_features) continue;

    const bcdKeys = Array.from(feature.compat_features);
    const baseFeature = {
      id: featureId,
      name: feature.name,
      description: feature.description_html,
      bcd_keys: bcdKeys,
      baseline: feature.status.baseline as 'high' | 'low' | false,
      baseline_low_date: feature.status.baseline_low_date,
      baseline_high_date: feature.status.baseline_high_date,
    };

    // Classify by technology
    if (isJavaScriptFeature(bcdKeys)) {
      const jsFeature: JSFeature = {
        ...baseFeature,
        eslint_rule: JS_ESLINT_MAPPING[featureId],
      };
      jsFeatures.push(jsFeature);
    }

    if (isCSSFeature(bcdKeys)) {
      cssFeatures.push(baseFeature);
    }

    if (isHTMLFeature(bcdKeys)) {
      htmlFeatures.push(baseFeature);
    }
  }

  console.log(`📊 Found ${jsFeatures.length} JS features, ${cssFeatures.length} CSS features, ${htmlFeatures.length} HTML features`);

  // Create output directory
  const outputDir = join(process.cwd(), 'src', 'generated');
  await mkdir(outputDir, { recursive: true });

  // Generate JS features file
  const jsContent = `// Auto-generated from web-features - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

export interface JSFeature {
  id: string;
  name: string;
  description?: string;
  bcd_keys: string[];
  baseline: 'high' | 'low' | false;
  baseline_low_date?: string;
  baseline_high_date?: string;
  eslint_rule?: string;
}

export const JS_FEATURES: JSFeature[] = ${JSON.stringify(jsFeatures, null, 2)};

// ESLint rule mapping for quick lookup
export const ESLINT_RULE_TO_FEATURE: Record<string, JSFeature> = {
${jsFeatures
  .filter(f => f.eslint_rule)
  .map(f => `  '${f.eslint_rule}': JS_FEATURES.find(feat => feat.id === '${f.id}')!`)
  .join(',\n')}
};

// Feature ID to ESLint rule mapping
export const FEATURE_TO_ESLINT_RULE: Record<string, string> = {
${jsFeatures
  .filter(f => f.eslint_rule)
  .map(f => `  '${f.id}': '${f.eslint_rule}'`)
  .join(',\n')}
};
`;

  await writeFile(join(outputDir, 'js-features.generated.ts'), jsContent);

  // Generate CSS features file
  const cssContent = `// Auto-generated from web-features - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

export interface CSSFeature {
  id: string;
  name: string;
  description?: string;
  bcd_keys: string[];
  baseline: 'high' | 'low' | false;
  baseline_low_date?: string;
  baseline_high_date?: string;
}

export const CSS_FEATURES: CSSFeature[] = ${JSON.stringify(cssFeatures, null, 2)};

// BCD key to feature mapping for quick lookup
export const BCD_KEY_TO_CSS_FEATURE: Record<string, CSSFeature> = {
${cssFeatures
  .flatMap(f => f.bcd_keys.map(key => `  '${key}': CSS_FEATURES.find(feat => feat.id === '${f.id}')!`))
  .join(',\n')}
};
`;

  await writeFile(join(outputDir, 'css-features.generated.ts'), cssContent);

  // Generate HTML features file
  const htmlContent = `// Auto-generated from web-features - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

export interface HTMLFeature {
  id: string;
  name: string;
  description?: string;
  bcd_keys: string[];
  baseline: 'high' | 'low' | false;
  baseline_low_date?: string;
  baseline_high_date?: string;
}

export const HTML_FEATURES: HTMLFeature[] = ${JSON.stringify(htmlFeatures, null, 2)};

// BCD key to feature mapping for quick lookup
export const BCD_KEY_TO_HTML_FEATURE: Record<string, HTMLFeature> = {
${htmlFeatures
  .flatMap(f => f.bcd_keys.map(key => `  '${key}': HTML_FEATURES.find(feat => feat.id === '${f.id}')!`))
  .join(',\n')}
};
`;

  await writeFile(join(outputDir, 'html-features.generated.ts'), htmlContent);

  console.log('✅ Generated baseline data files:');
  console.log('   - src/generated/js-features.generated.ts');
  console.log('   - src/generated/css-features.generated.ts');
  console.log('   - src/generated/html-features.generated.ts');
}

// Run the script
generateBaselineData().catch(console.error);