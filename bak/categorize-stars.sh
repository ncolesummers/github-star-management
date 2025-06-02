#!/bin/bash

# categorize-stars.sh - Organize stars into topical lists

OUTPUT_DIR="star-lists"
mkdir -p "$OUTPUT_DIR"

# Define categories with keywords
declare -A CATEGORIES=(
    ["ai"]="ai|machine-learning|ml|deep-learning|neural|llm|gpt|transformer|nlp"
    ["web-servers"]="server|http|nginx|apache|caddy|express|fastapi|flask"
    ["standards"]="rfc|spec|standard|protocol|w3c|ecma"
    ["awesome-lists"]="awesome-|awesome |curated|list"
    ["typescript"]="typescript|ts|deno|tsx"
    ["python"]="python|py|django|flask|fastapi|pandas|numpy"
    ["golang"]="golang|go-|go |gin|echo|fiber"
    ["testing"]="test|testing|jest|pytest|mocha|cypress"
    ["devops"]="docker|kubernetes|k8s|ci-cd|jenkins|github-actions"
    ["databases"]="database|db|sql|postgres|mysql|mongodb|redis"
)

echo "📚 Categorizing GitHub stars..."
echo "========================================="

# Get all starred repositories
STARS_JSON=$(gh api user/starred --paginate)

# Process each category
for category in "${!CATEGORIES[@]}"; do
    pattern="${CATEGORIES[$category]}"
    output_file="$OUTPUT_DIR/$category-stars.md"
    
    echo "Processing category: $category"
    
    # Create markdown header
    cat > "$output_file" << EOF
# ${category^} Stars Collection

*Curated list of ${category} repositories I've found valuable*

EOF
    
    # Filter and format repositories
    echo "$STARS_JSON" | jq -r --arg pattern "$pattern" '
        .[] | 
        select(
            (.name | test($pattern; "i")) or 
            (.description | test($pattern; "i")) or 
            (.topics[]? | test($pattern; "i"))
        ) | 
        "## [\(.full_name)](\(.html_url))\n\(.description // "No description")\n\n⭐ \(.stargazers_count) | 🔄 Updated: \(.updated_at | split("T")[0])\n\n---\n"
    ' >> "$output_file"
    
    # Count entries
    count=$(grep -c "^##" "$output_file" || echo "0")
    echo "  ✅ Found $count repositories for $category"
done

echo "========================================="
echo "✅ Categorization complete! Check the $OUTPUT_DIR directory."