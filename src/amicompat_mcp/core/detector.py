"""Feature detection via regex patterns"""
import re
import json
from pathlib import Path
from typing import Dict

class Detector:
    """Detect web features in code files using regex patterns"""
    
    def __init__(self):
        """Initialize detector with patterns"""
        self.patterns = self._load_patterns()
        # Precompile regex patterns for performance
        self._compiled: Dict[str, re.Pattern] = {}
        for fid, cfg in self.patterns.items():
            pat = cfg.get("pattern")
            if not pat:
                continue
            flags = re.MULTILINE
            if cfg.get("group") in {"css", "html"}:
                flags |= re.IGNORECASE
            try:
                self._compiled[fid] = re.compile(pat, flags)
            except re.error:
                # Skip invalid regex; will warn during detection
                pass
    
    def _load_patterns(self) -> Dict[str, Dict[str, str]]:
        """Load feature patterns from config file"""
        # Try multiple paths for robustness
        possible_paths = [
            Path(__file__).parent.parent / "config" / "features.json",
            Path.cwd() / "src" / "amicompat_mcp" / "config" / "features.json",
        ]
        
        for config_path in possible_paths:
            if config_path.exists():
                try:
                    with open(config_path, 'r', encoding='utf-8') as f:
                        return json.load(f)
                except Exception as e:
                    print(f"Warning: Error loading {config_path}: {e}")
        
        # Fallback to default patterns
        print("Warning: Using default patterns (features.json not found)")
        return self._get_default_patterns()
    
    def _get_default_patterns(self) -> Dict[str, Dict[str, str]]:
        """Fallback patterns if config not found"""
        return {
            "css-container-queries": {
                "pattern": r"@container\s+[\w-]+|@container\s*\(",
                "group": "css"
            },
            "css-has-selector": {
                "pattern": r":has\s*\([^)]+\)",
                "group": "css"
            },
            "css-subgrid": {
                "pattern": r"grid-template-(rows|columns)\s*:\s*subgrid",
                "group": "css"
            },
            "js-optional-chaining": {
                "pattern": r"\?\.(?!\d)",
                "group": "js"
            },
            "js-nullish-coalescing": {
                "pattern": r"\?\?(?!=)",
                "group": "js"
            }
        }
    
    def detect(self, file_path: Path) -> Dict[str, int]:
        """
        Detect features in a file.
        
        Args:
            file_path: Path to file
        
        Returns:
            Dictionary of feature_id -> occurrence count
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            print(f"Warning: Could not read {file_path}: {e}")
            return {}
        
        # Determine file type and detect
        ext = file_path.suffix.lower()
        
        if ext in {'.css', '.scss'}:
            return self._detect_css(content)
        elif ext in {'.js', '.ts', '.jsx', '.tsx'}:
            return self._detect_js(content)
        elif ext == '.html':
            return self._detect_html(content)
        
        return {}
    
    def _detect_css(self, content: str) -> Dict[str, int]:
        """Detect CSS features"""
        features = {}
        css_ids = [k for k, v in self.patterns.items() if v.get("group") == "css"]
        
        for feature_id in css_ids:
            pattern = self._compiled.get(feature_id)
            raw = self.patterns[feature_id].get("pattern", "")
            if pattern:
                matches = pattern.findall(content)
            else:
                try:
                    matches = re.findall(raw, content, re.MULTILINE | re.IGNORECASE)
                except re.error:
                    print(f"Warning: Invalid regex for {feature_id}")
                    matches = []
            if matches:
                count = len(matches)
                features[feature_id] = count
        
        return features
    
    def _detect_js(self, content: str) -> Dict[str, int]:
        """Detect JavaScript features"""
        features = {}
        
        # Remove comments to avoid false positives
        content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        
        js_ids = [k for k, v in self.patterns.items() if v.get("group") == "js"]
        
        for feature_id in js_ids:
            pattern = self._compiled.get(feature_id)
            raw = self.patterns[feature_id].get("pattern", "")
            if pattern:
                matches = pattern.findall(content)
            else:
                try:
                    matches = re.findall(raw, content, re.MULTILINE)
                except re.error:
                    print(f"Warning: Invalid regex for {feature_id}")
                    matches = []
            if matches:
                features[feature_id] = len(matches)
        
        return features
    
    def _detect_html(self, content: str) -> Dict[str, int]:
        """Detect HTML features and embedded CSS/JS"""
        features = {}
        
        # Detect HTML-specific features
        html_ids = [k for k, v in self.patterns.items() if v.get("group") == "html"]
        
        for feature_id in html_ids:
            pattern = self._compiled.get(feature_id)
            raw = self.patterns[feature_id].get("pattern", "")
            if pattern:
                matches = pattern.findall(content)
            else:
                try:
                    matches = re.findall(raw, content, re.MULTILINE | re.IGNORECASE)
                except re.error:
                    print(f"Warning: Invalid regex for {feature_id}")
                    matches = []
            if matches:
                features[feature_id] = len(matches)
        
        # Also detect CSS in style tags
        style_matches = re.findall(
            r'<style[^>]*>(.*?)</style>', 
            content, 
            re.DOTALL | re.IGNORECASE
        )
        for style_content in style_matches:
            css_features = self._detect_css(style_content)
            for feature_id, count in css_features.items():
                features[feature_id] = features.get(feature_id, 0) + count
        
        # Detect JS in script tags
        script_matches = re.findall(
            r'<script[^>]*>(.*?)</script>', 
            content, 
            re.DOTALL | re.IGNORECASE
        )
        for script_content in script_matches:
            js_features = self._detect_js(script_content)
            for feature_id, count in js_features.items():
                features[feature_id] = features.get(feature_id, 0) + count
        
        return features
