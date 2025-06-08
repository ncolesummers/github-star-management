/**
 * Unit tests for GitHub API client
 */

// Import test libraries
import { assertEquals, assertRejects } from "@std/assert";

// Import application code
import { GitHubAPIError, GitHubClient } from "../../../src/core/api/mod.ts";

// Import test helpers and fixtures
import { MockFetch } from "../../helpers/mock_fetch.ts";
import {
  createPaginatedRepos,
  errorResponses,
  mockRepos,
} from "../../fixtures/repositories.ts";

// Define test suite for GitHub client
Deno.test("GitHubClient", async (t) => {
  // Test getStarredRepos
  await t.step("getStarredRepos fetches starred repositories", async () => {
    // Arrange
    const mockFetch = new MockFetch();

    // Mock the response for starred repos
    mockFetch.mock("https://api.github.com/user/starred?page=1&per_page=30", {
      status: 200,
      body: [mockRepos[0], mockRepos[1]],
    });

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    try {
      // Create client with test token
      const client = new GitHubClient({
        token: "test-token",
      });

      // Act
      const repos = await client.getStarredRepos();

      // Assert
      assertEquals(repos.length, 2);
      assertEquals(repos[0].name, mockRepos[0].name);
      assertEquals(repos[1].full_name, mockRepos[1].full_name);

      // Verify headers were set correctly
      const calls = mockFetch.calls;
      assertEquals(calls.length, 1);
      assertEquals(
        calls[0].request.headers.get("Authorization"),
        "token test-token",
      );
      assertEquals(
        calls[0].request.headers.get("Accept"),
        "application/vnd.github.v3+json",
      );
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  // Test getAllStarredRepos with pagination
  await t.step("getAllStarredRepos handles pagination", async () => {
    // Arrange
    const mockFetch = new MockFetch();
    const paginatedResponses = createPaginatedRepos(75, 30); // Create 3 pages of repos

    // Mock the responses for each page
    mockFetch.mock("https://api.github.com/user/starred?page=1&per_page=30", {
      status: 200,
      body: paginatedResponses[0].body,
      headers: paginatedResponses[0].headers,
    });

    mockFetch.mock("https://api.github.com/user/starred?page=2&per_page=30", {
      status: 200,
      body: paginatedResponses[1].body,
      headers: paginatedResponses[1].headers,
    });

    mockFetch.mock("https://api.github.com/user/starred?page=3&per_page=30", {
      status: 200,
      body: paginatedResponses[2].body,
      headers: paginatedResponses[2].headers,
    });

    // Empty response for the next page after all data
    mockFetch.mock("https://api.github.com/user/starred?page=4&per_page=30", {
      status: 200,
      body: [],
    });

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    try {
      // Create client with test token
      const client = new GitHubClient({
        token: "test-token",
      });

      // Act
      const repos = await client.getAllStarredRepos();

      // Assert
      assertEquals(repos.length, 75, "Should get all 75 repos across 3 pages");

      // Verify we made requests for all pages
      const calls = mockFetch.calls;
      assertEquals(calls.length, 4); // 3 pages of data + 1 empty page to stop
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  // Test starRepo
  await t.step("starRepo stars a repository", async () => {
    // Arrange
    const mockFetch = new MockFetch();

    // Mock the response for starring a repo (204 No Content)
    mockFetch.mock("https://api.github.com/user/starred/owner/repo", {
      status: 204,
    }, { method: "PUT" });

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    try {
      // Create client
      const client = new GitHubClient({
        token: "test-token",
      });

      // Act
      await client.starRepo("owner", "repo");

      // Assert - should not throw and should make the correct request
      const calls = mockFetch.calls;
      assertEquals(calls.length, 1);
      assertEquals(calls[0].request.method, "PUT");
      assertEquals(
        calls[0].url,
        "https://api.github.com/user/starred/owner/repo",
      );
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  // Test unstarRepo
  await t.step("unstarRepo removes a star from a repository", async () => {
    // Arrange
    const mockFetch = new MockFetch();

    // Mock the response for unstarring a repo (204 No Content)
    mockFetch.mock("https://api.github.com/user/starred/owner/repo", {
      status: 204,
    }, { method: "DELETE" });

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    try {
      // Create client
      const client = new GitHubClient({
        token: "test-token",
      });

      // Act
      await client.unstarRepo("owner", "repo");

      // Assert - should not throw and should make the correct request
      const calls = mockFetch.calls;
      assertEquals(calls.length, 1);
      assertEquals(calls[0].request.method, "DELETE");
      assertEquals(
        calls[0].url,
        "https://api.github.com/user/starred/owner/repo",
      );
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  // Test isRepoStarred (true case)
  await t.step("isRepoStarred returns true for starred repos", async () => {
    // Arrange
    const mockFetch = new MockFetch();

    // Mock the response for checking a starred repo (204 No Content)
    mockFetch.mock("https://api.github.com/user/starred/owner/starred-repo", {
      status: 204,
    });

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    try {
      // Create client
      const client = new GitHubClient({
        token: "test-token",
      });

      // Act
      const isStarred = await client.isRepoStarred("owner", "starred-repo");

      // Assert
      assertEquals(isStarred, true);
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  // Test isRepoStarred (false case)
  await t.step("isRepoStarred returns false for unstarred repos", async () => {
    // Arrange
    const mockFetch = new MockFetch();

    // Mock a 404 response for an unstarred repo
    mockFetch.mock("https://api.github.com/user/starred/owner/unstarred-repo", {
      status: 404,
      body: {
        message: "Not Found",
      },
    });

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    try {
      // Create client
      const client = new GitHubClient({
        token: "test-token",
      });

      // Act
      const isStarred = await client.isRepoStarred("owner", "unstarred-repo");

      // Assert
      assertEquals(isStarred, false);
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  // Test getRepo
  await t.step("getRepo fetches repository details", async () => {
    // Arrange
    const mockFetch = new MockFetch();
    const testRepo = mockRepos[0];

    // Mock the response for getting a repo
    mockFetch.mock(
      `https://api.github.com/repos/${testRepo.owner.login}/${testRepo.name}`,
      {
        status: 200,
        body: testRepo,
      },
    );

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    try {
      // Create client
      const client = new GitHubClient({
        token: "test-token",
      });

      // Act
      const repo = await client.getRepo(testRepo.owner.login, testRepo.name);

      // Assert
      assertEquals(repo?.id, testRepo.id);
      assertEquals(repo?.name, testRepo.name);
      assertEquals(repo?.full_name, testRepo.full_name);
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  // Test getRepo with not found
  await t.step(
    "getRepo returns null for non-existent repositories",
    async () => {
      // Arrange
      const mockFetch = new MockFetch();

      // Mock a 404 response
      mockFetch.mock("https://api.github.com/repos/owner/nonexistent", {
        status: 404,
        body: {
          message: "Not Found",
        },
      });

      // Inject the mock fetch
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch.fetch;

      try {
        // Create client
        const client = new GitHubClient({
          token: "test-token",
        });

        // Act
        const repo = await client.getRepo("owner", "nonexistent");

        // Assert
        assertEquals(repo, null);
      } finally {
        // Restore original fetch
        globalThis.fetch = originalFetch;
      }
    },
  );

  // Test API error handling
  await t.step("handles API errors correctly", async () => {
    // Arrange
    const mockFetch = new MockFetch();

    // Mock an unauthorized error
    mockFetch.mock("https://api.github.com/user", errorResponses.unauthorized);

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    try {
      // Create client
      const client = new GitHubClient({
        token: "invalid-token",
      });

      // Act & Assert
      await assertRejects(
        async () => {
          await client.getCurrentUser();
        },
        GitHubAPIError,
        "GitHub API error: 401 Bad credentials",
      );
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  // Test rate limiting handling
  await t.step("handles rate limiting", async () => {
    // Arrange
    const mockFetch = new MockFetch();

    // Mock a rate limit response followed by a success
    mockFetch.mockSequence(
      "https://api.github.com/user/starred?page=1&per_page=30",
      [
        errorResponses.rateLimited,
        {
          status: 200,
          body: [mockRepos[0]],
        },
      ],
    );

    // Inject the mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch.fetch;

    // Override setTimeout to avoid waiting in tests
    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (
      callback: (...args: unknown[]) => void,
      _timeout?: number,
    ) => {
      // Call immediately instead of waiting
      callback();
      return 0 as unknown as number;
    };

    try {
      // Create client with very short retry delay for testing
      const client = new GitHubClient({
        token: "test-token",
        retryDelay: 1, // Use minimal delay for tests
      });

      // Act
      const result = await client.getStarredRepos();

      // Assert
      assertEquals(result.length, 1);
      assertEquals(result[0].name, mockRepos[0].name);

      // Verify we made two calls (first hit rate limit, second succeeded)
      const calls = mockFetch.calls;
      assertEquals(calls.length, 2);
    } finally {
      // Restore originals
      globalThis.fetch = originalFetch;
      globalThis.setTimeout = originalSetTimeout;
    }
  });
});
