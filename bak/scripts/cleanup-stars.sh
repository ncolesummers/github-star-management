#!/bin/bash

# cleanup-stars.sh - Remove stars from archived or outdated repositories

set -e

# Configuration
CUTOFF_MONTHS=${CUTOFF_MONTHS:-24}  # Default 24 months (2 years)
DRY_RUN=${DRY_RUN:-false}
GITHUB_TOKEN=${GITHUB_TOKEN:-$STAR_MANAGEMENT_TOKEN}

# Calculate cutoff date
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CUTOFF_DATE=$(date -v-${CUTOFF_MONTHS}m +%Y-%m-%d)
else
    # Linux
    CUTOFF_DATE=$(date -d "$CUTOFF_MONTHS months ago" +%Y-%m-%d)
fi

# Counters
REMOVED_COUNT=0
ARCHIVED_COUNT=0
OUTDATED_COUNT=0
TOTAL_STARS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧹 GitHub Stars Cleanup Script"
echo "=============================="
echo "Cutoff date: $CUTOFF_DATE (${CUTOFF_MONTHS} months)"
echo "Dry run: $DRY_RUN"
echo ""

# Function to make authenticated API calls
api_call() {
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         "$@"
}

# Function to unstar a repository
unstar_repo() {
    local repo=$1
    local reason=$2
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would unstar: $repo ($reason)"
    else
        echo -e "${RED}Unstarring:${NC} $repo ($reason)"
        api_call -X DELETE "https://api.github.com/user/starred/$repo"
    fi
}

# Get all starred repositories with pagination
page=1
while true; do
    response=$(api_call "https://api.github.com/user/starred?page=$page&per_page=100")
    
    # Check if response is empty
    if [ "$(echo "$response" | jq '. | length')" -eq 0 ]; then
        break
    fi
    
    # Process each repository
    echo "$response" | jq -c '.[]' | while read -r repo; do
        full_name=$(echo "$repo" | jq -r '.full_name')
        updated_at=$(echo "$repo" | jq -r '.updated_at')
        archived=$(echo "$repo" | jq -r '.archived')
        pushed_at=$(echo "$repo" | jq -r '.pushed_at')
        
        ((TOTAL_STARS++))
        
        # Check if repository is archived
        if [ "$archived" = "true" ]; then
            unstar_repo "$full_name" "archived"
            ((ARCHIVED_COUNT++))
            ((REMOVED_COUNT++))
            continue
        fi
        
        # Use pushed_at for activity check (more accurate than updated_at)
        if [[ "$pushed_at" < "$CUTOFF_DATE" ]]; then
            unstar_repo "$full_name" "no activity since $pushed_at"
            ((OUTDATED_COUNT++))
            ((REMOVED_COUNT++))
        fi
    done
    
    ((page++))
done

# Summary
echo ""
echo "=============================="
echo -e "${GREEN}✅ Cleanup Summary${NC}"
echo "Total stars reviewed: $TOTAL_STARS"
echo "Stars removed: $REMOVED_COUNT"
echo "  - Archived repos: $ARCHIVED_COUNT"
echo "  - Outdated repos: $OUTDATED_COUNT"
echo "Stars remaining: $((TOTAL_STARS - REMOVED_COUNT))"

# Create summary for GitHub Action
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
    cat >> $GITHUB_STEP_SUMMARY << EOF
## 🧹 Star Cleanup Results

- **Total stars reviewed**: $TOTAL_STARS
- **Stars removed**: $REMOVED_COUNT
  - Archived repositories: $ARCHIVED_COUNT
  - Outdated repositories: $OUTDATED_COUNT
- **Stars remaining**: $((TOTAL_STARS - REMOVED_COUNT))
- **Cutoff date**: $CUTOFF_DATE

### Cleanup Policy
- Removed stars from archived repositories
- Removed stars from repositories with no activity for $CUTOFF_MONTHS months
EOF
fi