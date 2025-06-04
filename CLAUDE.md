# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Repository Overview

This repository contains documentation and tools for managing GitHub stars,
implemented in Deno TypeScript. The project provides tools for:

1. Viewing, managing, and organizing GitHub stars
2. Cleaning up outdated or archived starred repositories
3. Creating categorized lists of stars
4. Generating reports and analytics on starred repositories
5. Setting up GitHub Actions for automated star management

## Project Structure

The repository follows a modular architecture:

- `/src` - Contains the Deno TypeScript implementation
  - `/src/cli` - Command-line interface
  - `/src/core` - Core functionality
    - `/src/core/api` - GitHub API client
    - `/src/core/models` - TypeScript interfaces
    - `/src/core/services` - Business logic
  - `/src/utils` - Shared utilities
- `/tests` - Contains unit and integration tests
  - `/tests/unit` - Unit tests for individual components
  - `/tests/integration` - Integration tests for combined functionality
  - `/tests/fixtures` - Mock data for testing
  - `/tests/helpers` - Test utility functions
- `/docs` - Contains detailed documentation
- `/bak` - Contains the original shell script implementation (archived)

Key documentation:

- `README.md` - Project overview and usage instructions
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Community code of conduct
- `/docs/api` - API documentation
- `/docs/guides` - User guides
- `/docs/tutorials` - Tutorials
- `/docs/examples` - Example configurations and scripts

## Commands

### GitHub CLI Installation (Legacy)

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

### Deno Installation (Required for New Implementation)

```bash
# macOS (Homebrew)
brew install deno

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Linux/macOS (Shell)
curl -fsSL https://deno.land/install.sh | sh
```

### CLI Usage

The Deno implementation supports the following commands:

```bash
# Using deno task (recommended)
# View help
deno task start --help

# Clean up stars
deno task start cleanup --dry-run

# Back up stars
deno task start backup --output stars.json

# Categorize stars
deno task start categorize --output-dir star-lists

# Generate reports
deno task start report

# Generate digest
deno task start digest
```

You can also run commands directly with Deno:

```bash
# Direct usage with Deno
deno run --allow-net --allow-env --allow-read --allow-write mod.ts cleanup --dry-run
```

## Key Features

The Deno implementation provides several improvements:

- **TypeScript Support**: Strong typing and better IDE integration
- **Rate Limiting**: Built-in protection against GitHub API rate limits
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Error Handling**: Comprehensive error handling and recovery
- **Efficient Processing**: Modern JavaScript features for better performance
- **Testing Framework**: Integrated testing with mocking support

## GitHub Action Setup

The repository includes (or will include) GitHub Actions for automated star
management:

1. Quarterly cleanup of stars
2. Manual star management tools
3. Report generation
4. Backup and restore capabilities

## Development Workflow

When developing in this repository:

1. Set up the git commit template:
   ```bash
   git config --local commit.template .gitmessage
   ```

2. Use Deno's built-in tools for linting and formatting:
   ```bash
   deno task lint
   deno task fmt
   ```

3. Run tests with:
   ```bash
   deno task test
   ```

4. The repository uses Deno's JSR and npm compatibility for dependencies,
   specified in deno.json.

### Test-Driven Development

This project follows test-driven development (TDD) principles. When implementing
new features:

1. **Write tests first**: Always start by writing tests that define the expected
   behavior.
2. **Use mocks for API calls**: Create mock responses for GitHub API requests.
3. **Test edge cases**: Include tests for error scenarios, empty responses, and
   edge cases.
4. **Run tests frequently**: Use `deno task test` to verify your changes as you
   work.
5. **Maintain high coverage**: Aim for high test coverage, especially for core
   API and service logic.

Example test pattern:

```typescript
// Arrange - Set up test data and mocks
const service = new StarService();
const mockRepo = createMockRepository({/* properties */});

// Act - Call the method being tested
const result = await service.categorizeRepository(mockRepo);

// Assert - Verify the expected outcome
assertEquals(result.length, 1);
assertEquals(result[0].name, "Expected Category");
```

### Conventional Commits

This repository strictly follows the
[Conventional Commits](https://www.conventionalcommits.org/) specification. All
commit messages must follow this format:

```
<type>(<scope>): <short summary>
```

Where:

- `type` is one of: feat, fix, docs, style, refactor, perf, test, build, ci,
  chore, revert
- `scope` is one of: cli, api, models, services, utils, docs, test, deps,
  release, workflow, config
- `summary` is a brief description of the change

Example commit messages:

```
feat(cli): add support for custom output formats
fix(api): handle rate limiting errors properly
docs(README): update installation instructions
```

For more details, see the [Commit Guidelines](CONTRIBUTING.md#commit-guidelines)
section in the CONTRIBUTING.md file.

## Star Management Guidelines

### Star Categorization

When categorizing stars, follow these principles:

1. Use repository topics as primary signals
2. Consider repository description and README content
3. Look at programming languages used
4. Consider owner and organization information
5. Check for related repositories in the same category

Preferred categories should include:

- Development Tools
- Libraries & Frameworks
- Documentation & Learning
- Applications
- Data Science & Analytics
- DevOps & Infrastructure
- Security
- Personal Projects

### Star Cleanup Criteria

When identifying stars for potential removal, consider:

1. Last update time (2+ years with no updates is a candidate)
2. Archived repositories (usually safe to remove)
3. Forks that haven't diverged from originals
4. Repositories that no longer align with your interests
5. Repositories with better alternatives now available

Always back up stars before cleanup operations.

### Report Generation

Star reports should include:

1. Total star count and distribution by category
2. Growth trends over time
3. Language distribution
4. Activity metrics (recently updated vs. stale)
5. Top organizations and developers in your stars
6. Topic clustering and analysis

## GitHub API Guidelines

### Rate Limiting Considerations

GitHub API has strict rate limits:

- 5,000 requests per hour for authenticated requests
- 60 requests per hour for unauthenticated requests

Implementation guidelines:

1. Always check the `x-ratelimit-remaining` header
2. Implement exponential backoff when approaching limits
3. Use the `If-None-Match` header with ETags when possible
4. Cache responses when appropriate
5. Batch operations to minimize API calls

### Pagination Handling

Many GitHub API endpoints return paginated results:

1. Use the Link header to determine if more pages exist
2. Request the maximum items per page (100) to minimize requests
3. Implement automatic pagination handling in API clients
4. Consider parallel requests for faster processing (but be careful with rate
   limits)

## Important Notes

1. GitHub API tokens should never be hardcoded in scripts.
2. Always respect GitHub's rate limits with appropriate rate limiting
   mechanisms.
3. Ensure cross-platform compatibility for all implementation.
4. Tests should include mocks for API responses to avoid hitting real GitHub API
   limits.
5. All commits must follow the conventional commits format.
6. Documentation should be kept up-to-date with code changes.
7. New features should include corresponding tests and documentation.
8. Implement defensive programming with proper error handling.
9. Use TypeScript interfaces for all API responses and parameters.
10. Follow test-driven development practices for all new features.
