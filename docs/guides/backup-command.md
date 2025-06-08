# Backup Command Guide

The `backup` command provides functionality for managing GitHub star backups
using Deno KV, a built-in key-value database in Deno.

## Overview

The backup command lets you:

- Create backups of your starred repositories
- List available backups
- View details of specific backups
- Delete unwanted backups
- Export backups to files for sharing
- Import backups from files

All backup data is stored locally using Deno KV, which provides a persistent
storage solution without requiring external databases.

## Command Usage

### Basic Usage

To see available backup commands:

```bash
deno task start backup
```

### Creating Backups

Create a backup of your starred repositories:

```bash
deno task start backup create
```

With additional options:

```bash
deno task start backup create --description "Important libraries" --tags work,reference,important
```

You can also overwrite your latest backup instead of creating a new one:

```bash
deno task start backup create --overwrite
```

### Listing Backups

View all available backups:

```bash
deno task start backup list
```

For machine-readable output:

```bash
deno task start backup list --json
```

### Viewing Backup Details

View details of a specific backup:

```bash
deno task start backup get --id <backup-id>
```

For example:

```bash
deno task start backup get --id backup-2023-06-15
```

### Deleting Backups

Delete a backup by ID:

```bash
deno task start backup delete --id <backup-id>
```

To skip the confirmation prompt:

```bash
deno task start backup delete --id <backup-id> --force
```

### Exporting Backups

Export a backup to a file:

```bash
deno task start backup export --id <backup-id> --output stars.json
```

### Importing Backups

Import a backup from a file:

```bash
deno task start backup import --input stars.json
```

With additional options:

```bash
deno task start backup import --input stars.json --description "Imported from another system" --tags imported,archived
```

## Backup Storage

Backups are stored locally using Deno KV with the following structure:

```
["backups", "backup-id", "meta"] -> BackupMeta
["backups", "backup-id", "data"] -> Backup
```

Each backup includes:

- Metadata (ID, creation date, description, tags, etc.)
- Complete repository data for all starred repositories

## Backup ID Format

Backup IDs follow the format:

- `backup-YYYY-MM-DD` for backups created with `--overwrite`
- `backup-YYYY-MM-DD-XXXXXX` for new backups (where XXXXXX is a unique
  identifier)
- `backup-YYYY-MM-DD-imported-XXXXXX` for imported backups

## Best Practices

1. **Regular Backups**: Create backups regularly to maintain a history of your
   stars

2. **Descriptive Names**: Use the `--description` option to provide context for
   each backup

3. **Categorization**: Use tags to categorize backups for better organization

4. **External Storage**: Export important backups to files and store them in a
   secure location

5. **Cleanup**: Delete old or unnecessary backups to save space

## Examples

### Daily Backup Script

```bash
#!/bin/bash
# daily-backup.sh

# Create a backup with the current date
deno task start backup create --description "Daily backup $(date +%Y-%m-%d)" --tags daily,automated

# Export the backup to an external file
BACKUP_ID=$(deno task start backup list --json | jq -r '.[0].id')
deno task start backup export --id $BACKUP_ID --output ~/backups/github-stars-$(date +%Y-%m-%d).json
```

### Comparing Stars Between Backups

```bash
# Export two backups to files
deno task start backup export --id backup-2023-01-01 --output stars-jan.json
deno task start backup export --id backup-2023-06-01 --output stars-jun.json

# Use jq to find differences
jq -r '.repositories[].full_name' stars-jan.json > stars-jan-list.txt
jq -r '.repositories[].full_name' stars-jun.json > stars-jun-list.txt

# Find new stars
comm -13 stars-jan-list.txt stars-jun-list.txt > new-stars.txt
# Find removed stars
comm -23 stars-jan-list.txt stars-jun-list.txt > removed-stars.txt
```

## Troubleshooting

### Common Issues

1. **Missing GitHub Token**: Set the `GITHUB_TOKEN` environment variable or use
   the `--token` option

2. **Import Fails**: Check if the import file is a valid JSON backup file

3. **Permission Errors**: Ensure Deno has permission to access the KV store by
   running with `--allow-env --allow-read --allow-write`

### Debugging

For more detailed output, use the `--verbose` flag:

```bash
deno task start backup create --verbose
```
