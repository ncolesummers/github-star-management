#!/bin/bash

# star-report.sh - Weekly report of your GitHub stars
# Ultra-simplified version that processes each part separately

echo "📊 GitHub Stars Weekly Report"
echo "Generated: $(date)"
echo "========================================="

# Function to count stars
count_stars() {
    # Get just the first page to estimate total
    local first_page=$(gh api "user/starred?per_page=100" | jq '. | length')
    echo "Approximately ${first_page}+ repositories starred"
}

# Function to get language distribution
get_language_dist() {
    echo "Getting top 10 languages (first page only)..."
    gh api "user/starred?per_page=100" | jq -r '.[].language // "Unknown"' | 
        sort | uniq -c | sort -rn | head -10 | sed 's/^[ \t]*//'
}

# Function to get most popular repos
get_popular_repos() {
    echo "Finding your most popular starred repos (first page only)..."
    gh api "user/starred?per_page=100" | 
        jq -r 'sort_by(.stargazers_count) | reverse | .[:10][] | "\(.stargazers_count) ⭐ - \(.full_name)"'
}

# Display results
echo "Note: This report is based on a sample of your stars to avoid timeouts."
echo ""

echo "Total stars:"
count_stars

echo -e "\n📝 Language Distribution:"
get_language_dist

echo -e "\n🌟 Your most popular starred repos:"
get_popular_repos

echo -e "\nℹ️ To see all of your stars, run: gh api user/starred --paginate | jq -r '.[].full_name'"
echo -e "✅ Report generated successfully"