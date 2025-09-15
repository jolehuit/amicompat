# Testing Documentation 🧪

## Overview

Comprehensive test suite for AmICompat MCP Server ensuring reliability, correctness, and performance across all components.

## Test Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── parsers.test.ts     # AST parser testing
│   ├── baseline.test.ts    # Baseline computation testing
│   ├── walker.test.ts      # File system operations testing
│   └── types.test.ts       # Zod schema validation testing
├── integration/            # Integration tests for full workflows
│   ├── cli.test.ts         # CLI interface testing
│   └── mcp-tools.test.ts   # MCP tools end-to-end testing
└── fixtures/               # Test data and sample files
    ├── test.js             # JavaScript with modern features
    ├── test.ts             # TypeScript with modern features
    ├── test.css            # CSS with modern features
    └── test.html           # HTML with modern features
```

## Test Categories

### 🔬 Unit Tests

#### AST Parser Tests (`parsers.test.ts`)
- **JavaScript/TypeScript parsing**
  - ✅ Optional chaining detection (`?.`)
  - ✅ Nullish coalescing detection (`??`)
  - ✅ Private class fields detection (`#field`)
  - ✅ Top-level await detection
  - ✅ Dynamic import detection
  - ✅ Malformed code handling
  - ✅ TypeScript-specific features

- **CSS parsing**
  - ✅ Container queries detection (`@container`)
  - ✅ `:has()` selector detection
  - ✅ CSS Grid subgrid detection
  - ✅ Cascade layers detection (`@layer`)
  - ✅ Custom properties detection (`@property`)
  - ✅ `color-mix()` function detection
  - ✅ Invalid CSS handling

- **HTML parsing**
  - ✅ Dialog element detection (`<dialog>`)
  - ✅ Lazy loading attribute detection
  - ✅ Modern input types detection
  - ✅ Web components detection
  - ✅ Malformed HTML handling

- **File type detection**
  - ✅ JavaScript variants (`.js`, `.mjs`, `.jsx`)
  - ✅ TypeScript variants (`.ts`, `.tsx`)
  - ✅ CSS variants (`.css`, `.scss`, `.sass`)
  - ✅ HTML variants (`.html`, `.htm`)
  - ✅ Unsupported types handling

#### Baseline Computation Tests (`baseline.test.ts`)
- **Feature status computation**
  - ✅ Local `compute-baseline` integration
  - ✅ Empty compat keys handling
  - ✅ Caching mechanism verification
  - ✅ Invalid compat keys handling

- **Browser coverage calculation**
  - ✅ Major browsers coverage (Chrome, Firefox, Safari, Edge)
  - ✅ Mixed support scenarios
  - ✅ Empty features array handling

- **Baseline level determination**
  - ✅ "Widely available" (high baseline)
  - ✅ "Newly available" (low baseline)
  - ✅ "Limited support" (false baseline with some support)
  - ✅ "No support" (false baseline, no support)

- **Recommendations generation**
  - ✅ Polyfill suggestions for limited features
  - ✅ Monitoring suggestions for new features
  - ✅ Browser-specific recommendations

#### File Walker Tests (`walker.test.ts`)
- **Directory traversal**
  - ✅ File discovery across directory structures
  - ✅ Supported file extension filtering
  - ✅ Default ignore patterns (node_modules, dist)
  - ✅ Custom ignore patterns
  - ✅ File limit enforcement

- **File operations**
  - ✅ File content reading
  - ✅ File statistics retrieval
  - ✅ Directory detection
  - ✅ Path existence checking
  - ✅ Error handling for non-existent files

#### Schema Validation Tests (`types.test.ts`)
- **Zod schema validation**
  - ✅ `AuditProjectInputSchema` validation
  - ✅ `AuditFileInputSchema` validation
  - ✅ `GetFeatureStatusInputSchema` validation
  - ✅ `ExportLastReportInputSchema` validation
  - ✅ Default value assignment
  - ✅ Invalid input rejection
  - ✅ Type coercion testing

### 🔗 Integration Tests

#### CLI Interface Tests (`cli.test.ts`)
- **Command execution**
  - ✅ `info` command output verification
  - ✅ `test-parse` command for all file types
  - ✅ Server startup and graceful shutdown
  - ✅ Error handling for invalid commands
  - ✅ File type validation

- **Real file processing**
  - ✅ JavaScript feature detection in real files
  - ✅ CSS feature detection in real files
  - ✅ HTML feature detection in real files
  - ✅ Unsupported file type handling
  - ✅ Non-existent file handling

