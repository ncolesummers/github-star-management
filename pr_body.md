## Summary

- Implemented git hooks for code quality checks as specified in issue #5
- Added pre-commit hook for Deno formatting and linting checks (issue #6)
- Added commit-msg hook for conventional commits validation (issue #7)
- Added pre-push hook to run tests before pushing (issue #8)
- Provided installation and documentation for developers

## Implementation Details

This PR implements the git hooks according to the implementation plan in
docs/guides/git-hooks-implementation-plan.md. The hooks help enforce code
quality and commit standards:

1. **Pre-commit hook**: Verifies formatting and linting of staged TypeScript
   files
2. **Commit-msg hook**: Ensures commit messages follow the conventional commits
   format
3. **Pre-push hook**: Runs tests before pushing to catch issues early

## Documentation

- Added git hooks documentation in scripts/git-hooks/README.md
- Updated project README.md with git hooks information
- Updated CONTRIBUTING.md with installation instructions

## Installation

Developers can install the hooks using:

```bash
deno task hooks:install
```

## Known Issues

During implementation, we discovered type compatibility issues with Deno KV that
have been documented in issue #11. These issues are unrelated to the git hooks
functionality but should be addressed in a future PR.

Closes #5 Closes #6 Closes #7 Closes #8
