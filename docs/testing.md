# Testing Strategy and Mocking Guide

## Testing Philosophy

The GitHub Stars Management testing approach follows these principles:

1. **Comprehensive Coverage**: Test all core functionality
2. **Realistic Mocking**: Simulate GitHub API behavior accurately
3. **Isolation**: Unit tests should not depend on external services
4. **Integration Verification**: Verify real-world interactions with sandboxed
   tests
5. **Performance Testing**: Ensure efficient API usage

## Test Structure

```
tests/
├── unit/              # Unit tests
│   ├── api/           # API client tests
│   ├── services/      # Business logic tests
│   └── utils/         # Utility function tests
├── integration/       # Integration tests
│   ├── api/           # API integration tests
│   └── cli/           # CLI integration tests
├── mocks/             # Mock implementations
│   └── github/        # GitHub API mocks
├── fixtures/          # Test data fixtures
└── helpers/           # Test helper utilities
```

## Unit Testing

### API Client Tests

```typescript
// tests/unit/api/github_client_test.ts
import { assertEquals, assertRejects, assertSpyCalls } from "@std/assert";
import { spy } from "jsr:@std/mock/spy";
import { GitHubAPIError, GitHubClient } from "../../../src/core/api/github.ts";
import { createResponse, MockFetch } from "../../helpers/mock_fetch.ts";

Deno.test("GitHubClient.getStarredRepos fetches starred repositories", async () => {
  // Arrange
  const mockFetch = new MockFetch();

  // Mock the response for starred repos
  mockFetch.mock("https://api.github.com/user/starred", {
    status: 200,
    body: [
      {
        id: 1,
        name: "test-repo",
        full_name: "owner/test-repo",
        owner: {
          login: "owner",
          id: 123,
          avatar_url: "https://example.com/avatar.png",
          url: "https://api.github.com/users/owner",
          html_url: "https://github.com/owner",
        },
        description: "Test repository",
        stargazers_count: 100,
        archived: false,
        topics: ["test", "demo"],
      },
    ],
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
    assertEquals(repos.length, 1);
    assertEquals(repos[0].name, "test-repo");
    assertEquals(repos[0].full_name, "owner/test-repo");
    assertEquals(repos[0].stargazers_count, 100);

    // Verify headers were set correctly
    const calls = mockFetch.calls;
    assertEquals(calls.length, 1);
    assertEquals(
      calls[0].request.headers.get("Authorization"),
      "token test-token",
    );
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  }
});

Deno.test("GitHubClient.starRepo stars a repository", async () => {
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

Deno.test("GitHubClient handles API errors", async () => {
  // Arrange
  const mockFetch = new MockFetch();

  // Mock a 404 response
  mockFetch.mock("https://api.github.com/user/starred/owner/missing", {
    status: 404,
    body: {
      message: "Not Found",
      documentation_url: "https://docs.github.com/...",
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

    // Act & Assert
    await assertRejects(
      async () => {
        await client.getStarredRepos({ owner: "owner", repo: "missing" });
      },
      GitHubAPIError,
      "GitHub API error: 404 Not Found",
    );
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  }
});

Deno.test("GitHubClient handles rate limiting", async () => {
  // Arrange
  const mockFetch = new MockFetch();

  // Mock a rate limit response followed by a success
  mockFetch.mockSequence("https://api.github.com/user/starred", [
    {
      status: 403,
      body: { message: "API rate limit exceeded" },
      headers: {
        "x-ratelimit-limit": "60",
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": (Math.floor(Date.now() / 1000) + 1).toString(),
      },
    },
    {
      status: 200,
      body: [{ id: 1, name: "test-repo" }],
    },
  ]);

  // Create a timer spy to verify wait behavior
  const originalSetTimeout = globalThis.setTimeout;
  const setTimeoutSpy = spy(originalSetTimeout);
  globalThis.setTimeout = setTimeoutSpy;

  // Inject the mock fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch.fetch;

  try {
    // Create client with short retries for testing
    const client = new GitHubClient({
      token: "test-token",
      rateLimit: 10,
      retryDelay: 100,
    });

    // Act
    const result = await client.getStarredRepos();

    // Assert
    assertEquals(result.length, 1);
    assertEquals(result[0].name, "test-repo");

    // Verify setTimeout was called at least once for the rate limit wait
    assertSpyCalls(setTimeoutSpy, { atLeast: 1 });
  } finally {
    // Restore originals
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  }
});
```

