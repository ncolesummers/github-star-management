# Implement Tests

This workflow guides you through implementing tests for the GitHub Stars
Management project using Deno's built-in testing framework.

## Workflow Steps

1. **Plan Test Categories**
   - Determine if unit tests, integration tests, or both are needed
   - Identify components to be tested
   - Determine mocking requirements
   - Consider test fixtures needed

2. **Create Test Fixtures**
   - Create mock data in `tests/fixtures/`
   - Ensure fixtures match real API responses
   - Add type information to fixtures
   - Consider creating fixture generators for complex data

3. **Implement Mock Helpers**
   - Create or extend mock implementations in `tests/mocks/`
   - Implement mock responses for API endpoints
   - Add sequence support for paginated responses
   - Ensure mocks can simulate errors and rate limiting

4. **Write Unit Tests**
   - Create test file in appropriate `tests/unit/` subdirectory
   - Import necessary test assertions
   - Implement test setup and teardown
   - Write test cases for normal operation
   - Add tests for error conditions and edge cases

5. **Write Integration Tests** (if applicable)
   - Create test file in appropriate `tests/integration/` subdirectory
   - Add environment variable checks for API tokens
   - Implement conditional test execution
   - Add cleanup for created resources

6. **Run and Verify Tests**
   - Run tests with `deno test`
   - Check test coverage if applicable
   - Ensure tests work in CI environment

## Example: Testing Star Service

```typescript
// tests/unit/services/star_service_test.ts
import { assertEquals, assertSpyCall } from "@std/assert";
import { spy } from "jsr:@std/mock/spy";
import { StarService } from "../../../src/core/services/star_service.ts";
import { MockGitHubClient } from "../../mocks/github_client.ts";
import { mockRepos } from "../../fixtures/repositories.ts";

Deno.test("StarService.cleanupStars - identifies and removes archived repos", async () => {
  // Arrange
  const mockClient = new MockGitHubClient();
  const unstarSpy = spy(mockClient, "unstarRepo");

  // Setup mock data - mix of archived and active repos
  mockClient.addMockResponse("getAllStarredRepos", [
    { ...mockRepos[0], archived: true }, // Should be removed
    { ...mockRepos[1], archived: false }, // Should be kept
    { ...mockRepos[2], archived: true }, // Should be removed
  ]);

  const service = new StarService({
    client: mockClient,
  });

  // Act
  const result = await service.cleanupStars({
    dryRun: false,
  });

  // Assert
  assertEquals(result.totalReviewed, 3);
  assertEquals(result.archived, 2);
  assertEquals(result.removed, 2);
  assertEquals(unstarSpy.calls.length, 2);

  // Check that the right repos were unstarred
  assertSpyCall(unstarSpy, 0, {
    args: [mockRepos[0].owner.login, mockRepos[0].name],
  });
  assertSpyCall(unstarSpy, 1, {
    args: [mockRepos[2].owner.login, mockRepos[2].name],
  });
});

Deno.test("StarService.cleanupStars - respects dry run mode", async () => {
  // Arrange
  const mockClient = new MockGitHubClient();
  const unstarSpy = spy(mockClient, "unstarRepo");

  // All repos are archived (would normally be removed)
  mockClient.addMockResponse("getAllStarredRepos", [
    { ...mockRepos[0], archived: true },
    { ...mockRepos[1], archived: true },
  ]);

  const service = new StarService({
    client: mockClient,
  });

  // Act - with dry run enabled
  const result = await service.cleanupStars({
    dryRun: true,
  });

  // Assert - should identify repos but not call unstar
  assertEquals(result.totalReviewed, 2);
  assertEquals(result.archived, 2);
  assertEquals(result.removed, 2); // Counted but not actually removed
  assertEquals(unstarSpy.calls.length, 0); // No calls to unstar
});
```
