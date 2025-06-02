# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains documentation and scripts for managing GitHub stars using the GitHub CLI (`gh`). It includes guides and automation scripts for:

1. Viewing, managing, and organizing GitHub stars
2. Cleaning up outdated or archived starred repositories
3. Creating categorized lists of stars
4. Setting up GitHub Actions for automated star management

## Commands

### GitHub CLI Installation

```bash
# macOS
brew install gh

# Windows
winget install --id GitHub.cli

# Linux (Debian/Ubuntu)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### GitHub CLI Authentication

```bash
gh auth login
```

### GitHub CLI Extensions

```bash
# Star management extension
gh extension install mislav/gh-starred

# Repository analytics
gh extension install dlvhdr/gh-dash
```

### Star Management Scripts

These scripts are referenced in the guides but need to be created locally or in a repository:

```bash
# Run cleanup script
./cleanup-stars.sh

# Generate categorized star lists
./categorize-stars.sh

# Generate awesome-list style document
./generate-awesome-list.sh <category> <title>

# Generate star digest
./star-digest.sh

# Generate weekly star report
./star-report.sh
```

## Key Files

1. `gh-stars-guide.md` - Main guide for GitHub stars management with the GitHub CLI
2. `github-action-star-cleanup.md` - Guide for setting up GitHub Actions for automated star cleanup

## Repository Structure

The repository primarily contains markdown documentation files. The actual script files mentioned in the guides need to be created by the user. The guides include the script content that can be copied and used.

## Scripts Explained

1. `cleanup-stars.sh` - Removes stars from archived repos or those not updated in a long time
2. `categorize-stars.sh` - Organizes stars into topical lists based on predefined categories
3. `generate-awesome-list.sh` - Creates a shareable awesome-list style document for a specific category
4. `star-digest.sh` - Generates a digest of trending repositories in your interest areas
5. `star-report.sh` - Creates a weekly report of your GitHub stars
6. `scripts/cleanup-stars.sh` - Enhanced version for GitHub Actions
7. `scripts/generate-report.sh` - Comprehensive star report generator
8. `scripts/backup-stars.sh` - Backs up all starred repositories
9. `scripts/test-locally.sh` - Tests the cleanup script locally

## GitHub Action Setup

The repository includes guides for setting up GitHub Actions for automated star management, including:

1. Quarterly cleanup of stars
2. Manual star management tools
3. Report generation
4. Backup and restore capabilities