### Service Tests

```typescript
// tests/unit/services/star_service_test.ts
import { assertEquals, assertSpyCall } from "@std/assert";
import { spy } from "jsr:@std/mock/spy";
import { stub } from "jsr:@std/mock/stub";
import { StarService } from "../../../src/core/services/star_service.ts";
import { GitHubClient } from "../../../src/core/api/github.ts";
import { MockGitHubClient } from "../../mocks/github_client.ts";
import { mockRepos } from "../../fixtures/repositories.ts";

Deno.test("StarService.cleanupStars removes archived and outdated repositories", async () => {
  // Arrange
  const mockClient = new MockGitHubClient();
  
  // Set up mock data
  mockClient.addMockResponse("getAllStarredRepos", [
    // Archived repo
    { ...mockRepos[0], archived: true },
    // Old repo (inactive)
    { 
      ...mockRepos[1], 
      pushed_at: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString() 
    },
    // Active repo (should be kept)
    { 
      ...mockRepos[2], 
      pushed_at: new Date().toISOString(),
      archived: false
    }
  ]);
  
  // Spy on unstarRepo method
  const unstarSpy = spy(mockClient, "unstarRepo");
  
  // Create service with mock client
  const service = new StarService({
    client: mockClient,
  });
  
  // Act
  const result = await service.cleanupStars({
    cutoffMonths: 24,
    dryRun: false,
  });
  
  // Assert
  assertEquals(result.totalReviewed, 3);
  assertEquals(result.removed, 2);
  assertEquals(result.archived, 1);
  assertEquals(result.outdated, 1);
  
  // Verify unstar was called for the right repos
  assertEquals(unstarSpy.calls.length, 2);
  assertSpyCall(unstarSpy, 0, {
    args: [mockRepos[0].owner.login, mockRepos[0].name]
  });
  assertSpyCall(unstarSpy, 1, {
    args: [mockRepos[1].owner.login, mockRepos[1].name]
  });
});

Deno.test("StarService.backupStars creates a JSON backup file", async () => {
  // Arrange
  const mockClient = new MockGitHubClient();
  mockClient.addMockResponse("getAllStarredRepos", mockRepos);
  
  const writeFileSpy = stub(
    Deno,
    "writeTextFile",
    () => Promise.resolve()
  );
  
  try {
    // Create service with mock client
    const service = new StarService({
      client: mockClient,
    });
    
    // Act
    await service.backupStars("stars.json");
    
    // Assert
    assertEquals(writeFileSpy.calls.length, 1);
    assertEquals(writeFileSpy.calls[0].args[0], "stars.json");
    
    // Verify JSON contains all repos
    const backupData = JSON.parse(writeFileSpy.calls[0].args[1]);
    assertEquals(backupData.length, mockRepos.length);
    assertEquals(backupData[0].id, mockRepos[0].id);
  } finally {
    writeFileSpy.restore();
  }
});

Deno.test("StarService.categorizeStars groups repositories by category", async () => {
  // Arrange
  const mockClient = new MockGitHubClient();
  mockClient.addMockResponse("getAllStarredRepos", [
    { ...mockRepos[0], name: "typescript-project", topics: ["typescript"] },
    { ...mockRepos[1], name: "python-utils", description: "Python utilities", topics: [] },
    { ...mockRepos[2], name: "golang-server", topics: ["go", "server"] },
    { ...mockRepos[3], name: "other-project", topics: [] }
  ]);
  
  const service = new StarService({
    client: mockClient,
  });
  
  const categories = [
    { name: "typescript", pattern: "typescript|ts" },
    { name: "python", pattern: "python|py" },
    { name: "golang", pattern: "golang|go" },
    { name: "web-servers", pattern: "server|http|express" }
  ];
  
  // Act
  const result = await service.categorizeStars(categories);
  
  // Assert
  assertEquals(Object.keys(result).length, 4);
  assertEquals(result.typescript.length, 1);
  assertEquals(result.typescript[0].name, "typescript-project");
  assertEquals(result.python.length, 1);
  assertEquals(result.python[0].name, "python-utils");
  assertEquals(result.golang.length, 1);
  assertEquals(result.golang[0].name, "golang-server");
  assertEquals(result.["web-servers"].length, 1);
  assertEquals(result.["web-servers"][0].name, "golang-server");
  
  // Note that golang-server appears in two categories
});
```

## Integration Testing

