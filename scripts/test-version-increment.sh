#!/bin/bash

echo "🧪 Testing version increment logic..."

# Simulate current state
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Check if version exists on NPM
if npm view amicompat-mcp@$CURRENT_VERSION version 2>/dev/null; then
  echo "✅ Version $CURRENT_VERSION exists on NPM"
  echo "Would increment to patch version..."

  # Preview what the new version would be
  TEMP_VERSION=$(npm version patch --no-git-tag-version --dry-run 2>/dev/null || echo "1.1.1")
  echo "New version would be: $TEMP_VERSION"
else
  echo "❌ Version $CURRENT_VERSION does not exist on NPM"
  echo "Would use current version for publish"
fi

echo ""
echo "🔍 Current NPM versions:"
npm view amicompat-mcp versions --json | tail -10
