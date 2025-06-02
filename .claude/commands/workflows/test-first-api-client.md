# Test-First API Client Implementation

This workflow guides you through implementing a GitHub API client feature using a test-first approach, with a focus on robust error handling, rate limiting, and proper typing.

## Workflow Steps

1. **API Research and Requirements**
   - Research the specific GitHub API endpoint documentation
   - Identify required request parameters and headers
   - Understand response structure and pagination
   - Note rate limiting considerations
   - Consider error scenarios and edge cases

2. **Interface and Model Definition**
   - Define TypeScript interfaces for API responses
   - Create parameter types for API requests
   - Define error types for specific API errors
   - Document interfaces with JSDoc comments
   - Consider type extensions for specific endpoint needs

3. **Test Implementation**
   - Create mock responses for happy path tests
   - Add test cases for pagination handling
   - Include tests for rate limit handling
   - Add error scenario tests
   - Test parameter validation

4. **Client Method Implementation**
   - Implement method signature with proper typing
   - Add parameter validation and normalization
   - Implement HTTP request with proper headers
   - Add response parsing and transformation
   - Implement pagination handling if needed

5. **Rate Limiting and Error Handling**
   - Add rate limit detection and backoff
   - Implement specific error handling for common scenarios
   - Add retry logic for transient errors
   - Consider caching for frequently accessed data
   - Log appropriate debug information

## Example Implementation

### 1. Define Types and Interfaces

```typescript
// src/core/models/repository.ts
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    url: string;
  } | null;
  topics: string[];
  visibility: string;
  default_branch: string;
}

// src/core/api/errors.ts
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(
    message: string,
    public resetAt: Date,
    response?: any
  ) {
    super(message, 403, response);
    this.name = "GitHubRateLimitError";
  }
}
```

### 2. Write Tests First

```typescript
// tests/unit/api/github_client_test.ts
import { assertEquals, assertRejects, assertArrayIncludes } from "../../deps.ts";
import { GitHubClient } from "../../../src/core/api/github_client.ts";
import { MockFetch } from "../../helpers/mock_fetch.ts";
import { GitHubRateLimitError } from "../../../src/core/api/errors.ts";

Deno.test("GitHubClient.getStarredRepositories - fetches and combines paginated results", async () => {
  // Arrange
  const mockFetch = new MockFetch();
  
  // Mock first page response
  mockFetch.mock("https://api.github.com/user/starred?page=1&per_page=2&sort=created&direction=desc", {
    status: 200,
    body: [
      { id: 1, name: "repo1", full_name: "user/repo1" },
      { id: 2, name: "repo2", full_name: "user/repo2" }
    ],
    headers: {
      "Link": '<https://api.github.com/user/starred?page=2&per_page=2>; rel="next"',
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "4999",
      "x-ratelimit-reset": (Math.floor(Date.now() / 1000) + 3600).toString()
    }
  });
  
  // Mock second page response
  mockFetch.mock("https://api.github.com/user/starred?page=2&per_page=2&sort=created&direction=desc", {
    status: 200,
    body: [
      { id: 3, name: "repo3", full_name: "user/repo3" }
    ],
    headers: {
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "4998",
      "x-ratelimit-reset": (Math.floor(Date.now() / 1000) + 3600).toString()
    }
  });
  
  // Replace global fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch.fetch;
  
  try {
    const client = new GitHubClient({ token: "test-token" });
    
    // Act
    const repos = await client.getStarredRepositories({ per_page: 2 });
    
    // Assert
    assertEquals(repos.length, 3);
    assertEquals(repos[0].name, "repo1");
    assertEquals(repos[1].name, "repo2");
    assertEquals(repos[2].name, "repo3");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("GitHubClient.getStarredRepositories - handles rate limiting", async () => {
  // Arrange
  const mockFetch = new MockFetch();
  const resetTime = Math.floor(Date.now() / 1000) + 60; // 1 minute in the future
  
  mockFetch.mock("https://api.github.com/user/starred?page=1&per_page=100&sort=created&direction=desc", {
    status: 403,
    body: {
      message: "API rate limit exceeded",
      documentation_url: "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
    },
    headers: {
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": resetTime.toString()
    }
  });
  
  // Replace global fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch.fetch;
  
  try {
    const client = new GitHubClient({ token: "test-token" });
    
    // Act & Assert
    await assertRejects(
      async () => {
        await client.getStarredRepositories();
      },
      GitHubRateLimitError,
      "API rate limit exceeded"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("GitHubClient.getStarredRepositories - sorts by specified criteria", async () => {
  // Arrange
  const mockFetch = new MockFetch();
  
  // Mock response for sorting by updated
  mockFetch.mock("https://api.github.com/user/starred?page=1&per_page=100&sort=updated&direction=desc", {
    status: 200,
    body: [
      { id: 1, name: "repo1", full_name: "user/repo1", updated_at: "2023-01-01T00:00:00Z" },
      { id: 2, name: "repo2", full_name: "user/repo2", updated_at: "2022-01-01T00:00:00Z" }
    ],
    headers: {
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "4999",
      "x-ratelimit-reset": (Math.floor(Date.now() / 1000) + 3600).toString()
    }
  });
  
  // Replace global fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch.fetch;
  
  try {
    const client = new GitHubClient({ token: "test-token" });
    
    // Act
    const repos = await client.getStarredRepositories({ sort: "updated" });
    
    // Assert
    assertEquals(repos.length, 2);
    assertEquals(repos[0].name, "repo1");
    assertEquals(repos[1].name, "repo2");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
```

