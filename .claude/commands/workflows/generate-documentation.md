# Generate Documentation

This workflow guides you through creating or updating documentation for the GitHub Stars Management project.

## Workflow Steps

1. **Identify Documentation Needs**
   - Determine the target audience (users, developers, contributors)
   - Identify what kind of documentation is needed (usage, API, architecture)
   - Check for existing documentation that needs updating
   - Consider the format (markdown, code comments, diagrams)

2. **Structure Documentation**
   - Create a logical organization with sections and subsections
   - Include a table of contents for longer documents
   - Use consistent heading levels
   - Consider SEO-friendly terminology

3. **Draft Content**
   - Start with a clear overview
   - Include installation and setup instructions
   - Document command usage with examples
   - Describe configuration options
   - Add diagrams if helpful for complex concepts

4. **Add Code Examples**
   - Include realistic, tested code examples
   - Use syntax highlighting in markdown
   - Show both basic and advanced usage
   - Cover error handling where appropriate

5. **Review and Refine**
   - Check for technical accuracy
   - Ensure clarity and readability
   - Verify all links work
   - Check formatting for consistency

6. **Integrate Documentation**
   - Add to appropriate location in the project
   - Update references to documentation in other files
   - Consider generating docs from code when appropriate

## Example: CLI Command Documentation

```markdown
# Star Management CLI Reference

## Overview

The Star Management CLI provides tools for managing your GitHub stars, including
backup, categorization, reporting, and cleanup operations.

## Commands

### `cleanup`

Remove stars from archived or outdated repositories.

**Usage:**
```bash
star-management cleanup [options]
```

**Options:**
- `--dry-run`, `-d`: Run without making changes
- `--cutoff-months`, `-c`: Months of inactivity before removal (default: 24)
- `--exclude`, `-e`: Comma-separated list of repos to exclude (owner/name format)
- `--verbose`, `-v`: Show detailed output
- `--help`, `-h`: Show this help message

**Examples:**
```bash
star-management cleanup --dry-run
star-management cleanup --cutoff-months 12
star-management cleanup --exclude owner/repo1,owner/repo2
```

### `backup`

Backup all starred repositories to a file.

**Usage:**
```bash
star-management backup [options]
```

**Options:**
- `--output`, `-o`: Output file path (default: star-backup-YYYY-MM-DD.json)
- `--compress`, `-c`: Compress output file with gzip
- `--format`, `-f`: Output format (json, csv, md) (default: json)
- `--verbose`, `-v`: Show detailed output

**Examples:**
```bash
star-management backup
star-management backup --output stars.json
star-management backup --compress
```
```