#### MCP Tools Tests (`mcp-tools.test.ts`)
- **Tool functionality**
  - ✅ `auditFile` for all supported file types
  - ✅ `auditProject` for complete project analysis
  - ✅ `getFeatureStatus` for feature lookups
  - ✅ `exportLastReport` for report export
  - ✅ Different baseline targets handling
  - ✅ File limit enforcement

- **Error scenarios**
  - ✅ Non-existent files and directories
  - ✅ Unsupported file types
  - ✅ Permission errors
  - ✅ Empty projects
  - ✅ Malformed input handling

## Running Tests

### All Tests
```bash
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

### Specific Test Types
```bash
# Unit tests only
npx vitest run tests/unit/

# Integration tests only
npx vitest run tests/integration/

# Specific test file
npx vitest run tests/unit/parsers.test.ts
```

### Integration Test Scripts
```bash
npm run test:integration    # Build + run integration tests
npm run test:cli           # Test CLI functionality
npm run test:parsers       # Test all parsers with real files
npm run test:parser:js     # Test JavaScript parser only
npm run test:parser:css    # Test CSS parser only
npm run test:parser:html   # Test HTML parser only
```

## Test Coverage Targets

### Current Coverage Goals
- **Overall**: >90% line coverage
- **Critical paths**: 100% coverage
- **Parser logic**: 100% coverage
- **MCP tools**: >95% coverage
- **Error handling**: 100% coverage

### Coverage Reports
```bash
npm run test:coverage       # Generate HTML coverage report
open coverage/index.html    # View detailed coverage report
```

## Test Data & Fixtures

### Sample Files
- **`test.js`**: Modern JavaScript features showcase
- **`test.ts`**: TypeScript with advanced patterns
- **`test.css`**: Comprehensive modern CSS features
- **`test.html`**: Modern HTML elements and attributes

### Test Features Covered

#### JavaScript Features
```javascript
// Optional chaining & nullish coalescing
const data = user?.profile?.name ?? 'Anonymous';

// Private class fields
class MyClass {
  #privateField = 42;
  #privateMethod() { /* ... */ }
}

// Top-level await & dynamic imports
await import('./module.js');
const module = await import('./dynamic-module.js');
```

#### CSS Features
```css
/* Container queries */
@container (min-width: 400px) { /* ... */ }

/* :has() selector */
.button:has(.icon) { /* ... */ }

/* CSS Grid subgrid */
.grid { grid-template-columns: subgrid; }

/* Cascade layers */
@layer base { /* ... */ }

/* color-mix() function */
.element { color: color-mix(in srgb, red 50%, blue); }

/* @property */
@property --my-color { /* ... */ }
```

#### HTML Features
```html
<!-- Dialog element -->
<dialog>Content</dialog>

<!-- Lazy loading -->
<img loading="lazy" src="image.jpg">

<!-- Modern input types -->
<input type="date">
<input type="color">

<!-- Web components -->
<my-custom-element></my-custom-element>
```

## Continuous Integration

### GitHub Actions Integration
Tests run automatically on:
- ✅ Push to `main` branch
- ✅ Pull request creation
- ✅ Multiple Node.js versions (18.x, 20.x, 22.x)
- ✅ Build verification before testing
- ✅ Type checking validation
- ✅ Linting verification

### CI Test Matrix
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]

steps:
- Build project
- Run type checking
- Run linting
- Run full test suite
- Test CLI functionality
```

## Test Performance

### Benchmarks
- **Unit tests**: <2 seconds total
- **Integration tests**: <10 seconds total
- **Full suite**: <15 seconds total
- **Coverage generation**: <20 seconds total

### Optimization Strategies
- Parallel test execution with Vitest
- Efficient test file isolation
- Minimal fixture data
- Smart test categorization
- Fast cleanup procedures

## Debugging Tests

### Development Workflow
```bash
# Debug specific test
npx vitest run tests/unit/parsers.test.ts --reporter=verbose

# Debug with console output
npx vitest run --reporter=verbose

# Debug single test case
npx vitest run -t "should detect modern JavaScript features"
```

### Common Issues
1. **File path issues**: Use `join()` for cross-platform compatibility
2. **Async cleanup**: Always clean up test files in `afterEach`
3. **Permission errors**: Handle with try/catch in cleanup
4. **Timing issues**: Use proper async/await patterns

## Quality Assurance

### Test Quality Metrics
- **Reliability**: Tests must be deterministic
- **Speed**: Fast feedback for developers
- **Maintainability**: Clear, readable test code
- **Coverage**: Comprehensive edge case testing
- **Isolation**: No test dependencies

### Review Checklist
- [ ] Tests cover both happy path and error cases
- [ ] Edge cases are thoroughly tested
- [ ] Test names clearly describe what they verify
- [ ] No hardcoded paths or values
- [ ] Proper cleanup in all tests
- [ ] Mock external dependencies appropriately