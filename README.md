AmICompat MCP 🔎🧪

Audit your web codebase (CSS/JS/HTML) for Baseline support. Detect modern features, check support via WebStatus, and get a clean report with score, coverage, and next actions.

✨ What you get
- 📊 Compatibility score + per‑browser coverage
- 🚩 Risk list (limited/newly) with top files
- 📦 JSON report + chart data, ready to visualize
- ⚡ Fast scan (skips vendor/build, parallel API lookups, caching)

🛠️ Install
```bash
# with pip
pip install amicompat-mcp

# dev mode
git clone <your-repo-url>
cd amicompat-mcp
uv pip install -e .
```

🚀 Quick start
```bash
# run the MCP server (pick one)
uvx amicompat-mcp
mcp dev "$(which amicompat-mcp)"
uv run mcp dev src/amicompat_mcp/server.py
```

➕ Add amicompat to Cursor (or any MCP client)
```json
{
  "mcpServers": {
    "amicompat": { "command": "amicompat-mcp", "args": [], "env": {} }
  }
}
```

🧩 Tools (MCP)
- `audit_project(project_path, target?, max_files?, export_path?)`
  - Full scan; returns report, charts, text_summary. If `target` is omitted, it uses `AMICOMPAT_DEFAULT_TARGET` (fallback: baseline-2024). Optional JSON export.
- `audit_file(file_path)` – Quick score for one file
- `get_feature_status(feature)` – Baseline status + versions (e.g. css-subgrid)
- `export_last_report(path)` – Save the last report to disk
Resources: `report:last`, `charts:last`

🧠 How it works (speed‑run)
- Walk project (skips node_modules, dist, big files)
- Detect modern features with lightweight regex
- Fetch Baseline status (cached, parallel, resilient)
- Compute score, coverage, and top risks → build report

🎯 Targets & config
- Targets: baseline-2023, baseline-2024, widely (extend in `src/amicompat_mcp/config/targets.json`)
- Default target: set `AMICOMPAT_DEFAULT_TARGET` (e.g. `baseline-2025`)
- Other env: `AMICOMPAT_MAX_CONCURRENCY`, `AMICOMPAT_MAX_FILES`, `AMICOMPAT_API_BASE`

🧪 Dev
```bash
python test_server.py                       # quick component smoke test
uv run mcp dev src/amicompat_mcp/server.py  # MCP Inspector
```

📄 License
MIT
