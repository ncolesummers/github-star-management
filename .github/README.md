# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating various aspects
of the GitHub Stars Management project.

## Available Workflows

### 1. Deno CI (`deno-ci.yml`)

Runs on pushes to main branch and pull requests:

- Verifies code formatting
- Runs linter
- Executes tests

### 2. Star Cleanup (`star-cleanup.yml`)

Automates the cleanup of old GitHub stars:

- Runs quarterly (Jan, Apr, Jul, Oct)
- Supports manual triggering with options
- Creates cleanup reports
- Notifies via issues when cleanup completes

### 3. Star Management (`star-management.yml`)

Provides manual operations for star management:

- Supports multiple actions: cleanup, report, backup, categorize, digest
- Creates artifacts with operation results
- Notifies via issues for operation completion

### 4. Token Rotation (`token-rotation.yml`)

Security reminder for GitHub token rotation:

- Runs monthly as a reminder
- Creates issues with detailed instructions
- Supports manual triggering

## Setup Requirements

1. Create a GitHub personal access token with the following permissions:
   - `repo` (to access repositories)
   - `user:read` (to read star information)

2. Add the token as a repository secret:
   - Name: `STAR_MANAGEMENT_TOKEN`
   - Value: Your GitHub personal access token

## Security Practices

- Tokens are stored as GitHub Secrets
- Workflows use the principle of least privilege
- Token rotation is enforced through regular reminders
- CODEOWNERS file ensures workflow changes require approval

## Customizing Workflows

To modify these workflows:

1. Fork this repository
2. Edit the workflow YAML files
3. Test your changes using the "workflow_dispatch" trigger
4. Create a pull request with your improvements
