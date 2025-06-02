# Automated GitHub Stars Cleanup with GitHub Actions

## Overview

This guide will help you set up a GitHub Action that automatically cleans up your starred repositories quarterly, removing stars from archived or outdated repositories.

## Prerequisites

- A GitHub repository to host the action (can be private)
- A GitHub Personal Access Token with `repo` and `user` scopes

## Step 1: Create a Repository for Your Action

```bash
# Create a new repository for your star management
gh repo create star-manager --private --description "Automated GitHub star management"
cd star-manager
```

## Step 2: Set Up GitHub Secrets

1. Generate a Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with scopes: `repo`, `user`, `read:user`
   - Copy the token

2. Add the token to your repository:
```bash
# Add the token as a secret
gh secret set STAR_MANAGEMENT_TOKEN
# Paste your token when prompted
```

## Step 3: Create the Cleanup Script

Create `scripts/cleanup-stars.sh`:

```bash
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
```

Make it executable:
```bash
chmod +x scripts/cleanup-stars.sh
```

## Step 4: Create the GitHub Action Workflow

Create `.github/workflows/star-cleanup.yml`:

```yaml
name: Quarterly Star Cleanup

on:
  # Run quarterly on the 1st day of Jan, Apr, Jul, Oct at 9 AM UTC
  schedule:
    - cron: '0 9 1 1,4,7,10 *'
  
  # Allow manual trigger
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run (no actual changes)'
        required: false
        default: 'false'
        type: choice
        options:
          - 'true'
          - 'false'
      cutoff_months:
        description: 'Months of inactivity before removal'
        required: false
        default: '24'
        type: string

jobs:
  cleanup-stars:
    runs-on: ubuntu-latest
    name: Clean up old GitHub stars
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Set up environment
        run: |
          echo "GITHUB_TOKEN=${{ secrets.STAR_MANAGEMENT_TOKEN }}" >> $GITHUB_ENV
          echo "DRY_RUN=${{ github.event.inputs.dry_run || 'false' }}" >> $GITHUB_ENV
          echo "CUTOFF_MONTHS=${{ github.event.inputs.cutoff_months || '24' }}" >> $GITHUB_ENV
      
      - name: Run star cleanup
        run: ./scripts/cleanup-stars.sh
      
      - name: Create issue if stars were removed
        if: success() && env.DRY_RUN == 'false'
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const date = new Date().toISOString().split('T')[0];
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Star Cleanup Report - ${date}`,
              body: `## Quarterly Star Cleanup Completed\n\nThe automated star cleanup has run. Check the [workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}) for details.`,
              labels: ['automation', 'star-cleanup']
            });
            console.log(`Created issue #${issue.data.number}`);
```

## Step 5: Create a Manual Trigger Workflow

Create `.github/workflows/star-management.yml` for additional star management tasks:

```yaml
name: Star Management Tools

on:
  workflow_dispatch:
    inputs:
      action:
        description: 'Action to perform'
        required: true
        type: choice
        options:
          - 'cleanup'
          - 'report'
          - 'backup'
          - 'analyze'
      dry_run:
        description: 'Dry run mode'
        required: false
        default: 'true'
        type: choice
        options:
          - 'true'
          - 'false'

jobs:
  star-management:
    runs-on: ubuntu-latest
    name: Star Management - ${{ github.event.inputs.action }}
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install jq
        run: sudo apt-get update && sudo apt-get install -y jq
      
      - name: Run selected action
        env:
          GITHUB_TOKEN: ${{ secrets.STAR_MANAGEMENT_TOKEN }}
          ACTION: ${{ github.event.inputs.action }}
          DRY_RUN: ${{ github.event.inputs.dry_run }}
        run: |
          case "$ACTION" in
            cleanup)
              ./scripts/cleanup-stars.sh
              ;;
            report)
              ./scripts/generate-report.sh
              ;;
            backup)
              ./scripts/backup-stars.sh
              ;;
            analyze)
              ./scripts/analyze-stars.sh
              ;;
          esac
