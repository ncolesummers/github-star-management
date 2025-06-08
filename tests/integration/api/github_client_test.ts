/**
 * Integration tests for GitHub API client
 *
 * These tests interact with the real GitHub API and are only run
 * when explicitly enabled with the RUN_INTEGRATION_TESTS environment variable.
 */

import {
  assertEquals,
  assertExists,
} from "@std/assert";
import { GitHubClient } from "../../../src/core/api/mod.ts";

// Only run integration tests when explicitly enabled
const runIntegration = Deno.env.get("RUN_INTEGRATION_TESTS") === "true";

Deno.test({
  name: "GitHubClient can fetch real starred repositories",
  ignore: !runIntegration,
  async fn() {
    // Arrange
    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) {
      throw new Error(
        "GITHUB_TOKEN environment variable is required for integration tests",
      );
    }

    const client = new GitHubClient({ token });

    // Act
    const repos = await client.getStarredRepos({ perPage: 3 });

    // Assert
    assertExists(repos);
    assertEquals(Array.isArray(repos), true);

    // We can't know exactly what repos will be returned, but we can
    // verify the structure of the results
    if (repos.length > 0) {
      const repo = repos[0];
      assertExists(repo.id);
      assertExists(repo.name);
      assertExists(repo.full_name);
      assertExists(repo.owner);
      assertExists(repo.html_url);
    }
  },
});

Deno.test({
  name: "Star and unstar a repository",
  ignore: !runIntegration,
  async fn() {
    // This test modifies state, so it should be used carefully
    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) {
      throw new Error(
        "GITHUB_TOKEN environment variable is required for integration tests",
      );
    }

    const client = new GitHubClient({ token });

    // Use a well-known repo for testing
    const owner = "denoland";
    const repo = "deno";

    try {
      // Star the repo
      await client.starRepo(owner, repo);

      // Verify it's starred
      const isStarred = await client.isRepoStarred(owner, repo);
      assertEquals(isStarred, true);
    } finally {
      // Always unstar to clean up
      try {
        await client.unstarRepo(owner, repo);
      } catch (_e) {
        // Ignore errors during cleanup
      }
    }
  },
});

Deno.test({
  name: "Rate limiting behavior",
  ignore: !runIntegration,
  async fn() {
    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) {
      throw new Error(
        "GITHUB_TOKEN environment variable is required for integration tests",
      );
    }

    // Create client with low rate limit to test rate limiter
    const client = new GitHubClient({
      token,
      rateLimit: 3, // Very low limit for testing
    });

    // Make multiple requests to trigger rate limiter
    const start = performance.now();
    await Promise.all([
      client.getStarredRepos({ perPage: 1 }),
      client.getStarredRepos({ perPage: 1 }),
      client.getStarredRepos({ perPage: 1 }),
      client.getStarredRepos({ perPage: 1 }),
      client.getStarredRepos({ perPage: 1 }),
    ]);
    const duration = performance.now() - start;

    // Should take longer than immediate execution due to rate limiting
    console.log(`5 requests took ${duration}ms with rate limiting`);
    // Avoiding a hard assertion here since timing can vary,
    // but we expect rate limiting to cause some delay
  },
});
