# GitHub Star Management

A modern CLI tool for managing your GitHub stars, written in Deno TypeScript.

## Features

- 🧹 **Star Cleanup**: Remove stars from archived or outdated repositories
- 💾 **Star Backup & Restore**: Export and import your stars
- 📚 **Star Categorization**: Generate topical lists of your starred
  repositories
- 📊 **Star Reporting**: Generate statistics and insights about your starred
  repositories
- 📰 **Star Digest**: Create digests of trending repositories in your areas of
  interest
- ⚡️ **Rate Limiting**: Built-in protection against GitHub API rate limits
- 🔄 **Cross-Platform**: Works on macOS, Windows, and Linux

## Installation

### Prerequisites

- [Deno](https://deno.land/) v1.28 or higher
- A GitHub Personal Access Token with `repo` and `user` scopes

### Install Deno

```bash
# macOS (Homebrew)
brew install deno

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Linux/macOS (Shell)
curl -fsSL https://deno.land/install.sh | sh
```

### Install GitHub Star Management

```bash
# From source
git clone https://github.com/yourusername/github-star-management.git
cd github-star-management

# Run directly
deno task start
```

## Quick Start

Set your GitHub token:

```bash
# Set environment variable
export GITHUB_TOKEN=your_github_token
```

Or create a config file:

```bash
# Create .star-management.json in your home directory or project directory
echo '{
  "token": "your_github_token"
}' > ~/.star-management.json
```

## Usage

```bash
# Show help
deno run --allow-net --allow-env --allow-read --allow-write mod.ts --help

# Clean up stars
deno run --allow-net --allow-env --allow-read --allow-write mod.ts cleanup --dry-run

# Back up stars
deno run --allow-net --allow-env --allow-read --allow-write mod.ts backup --output stars.json

# Categorize stars
deno run --allow-net --allow-env --allow-read --allow-write mod.ts categorize --output-dir star-lists

# Generate reports
deno run --allow-net --allow-env --allow-read --allow-write mod.ts report

# Generate digest
deno run --allow-net --allow-env --allow-read --allow-write mod.ts digest
```

### Using Tasks

```bash
# Clean up stars
deno task start cleanup --dry-run

# Back up stars
deno task start backup
```

## Command Reference

### `cleanup`

Remove stars from archived or outdated repositories.

```bash
deno task start cleanup [options]

Options:
  --dry-run, -d          Run without making changes
  --cutoff-months, -c    Months of inactivity before removal (default: 24)
  --exclude, -e          Comma-separated list of repos to exclude (owner/name format)
  --verbose, -v          Show detailed output
```

### `backup`

Backup all starred repositories to a file.

```bash
deno task start backup [options]

Options:
  --output, -o           Output file path (default: star-backup-YYYY-MM-DD.json)
  --compress, -c         Compress output with gzip
  --verbose, -v          Show detailed output
```

### `restore`

Restore stars from a backup file.

```bash
deno task start restore --input <file> [options]

Options:
  --input, -i            Input backup file path (required)
  --dry-run, -d          Preview restoration without making changes
  --delay, -l            Milliseconds to wait between operations (default: 500)
  --verbose, -v          Show detailed output
```

### `categorize`

Categorize stars into topical lists.

```bash
deno task start categorize [options]

Options:
  --output-dir, -o       Output directory (default: star-lists)
  --config, -c           Path to category configuration file
  --verbose, -v          Show detailed output
```

### `report`

Generate a star report with statistics.

```bash
deno task start report [options]

Options:
  --output, -o           Output file path (default: star-report-YYYY-MM-DD.md)
  --verbose, -v          Show detailed output
```

### `digest`

Generate a digest of trending repositories.

```bash
deno task start digest [options]

Options:
  --interests, -i        Comma-separated list of interests
  --output, -o           Output file path (default: star-digest-YYYY-MM-DD.md)
  --limit, -l            Number of repos per interest (default: 5)
  --verbose, -v          Show detailed output
```

## Configuration

Create a `.star-management.json` file in your home directory or project
directory:

```json
{
  "token": "your_github_token",
  "rateLimit": 10,
  "categories": [
    {
      "name": "ai",
      "pattern": "ai|machine-learning|ml",
      "displayName": "AI & Machine Learning"
    },
    {
      "name": "typescript",
      "pattern": "typescript|ts|deno",
      "displayName": "TypeScript"
    }
  ],
  "interests": ["typescript", "python", "golang", "ai", "devops"],
  "cleanup": {
    "cutoffMonths": 24,
    "excludeList": ["important/repo1", "important/repo2"]
  }
}
```

## GitHub Actions Integration

You can automate star management with GitHub Actions. See the workflows in
`.github/workflows/` for examples.

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/github-star-management.git
cd github-star-management

# Install dependencies
# (None required! Deno handles dependencies for you)

# Set up the commit message template
git config --local commit.template .gitmessage

# Run tests
deno task test

# Run linter
deno task lint

# Format code
deno task fmt
```

### Testing

This project uses Deno's built-in testing framework with a comprehensive test
suite:

```bash
# Run unit tests
deno test --allow-env tests/unit/

# Run integration tests (requires GitHub token)
export GITHUB_TOKEN=your_test_token
RUN_INTEGRATION_TESTS=true deno test --allow-env --allow-net --allow-read --allow-write tests/integration/
```

The test suite includes:

- **Unit tests**: Tests individual components in isolation using mocks
- **Integration tests**: Tests real API interactions (disabled by default)
- **Mock helpers**: Tools for simulating API responses and CLI outputs
- **Test fixtures**: Consistent test data for all test scenarios

For more details, see the [testing documentation](tests/README.md).

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) for all
commit messages. This helps us maintain a clear project history and automate
versioning and changelog generation.

Example of a commit message:

```
feat(cli): add support for custom output formats
```

See our [Contributing Guide](CONTRIBUTING.md#commit-guidelines) for detailed
information on commit message format.

## License

MIT

## Acknowledgements

This project started as a collection of shell scripts and has been migrated to
Deno TypeScript for improved performance, type safety, and cross-platform
compatibility.
