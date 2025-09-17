# AmICompat MCP - Be compatible regardless of the browser

[![NPM Version](https://img.shields.io/npm/v/amicompat-mcp?color=red)](https://www.npmjs.com/package/amicompat-mcp) [![MIT licensed](https://img.shields.io/npm/l/amicompat-mcp)](./LICENSE) [![GitHub stars](https://img.shields.io/github/stars/jolehuit/amicompat?style=social)](https://github.com/jolehuit/amicompat)

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=amicompat-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImFtaWNvbXBhdC1tY3AiXX0=) [<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/Install%20in%20VS%20Code-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22amicompat-mcp%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22amicompat-mcp%22%5D%7D)

## ❌ Without AmICompat

Building modern web applications often means encountering browser compatibility issues:

- ❌ **Unclear feature support** - Not knowing which browsers support your CSS and HTML
- ❌ **Runtime surprises** - Features breaking in production on older browsers
- ❌ **Manual research** - Constantly checking MDN and Can I Use for compatibility
- ❌ **Guesswork polyfills** - Adding unnecessary or missing polyfills
- ❌ **Inconsistent baselines** - No standardized way to assess browser support

## ✅ With AmICompat

AmICompat MCP automatically analyzes your CSS and HTML code and provides instant Web Baseline compatibility insights using ESLint-based feature detection.

```txt
Audit my web project for CSS and HTML compatibility issues using widely available baseline
```

```txt
Check this CSS file for modern features that might need polyfills
```

```txt
Analyze my HTML code and tell me what browsers support these elements
```

AmICompat provides:

- 🔍 **ESLint-based analysis** - Robust feature detection for CSS and HTML
- 📊 **Baseline compatibility reports** - Standards-based browser support analysis
- 🎯 **Targeted recommendations** - Specific baseline violation identification
- 🚀 **Local processing** - Fast analysis using native ESLint rules
- 📈 **Coverage metrics** - Clear baseline violation reporting

## 🛠️ Installation

### Requirements

- Node.js >= v18.0.0
- Cursor, Claude Code, Windsurf, VS Code, or another MCP Client

### Quick Start (No Installation Required)

AmICompat works out of the box with `npx` - no installation needed! Just configure your MCP client with the configurations below.

### Optional: Local Installation

For faster startup times, you can optionally install AmICompat globally:

```bash
npm install -g amicompat-mcp
```

Then use `"command": "amicompat-mcp"` in your configurations instead of the npx commands.

### MCP Client Configuration

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=amicompat-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImFtaWNvbXBhdC1tY3AiXX0=)

```json
{
  "mcpServers": {
    "amicompat-mcp": {
      "command": "npx",
      "args": ["-y", "amicompat-mcp"]
    }
  }
}
```

> If you installed globally: use `"command": "amicompat-mcp"` and `"args": []`

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command. See [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp) for more info.

```sh
claude mcp add amicompat-mcp -- npx -y amicompat-mcp
```

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file. See [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp) for more info.

