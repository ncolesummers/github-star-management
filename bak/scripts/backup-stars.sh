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