### 3. Implement the Feature

```typescript
// src/core/api/github_client.ts
import { Repository } from "../models/repository.ts";
import { GitHubApiError, GitHubRateLimitError } from "./errors.ts";

export interface GitHubClientOptions {
  token: string;
  baseUrl?: string;
  userAgent?: string;
}

export interface StarredRepositoriesOptions {
  per_page?: number;
  sort?: "created" | "updated";
  direction?: "asc" | "desc";
}

export class GitHubClient {
  private baseUrl: string;
  private token: string;
  private userAgent: string;
  
  constructor(options: GitHubClientOptions) {
    this.baseUrl = options.baseUrl || "https://api.github.com";
    this.token = options.token;
    this.userAgent = options.userAgent || "GitHub-Stars-Management-Tool";
  }
  
  /**
   * Fetches all repositories starred by the authenticated user.
   * Handles pagination automatically.
   * 
   * @param options - Optional parameters for the request
   * @returns Array of Repository objects
   * @throws GitHubApiError if the request fails
   * @throws GitHubRateLimitError if rate limits are exceeded
   */
  async getStarredRepositories(options: StarredRepositoriesOptions = {}): Promise<Repository[]> {
    const perPage = options.per_page || 100;
    const sort = options.sort || "created";
    const direction = options.direction || "desc";
    let page = 1;
    let hasMore = true;
    const allRepos: Repository[] = [];
    
    while (hasMore) {
      try {
        const url = `${this.baseUrl}/user/starred?page=${page}&per_page=${perPage}&sort=${sort}&direction=${direction}`;
        
        const response = await fetch(url, {
          headers: {
            "Authorization": `token ${this.token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": this.userAgent
          }
        });
        
        // Check for rate limiting
        if (response.status === 403 && 
            response.headers.get("x-ratelimit-remaining") === "0") {
          const resetTimestamp = parseInt(response.headers.get("x-ratelimit-reset") || "0");
          const resetDate = new Date(resetTimestamp * 1000);
          const responseData = await response.json();
          throw new GitHubRateLimitError(
            responseData.message || "GitHub API rate limit exceeded",
            resetDate,
            responseData
          );
        }
        
        // Check for other errors
        if (!response.ok) {
          const responseData = await response.json();
          throw new GitHubApiError(
            responseData.message || `GitHub API error: ${response.statusText}`,
            response.status,
            responseData
          );
        }
        
        const repos = await response.json() as Repository[];
        
        if (repos.length === 0) {
          hasMore = false;
        } else {
          allRepos.push(...repos);
          
          // Check if there's another page
          const linkHeader = response.headers.get("Link");
          hasMore = linkHeader !== null && linkHeader.includes('rel="next"');
          
          page++;
        }
        
        // Check rate limit headers and slow down if needed
        const remaining = parseInt(response.headers.get("x-ratelimit-remaining") || "1000");
        if (remaining < 10) {
          const resetTimestamp = parseInt(response.headers.get("x-ratelimit-reset") || "0");
          const resetTime = resetTimestamp * 1000;
          const now = Date.now();
          
          if (resetTime > now) {
            // If we're close to the rate limit, add a small delay
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        if (error instanceof GitHubApiError) {
          throw error;
        }
        
        // Handle unexpected errors
        throw new GitHubApiError(
          `Unexpected error: ${error.message}`,
          500
        );
      }
    }
    
    return allRepos;
  }
}
```

### 4. Run Tests to Verify

```bash
deno test tests/unit/api/github_client_test.ts
```

This test-first approach ensures that your API client is thoroughly tested for different scenarios, including pagination, rate limiting, and error handling. By writing tests before implementation, you define the expected behavior clearly and create a safety net for future changes.