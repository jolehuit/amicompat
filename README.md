# AmICompat MCP - Be compatible regardless of the browser

[![NPM Version](https://img.shields.io/npm/v/amicompat?color=red)](https://www.npmjs.com/package/amicompat) [![MIT licensed](https://img.shields.io/npm/l/amicompat)](./LICENSE) [![GitHub stars](https://img.shields.io/github/stars/jolehuit/amicompat?style=social)](https://github.com/jolehuit/amicompat)

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=amicompat&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImFtaWNvbXBhdCJdfQ%3D%3D) [<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/Install%20in%20VS%20Code-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22amicompat%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22amicompat%22%5D%7D)

## ❌ Without AmICompat

Building modern web applications often means encountering browser compatibility issues:

- ❌ **Unclear feature support** - Not knowing which browsers support your code
- ❌ **Runtime surprises** - Features breaking in production on older browsers
- ❌ **Manual research** - Constantly checking MDN and Can I Use for compatibility
- ❌ **Guesswork polyfills** - Adding unnecessary or missing polyfills
- ❌ **Inconsistent baselines** - No standardized way to assess browser support

## ✅ With AmICompat

AmICompat MCP automatically analyzes your web code and provides instant Web Baseline compatibility insights using AST-based parsing and local Baseline data.

```txt
Audit my React project for browser compatibility issues using baseline-2025 target
```

```txt
Check this CSS file for modern features that might need polyfills
```

```txt
Analyze my JavaScript code and tell me what browsers support these features
```

AmICompat provides:

- 🔍 **AST-based analysis** - Deep parsing of JavaScript, TypeScript, CSS, and HTML
- 📊 **Baseline compatibility reports** - Standards-based browser support analysis
- 🎯 **Targeted recommendations** - Specific polyfill and fallback suggestions
- 🚀 **Local processing** - Fast analysis using local Baseline data via web-features
- 📈 **Coverage metrics** - Browser coverage percentages and support levels

## 🛠️ Installation

### Requirements

- Node.js >= v18.0.0
- Cursor, Claude Code, Windsurf, VS Code, or another MCP Client

### Quick Start (No Installation Required)

AmICompat works out of the box with `npx` - no installation needed! Just configure your MCP client with the configurations below.

### Optional: Local Installation

For faster startup times, you can optionally install AmICompat globally:

```bash
npm install -g amicompat
```

Then use `"command": "amicompat"` in your configurations instead of the npx commands.

### MCP Client Configuration

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=amicompat&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImFtaWNvbXBhdC1tY3AiXX0%3D)

