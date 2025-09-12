#!/usr/bin/env python3
"""MCP server entry point for AmICompat"""
from mcp.server.fastmcp import FastMCP
from amicompat_mcp.mcp.handlers import setup_handlers

# Initialize FastMCP server with metadata
mcp = FastMCP(
    name="amicompat-mcp",
    instructions=(
        "Web codebase Baseline compatibility auditor. "
        "Scans CSS/JS/HTML files for modern web features and checks browser support via WebStatus API. "
        "Use 'audit_project' for full analysis or 'audit_file' for single files."
    )
)

# Register all handlers
setup_handlers(mcp)

def main():
    """Main entry point for the server"""
    mcp.run(transport="stdio")

if __name__ == "__main__":
    main()
