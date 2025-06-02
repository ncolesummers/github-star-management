#!/bin/bash

# generate-awesome-list.sh - Create an awesome-list style document

CATEGORY=$1
TITLE=$2
OUTPUT_FILE="awesome-${CATEGORY}.md"

if [ -z "$CATEGORY" ] || [ -z "$TITLE" ]; then
    echo "Usage: ./generate-awesome-list.sh <category> <title>"
    echo "Example: ./generate-awesome-list.sh ai 'AI and Machine Learning'"
    exit 1
fi

cat > "$OUTPUT_FILE" << EOF
# Awesome $TITLE [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> A curated list of $TITLE resources, tools, and libraries

## Contents

- [Libraries & Frameworks](#libraries--frameworks)
- [Tools](#tools)
- [Learning Resources](#learning-resources)
- [Projects & Examples](#projects--examples)

---

EOF

# Categorize by repository characteristics
gh api user/starred --paginate | jq -r --arg cat "$CATEGORY" '
    .[] |
    select(
        (.name | test($cat; "i")) or 
        (.description | test($cat; "i")) or 
        (.topics[]? | test($cat; "i"))
    ) |
    {
        name: .full_name,
        url: .html_url,
        description: .description,
        stars: .stargazers_count,
        language: .language,
        topics: .topics
    }
' | jq -s 'sort_by(.stars) | reverse' | jq -r '
    .[] |
    "- [\(.name)](\(.url)) - \(.description // "No description") ⭐\(.stars)"
' >> "$OUTPUT_FILE"

echo "✅ Generated $OUTPUT_FILE"