```typescript
// tests/integration/api/github_client_test.ts
import { assertEquals, assertExists } from "@std/assert";
import { GitHubClient } from "../../../src/core/api/github.ts";

// Only run if integration tests are enabled
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
      } catch (e) {
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
    const start = Date.now();
    await Promise.all([
      client.getStarredRepos({ perPage: 1 }),
      client.getStarredRepos({ perPage: 1 }),
      client.getStarredRepos({ perPage: 1 }),
      client.getStarredRepos({ perPage: 1 }),
      client.getStarredRepos({ perPage: 1 }),
    ]);
    const duration = Date.now() - start;

    // Should take longer than immediate execution due to rate limiting
    console.log(`5 requests took ${duration}ms with rate limiting`);
    assert(duration > 500, "Rate limiting should cause delays");
  },
});
```

## CLI Integration Tests

```typescript
// tests/integration/cli/commands_test.ts
import { assertEquals } from "@std/assert";
import { StringWriter } from "../../helpers/string_writer.ts";
import { backup } from "../../../src/cli/commands/backup.ts";
import { clean } from "../../../src/cli/commands/cleanup.ts";

// Setup test context
function createTestContext(args: string[] = []) {
  const stdout = new StringWriter();
  const stderr = new StringWriter();

  return {
    args,
    flags: {},
    stdout,
    stderr,
    env: {
      GITHUB_TOKEN: Deno.env.get("GITHUB_TOKEN") || "test-token",
    },
    getStdout: () => stdout.toString(),
    getStderr: () => stderr.toString(),
  };
}

// Only run if integration tests are enabled
const runIntegration = Deno.env.get("RUN_INTEGRATION_TESTS") === "true";

Deno.test({
  name: "backup command creates a JSON file",
  ignore: !runIntegration,
  async fn() {
    // Create temporary file path
    const tempFile = await Deno.makeTempFile({ suffix: ".json" });

    try {
      // Arrange
      const ctx = createTestContext(["--output", tempFile, "--limit", "3"]);

      // Act
      const exitCode = await backup(ctx);

      // Assert
      assertEquals(exitCode, 0);
      assertEquals(ctx.getStderr(), ""); // No errors

      // Verify stdout contains success message
      const stdout = ctx.getStdout();
      assert(stdout.includes("Backup completed"));

      // Verify file exists and contains valid JSON
      const fileContent = await Deno.readTextFile(tempFile);
      const backupData = JSON.parse(fileContent);

      assert(Array.isArray(backupData));
      if (backupData.length > 0) {
        assertExists(backupData[0].full_name);
      }
    } finally {
      // Clean up
      try {
        await Deno.remove(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  },
});

Deno.test({
  name: "cleanup command in dry-run mode doesn't make changes",
  ignore: !runIntegration,
  async fn() {
    // Arrange
    const ctx = createTestContext(["--dry-run", "--cutoff-months", "36"]);

    // Act
    const exitCode = await clean(ctx);

    // Assert
    assertEquals(exitCode, 0);
    assertEquals(ctx.getStderr(), ""); // No errors

    // Verify stdout contains dry run message
    const stdout = ctx.getStdout();
    assert(stdout.includes("DRY RUN"));
    assert(stdout.includes("Cleanup complete"));
  },
});
```

## Mock Implementations

### Mock Fetch Helper

