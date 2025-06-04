# Contributing to GitHub Star Management

Thank you for your interest in contributing to GitHub Star Management! This
document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Contribution Workflow](#contribution-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to
uphold this code. Please report unacceptable behavior to the project
maintainers.

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) v1.28 or higher
- A GitHub account
- A GitHub Personal Access Token (for testing)

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/github-star-management.git
   cd github-star-management
   ```
3. Set up the upstream remote:
   ```bash
   git remote add upstream https://github.com/original-owner/github-star-management.git
   ```
4. Make sure everything works:
   ```bash
   deno task test
   ```

## Development Environment

We use Deno as our runtime, which has built-in TypeScript support, testing,
formatting, and linting.

To run the various tasks:

```bash
# Run the application
deno task start

# Development mode with auto-reload
deno task dev

# Run tests
deno task test

# Format code
deno task fmt

# Lint code
deno task lint
```

## Project Structure

The project follows a modular architecture:

```
github-star-management/
├── deno.json           # Deno configuration
├── mod.ts              # Main module entry point
├── src/
│   ├── cli/            # Command-line interface 
│   ├── core/           # Core functionality
│   │   ├── api/        # GitHub API client
│   │   ├── models/     # TypeScript interfaces
│   │   └── services/   # Business logic
│   └── utils/          # Shared utilities
├── tests/              # Test files
└── docs/               # Documentation
```

## Contribution Workflow

1. Ensure you have an issue to work on. If not, create one to discuss your idea.
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/issue-you-are-fixing
   ```
3. Make your changes following our code style guidelines
4. Add tests for your changes
5. Run the test suite to make sure everything works:
   ```bash
   deno task test
   ```
6. Update documentation if necessary
7. Commit your changes (see Commit Guidelines below)
8. Push your branch to your fork:
   ```bash
   git push origin your-branch-name
   ```
9. Create a Pull Request from your fork to the main repository

## Commit Guidelines

We strictly follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification for
commit messages. This enables automatic versioning, changelog generation, and
helps organize the project history.

### Commit Message Format

Each commit message consists of a **header**, an optional **body**, and an
optional **footer**:

```
<type>(<scope>): <short summary>

<body>

<footer>
```

#### Type

The type must be one of the following:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space,
  formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

#### Scope

The scope should specify the part of the codebase affected by the changes.
Examples:

- `cli`
- `api`
- `models`
- `services`
- `utils`
- `docs`
- `test`

Scopes should be lowercase and use hyphens for multi-word scopes (e.g.,
`rate-limit`).

#### Summary

The summary (or description) is a brief description of the change:

- Use imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No period (.) at the end
- Keep it concise and to the point (less than 70 characters)

#### Body

The body should include the motivation for the change and contrast this with
previous behavior:

- Use imperative, present tense
- Include detailed descriptions of what changed and why
- Can use multiple paragraphs
- Bullet points are acceptable (use hyphen or asterisk)

#### Footer

The footer should contain information about Breaking Changes and reference
GitHub issues that this commit closes or is related to:

- Breaking changes should start with `BREAKING CHANGE:`
- Reference issues at the bottom with `Fixes #123` or `Closes #123`
- For multiple issues, use one line per issue reference

### Examples

#### Simple Feature

```
feat(cli): add --verbose flag to backup command
```

#### Bug Fix With Issue Reference

```
fix(api): handle rate limit errors correctly

When a rate limit error occurs, the API now waits until the 
rate limit resets instead of failing immediately.

Closes #123
```

#### Breaking Change

```
feat(services): refactor star service interface

BREAKING CHANGE: The StarService.cleanup method now requires 
a config object parameter instead of individual arguments.
```

#### Documentation Update

```
docs(README): update installation instructions for Windows
```

#### Multiple Scopes

If a change affects multiple scopes, you can use comma-separated scopes:

```
feat(api,services): implement new rate limiting strategy
```

### Commit Tools

We recommend using the following tools to help with conventional commits:

- [commitlint](https://github.com/conventional-changelog/commitlint): Validates
  commit messages
- [commitizen](https://github.com/commitizen/cz-cli): Interactive CLI for
  creating conventional commits

#### Setting Up the Commit Template

We provide a git commit template to help you write conventional commits. To use
it:

```bash
# Set up the commit template
git config --local commit.template .gitmessage

# Now when you run git commit without -m, the template will be shown in your editor
git commit
```

#### Installing commitlint (Optional)

To validate your commits locally before pushing:

```bash
# Install commitlint CLI and conventional config
npm install -g @commitlint/cli @commitlint/config-conventional

# Test a commit message
echo "feat(cli): add new feature" | commitlint

# You can also validate the most recent commit
git log -1 --pretty=format:"%s" | commitlint
```

### Working with Commit History

- Keep commits atomic and focused on a single responsibility
- Don't mix unrelated changes in the same commit
- Squash multiple commits if they are related to the same logical change
- Use rebase to keep your branch up to date with main

### Enforcing Conventional Commits

This project enforces conventional commits through:

1. A pre-commit hook that validates commit messages
2. CI checks that verify all commits in a PR follow the convention
3. PR validation that checks commit message format

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the
   layer when doing a build.
2. Update the README.md or documentation with details of changes to the
   interface.
3. The pull request will be merged once you have the sign-off of at least one
   maintainer.

### Pull Request Checklist

Before submitting your pull request, make sure to:

- [ ] Update your branch with the latest changes from main
- [ ] Run the test suite and ensure all tests pass
- [ ] Ensure your code follows our style guidelines
- [ ] Update documentation if necessary
- [ ] Include relevant tests for your changes

## Testing

We use Deno's built-in testing framework. Tests should be placed in the `tests/`
directory.

### Unit Tests

Unit tests should be placed in `tests/unit/` and should test individual
components in isolation.

### Integration Tests

Integration tests should be placed in `tests/integration/` and should test how
components work together.

To run tests:

```bash
# Run all tests
deno task test

# Run specific test file
deno test tests/unit/specific_test.ts
```

## Documentation

Documentation is a critical part of this project. Please help us improve it!

- Code should be well-commented using JSDoc syntax
- Any new features should include updates to relevant documentation
- Public APIs should be thoroughly documented

## Release Process

Our release process follows these steps:

1. Version bumps follow [Semantic Versioning](https://semver.org/)
2. Release branches are created from `main` as `release/vX.Y.Z`
3. After testing, releases are tagged and published

## Community

Join our community! Here are some ways to get involved beyond code
contributions:

- Help users by answering questions
- Improve documentation
- Report bugs or suggest features
- Share your experience using the tool

## Questions?

If you have any questions or need help, you can:

- Open an issue with your question
- Reach out to the maintainers directly

Thank you for contributing to GitHub Star Management!
