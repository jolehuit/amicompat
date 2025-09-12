"""Format analysis results for output"""
from typing import Dict, Any, List
from datetime import datetime

class Formatter:
    """Format analysis results into reports and visualizations"""
    
    def format_report(self, features: Dict[str, Any], metrics: Dict[str, Any], files_count: int) -> Dict[str, Any]:
        """
        Format complete JSON report.
        
        Args:
            features: Detected features
            metrics: Computed metrics
            files_count: Number of files scanned
        
        Returns:
            Formatted report dictionary
        """
        feature_list = []
        
        for feature_id, data in features.items():
            status = data.get("status", {})
            feature_entry = {
                "id": feature_id,
                "name": status.get("name", feature_id),
                "status": status.get("baseline_status", "limited"),
                "browsers": status.get("browsers", {}),
                "files": sorted(
                    data.get("files", []),
                    key=lambda x: x.get("hits", 0),
                    reverse=True
                )[:10],  # Top 10 files
                "total_hits": data.get("total_hits", 0),
                "file_count": len(data.get("files", []))
            }
            feature_list.append(feature_entry)
        
        # Sort features by risk level
        feature_list.sort(key=lambda x: (
            0 if x["status"] == "limited" else (1 if x["status"] == "newly" else 2),
            -x["total_hits"]
        ))
        
        next_actions = self._generate_actions(features, metrics["top_risks"])
        
        return {
            "summary": {
                "files_scanned": files_count,
                "features_total": metrics["total_features"],
                "score_global": metrics["global_score"],
                "coverage_by_browser": metrics["browser_coverage"],
                "target": metrics["target"]
            },
            "features": feature_list,
            "next_actions": next_actions,
            "generated_at": self._get_timestamp()
        }
    
    def format_charts(self, metrics: Dict[str, Any], features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format data for chart visualization.
        
        Args:
            metrics: Computed metrics
            features: Detected features
        
        Returns:
            Charts data dictionary
        """
        return {
            "compatibility_overview": {
                "type": "donut",
                "data": {
                    "widely": metrics["widely_count"],
                    "newly": metrics["newly_count"],
                    "limited": metrics["limited_count"]
                },
                "colors": {
                    "widely": "#22c55e",
                    "newly": "#f59e0b",
                    "limited": "#ef4444"
                }
            },
            "browser_bars": {
                "type": "bar",
                "data": metrics["browser_coverage"],
                "colors": {
                    "chrome": "#4285f4",
                    "firefox": "#ff9500",
                    "safari": "#0fb5ee",
                    "edge": "#0078d4"
                }
            },
            "top_risks": {
                "type": "list",
                "data": [
                    {
                        "feature": risk,
                        "status": features.get(risk, {}).get("status", {}).get("baseline_status", "limited"),
                        "files": len(features.get(risk, {}).get("files", [])),
                        "hits": features.get(risk, {}).get("total_hits", 0)
                    }
                    for risk in metrics["top_risks"]
                ]
            },
            "trend": {
                "type": "gauge",
                "value": metrics["global_score"],
                "target": 80,
                "label": f"Compatibility Score ({metrics['target']})"
            }
        }
    
    def format_summary(self, metrics: Dict[str, Any], features: Dict[str, Any]) -> str:
        """
        Format human-readable text summary.
        
        Args:
            metrics: Computed metrics
            features: Detected features
        
        Returns:
            Formatted text summary
        """
        lines = []
        
        # Header
        lines.append("=" * 50)
        lines.append("BASELINE COMPATIBILITY REPORT")
        lines.append("=" * 50)
        
        # Score
        score = metrics['global_score']
        emoji = "✅" if score >= 80 else "⚡" if score >= 60 else "⚠️"
        lines.append(f"{emoji} Score: {score}% (Target: {metrics['target']})")
        
        # Feature breakdown
        lines.append(f"\nFeatures Detected: {metrics['total_features']}")
        lines.append(f"  • Widely supported: {metrics['widely_count']}")
        lines.append(f"  • Newly available: {metrics['newly_count']}")
        lines.append(f"  • Limited support: {metrics['limited_count']}")
        
        # Browser coverage
        lines.append(f"\nBrowser Coverage:")
        for browser, coverage in metrics['browser_coverage'].items():
            emoji = "✅" if coverage >= 90 else "⚠️"
            lines.append(f"  {emoji} {browser.capitalize()}: {coverage}%")
        
        # Weakest browser
        if metrics['browser_coverage']:
            weakest = min(metrics['browser_coverage'], key=metrics['browser_coverage'].get)
            lines.append(f"\n⚠️  Weakest Support: {weakest.capitalize()} ({metrics['browser_coverage'][weakest]}%)")
        
        # Top risks
        if metrics["top_risks"]:
            lines.append("\n🎯 Top Compatibility Risks:")
            for i, risk in enumerate(metrics["top_risks"][:3], 1):
                if risk in features:
                    feature_data = features[risk]
                    status = feature_data.get("status", {}).get("baseline_status", "limited")
                    file_count = len(feature_data.get("files", []))
                    lines.append(f"  {i}. {risk}")
                    lines.append(f"     Status: {status} | Files: {file_count}")
        
        # Recommendations
        lines.append("\n📝 Recommendations:")
        if metrics["limited_count"] > 0:
            lines.append("  • Add polyfills for limited features")
            lines.append("  • Consider fallback implementations")
        if metrics["newly_count"] > 3:
            lines.append("  • Monitor browser updates for newly supported features")
            lines.append("  • Test thoroughly in older browser versions")
        if score >= 80:
            lines.append("  • Good compatibility! Continue monitoring new features")
        
        lines.append("=" * 50)
        
        return "\n".join(lines)
    
    def _generate_actions(self, features: Dict[str, Any], top_risks: List[str]) -> List[str]:
        """Generate actionable recommendations"""
        actions = []
        
        for risk in top_risks[:3]:
            if risk not in features:
                continue
            
            feature_data = features[risk]
            status = feature_data.get("status", {}).get("baseline_status", "limited")
            files = feature_data.get("files", [])
            top_file = files[0]["path"] if files else "unknown"
            
            if status == "limited":
                # Specific recommendations by feature
                if "container" in risk:
                    actions.append(f"Replace @container with media queries in {top_file}")
                elif "subgrid" in risk:
                    actions.append(f"Use nested grids instead of subgrid in {top_file}")
                elif "has" in risk:
                    actions.append(f"Refactor :has() with JavaScript fallback in {top_file}")
                elif "dialog" in risk:
                    actions.append(f"Add dialog polyfill or use modal library")
                else:
                    actions.append(f"Add polyfill for {risk}")
            
            elif status == "newly":
                actions.append(f"Test {risk} in older browsers (newly available)")
        
        if not actions:
            if features:
                actions.append("All detected features have good browser support")
            else:
                actions.append("No compatibility issues detected")
        
        return actions[:5]  # Limit to 5 actions
    
    def _get_timestamp(self) -> str:
        """Get current ISO timestamp"""
        return datetime.now().isoformat()

