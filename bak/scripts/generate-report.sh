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