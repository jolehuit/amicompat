#!/usr/bin/env python3
"""Test script for MCP server functionality"""
import asyncio
from amicompat_mcp.server import mcp

async def test_server():
    """Test the MCP server initialization and functionality"""
    print("🧪 Testing AmICompat MCP Server\n")

    # Test server properties
    print(f"✅ Server name: {mcp.name}")
    print(f"✅ Server instructions: {mcp.instructions[:100]}...")

    # Test tools
    try:
        tools = await mcp.list_tools()
        print(f"✅ Available tools: {len(tools)}")
        for tool in tools:
            print(f"   - {tool.name}: {tool.description[:60]}...")
    except Exception as e:
        print(f"❌ Error listing tools: {e}")

    # Test resources
    try:
        resources = await mcp.list_resources()
        print(f"✅ Available resources: {len(resources)}")
        for resource in resources:
            print(f"   - {resource.uri}")
    except Exception as e:
        print(f"❌ Error listing resources: {e}")

    print("\n✅ Server test completed!")

if __name__ == "__main__":
    asyncio.run(test_server())