```typescript
// tests/helpers/mock_fetch.ts
export interface MockResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

interface MockRequestKey {
  url: string;
  method?: RequestMethod;
}

interface MockCall {
  url: string;
  request: Request;
}

function keyFromRequest(url: string, method?: RequestMethod): string {
  return `${method || "GET"}:${url}`;
}

export class MockFetch {
  private mocks = new Map<string, MockResponse | MockResponse[]>();
  private _calls: MockCall[] = [];

  constructor() {
    this.fetch = this.fetch.bind(this);
  }

  mock(
    url: string,
    response: MockResponse,
    options: { method?: RequestMethod } = {},
  ): void {
    const key = keyFromRequest(url, options.method);
    this.mocks.set(key, response);
  }

  mockSequence(
    url: string,
    responses: MockResponse[],
    options: { method?: RequestMethod } = {},
  ): void {
    const key = keyFromRequest(url, options.method);
    this.mocks.set(key, responses);
  }

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = new Request(input, init);
    const url = request.url;
    const method = request.method as RequestMethod;

    // Record this call
    this._calls.push({ url, request });

    // Look for a matching mock
    const key = keyFromRequest(url, method);
    let mockResponse = this.mocks.get(key);

    // If no exact match, try just the URL
    if (!mockResponse) {
      const keyWithoutMethod = keyFromRequest(url);
      mockResponse = this.mocks.get(keyWithoutMethod);
    }

    if (!mockResponse) {
      throw new Error(`No mock response for ${method} ${url}`);
    }

    // Handle sequence of responses
    let response: MockResponse;
    if (Array.isArray(mockResponse)) {
      if (mockResponse.length === 0) {
        throw new Error(`Mock response sequence for ${method} ${url} is empty`);
      }

      response = mockResponse[0];

      // Remove the first item if there are more in the sequence
      if (mockResponse.length > 1) {
        this.mocks.set(key, mockResponse.slice(1));
      } else {
        this.mocks.delete(key);
      }
    } else {
      response = mockResponse;
    }

    // Create response object
    return createResponse(response);
  }

  get calls(): MockCall[] {
    return [...this._calls];
  }

  reset(): void {
    this.mocks.clear();
    this._calls = [];
  }
}

export function createResponse(mock: MockResponse): Response {
  const { status, body, headers = {} } = mock;

  const responseInit: ResponseInit = {
    status,
    headers,
  };

  if (body === undefined) {
    return new Response(null, responseInit);
  }

  if (typeof body === "string") {
    return new Response(body, responseInit);
  }

  // JSON body
  return new Response(
    JSON.stringify(body),
    {
      ...responseInit,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    },
  );
}
```

### Mock GitHub Client

```typescript
// tests/mocks/github_client.ts
import type { Repository, User } from "../../src/core/models/mod.ts";

export class MockGitHubClient {
  private responses: Map<string, any> = new Map();
  private calls: Map<string, any[][]> = new Map();

  constructor() {
    // Auto-bind all methods to track calls
    for (
      const key of Object.getOwnPropertyNames(
        MockGitHubClient.prototype,
      )
    ) {
      if (key !== "constructor" && typeof (this as any)[key] === "function") {
        const method = (this as any)[key];
        (this as any)[key] = (...args: any[]) => {
          this.recordCall(key, args);
          return method.apply(this, args);
        };
      }
    }
  }

  private recordCall(method: string, args: any[]): void {
    const calls = this.calls.get(method) || [];
    calls.push(args);
    this.calls.set(method, calls);
  }

  addMockResponse(method: string, response: any): void {
    this.responses.set(method, response);
  }

  getCallCount(method: string): number {
    return this.calls.get(method)?.length || 0;
  }

  getCallArgs(method: string, index = 0): any[] | undefined {
    return this.calls.get(method)?.[index];
  }

  // Mock API methods
  async getStarredRepos(): Promise<Repository[]> {
    return this.responses.get("getStarredRepos") || [];
  }

  async getAllStarredRepos(): Promise<Repository[]> {
    return this.responses.get("getAllStarredRepos") || [];
  }

  async starRepo(owner: string, repo: string): Promise<void> {
    // Implementation not needed, just recording the call
  }

  async unstarRepo(owner: string, repo: string): Promise<void> {
    // Implementation not needed, just recording the call
  }

  async isRepoStarred(owner: string, repo: string): Promise<boolean> {
    return this.responses.get("isRepoStarred") || false;
  }

  async getRepo(owner: string, repo: string): Promise<Repository | null> {
    return this.responses.get("getRepo") || null;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.responses.get("getCurrentUser") || null;
  }

  reset(): void {
    this.responses.clear();
    this.calls.clear();
  }
}
```

### Test Fixtures

