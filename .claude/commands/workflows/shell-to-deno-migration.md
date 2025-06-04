# Shell to Deno Migration

This workflow guides you through converting shell scripts to Deno TypeScript
implementations for the GitHub Stars Management project.

## Workflow Steps

1. **Analyze Shell Script**
   - Understand the purpose and functionality of the shell script
   - Identify external dependencies and commands used
   - Note environment variables and configuration
   - Determine input/output patterns
   - Identify error handling approaches

2. **Plan TypeScript Structure**
   - Determine appropriate module location in the Deno project
   - Identify required TypeScript interfaces
   - Plan service methods and CLI commands
   - Consider how to handle shell-specific operations

3. **Implement Core Functionality**
   - Create or extend service classes for the core logic
   - Implement GitHub API calls using the GitHubClient
   - Add proper error handling and TypeScript types
   - Handle file operations using Deno's file system APIs

4. **Create CLI Command**
   - Implement command handler using the CLI framework
   - Parse arguments and flags to match shell script behavior
   - Create help text and usage examples
   - Connect to the service implementation

5. **Maintain Compatibility**
   - Create compatibility wrapper scripts if needed
   - Ensure the same environment variables work
   - Match output format for automation compatibility

6. **Test Implementation**
   - Create unit tests for the new functionality
   - Add integration tests if appropriate
   - Manually verify against the original shell script

## Example: Converting Star Cleanup Script

### Original Shell Script

```bash
#!/bin/bash
# cleanup-stars.sh - Remove stars for archived or outdated repos

CUTOFF_MONTHS=${CUTOFF_MONTHS:-24}
DRY_RUN=${DRY_RUN:-false}
TODAY=$(date +%s)
CUTOFF_SECONDS=$((CUTOFF_MONTHS * 30 * 24 * 60 * 60))
CUTOFF_DATE=$((TODAY - CUTOFF_SECONDS))

echo "Starting GitHub stars cleanup..."
echo "Cutoff date: $CUTOFF_MONTHS months of inactivity"

if [ "$DRY_RUN" = "true" ]; then
  echo "DRY RUN: No stars will be removed"
fi

# Get all starred repos
STARS=$(gh api --paginate user/starred)

# Count stars
TOTAL=$(echo "$STARS" | jq '. | length')
REMOVED=0
ARCHIVED=0
OUTDATED=0

# Process each repo
echo "$STARS" | jq -c '.[]' | while read -r repo; do
  FULL_NAME=$(echo "$repo" | jq -r '.full_name')
  IS_ARCHIVED=$(echo "$repo" | jq -r '.archived')
  PUSHED_AT=$(echo "$repo" | jq -r '.pushed_at')
  PUSHED_TIMESTAMP=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$PUSHED_AT" +%s 2>/dev/null || date -d "$PUSHED_AT" +%s)
  
  SHOULD_REMOVE=false
  REASON=""
  
  if [ "$IS_ARCHIVED" = "true" ]; then
    SHOULD_REMOVE=true
    REASON="archived"
    ARCHIVED=$((ARCHIVED + 1))
  elif [ "$PUSHED_TIMESTAMP" -lt "$CUTOFF_DATE" ]; then
    SHOULD_REMOVE=true
    REASON="no activity since $PUSHED_AT"
    OUTDATED=$((OUTDATED + 1))
  fi
  
  if [ "$SHOULD_REMOVE" = "true" ]; then
    if [ "$DRY_RUN" = "true" ]; then
      echo "[DRY RUN] Would unstar: $FULL_NAME ($REASON)"
    else
      echo "Unstarring: $FULL_NAME ($REASON)"
      gh api -X DELETE user/starred/$FULL_NAME
    fi
    REMOVED=$((REMOVED + 1))
  fi
done

# Summary
echo "Cleanup complete!"
echo "Total stars reviewed: $TOTAL"
echo "Stars removed: $REMOVED"
echo "Archived repositories: $ARCHIVED"
echo "Outdated repositories: $OUTDATED"
```

### Deno TypeScript Implementation

```typescript
// src/core/services/star_service.ts (partial)
async cleanupStars(options: {
  cutoffMonths?: number;
  dryRun?: boolean;
  excludeList?: string[];
  verbose?: boolean;
} = {}): Promise<{
  totalReviewed: number;
  removed: number;
  archived: number;
  outdated: number;
}> {
  const { cutoffMonths = 24, dryRun = false, excludeList = [], verbose = false } = options;
  
  const stars = await this.getAllStars();
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - cutoffMonths);
  
  let removed = 0;
  let archived = 0;
  let outdated = 0;
  
  for (const repo of stars) {
    // Skip excluded repositories
    if (excludeList.includes(repo.full_name)) {
      if (verbose) {
        console.log(`Skipping excluded repo: ${repo.full_name}`);
      }
      continue;
    }
    
    let shouldRemove = false;
    let reason = "";
    
    // Check if archived
    if (repo.archived) {
      shouldRemove = true;
      reason = "archived";
      archived++;
    } 
    // Check if outdated
    else if (new Date(repo.pushed_at) < cutoffDate) {
      shouldRemove = true;
      reason = `no activity since ${repo.pushed_at}`;
      outdated++;
    }
    
    if (shouldRemove) {
      console.log(`${dryRun ? "[DRY RUN] Would unstar" : "Unstarring"}: ${repo.full_name} (${reason})`);
      
      if (!dryRun) {
        const [owner, name] = repo.full_name.split("/");
        await this.client.unstarRepo(owner, name);
      }
      
      removed++;
    }
  }
  
  return {
    totalReviewed: stars.length,
    removed,
    archived,
    outdated,
  };
}

// src/cli/commands/cleanup.ts
// See the CLI command implementation in previous sections
```
