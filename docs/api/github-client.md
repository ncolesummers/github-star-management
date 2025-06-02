# GitHub API Client

The `GitHubClient` class provides a TypeScript interface to the GitHub API with built-in rate limiting, pagination handling, and error management.

## Class: `GitHubClient`

The main client for interacting with GitHub's REST API.

### Constructor

```typescript
constructor(options: GitHubClientOptions = {})
```

Creates a new instance of the GitHub API client.

#### Parameters

- `options`: Configuration options for the client
  - `token?: string`: GitHub personal access token (falls back to `GITHUB_TOKEN` environment variable if not provided)
  - `baseUrl?: string`: Base URL for the GitHub API (defaults to "https://api.github.com")
  - `rateLimit?: number`: Maximum requests per second (defaults to 10)
  - `maxRetries?: number`: Maximum number of retries for failed requests (defaults to 3)

#### Example

```typescript
import { GitHubClient } from "github-star-management/mod.ts";

// Create client with default options
const client = new GitHubClient();

// Create client with custom options
const customClient = new GitHubClient({
  token: "your-github-token",
  rateLimit: 5,
  maxRetries: 5
});
```

### Methods

#### `getStarredRepos`

```typescript
async getStarredRepos(options: StarredRepoOptions = {}): Promise<Repository[]>
```

Fetches a page of the authenticated user's starred repositories.

##### Parameters

- `options`: Pagination and sorting options
  - `page?: number`: Page number (defaults to 1)
  - `perPage?: number`: Number of results per page (defaults to 100, maximum 100)
  - `sort?: "created" | "updated"`: Sort by creation or update date
  - `direction?: "asc" | "desc"`: Sort direction (defaults to "desc")

##### Returns

A promise that resolves to an array of `Repository` objects.

##### Example

```typescript
// Get first page of starred repos
const stars = await client.getStarredRepos();

// Get second page, sorted by when they were starred
const moreStars = await client.getStarredRepos({
  page: 2,
  sort: "created",
  direction: "desc"
});
```

#### `getAllStarredRepos`

```typescript
async getAllStarredRepos(): Promise<Repository[]>
```

Fetches all starred repositories, handling pagination automatically.

##### Returns

A promise that resolves to an array of all `Repository` objects.

##### Example

```typescript
// Get all starred repositories (may take time if you have many stars)
const allStars = await client.getAllStarredRepos();
console.log(`You have ${allStars.length} starred repositories.`);
```

#### `starRepo`

```typescript
async starRepo(owner: string, repo: string): Promise<void>
```

Stars a repository.

##### Parameters

- `owner`: Repository owner (username or organization)
- `repo`: Repository name

##### Example

```typescript
// Star a repository
await client.starRepo("denoland", "deno");
```

#### `unstarRepo`

```typescript
async unstarRepo(owner: string, repo: string): Promise<void>
```

Unstars a repository.

##### Parameters

- `owner`: Repository owner (username or organization)
- `repo`: Repository name

##### Example

```typescript
// Unstar a repository
await client.unstarRepo("denoland", "deno");
```

#### `isRepoStarred`

```typescript
async isRepoStarred(owner: string, repo: string): Promise<boolean>
```

Checks if a repository is starred by the authenticated user.

##### Parameters

- `owner`: Repository owner (username or organization)
- `repo`: Repository name

##### Returns

A promise that resolves to a boolean indicating whether the repository is starred.

##### Example

```typescript
// Check if a repository is starred
const isStarred = await client.isRepoStarred("denoland", "deno");
if (isStarred) {
  console.log("Repository is starred!");
} else {
  console.log("Repository is not starred.");
}
```

## Error Handling

The `GitHubClient` throws `GitHubAPIError` instances for API-related errors:

```typescript
try {
  await client.starRepo("denoland", "deno");
} catch (error) {
  if (error instanceof GitHubAPIError) {
    if (error.isRateLimited()) {
      const resetTime = error.getRateLimitReset();
      console.log(`Rate limited! Try again after ${resetTime}`);
    } else if (error.isNotFound()) {
      console.log("Repository not found!");
    } else {
      console.log(`API error: ${error.message} (${error.status})`);
    }
  } else {
    console.log(`Other error: ${error.message}`);
  }
}
```

## Rate Limiting

The client uses a token bucket algorithm to respect GitHub's rate limits. You can configure the rate limit when creating the client:

```typescript
// Limit to 5 requests per second
const client = new GitHubClient({ rateLimit: 5 });
```

The client will automatically wait when necessary to avoid hitting rate limits.