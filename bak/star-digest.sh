#!/bin/bash

# star-digest.sh - Generate a digest of trending repos in your interest areas

INTERESTS=("typescript" "python" "golang" "ai" "devops")
OUTPUT="star-digest-$(date +%Y-%m-%d).md"

echo "# GitHub Star Digest - $(date +%Y-%m-%d)" > "$OUTPUT"
echo "" >> "$OUTPUT"

for interest in "${INTERESTS[@]}"; do
    echo "## Trending in $interest" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    
    gh api "search/repositories?q=$interest&sort=stars&order=desc&per_page=5" | \
    jq -r '.items[] | "- [\(.full_name)](\(.html_url)) - \(.description // "No description") ⭐\(.stargazers_count)"' >> "$OUTPUT"
    
    echo "" >> "$OUTPUT"
done

echo "✅ Generated $OUTPUT"