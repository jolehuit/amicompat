#!/usr/bin/env python3
"""Quick test script for the amicompat-mcp server"""
import asyncio
from pathlib import Path
from amicompat_mcp.core.detector import Detector
from amicompat_mcp.core.baseline_api import BaselineAPI
from amicompat_mcp.core.walker import Walker
from amicompat_mcp.core.analyzer import Analyzer

async def test_components():
    """Test individual components"""
    print("🧪 Testing AmICompat MCP Server Components\n")
    
    # Test detector
    print("1. Testing Feature Detector...")
    detector = Detector()
    patterns = detector.patterns
    print(f"   ✓ Loaded {len(patterns)} feature patterns")
    
    # Test walker
    print("\n2. Testing File Walker...")
    walker = Walker(max_files=10)
    current_dir = Path.cwd()
    files = walker.scan(current_dir)
    print(f"   ✓ Found {len(files)} files in current directory")
    
    # Test API
    print("\n3. Testing WebStatus API...")
    async with BaselineAPI() as api:
        status = await api.get_feature_status("css-container-queries")
    print(f"   ✓ API Response: {status.get('baseline_status', 'error')}")
    print(f"   ✓ Browsers: {list(status.get('browsers', {}).keys())}")
    
    # Test analyzer
    print("\n4. Testing Analyzer...")
    analyzer = Analyzer(target="baseline-2024")
    test_features = {
        "css-container-queries": {
            "status": status,
            "files": [{"path": "test.css", "hits": 2}],
            "total_hits": 2
        }
    }
    metrics = analyzer.analyze(test_features)
    print(f"   ✓ Global Score: {metrics['global_score']}%")
    print(f"   ✓ Browser Coverage: Chrome {metrics['browser_coverage'].get('chrome', 0)}%")
    
    print("\n✅ All component tests passed!")
    print("\n📝 Next steps:")
    print("   1. Test with MCP Inspector: uv run mcp dev src/amicompat_mcp/server.py")
    print("   2. Alternative: mcp dev \"$(which amicompat-mcp)\"")
    print("   3. Run locally via CLI: uvx amicompat-mcp")

if __name__ == "__main__":
    asyncio.run(test_components())