```json
{
  "mcpServers": {
    "amicompat": {
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

> If you installed globally: use `"command": "amicompat"` and `"args": []`

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command. See [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp) for more info.

```sh
claude mcp add amicompat -- npx -y amicompat
```

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file. See [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp) for more info.

```json
{
  "mcpServers": {
    "amicompat": {
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in VS Code</b></summary>

[<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20AmICompat%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22amicompat%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22amicompat%22%5D%7D)

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

```json
"mcp": {
  "servers": {
    "amicompat": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Cline</b></summary>

1. Open **Cline**.
2. Click the hamburger menu icon (☰) to enter the **MCP Servers** section.
3. Choose **Local Servers** tab.
4. Click the **Edit Configuration** button.
5. Add amicompat to `mcpServers`:

```json
{
  "mcpServers": {
    "amicompat": {
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

Add this to your Zed `settings.json`. See [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers) for more info.

```json
{
  "context_servers": {
    "AmICompat": {
      "command": {
        "path": "npx",
        "args": ["-y", "amicompat"]
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration file. See [Roo Code MCP docs](https://docs.roocode.com/features/mcp/using-mcp-in-roo) for more info.

```json
{
  "mcpServers": {
    "amicompat": {
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Gemini CLI</b></summary>

See [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html) for details.

Add the following to the `mcpServers` object in your `~/.gemini/settings.json` file:

```json
{
  "mcpServers": {
    "amicompat": {
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

Open Claude Desktop developer settings and edit your `claude_desktop_config.json` file. See [Claude Desktop MCP docs](https://modelcontextprotocol.io/quickstart/user) for more info.

```json
{
  "mcpServers": {
    "amicompat": {
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in OpenAI Codex</b></summary>

Add the following configuration to your OpenAI Codex MCP server settings:

```toml
[mcp_servers.amicompat]
args = ["-y", "amicompat"]
command = "npx"
```

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

See [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) for more details.

1. In JetBrains IDEs, go to `Settings` -> `Tools` -> `AI Assistant` -> `Model Context Protocol (MCP)`
2. Click `+ Add`.
3. Add this configuration and click `OK`

```json
{
  "mcpServers": {
    "amicompat": {
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Copilot Coding Agent</b></summary>

Add the following configuration to the `mcp` section of your Copilot Coding Agent configuration file:

```json
{
  "mcpServers": {
    "amicompat": {
      "command": "npx",
      "args": ["-y", "amicompat"],
      "tools": ["audit_project", "audit_file", "get_feature_status", "export_last_report"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in LM Studio</b></summary>

1. Navigate to `Program` (right side) > `Install` > `Edit mcp.json`.
2. Paste the configuration given below:

```json
{
  "mcpServers": {
    "AmICompat": {
      "command": "npx",
      "args": ["-y", "amicompat"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Perplexity Desktop</b></summary>

1. Navigate `Perplexity` > `Settings`
2. Select `Connectors`.
3. Click `Add Connector`.
4. Select `Advanced`.
5. Enter Server Name: `AmICompat`
6. Paste the following JSON in the text area:

```json
{
  "args": ["-y", "amicompat"],
  "command": "npx",
  "env": {}
}
```

</details>

## 🔨 Available Tools

AmICompat MCP provides the following tools that LLMs can use:

- **`audit_project`**: Comprehensive project-wide compatibility analysis
  - `project_path` (required): Path to the project directory
  - `target` (optional): Baseline target (`baseline-2025`, `baseline-2024`,`baseline-2023`, `widely`, `limited`)
  - `max_files` (optional): Maximum number of files to scan (default: 10000)
  - `export_path` (optional): Path to export JSON report

- **`audit_file`**: Single file compatibility analysis
  - `file_path` (required): Path to the file to analyze

- **`get_feature_status`**: Get Baseline status for specific web features
  - `feature` (required): Feature identifier (e.g., `css-container-queries`, `js-optional-chaining`)

- **`export_last_report`**: Export the most recent audit report
  - `path` (required): File path for the exported JSON report

## 🎯 Supported Technologies

AmICompat uses advanced AST-based parsing to analyze:

### JavaScript & TypeScript
- ✅ Optional chaining (`?.`)
- ✅ Nullish coalescing (`??`)
- ✅ Private class fields (`#field`)
- ✅ Top-level await
- ✅ Dynamic imports
- ✅ Decorators
- ✅ And more ES2015+ features

### CSS
- ✅ Container queries (`@container`)
- ✅ `:has()` selector
- ✅ CSS Grid subgrid
- ✅ Cascade layers (`@layer`)
- ✅ Custom properties (`@property`)
- ✅ `color-mix()` function
- ✅ CSS nesting
- ✅ And more modern CSS features

### HTML
- ✅ Dialog element (`<dialog>`)
- ✅ Lazy loading attributes
- ✅ Modern input types
- ✅ Web components
- ✅ ARIA attributes
- ✅ And more semantic HTML5+ features

## 📊 Baseline Targets

Choose your compatibility target:

- **`baseline-2025`**: Features available in all major browsers since 2025
- **`baseline-2024`**: Features available in all major browsers since 2024
- **`baseline-2023`**: Features available in all major browsers since 2023
- **`widely`**: High baseline - widely supported across browsers
- **`limited`**: Limited baseline - some browser support

## 🛟 Usage Examples

### Project-wide Analysis

```txt
Run a baseline compatibility audit on my React project for baseline-2025 target and export the results to compatibility-report.json
```

### Single File Check

```txt
Analyze this CSS file for container query usage and browser support
```

### Feature Status Lookup

```txt
What's the baseline status of CSS Grid subgrid feature?
```

### Custom Rules Integration

Add this rule to your MCP client for automatic compatibility checking:

```txt
Always run compatibility analysis with AmICompat when I'm working with modern web features,
CSS Grid, flexbox, JavaScript ES2015+ syntax, or when I mention browser support concerns.
Use baseline-2025 as the default target unless specified otherwise.
```

## 📊 Example Output

```
🎯 Baseline Compatibility Report

📊 Summary:
   Global Score: 85.2% (Target: baseline-2025)
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
   • Monitor newly available features for wider adoption
```

## 💻 CLI Usage

AmICompat also provides a command-line interface:

```bash
# Show server information
npx amicompat info

# Test parser on a file
npx amicompat test-parse ./src/app.js

# Start MCP server (default)
npx amicompat
```

## 🧪 Testing

AmICompat includes a comprehensive test suite with >90% coverage:

```bash
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:integration    # Integration tests only
npm run test:cli           # Test CLI functionality
```

## 🏗️ Architecture

- **TypeScript Native**: Built with modern TypeScript and strict type checking
- **AST-based Parsing**: Uses Babel, PostCSS, and Cheerio for accurate code analysis
- **Local Baseline Data**: Powered by web-features and compute-baseline for offline analysis
- **Zod Validation**: Type-safe MCP tool inputs and outputs
- **Comprehensive Testing**: Unit and integration tests for reliability

### Project Structure

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

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- **MCP TypeScript SDK** - Native MCP implementation
- **web-features** - Local Baseline data
- **Babel** - JavaScript/TypeScript AST parsing
- **PostCSS** - CSS AST parsing
- **Cheerio** - HTML parsing
- **Zod** - Runtime type validation

---

**AmICompat MCP - Be compatible regardless of the browser** 🌐✨