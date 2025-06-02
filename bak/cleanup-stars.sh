#!/bin/bash

# cleanup-stars.sh - Remove stars from archived or outdated repositories

CUTOFF_DATE=$(date -d "2 years ago" +%Y-%m-%d)
REMOVED_COUNT=0
ARCHIVED_COUNT=0

echo "🧹 Starting GitHub stars cleanup..."
echo "Cutoff date for updates: $CUTOFF_DATE"
echo "========================================="

# Function to unstar a repository
unstar_repo() {
    local repo=$1
    local reason=$2
    echo "  ❌ Unstarring: $repo ($reason)"
    gh api -X DELETE "/user/starred/$repo" --silent
}

# Get all starred repositories
gh api user/starred --paginate | jq -r '.[] | @base64' | while read -r encoded; do
    # Decode repository data
    repo_data=$(echo "$encoded" | base64 -d)
    
    full_name=$(echo "$repo_data" | jq -r '.full_name')
    updated_at=$(echo "$repo_data" | jq -r '.updated_at')
    archived=$(echo "$repo_data" | jq -r '.archived')
    
    # Check if repository is archived
    if [ "$archived" = "true" ]; then
        unstar_repo "$full_name" "archived"
        ((ARCHIVED_COUNT++))
        ((REMOVED_COUNT++))
        continue
    fi
    
    # Check if repository hasn't been updated in 2 years
    if [[ "$updated_at" < "$CUTOFF_DATE" ]]; then
        unstar_repo "$full_name" "not updated since $updated_at"
        ((REMOVED_COUNT++))
    fi
done

echo "========================================="
echo "✅ Cleanup complete!"
echo "   - Removed $REMOVED_COUNT stars total"
echo "   - $ARCHIVED_COUNT were archived repositories"