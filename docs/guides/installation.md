# Installation Guide

This guide will walk you through the process of installing GitHub Star
Management on your system.

## Prerequisites

Before installing GitHub Star Management, make sure you have the following:

- [Deno](https://deno.land/) v1.28 or higher
- A GitHub account
- A GitHub Personal Access Token with appropriate scopes

## Installing Deno

Deno is the JavaScript/TypeScript runtime used by GitHub Star Management. If you
don't have Deno installed, you can install it using one of the following
methods:

### macOS (using Homebrew)

```bash
brew install deno
```

### Windows (using PowerShell)

```powershell
irm https://deno.land/install.ps1 | iex
```

### Linux/macOS (using Shell)

```bash
curl -fsSL https://deno.land/install.sh | sh
```

After installation, verify that Deno is correctly installed:

```bash
deno --version
```

You should see output showing the Deno version, V8 version, and TypeScript
version.

## Getting GitHub Star Management

You can install GitHub Star Management in one of two ways:

### Method 1: Clone the Repository

This is the recommended method if you want to use the latest development version
or contribute to the project:

```bash
# Clone the repository
git clone https://github.com/yourusername/github-star-management.git

# Navigate to the project directory
cd github-star-management
```

### Method 2: Install from URL

You can also install GitHub Star Management directly from the URL:

```bash
deno install --allow-net --allow-env --allow-read --allow-write -n star-management \
  https://raw.githubusercontent.com/yourusername/github-star-management/main/mod.ts
```

This will install the `star-management` command globally.

## Creating a GitHub Token

To use GitHub Star Management, you need a personal access token with the
following scopes:

- `repo` (for accessing repository information)
- `user` (for accessing your starred repositories)

Follow these steps to create a token:

1. Go to your GitHub Settings:
   [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token"
3. Give your token a descriptive name (e.g., "GitHub Star Management")
4. Select the `repo` and `user` scopes
5. Click "Generate token"
6. Copy the generated token immediately (you won't be able to see it again!)

## Configuration

There are several ways to provide your GitHub token to GitHub Star Management:

### Environment Variable

```bash
# Set the token as an environment variable
export GITHUB_TOKEN=your_github_token
```

### Configuration File

Create a `.star-management.json` file in your home directory or project
directory:

```json
{
  "token": "your_github_token",
  "rateLimit": 10
}
```

## Verifying Installation

To verify that GitHub Star Management is correctly installed and configured:

```bash
# If installed from repository
cd github-star-management
deno task start --help

# If installed globally
star-management --help
```

You should see the help output listing all available commands.

## Next Steps

Now that you have GitHub Star Management installed, check out:

- [Basic Usage](basic-usage.md) for common commands
- [Authentication](authentication.md) for more details on GitHub token usage
- [Configuration](configuration.md) for customizing GitHub Star Management

## Troubleshooting

If you encounter issues during installation:

- Make sure Deno is installed correctly: `deno --version`
- Check that your GitHub token has the correct permissions
- Verify that the environment variable is set correctly: `echo $GITHUB_TOKEN`
- Check the [Common Issues](common-issues.md) guide for solutions to common
  problems