```typescript
// tests/fixtures/repositories.ts
export const mockRepos = [
  {
    id: 1,
    name: "repo1",
    full_name: "owner1/repo1",
    owner: {
      login: "owner1",
      id: 101,
      avatar_url: "https://example.com/avatar1.png",
      url: "https://api.github.com/users/owner1",
      html_url: "https://github.com/owner1",
    },
    description: "Test repository 1",
    html_url: "https://github.com/owner1/repo1",
    fork: false,
    url: "https://api.github.com/repos/owner1/repo1",
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2022-01-01T00:00:00Z",
    pushed_at: "2022-01-01T00:00:00Z",
    stargazers_count: 100,
    watchers_count: 10,
    language: "TypeScript",
    forks_count: 5,
    archived: false,
    disabled: false,
    license: {
      key: "mit",
      name: "MIT License",
      url: "https://api.github.com/licenses/mit",
    },
    topics: ["typescript", "deno", "api"],
  },
  {
    id: 2,
    name: "repo2",
    full_name: "owner2/repo2",
    owner: {
      login: "owner2",
      id: 102,
      avatar_url: "https://example.com/avatar2.png",
      url: "https://api.github.com/users/owner2",
      html_url: "https://github.com/owner2",
    },
    description: "Test repository 2",
    html_url: "https://github.com/owner2/repo2",
    fork: false,
    url: "https://api.github.com/repos/owner2/repo2",
    created_at: "2020-02-01T00:00:00Z",
    updated_at: "2022-02-01T00:00:00Z",
    pushed_at: "2022-02-01T00:00:00Z",
    stargazers_count: 200,
    watchers_count: 20,
    language: "JavaScript",
    forks_count: 10,
    archived: false,
    disabled: false,
    license: null,
    topics: ["javascript", "web"],
  },
  {
    id: 3,
    name: "repo3",
    full_name: "owner3/repo3",
    owner: {
      login: "owner3",
      id: 103,
      avatar_url: "https://example.com/avatar3.png",
      url: "https://api.github.com/users/owner3",
      html_url: "https://github.com/owner3",
    },
    description: "Test repository 3",
    html_url: "https://github.com/owner3/repo3",
    fork: true,
    url: "https://api.github.com/repos/owner3/repo3",
    created_at: "2020-03-01T00:00:00Z",
    updated_at: "2022-03-01T00:00:00Z",
    pushed_at: "2022-03-01T00:00:00Z",
    stargazers_count: 300,
    watchers_count: 30,
    language: "Python",
    forks_count: 15,
    archived: false,
    disabled: false,
    license: {
      key: "apache-2.0",
      name: "Apache License 2.0",
      url: "https://api.github.com/licenses/apache-2.0",
    },
    topics: ["python", "machine-learning"],
  },
  {
    id: 4,
    name: "repo4",
    full_name: "owner4/repo4",
    owner: {
      login: "owner4",
      id: 104,
      avatar_url: "https://example.com/avatar4.png",
      url: "https://api.github.com/users/owner4",
      html_url: "https://github.com/owner4",
    },
    description: "Test repository 4",
    html_url: "https://github.com/owner4/repo4",
    fork: false,
    url: "https://api.github.com/repos/owner4/repo4",
    created_at: "2020-04-01T00:00:00Z",
    updated_at: "2021-04-01T00:00:00Z", // Older update
    pushed_at: "2021-04-01T00:00:00Z", // Older push
    stargazers_count: 400,
    watchers_count: 40,
    language: "Go",
    forks_count: 20,
    archived: false,
    disabled: false,
    license: null,
    topics: ["golang", "cli"],
  },
];
```

## Test Helpers

```typescript
// tests/helpers/string_writer.ts
export class StringWriter implements Deno.Writer {
  private chunks: Uint8Array[] = [];

  async write(p: Uint8Array): Promise<number> {
    const copy = new Uint8Array(p.length);
    copy.set(p);
    this.chunks.push(copy);
    return p.length;
  }

  toString(): string {
    const decoder = new TextDecoder();
    return this.chunks.map((chunk) => decoder.decode(chunk)).join("");
  }

  clear(): void {
    this.chunks = [];
  }
}

// tests/helpers/temp_file.ts
export async function withTempFile(
  fn: (path: string) => Promise<void>,
  options: { suffix?: string; prefix?: string; dir?: string } = {},
): Promise<void> {
  const filePath = await Deno.makeTempFile(options);
  try {
    await fn(filePath);
  } finally {
    try {
      await Deno.remove(filePath);
    } catch (e) {
      // Ignore errors when removing temp files
    }
  }
}

export async function withTempDir(
  fn: (path: string) => Promise<void>,
  options: { suffix?: string; prefix?: string; dir?: string } = {},
): Promise<void> {
  const dirPath = await Deno.makeTempDir(options);
  try {
    await fn(dirPath);
  } finally {
    try {
      await Deno.remove(dirPath, { recursive: true });
    } catch (e) {
      // Ignore errors when removing temp dirs
    }
  }
}
```

## Performance Testing

