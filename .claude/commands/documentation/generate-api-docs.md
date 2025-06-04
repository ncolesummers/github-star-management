# Generate API Documentation for $ARGUMENTS

You're generating comprehensive API documentation for the GitHub Stars
Management project. The $ARGUMENTS parameter specifies the component or module
to document.

Follow these steps:

1. **Documentation Requirements Analysis**
   - Understand the component specified in $ARGUMENTS
   - Identify key classes, methods, and interfaces to document
   - Consider the target audience and required detail level
   - Think about formatting and organization

2. **Code Analysis**
   - Examine the source code for the specified component
   - Identify public API surface and important implementation details
   - Look for existing documentation comments
   - Note usage patterns and examples

3. **Documentation Structure Design**
   - Think deeply about optimal documentation organization
   - Create a consistent format for classes and methods
   - Plan for examples and usage guidelines
   - Design clear method signature documentation

4. **Documentation Generation**
   - Create or update the documentation file in `docs/api/`
   - Document each class, method, and interface
   - Include parameter and return type descriptions
   - Add usage examples for common scenarios

5. **Cross-Referencing**
   - Add links to related components
   - Reference relevant GitHub API documentation
   - Link to example code and tutorials
   - Ensure navigation between documentation sections

## Example Implementation

For the GitHub API client, the documentation should include:

````markdown
# GitHub API Client

The `GitHubClient` class provides a type-safe interface to GitHub's REST API v3,
with specific focus on star management operations.

## Constructor

```typescript
constructor(options: GitHubClientOptions)
```
````

Creates a new GitHub API client instance.

### Parameters

- `options`: Configuration options for the client
  - `token`: GitHub personal access token
  - `baseUrl`: Optional custom API base URL (defaults to
    'https://api.github.com')
  - `userAgent`: Optional custom user agent

### Example

```typescript
const client = new GitHubClient({
  token: Deno.env.get("GITHUB_TOKEN"),
});
```

## Methods

### getStarredRepositories

```typescript
async getStarredRepositories(options?: {
  per_page?: number;
  sort?: 'created' | 'updated';
  direction?: 'asc' | 'desc';
}): Promise<Repository[]>
```

Retrieves all repositories starred by the authenticated user.

#### Parameters

- `options`: Optional parameters for the request
  - `per_page`: Number of results per page (default: 100, max: 100)
  - `sort`: Sort by 'created' or 'updated' (default: 'created')
  - `direction`: Sort direction 'asc' or 'desc' (default: 'desc')

#### Returns

An array of `Repository` objects representing the starred repositories.

#### Example

```typescript
// Get all stars, sorted by most recently starred first
const stars = await client.getStarredRepositories({
  sort: "created",
  direction: "desc",
});

// Get all stars, sorted by recently updated first
const recentlyUpdated = await client.getStarredRepositories({
  sort: "updated",
  direction: "desc",
});
```

#### Rate Limiting

This method handles pagination automatically and implements rate limit
awareness. If rate limits are approaching, the method will slow down requests to
avoid hitting limits.

```
```
