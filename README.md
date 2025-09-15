# AmICompat MCP Server v2.0 - TypeScript Native

**🏆 Built for the Baseline Tooling Hackathon 2025 - Now in TypeScript!**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://typescriptlang.org)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.0-green)](https://github.com/modelcontextprotocol/typescript-sdk)
[![AST Parsing](https://img.shields.io/badge/AST-Babel%20%7C%20PostCSS%20%7C%20Cheerio-purple)](https://babeljs.io)

**Web codebase Baseline compatibility auditor for Model Context Protocol (MCP) - Complete TypeScript rewrite**

## 🚀 What's New in v2.0

### Architecture Migration
- ✅ **TypeScript Native**: Full rewrite using `@modelcontextprotocol/typescript-sdk`
- ✅ **AST-Based Parsing**: Replaced all regex with robust AST parsing
  - **JavaScript/TypeScript**: Babel parser with full plugin support
  - **CSS**: PostCSS with selector parsing
  - **HTML**: Cheerio with start/end indices
- ✅ **Local Baseline Data**: Uses `web-features` and `compute-baseline` locally
- ✅ **Zod Validation**: All MCP I/O validated with Zod schemas

### Key Improvements
- 🔧 **Professional Parsing**: No more regex fragility
- 🌐 **Offline Baseline**: No API dependencies for baseline data
- 🛡️ **Type Safety**: Full TypeScript coverage with strict mode
- ⚡ **Performance**: Efficient AST traversal and caching
- 🎯 **Accuracy**: Precise feature detection with location context

## 🛠️ Installation

```bash
npm install amicompat-mcp
```

Or with other package managers:
```bash
pnpm add amicompat-mcp
yarn add amicompat-mcp
bun add amicompat-mcp
```

## ⚙️ Configuration

### Cursor IDE
```json
{
  "mcpServers": {
    "amicompat": {
      "command": "amicompat-mcp",
      "args": [],
      "env": {
        "AMICOMPAT_DEFAULT_TARGET": "baseline-2024",
        "AMICOMPAT_MAX_FILES": "10000"
      }
    }
  }
}
```

### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "amicompat": {
      "command": "amicompat-mcp",
      "args": [],
      "env": {
        "AMICOMPAT_DEFAULT_TARGET": "baseline-2024"
      }
    }
  }
}
```

## 🔧 Available MCP Tools

| Tool | Description | Inputs |
|------|-------------|---------|
| `audit_project` | Comprehensive project audit | `project_path`, `target?`, `max_files?`, `export_path?` |
| `audit_file` | Single file analysis | `file_path` |
| `get_feature_status` | Feature Baseline status | `feature` (ID) |
| `export_last_report` | Export results to JSON | `path` |

All inputs are validated with Zod schemas for type safety.

## 📁 Supported File Types

- **JavaScript**: `.js`, `.mjs`, `.cjs`, `.jsx`
- **TypeScript**: `.ts`, `.mts`, `.cts`, `.tsx`
- **CSS**: `.css`, `.scss`, `.sass`
- **HTML**: `.html`, `.htm`

## 🔍 Features Detected

### JavaScript/TypeScript (via Babel AST)
- Optional Chaining (`?.`)
- Nullish Coalescing (`??`)
- Private Class Fields (`#field`)
- Top-level `await`
- Dynamic `import()`
- And more...

### CSS (via PostCSS AST)
- Container Queries (`@container`)
- `:has()` Selector
- CSS Grid Subgrid
- Cascade Layers (`@layer`)
- `@property` Custom Properties
- `color-mix()` Function
- And more...

### HTML (via Cheerio AST)
- `<dialog>` Element
- `loading="lazy"` Attribute
- Modern Input Types (`date`, `color`, etc.)
- Web Components (custom elements)
- And more...

## 🌐 Baseline Data Integration

Uses `web-features` and `compute-baseline` for local Baseline data consumption:

```typescript
import { computeBaseline } from 'compute-baseline';

const status = computeBaseline({
  compatKeys: ['css.at-rules.container'],
  checkAncestors: true
});
```

## 💻 Development

### Setup
```bash
git clone <repo-url>
cd amicompat-mcp
npm install
```

### Build
```bash
npm run build      # Compile TypeScript
npm run dev        # Development mode
npm run typecheck  # Type checking
npm run lint       # ESLint
```

### Testing
```bash
npm test                           # Run tests
amicompat-mcp test-parse file.css  # Test parser on file
amicompat-mcp info                 # Show server info
```

## 📊 Example Usage

### In Cursor Chat
- *"Audit my React project for browser compatibility"*
- *"Check if CSS container queries are supported"*
- *"Analyze this TypeScript file for modern features"*
- *"Export the compatibility report as JSON"*

### Expected Output
```
🎯 Baseline Compatibility Report

📊 Summary:
   Global Score: 85.2% (Target: baseline-2024)
   Features Detected: 15
   Files Scanned: 127

🌐 Browser Coverage:
   chrome: 95.2%
   firefox: 87.3%
   safari: 71.4%
   edge: 94.1%

📈 Feature Distribution:
   ● Widely Supported: 8
   ● Newly Available: 4
   ● Limited Support: 2
   ● No Support: 1

💡 Recommendations:
   • Consider polyfills for limited support features
   • Pay special attention to safari compatibility (71.4%)
```

## 🏗️ Architecture

```
src/
├── types/index.ts      # Zod schemas and TypeScript types
├── lib/
│   ├── baseline.ts     # Local Baseline computation
│   ├── parsers.ts      # AST parsers (Babel/PostCSS/Cheerio)
│   └── walker.ts       # File system walker
├── tools/index.ts      # MCP tools implementation
├── server.ts           # Main MCP server
└── cli.ts              # CLI interface
```

## 🔒 Type Safety

Every input and output is validated:

```typescript
export const AuditProjectInputSchema = z.object({
  project_path: z.string(),
  target: z.enum(['baseline-2024', 'baseline-2023', 'widely', 'limited']).default('baseline-2024'),
  max_files: z.number().int().positive().default(10000),
  export_path: z.string().optional(),
});
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **MCP TypeScript SDK** - Native MCP implementation
- **web-features** - Local Baseline data
- **Babel** - JavaScript/TypeScript AST parsing
- **PostCSS** - CSS AST parsing
- **Cheerio** - HTML parsing
- **Zod** - Runtime type validation

---