```typescript
// tests/performance/api_performance_test.ts
import { GitHubClient } from "../../src/core/api/github.ts";

// Only run performance tests when explicitly enabled
const runPerformance = Deno.env.get("RUN_PERFORMANCE_TESTS") === "true";

Deno.test({
  name: "API performance test - parallel vs. sequential requests",
  ignore: !runPerformance,
  async fn() {
    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) {
      throw new Error(
        "GITHUB_TOKEN environment variable is required for performance tests",
      );
    }

    // Standard client with default settings
    const standardClient = new GitHubClient({ token });

    // Start standard sequential test
    console.log("Testing sequential requests...");
    const seqStart = performance.now();

    // Make 5 sequential requests
    for (let i = 0; i < 5; i++) {
      await standardClient.getStarredRepos({ page: i + 1, perPage: 10 });
    }

    const seqDuration = performance.now() - seqStart;
    console.log(`Sequential requests took: ${seqDuration.toFixed(2)}ms`);

    // Client with higher rate limit for parallel testing
    const parallelClient = new GitHubClient({
      token,
      rateLimit: 10, // Higher rate limit
    });

    // Test parallel requests
    console.log("Testing parallel requests...");
    const parStart = performance.now();

    // Make 5 parallel requests
    await Promise.all([
      parallelClient.getStarredRepos({ page: 1, perPage: 10 }),
      parallelClient.getStarredRepos({ page: 2, perPage: 10 }),
      parallelClient.getStarredRepos({ page: 3, perPage: 10 }),
      parallelClient.getStarredRepos({ page: 4, perPage: 10 }),
      parallelClient.getStarredRepos({ page: 5, perPage: 10 }),
    ]);

    const parDuration = performance.now() - parStart;
    console.log(`Parallel requests took: ${parDuration.toFixed(2)}ms`);

    // Show comparison
    const speedup = seqDuration / parDuration;
    console.log(`Parallel is ${speedup.toFixed(2)}x faster`);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
```

## GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        deno-version: [v1.x]
        include:
          - os: ubuntu-latest
            deno-version: canary

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: ${{ matrix.deno-version }}

      - name: Verify formatting
        run: deno fmt --check

      - name: Run linter
        run: deno lint

      - name: Type check
        run: deno check src/**/*.ts

      - name: Run unit tests
        run: deno test --allow-env tests/unit/

      - name: Run integration tests
        if: matrix.os == 'ubuntu-latest' && github.event_name == 'push'
        env:
          GITHUB_TOKEN: ${{ secrets.TEST_GITHUB_TOKEN }}
          RUN_INTEGRATION_TESTS: "true"
        run: deno test --allow-env --allow-net --allow-read --allow-write tests/integration/

      - name: Generate coverage
        if: matrix.os == 'ubuntu-latest' && matrix.deno-version == 'v1.x'
        run: deno test --allow-env --coverage=coverage tests/unit/

      - name: Create coverage report
        if: matrix.os == 'ubuntu-latest' && matrix.deno-version == 'v1.x'
        run: |
          deno coverage coverage --lcov > coverage.lcov
          deno install -A -f -n codecov https://deno.land/x/codecov@v0.1.4/cli.ts
          codecov -f coverage.lcov
```

## Best Practices

### Testing Strategy

1. **Test Isolation**
   - Each test should be self-contained
   - Avoid dependencies between tests
   - Clean up after tests with `teardown` functions

2. **Mocking External Dependencies**
   - Mock all network requests
   - Use dependency injection for easier mocking
   - Validate mock call patterns

3. **Coverage Goals**
   - Aim for 80%+ code coverage for core functionality
   - Focus on testing business logic and error cases
   - Include both happy path and error path tests

### Effective Mocking

1. **Realistic Mocks**
   - Make mock responses match real API behavior
   - Include rate limiting and pagination in mocks
   - Test error handling with appropriate HTTP error codes

2. **Mock GitHub API Best Practices**
   - Use the correct content types and headers
   - Include proper pagination links
   - Simulate rate limiting headers

3. **Mock Fixture Management**
   - Store complex fixtures as separate files
   - Use typed fixtures to catch schema changes
   - Keep fixtures up to date with API changes

### Test Maintenance

1. **Test Organization**
   - Group tests by functionality
   - Use descriptive test names
   - Structure test files to mirror source files

2. **CI Integration**
   - Run unit tests on all PRs
   - Run integration tests on main branch updates
   - Use a dedicated test account for integration tests

3. **Performance Monitoring**
   - Track test execution times
   - Benchmark critical operations
   - Alert on performance regressions
