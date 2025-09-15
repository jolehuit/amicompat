# Changelog

## [2.0.0] - 2024-12-29

### 🚀 Major Architecture Migration

**Migration from Custom AST Parsers to ESLint-based Feature Detection**

### ✨ Added

- **ESLint-based Feature Detection**: Complete rewrite using ESLint for JavaScript/TypeScript analysis
- **@html-eslint Integration**: Professional HTML feature detection
- **Enhanced Test Suite**: 26 new comprehensive tests for ESLint wrapper
- **Architecture Documentation**: Complete technical documentation in `ARCHITECTURE.md`
- **Improved CLI Output**: Feature names displayed instead of just locations

### 🔧 Changed

- **Core Parser Engine**: Migrated from Babel/PostCSS/Cheerio to ESLint-based detection
- **Feature Detection API**: New `detectFeatures()` method with rich metadata
- **Type System**: Cleaned up legacy AST types, focused on `IdentifiedFeature`
- **Documentation**: Updated README to reflect ESLint architecture
- **Project Structure**: Simplified with `eslint-wrapper.ts` replacing multiple parsers

### 🗑️ Removed

- **Legacy Dependencies**:
  - `@babel/parser`, `@babel/traverse`, `@babel/types`
  - `postcss`, `postcss-selector-parser`
  - `cheerio`
  - `@types/babel__traverse`
- **Legacy Code**:
  - `src/lib/parsers.ts` (custom AST parsers)
  - Legacy AST types: `ASTNode`, `CSSNode`, `JSNode`
  - Obsolete testing documentation

### 🛡️ Improved

- **Robustness**: ESLint handles edge cases and syntax variations better
- **Maintainability**: Leverages battle-tested, community-maintained parsing
- **Performance**: Optimized parsing engine for large codebases
- **Extensibility**: Easy to add new features via ESLint rules
- **Accuracy**: Industry-standard parsing with comprehensive syntax support

### 🔄 Backward Compatibility

- **Legacy Method**: `detectFeaturesLegacy()` maintained for existing integrations
- **API Compatibility**: All MCP tools maintain same interface

### 📊 Quality Metrics

- **Test Coverage**: >90% code coverage maintained
- **Test Suite**: 99 tests passing across 6 test files
- **Lint**: Zero ESLint warnings
- **TypeScript**: Zero type errors
- **Performance**: Faster parsing with ESLint optimization

### 🏗️ Technical Details

#### New Core Components

- `ESLintFeatureDetector`: Main feature detection engine
- `eslint-wrapper.ts`: ESLint integration layer
- Enhanced type system with proper metadata

#### Supported Features

**JavaScript/TypeScript**:
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Private class fields (`#field`)
- Dynamic imports (`import()`)
- Top-level await
- BigInt literals

**CSS**:
- Container queries (`@container`)
- `:has()` selector
- Subgrid
- Cascade layers (`@layer`)

**HTML**:
- Dialog element (`<dialog>`)
- Loading attributes (`loading="lazy"`)
- Popover attributes
- Custom elements

### 📈 Migration Benefits

1. **Better Error Handling**: ESLint gracefully handles malformed code
2. **Community Support**: Leverage ESLint ecosystem and updates
3. **Reduced Maintenance**: Less custom parsing code to maintain
4. **Enhanced Features**: More accurate detection with ESLint rules
5. **Future-Proof**: Easy to extend with new web features

---

## [1.0.0] - 2024-12-01

### Initial Release

- MCP Server implementation for Web Baseline compatibility analysis
- Custom AST-based parsing for JavaScript, CSS, and HTML
- Integration with compute-baseline for local Baseline data
- Comprehensive CLI interface
- Complete test suite with integration tests