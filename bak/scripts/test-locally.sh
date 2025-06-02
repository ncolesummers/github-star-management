#!/bin/bash

# test-locally.sh - Test the cleanup script locally

echo "🧪 Testing star cleanup locally..."

# Export required variables
export DRY_RUN=true
export CUTOFF_MONTHS=24
export GITHUB_TOKEN=$(gh auth token)

# Run the cleanup script
./scripts/cleanup-stars.sh

echo ""
echo "✅ Test completed (dry run mode)"
echo ""
echo "To run actual cleanup locally:"
echo "  DRY_RUN=false ./scripts/cleanup-stars.sh"