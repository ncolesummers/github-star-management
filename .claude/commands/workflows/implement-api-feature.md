# Implement GitHub API Feature

This workflow guides you through implementing a new GitHub API feature in the Deno TypeScript project.

## Workflow Steps

1. **Analyze API Requirements**
   - Review GitHub API documentation for the endpoints needed
   - Identify required request/response types
   - Consider rate limiting implications
   - Determine pagination requirements

2. **Update Type Definitions**
   - Add or extend interfaces in `src/core/models/` for API entities
   - Create request/response type definitions
   - Ensure proper optional/required properties

3. **Implement API Client Methods**
   - Add methods to `GitHubClient` in `src/core/api/github.ts`
   - Implement proper error handling
   - Add pagination support if needed
   - Add rate limiting considerations

4. **Add Service Layer Methods**
   - Integrate API methods into appropriate service classes
   - Implement business logic using the API client
   - Transform API responses to domain models

5. **Create Tests**
   - Write unit tests with mocked responses
   - Create test fixtures for response data
   - Add integration tests (marked as optional)

6. **Update CLI Commands** (if applicable)
   - Add new CLI commands or update existing ones
   - Implement proper argument parsing
   - Add help text and examples

## Example: Adding Repository Topic Support

```typescript
// 1. Update models
// src/core/models/repository.ts
export interface RepositoryTopics {
  names: string[];
}

// 2. Add to GitHub client
// src/core/api/github.ts
async getRepoTopics(owner: string, repo: string): Promise<string[]> {
  const response = await this.client.request<{ names: string[] }>(
    `/repos/${owner}/${repo}/topics`,
    {
      headers: {
        "Accept": "application/vnd.github.mercy-preview+json"
      }
    }
  );
  
  return response.names;
}

// 3. Add test
// tests/unit/api/github_test.ts
Deno.test("GitHubClient.getRepoTopics - fetches repository topics", async () => {
  // Arrange
  const mockFetch = new MockFetch();
  mockFetch.mock("https://api.github.com/repos/owner/repo/topics", {
    status: 200,
    body: { names: ["typescript", "api", "deno"] }
  });
  
  // Replace global fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch.fetch;
  
  try {
    const client = new GitHubClient({ token: "test-token" });
    
    // Act
    const topics = await client.getRepoTopics("owner", "repo");
    
    // Assert
    assertEquals(topics.length, 3);
    assertEquals(topics, ["typescript", "api", "deno"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
```