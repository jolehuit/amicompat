"""MCP request handlers for tools and resources"""
from typing import Dict, Any, Optional
from pathlib import Path
import asyncio
import os

from amicompat_mcp.core.walker import Walker
from amicompat_mcp.core.detector import Detector
from amicompat_mcp.core.baseline_api import BaselineAPI
from amicompat_mcp.core.analyzer import Analyzer
from amicompat_mcp.core.formatter import Formatter
from amicompat_mcp.utils.validate import (
    validate_project_path,
    validate_file_path,
    validate_target,
)

# Global storage for last results (in-memory cache)
_last_report: Optional[Dict[str, Any]] = None
_last_charts: Optional[Dict[str, Any]] = None

def setup_handlers(mcp):
    """Register all MCP handlers with the server"""
    global _last_report, _last_charts
    
    @mcp.tool()
    async def audit_project(
        project_path: str,
        target: Optional[str] = None,
        max_files: Optional[int] = None,
        export_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Audit entire project for Baseline compatibility.
        
        Args:
            project_path: Path to project directory
            target: Target baseline ("baseline-2024", "baseline-2023", "widely")
            max_files: Maximum files to scan
        
        Returns:
            Complete audit report with metrics and recommendations
        """
        global _last_report, _last_charts
        
        # Validate inputs
        path = Path(project_path).resolve()
        validate_project_path(path)
        if target is None:
            target = os.getenv("AMICOMPAT_DEFAULT_TARGET", "baseline-2024")
        target = validate_target(target)
        
        # Initialize components
        # Determine max files (param or env)
        if max_files is None:
            try:
                max_files = int(os.getenv("AMICOMPAT_MAX_FILES", "10000"))
            except ValueError:
                max_files = 10000

        walker = Walker(max_files=max_files)
        detector = Detector()
        analyzer = Analyzer(target=target)
        formatter = Formatter()
        
        # Phase 1: Scan files
        files = walker.scan(path)
        if not files:
            empty_result = {
                "report": {"error": "No supported files found in project"},
                "charts": {},
                "text_summary": "No CSS/JS/HTML files found to analyze"
            }
            return empty_result
        
        # Phase 2: Detect features
        all_features = {}
        for file_path in files:
            features = detector.detect(file_path)
            for feature_id, hits in features.items():
                if feature_id not in all_features:
                    all_features[feature_id] = {
                        "files": [],
                        "status": None,
                        "total_hits": 0
                    }
                all_features[feature_id]["files"].append({
                    "path": str(file_path.relative_to(path)),
                    "hits": hits
                })
                all_features[feature_id]["total_hits"] += hits
        
        # Phase 3: Get feature statuses (parallelized)
        feature_ids = list(all_features.keys())
        async with BaselineAPI() as api:
            tasks = [api.get_feature_status(fid) for fid in feature_ids]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        for fid, res in zip(feature_ids, results):
            if isinstance(res, Exception):
                res = {"id": fid, "baseline_status": "limited", "browsers": {}}
            all_features[fid]["status"] = res
        
        # Phase 4: Analyze and format
        metrics = analyzer.analyze(all_features)
        report = formatter.format_report(all_features, metrics, len(files))
        charts = formatter.format_charts(metrics, all_features)
        text_summary = formatter.format_summary(metrics, all_features)
        
        # Cache results
        _last_report = report
        _last_charts = charts
        
        result = {
            "report": report,
            "charts": charts,
            "text_summary": text_summary
        }

        # Optional export
        if export_path:
            try:
                export_file = Path(export_path)
                export_file.parent.mkdir(parents=True, exist_ok=True)
                import json
                with open(export_file, "w", encoding="utf-8") as f:
                    json.dump(report, f, indent=2, ensure_ascii=False)
                result["exported_to"] = str(export_file)
            except Exception as e:
                result["export_error"] = str(e)

        return result
    
    @mcp.tool()
    async def audit_file(file_path: str) -> Dict[str, Any]:
        """
        Audit single file for web features.
        
        Args:
            file_path: Path to file to audit
        
        Returns:
            Detected features and compatibility score
        """
        # Validate input
        path = Path(file_path).resolve()
        validate_file_path(path)
        
        # Detect features
        detector = Detector()
        
        features = detector.detect(path)
        if not features:
            return {
                "features": [],
                "statuses": [],
                "file_score": 100.0,
                "message": "No tracked features detected - good compatibility!"
            }
        
        # Get statuses (parallelized)
        feature_ids = list(features.keys())
        async with BaselineAPI() as api:
            tasks = [api.get_feature_status(fid) for fid in feature_ids]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        statuses = []
        score_sum = 0.0
        for fid, hits, res in zip(feature_ids, [features[fid] for fid in feature_ids], results):
            if isinstance(res, Exception):
                res = {"id": fid, "baseline_status": "limited", "browsers": {}}
            statuses.append({
                "feature": fid,
                "name": res.get("name", fid),
                "hits": hits,
                "baseline_status": res.get("baseline_status", "limited"),
                "browsers": res.get("browsers", {}),
            })
            status_val = res.get("baseline_status", "limited")
            if status_val == "widely":
                score_sum += 1.0
            elif status_val == "newly":
                score_sum += 0.5
        
        file_score = (score_sum / len(features)) * 100
        
        return {
            "file": str(path.name),
            "features": list(features.keys()),
            "statuses": statuses,
            "file_score": round(file_score, 1),
            "total_features": len(features)
        }
    
    @mcp.tool()
    async def get_feature_status(feature: str) -> Dict[str, Any]:
        """
        Get Baseline status for specific feature.
        
        Args:
            feature: Feature ID (e.g., 'css-subgrid', 'js-optional-chaining')
        
        Returns:
            Feature status with browser support details
        """
        async with BaselineAPI() as api:
            status = await api.get_feature_status(feature)
        
        # Add friendly interpretation
        if status["baseline_status"] == "widely":
            status["interpretation"] = "✅ Widely supported - safe to use"
        elif status["baseline_status"] == "newly":
            status["interpretation"] = "⚡ Newly available - monitor adoption"
        else:
            status["interpretation"] = "⚠️ Limited support - use with caution"
        
        return status
    
    @mcp.resource("report:last")
    async def get_last_report() -> Dict[str, Any]:
        """Get the most recent audit report"""
        if _last_report:
            return _last_report
        return {
            "message": "No report available yet",
            "hint": "Run 'audit_project' first to generate a report"
        }
    
    @mcp.resource("charts:last")
    async def get_last_charts() -> Dict[str, Any]:
        """Get the most recent charts data"""
        if _last_charts:
            return _last_charts
        return {
            "message": "No charts available yet",
            "hint": "Run 'audit_project' first to generate charts"
        }

    @mcp.tool()
    async def export_last_report(path: str) -> Dict[str, Any]:
        """Export the most recent audit report to JSON file"""
        global _last_report
        if not _last_report:
            return {"error": "No report to export. Run 'audit_project' first."}
        try:
            export_file = Path(path)
            export_file.parent.mkdir(parents=True, exist_ok=True)
            import json
            with open(export_file, "w", encoding="utf-8") as f:
                json.dump(_last_report, f, indent=2, ensure_ascii=False)
            return {"ok": True, "exported_to": str(export_file)}
        except Exception as e:
            return {"ok": False, "error": str(e)}
