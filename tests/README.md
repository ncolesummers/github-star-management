# Testing for GitHub Stars Management

This directory contains tests for the GitHub Stars Management project. The testing framework uses Deno's built-in testing capabilities and follows the testing philosophy outlined in `docs/testing.md`.

## Directory Structure

```
tests/
├── fixtures/           # Test data fixtures
│   └── repositories.ts # Mock repository data
├── helpers/            # Test helper utilities
│   ├── mock_fetch.ts   # Mock implementation of fetch API
│   ├── string_writer.ts# Writer implementation for capturing output
│   └── temp_file.ts    # Temporary file/directory helpers
├── integration/        # Integration tests
│   ├── api/            # API integration tests
│   └── cli/            # CLI integration tests
├── mocks/              # Mock implementations
│   └── github/         # GitHub API mocks
│       └── client.ts   # Mock GitHub client
└── unit/               # Unit tests
    ├── api/            # API client tests
    ├── services/       # Business logic tests
    └── utils/          # Utility function tests
```

## Running Tests

### Unit Tests

Unit tests can be run with:

```bash
deno test --allow-env tests/unit/
```

These tests use mocks and don't make actual network requests, so they don't require network permissions.

### Integration Tests

Integration tests require a GitHub token and make actual API requests. They are disabled by default and only run when explicitly enabled:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_token

# Run integration tests
RUN_INTEGRATION_TESTS=true deno test --allow-env --allow-net --allow-read --allow-write tests/integration/
```

**Important:** Integration tests will make real API calls and may modify your GitHub starred repositories. Use a test account if possible.

## Test Helpers

### MockFetch

`MockFetch` provides a way to mock the `fetch` API for testing HTTP requests:

```typescript
import { MockFetch } from "../helpers/mock_fetch.ts";

// Create a mock fetch instance
const mockFetch = new MockFetch();

// Mock a successful response
mockFetch.mock("https://api.github.com/user", {
  status: 200,
  body: { login: "testuser" }
});

// Mock a sequence of responses (for testing retry logic)
mockFetch.mockSequence("https://api.github.com/rate_limit", [
  { status: 403, headers: { "x-ratelimit-remaining": "0" } },
  { status: 200, body: { resources: { core: { remaining: 60 } } } }
]);

// Use the mock in tests
const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch.fetch;

// Test code here...

// Restore original fetch
globalThis.fetch = originalFetch;
```

### StringWriter

`StringWriter` helps capture output for testing CLI commands:

```typescript
import { StringWriter } from "../helpers/string_writer.ts";

// Create string writers for stdout and stderr
const stdout = new StringWriter();
const stderr = new StringWriter();

// Use them in your command
await someCommand({ stdout, stderr });

// Check the output
assertEquals(stdout.toString(), "Expected output");
```

### Temporary Files

The `temp_file.ts` helper provides utilities for creating and cleaning up temporary files during tests:

```typescript
import { withTempFile, withTempDir } from "../helpers/temp_file.ts";

// Use a temporary file that will be automatically cleaned up
await withTempFile(async (filePath) => {
  // Use the file path in your test
  await Deno.writeTextFile(filePath, "test data");
  
  // File will be deleted after this function completes
});

// Similarly for directories
await withTempDir(async (dirPath) => {
  // Use the directory in your test
});
```

## Mock GitHub Client

For testing services without making real API calls, use the `MockGitHubClient`:

```typescript
import { MockGitHubClient } from "../mocks/github/client.ts";
import { mockRepos } from "../fixtures/repositories.ts";

// Create a mock client
const mockClient = new MockGitHubClient();

// Set up mock responses
mockClient.addMockResponse("getStarredRepos", mockRepos.slice(0, 2));
mockClient.addMockResponse("isRepoStarred", true);

// Use the mock client in your service
const service = new StarService({ client: mockClient });
await service.doSomething();

// Verify calls
assertEquals(mockClient.getCallCount("getStarredRepos"), 1);
assertEquals(mockClient.getCallArgs("unstarRepo", 0), ["owner", "repo"]);
```

## Fixtures

Test fixtures provide consistent test data:

```typescript
import { mockRepos, errorResponses, createPaginatedRepos } from "../fixtures/repositories.ts";

// Use mock repositories
const testRepo = mockRepos[0];

// Use error responses
const notFoundError = errorResponses.notFound;

// Create paginated responses for testing
const pages = createPaginatedRepos(100, 30); // 100 repos, 30 per page
```

## Best Practices

1. **Independence**: Each test should be independent and not rely on the state from other tests.
2. **Mocking**: Always mock external services in unit tests.
3. **Cleanup**: Use the `finally` block to clean up resources and restore global state.
4. **Assertions**: Make specific assertions that verify the expected behavior.
5. **Coverage**: Aim to test both success and error paths.
6. **Descriptive Names**: Use descriptive test names that explain what is being tested.
7. **Isolation**: Keep integration tests separate from unit tests.
8. **Documentation**: Document special setup or teardown requirements for tests.

## GitHub Actions

A GitHub Actions workflow is included in `.github/workflows/test.yml` to automatically run tests on pull requests and pushes to the main branch. The workflow runs:

1. Linting and formatting checks
2. Type checking
3. Unit tests on all platforms
4. Integration tests on Ubuntu (for main branch commits only)
5. Code coverage reporting