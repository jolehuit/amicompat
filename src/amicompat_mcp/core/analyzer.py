"""Analyze detected features and compute compatibility metrics"""
from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
import json
import os
import importlib.resources

class Analyzer:
    """Analyze features and compute compatibility metrics"""

    def __init__(self, target: Optional[str] = None):
        """
        Initialize analyzer with target baseline.

        Args:
            target: Target baseline year/level
        """
        # Allow env override when not passed explicitly
        if target is None:
            target = os.getenv("AMICOMPAT_DEFAULT_TARGET", "baseline-2024")
        self.target = target
        self.browsers = ["chrome", "firefox", "safari", "edge"]
        self._targets_map = self._load_targets_map()
        self.target_versions = self._get_target_versions(target)

    def _load_targets_map(self) -> Dict[str, Dict[str, int]]:
        """Load baseline targets map from packaged JSON using importlib.resources."""
        default = {
            "baseline-2024": {"chrome": 121, "firefox": 122, "safari": 17, "edge": 121},
            "baseline-2023": {"chrome": 109, "firefox": 109, "safari": 16, "edge": 109},
            "baseline-2022": {"chrome": 97, "firefox": 97, "safari": 15.4, "edge": 97},
            "widely": {"chrome": 100, "firefox": 100, "safari": 15, "edge": 100},
            "conservative": {"chrome": 90, "firefox": 90, "safari": 14, "edge": 90},
        }
        try:
            # Try to load from embedded config first
            files = importlib.resources.files("amicompat_mcp.config")
            with files.joinpath("targets.json").open('r', encoding='utf-8') as f:
                data = json.load(f)
                # basic structure check
                if isinstance(data, dict):
                    return data
        except (ImportError, FileNotFoundError, json.JSONDecodeError):
            pass
        return default

    def _get_target_versions(self, target: str) -> Dict[str, int]:
        """Get minimum browser versions for target baseline (warn if unknown)."""
        if target not in self._targets_map:
            print(f"Warning: Unknown target '{target}'. Falling back to baseline-2024")
            return self._targets_map.get("baseline-2024", {})
        return self._targets_map[target]
    
    def analyze(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze features and compute metrics.
        
        Args:
            features: Dictionary of detected features
        
        Returns:
            Metrics dictionary
        """
        if not features:
            return self._empty_metrics()
        
        # Initialize counters
        widely_count = 0
        newly_count = 0
        limited_count = 0
        risks = []
        browser_features = {b: [] for b in self.browsers}
        
        # Process each feature
        for feature_id, data in features.items():
            status = data.get("status", {})
            baseline = status.get("baseline_status", "limited")
            
            # Count by baseline status
            if baseline == "widely":
                widely_count += 1
            elif baseline == "newly":
                newly_count += 1
                risks.append((
                    feature_id,
                    data.get("total_hits", 0),
                    len(data.get("files", [])),
                    "newly"
                ))
            else:
                limited_count += 1
                risks.append((
                    feature_id,
                    data.get("total_hits", 0),
                    len(data.get("files", [])),
                    "limited"
                ))
            
            # Check browser support
            browsers = status.get("browsers", {})
            for browser in self.browsers:
                if browser in browsers:
                    try:
                        version_str = browsers[browser]
                        if isinstance(version_str, str):
                            # Extract major version number
                            version = float(version_str.split('.')[0])
                        else:
                            version = float(version_str)
                        
                        # Check if version meets target (minimum version)
                        supported = version >= self.target_versions[browser]
                        browser_features[browser].append(1 if supported else 0)
                    except (ValueError, TypeError):
                        browser_features[browser].append(0)
                else:
                    browser_features[browser].append(0)
        
        # Calculate global score
        total = widely_count + newly_count + limited_count
        global_score = 0
        if total > 0:
            global_score = ((widely_count * 1.0) + (newly_count * 0.5)) / total * 100
        
        # Calculate browser coverage
        browser_coverage = {}
        for browser, support in browser_features.items():
            if support:
                browser_coverage[browser] = (sum(support) / len(support)) * 100
            else:
                browser_coverage[browser] = 100.0
        
        # Sort risks by priority
        risks.sort(key=lambda x: (
            0 if x[3] == "limited" else 1,  # Status priority
            -x[1],  # Total hits (descending)
            -x[2]   # File count (descending)
        ))
        
        top_risks = [r[0] for r in risks[:5]]
        
        return {
            "global_score": round(global_score, 1),
            "widely_count": widely_count,
            "newly_count": newly_count,
            "limited_count": limited_count,
            "browser_coverage": {k: round(v, 1) for k, v in browser_coverage.items()},
            "top_risks": top_risks,
            "total_features": total,
            "target": self.target
        }
    
    def _empty_metrics(self) -> Dict[str, Any]:
        """Return empty metrics structure"""
        return {
            "global_score": 100.0,
            "widely_count": 0,
            "newly_count": 0,
            "limited_count": 0,
            "browser_coverage": {b: 100.0 for b in self.browsers},
            "top_risks": [],
            "total_features": 0,
            "target": self.target
        }
