# Git Hooks for GitHub Star Management

This directory contains git hooks that help enforce code quality and commit
standards for the GitHub Star Management project.

## Available Hooks

- **pre-commit**: Runs before creating a commit
  - Checks formatting of staged TypeScript files using `deno fmt --check`
  - Lints staged TypeScript files using `deno lint`
  - Scans for accidental API tokens/secrets in staged files
  - Prevents debug statements (`console.log`, `debugger`) in staged files

- **commit-msg**: Validates commit messages
  - Enforces [Conventional Commits](https://www.conventionalcommits.org/) format
  - Verifies commit type is one of: feat, fix, docs, style, refactor, perf,
    test, build, ci, chore, revert
  - Verifies scope (if provided) is one of: cli, api, models, services, utils,
    docs, test, deps, release, workflow, config
  - Ensures commit messages are properly formatted

- **pre-push**: Runs before pushing to a remote repository
  - Runs the full test suite to ensure all tests pass
  - Verifies documentation is updated for changed files (requires docs/ or README.md to be staged if code changes are present)

- **post-checkout**: Runs after checking out a branch
  - Detects if `deno.lock` has changed and notifies the developer to update dependencies if needed

- **post-merge**: Runs after merging a branch
  - Notifies developers about dependency changes if `deno.lock` was updated

## Installation

### Automatic Installation

```bash
# Install hooks
deno task hooks:install

# Uninstall hooks
deno task hooks:uninstall
```

### Manual Installation

```bash
# Install hooks
deno run --allow-run --allow-read --allow-write scripts/git-hooks/install.ts

# Uninstall hooks
deno run --allow-run --allow-read --allow-write scripts/git-hooks/uninstall.ts
```

## Bypassing Hooks

In emergency situations, you can bypass git hooks using the `--no-verify` flag:

```bash
# Bypass pre-commit and commit-msg hooks
git commit --no-verify -m "..."

# Bypass pre-push hook
git push --no-verify
```

**Note**: Bypassing hooks should be done only in exceptional circumstances. The
hooks are in place to maintain code quality and project standards.

## Hook Implementation Details

The hooks are implemented as Deno TypeScript scripts:

- `/hooks`: Contains the actual hook implementations
- `/utils`: Contains shared utility functions used by hooks

## Troubleshooting

### Permission Issues

If you encounter permission issues with the hooks, make sure they are
executable:

```bash
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg
chmod +x .git/hooks/pre-push
```

### Deno Errors

If you see Deno-related errors when the hooks run:

1. Ensure Deno is installed and in your PATH
2. Try reinstalling the hooks with `deno task hooks:install`
3. Check for any TypeScript errors in the hook scripts
