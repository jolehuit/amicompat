"""MCP server capabilities declaration"""
from typing import Dict, Any, List

def get_capabilities() -> Dict[str, Any]:
    """Return server capabilities for MCP protocol"""
    return {
        "tools": {
            "list": [
                "audit_project",
                "audit_file", 
                "get_feature_status",
                "export_last_report"
            ],
            "descriptions": {
                "audit_project": "Comprehensive project audit for Baseline compatibility",
                "audit_file": "Analyze single file for web features",
                "get_feature_status": "Get Baseline status for specific feature",
                "export_last_report": "Export the last audit report to a JSON file"
            }
        },
        "resources": {
            "list": [
                "report:last",
                "charts:last"
            ],
            "descriptions": {
                "report:last": "Most recent complete audit report",
                "charts:last": "Most recent charts visualization data"
            }
        },
        "prompts": []
    }

def get_server_info() -> Dict[str, str]:
    """Return server metadata"""
    return {
        "name": "amicompat-mcp",
        "version": "1.0.0",
        "description": "Web codebase Baseline compatibility auditor",
        "author": "AmICompat Team"
    }