```json
{
  "mcpServers": {
    "amicompat-mcp": {
      "command": "npx",
      "args": ["-y", "amicompat-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in VS Code</b></summary>

[<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20AmICompat%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22amicompat-mcp%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22amicompat-mcp%22%5D%7D)

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

```json
"mcp": {
  "servers": {
    "amicompat-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "amicompat-mcp"]
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
5. Add amicompat-mcp to `mcpServers`:

```json
{
  "mcpServers": {
    "amicompat-mcp": {
      "command": "npx",
      "args": ["-y", "amicompat-mcp"]
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
        "args": ["-y", "amicompat-mcp"]
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
    "amicompat-mcp": {
      "command": "npx",
      "args": ["-y", "amicompat-mcp"]
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
    "amicompat-mcp": {
      "command": "npx",
      "args": ["-y", "amicompat-mcp"]
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
    "amicompat-mcp": {
      "command": "npx",
      "args": ["-y", "amicompat-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in OpenAI Codex</b></summary>

Add the following configuration to your OpenAI Codex MCP server settings:

```toml
[mcp_servers.amicompat-mcp]
args = ["-y", "amicompat-mcp"]
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
    "amicompat-mcp": {
      "command": "npx",
      "args": ["-y", "amicompat-mcp"]
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
    "amicompat-mcp": {
      "command": "npx",
      "args": ["-y", "amicompat-mcp"],
      "tools": ["audit_project", "audit_file", "export_last_report"]
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
      "args": ["-y", "amicompat-mcp"]
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
  "args": ["-y", "amicompat-mcp"],
  "command": "npx",
  "env": {}
}
```

</details>

## 🔨 Available Tools

AmICompat MCP provides the following tools that LLMs can use:

- **`audit_project`**: Comprehensive project-wide compatibility analysis
  - `project_path` (required): Path to the project directory
  - `target` (optional): Baseline target (`widely`, `newly`)
  - `max_files` (optional): Maximum number of files to scan (default: 10000)
  - `export_path` (optional): Path to export JSON report

- **`audit_file`**: Single file compatibility analysis
  - `file_path` (required): Path to the CSS or HTML file to analyze

- **`export_last_report`**: Export the most recent audit report
  - `path` (required): File path for the exported JSON report

## 🎯 Supported Technologies

AmICompat uses advanced ESLint-based feature detection to analyze:

### CSS
- ✅ Container queries (`@container`)
- ✅ `:has()` selector
- ✅ CSS Grid subgrid
- ✅ Cascade layers (`@layer`)
- ✅ Custom properties (`@property`)
- ✅ `color-mix()` function
- ✅ CSS nesting
- ✅ View transitions (`view-transition-name`)
- ✅ Anchor positioning (`anchor-name`)
- ✅ And more modern CSS features

### HTML
- ✅ Dialog element (`<dialog>`)
- ✅ Search element (`<search>`)
- ✅ Popover API (`<popover>`)
- ✅ Lazy loading attributes
- ✅ Modern input types
- ✅ Web components
- ✅ ARIA attributes
- ✅ And more semantic HTML5+ features

## 📊 Baseline Targets

Choose your compatibility target:

- **`widely`**: High baseline - features widely supported across browsers
- **`newly`**: Features available in newest browser versions

## 🛟 Usage Examples

### Project-wide Analysis

```txt
Run a baseline compatibility audit on my web project for widely available features and export the results to compatibility-report.json
```

### Single File Check

```txt
Analyze this CSS file for container query usage and browser support
```

### Custom Rules Integration

Add this rule to your MCP client for automatic compatibility checking:

```txt
Always run compatibility analysis with AmICompat when I'm working with modern CSS features,
container queries, CSS Grid, HTML elements, or when I mention browser support concerns.
Use 'widely' as the default target unless specified otherwise.
```

## 📊 Example Output

```
🎯 Baseline Compatibility Report

📊 Summary:
   Target: widely
   Features Detected: 3
   Baseline Violations: 3
   Files Scanned: 15

🔍 Detected Features:
   • CSS view-transition-name property (1 location)
   • CSS anchor-name property (1 location)
   • HTML <search> element (1 location)
```

## 💻 CLI Usage

AmICompat also provides a command-line interface:

```bash
# Show server information
npx amicompat-mcp info

# Test parser on a file
npx amicompat-mcp test-parse ./src/styles.css

# Audit a project
npx amicompat-mcp audit ./my-project --target widely

# Start MCP server (default)
npx amicompat-mcp
```

## 🧪 Testing

AmICompat includes a comprehensive test suite:

```bash
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:integration    # Integration tests only
npm run test:cli           # Test CLI functionality
```

### Test Coverage

- **Unit Tests**: ESLint wrapper, file walker, type validation
- **Integration Tests**: CLI interface, MCP tools end-to-end functionality
- **Feature Detection**: CSS and HTML feature detection tests
- **Error Handling**: Edge cases, malformed code, missing files

## 🏗️ Architecture

- **TypeScript Native**: Built with modern TypeScript and strict type checking
- **ESLint-based Detection**: Uses ESLint for robust and reliable feature detection
- **Native Baseline Rules**: Powered by `@eslint/css` and `@html-eslint` use-baseline rules
- **Zod Validation**: Type-safe MCP tool inputs and outputs
- **Simplified Design**: Clean, maintainable codebase focused on CSS and HTML

### Why ESLint-based Detection?

- **🛡️ Robustness**: ESLint handles edge cases and syntax variations better than custom parsers
- **🔧 Maintainability**: Leverages battle-tested, community-maintained parsing logic
- **⚡ Performance**: Optimized parsing engine designed for large codebases
- **🚀 Extensibility**: Easy to add new feature detection via ESLint rules
- **🎯 Accuracy**: Industry-standard parsing with comprehensive syntax support

### Project Structure

```
src/
├── types/index.ts         # Zod schemas and TypeScript types
├── lib/
│   ├── eslint-wrapper.ts  # ESLint-based feature detection for CSS/HTML
│   └── walker.ts          # File system walker with filtering
├── tools/index.ts         # MCP tools implementation
├── server.ts              # Main MCP server
└── cli.ts                 # CLI interface with test commands
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
- **ESLint** - Robust CSS and HTML feature detection
- **@eslint/css** - CSS feature detection with use-baseline rule
- **@html-eslint** - HTML feature detection with use-baseline rule
- **Zod** - Runtime type validation

---

**AmICompat MCP - Be compatible regardless of the browser** 🌐✨