```

## Step 6: Additional Scripts

### Create `scripts/generate-report.sh`:

```bash
#!/bin/bash

# generate-report.sh - Generate a comprehensive star report

set -e

GITHUB_TOKEN=${GITHUB_TOKEN:-$STAR_MANAGEMENT_TOKEN}
OUTPUT_FILE="star-report-$(date +%Y-%m-%d).md"

echo "# GitHub Stars Report - $(date +%Y-%m-%d)" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to make authenticated API calls
api_call() {
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         "$@"
}

# Get all stars
ALL_STARS=$(api_call "https://api.github.com/user/starred?per_page=100" | jq -s 'add')

# Calculate statistics
TOTAL=$(echo "$ALL_STARS" | jq '. | length')
ARCHIVED=$(echo "$ALL_STARS" | jq '[.[] | select(.archived == true)] | length')

echo "## Summary Statistics" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "- Total stars: $TOTAL" >> "$OUTPUT_FILE"
echo "- Archived repositories: $ARCHIVED" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Language breakdown
echo "## Language Distribution" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "$ALL_STARS" | jq -r '
  [.[] | .language // "Unknown"] | 
  group_by(.) | 
  map({language: .[0], count: length}) | 
  sort_by(.count) | 
  reverse | 
  .[] | 
  "- \(.language): \(.count)"
' >> "$OUTPUT_FILE"

# Activity analysis
echo "" >> "$OUTPUT_FILE"
echo "## Activity Analysis" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Calculate date ranges
CURRENT_YEAR=$(date +%Y)
LAST_YEAR=$((CURRENT_YEAR - 1))
TWO_YEARS_AGO=$((CURRENT_YEAR - 2))

UPDATED_THIS_YEAR=$(echo "$ALL_STARS" | jq --arg year "$CURRENT_YEAR" '
  [.[] | select(.pushed_at | startswith($year))] | length
')
UPDATED_LAST_YEAR=$(echo "$ALL_STARS" | jq --arg year "$LAST_YEAR" '
  [.[] | select(.pushed_at | startswith($year))] | length
')
OLDER=$(echo "$ALL_STARS" | jq --arg year "$TWO_YEARS_AGO" '
  [.[] | select(.pushed_at < ($year + "-01-01"))] | length
')

echo "- Updated this year: $UPDATED_THIS_YEAR" >> "$OUTPUT_FILE"
echo "- Updated last year: $UPDATED_LAST_YEAR" >> "$OUTPUT_FILE"
echo "- Not updated in 2+ years: $OLDER" >> "$OUTPUT_FILE"

# Upload as artifact
echo "Report generated: $OUTPUT_FILE"

# GitHub Action summary
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
    cat "$OUTPUT_FILE" >> $GITHUB_STEP_SUMMARY
fi
```

### Create `scripts/backup-stars.sh`:

```bash
#!/bin/bash

# backup-stars.sh - Backup all starred repositories

set -e

GITHUB_TOKEN=${GITHUB_TOKEN:-$STAR_MANAGEMENT_TOKEN}
BACKUP_FILE="star-backup-$(date +%Y-%m-%d).json"

echo "📦 Backing up GitHub stars..."

# Function to make authenticated API calls
api_call() {
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         "$@"
}

# Get all stars with pagination
page=1
echo "[" > "$BACKUP_FILE"
first=true

while true; do
    response=$(api_call "https://api.github.com/user/starred?page=$page&per_page=100")
    
    if [ "$(echo "$response" | jq '. | length')" -eq 0 ]; then
        break
    fi
    
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> "$BACKUP_FILE"
    fi
    
    echo "$response" | jq -c '.[]' | sed '$ ! s/$/,/' >> "$BACKUP_FILE"
    
    ((page++))
done

echo "]" >> "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

echo "✅ Backup completed: ${BACKUP_FILE}.gz"

# Create restore script
cat > "restore-stars.sh" << 'EOF'
#!/bin/bash
# restore-stars.sh - Restore stars from backup

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-stars.sh <backup-file.json.gz>"
    exit 1
fi

echo "Restoring stars from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | jq -r '.[].full_name' | while read -r repo; do
    echo "Starring: $repo"
    gh api -X PUT "/user/starred/$repo"
    sleep 0.5  # Rate limiting
done
echo "✅ Restore completed"
EOF

chmod +x restore-stars.sh
```

## Step 7: Set Up Notifications

Create `.github/workflows/notify-cleanup.yml`:

```yaml
name: Notify on Cleanup

on:
  workflow_run:
    workflows: ["Quarterly Star Cleanup"]
    types:
      - completed

jobs:
  notify:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - name: Send notification
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            // Create a notification issue
            const { data: runs } = await github.rest.actions.listWorkflowRuns({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'star-cleanup.yml',
              per_page: 1
            });
            
            if (runs.workflow_runs.length > 0) {
              const run = runs.workflow_runs[0];
              
              // Get the summary from the run
              const { data: jobs } = await github.rest.actions.listJobsForWorkflowRun({
                owner: context.repo.owner,
                repo: context.repo.repo,
                run_id: run.id
              });
              
              // You can also send a notification to Slack, Discord, etc.
              console.log(`Star cleanup completed at ${run.created_at}`);
            }
```

## Step 8: Local Testing

Create `scripts/test-locally.sh`:

```bash
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
```

## Step 9: Commit and Push

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Star management automation"

# Push to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/star-manager.git
git push -u origin main
```

## Usage

### Manual Trigger
1. Go to your repository on GitHub
2. Click "Actions" tab
3. Select "Quarterly Star Cleanup" or "Star Management Tools"
4. Click "Run workflow"
5. Choose options (dry run, cutoff months)
6. Click "Run workflow"

### Monitor Automated Runs
- Check the Actions tab for scheduled runs
- Review issues created after each cleanup
- Check workflow summaries for detailed reports

### Customization Options

1. **Change Schedule**: Edit the cron expression in `.github/workflows/star-cleanup.yml`
   - Monthly: `0 9 1 * *`
   - Bi-monthly: `0 9 1 */2 *`
   - Weekly: `0 9 * * 1`

2. **Adjust Cutoff Period**: Change `CUTOFF_MONTHS` default value

3. **Add Exclusions**: Modify `cleanup-stars.sh` to skip certain repositories:
   ```bash
   # Add to cleanup-stars.sh
   EXCLUDE_REPOS=("owner/repo1" "owner/repo2")
   
   # In the main loop
   if [[ " ${EXCLUDE_REPOS[@]} " =~ " ${full_name} " ]]; then
       echo "Skipping excluded repo: $full_name"
       continue
   fi
   ```

## Security Best Practices

1. **Token Permissions**: Use minimum required scopes
2. **Private Repository**: Keep your star management repo private
3. **Token Rotation**: Rotate your PAT periodically
4. **Audit Logs**: Review GitHub Action logs regularly

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify token has correct scopes
   - Check token hasn't expired
   - Ensure secret name matches in workflow

2. **Rate Limiting**
   - Add delays between API calls
   - Use conditional requests
   - Check rate limit status

3. **Workflow Not Running**
   - Verify cron syntax
   - Check workflow is enabled
   - Review GitHub Actions usage limits

### Debug Mode

Add to your workflow for debugging:
```yaml
- name: Debug Information
  run: |
    echo "GitHub Actor: ${{ github.actor }}"
    echo "GitHub Repo: ${{ github.repository }}"
    echo "Event Name: ${{ github.event_name }}"
  env:
    ACTIONS_STEP_DEBUG: true
```

## Conclusion

You now have a fully automated system for managing your GitHub stars with:
- Quarterly automated cleanup
- Manual management tools
- Comprehensive reporting
- Backup and restore capabilities
- Customizable rules and schedules

The system will help maintain a curated, relevant list of starred repositories that truly reflects your interests and professional focus.