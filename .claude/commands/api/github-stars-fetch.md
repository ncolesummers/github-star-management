# Implement GitHub Stars Fetch Functionality for $ARGUMENTS

You're implementing a robust GitHub stars fetching mechanism with pagination and
error handling. The $ARGUMENTS parameter specifies any specific requirements or
constraints for the implementation.

Follow these steps:

1. **API Requirements Analysis**
   - Review GitHub API documentation for the starred repositories endpoint
   - Understand pagination mechanisms for potentially thousands of stars
   - Identify rate limiting considerations
   - Consider authentication requirements and token handling

2. **Type Definition Implementation**
   - Create TypeScript interfaces for GitHub API responses in `src/core/models/`
   - Define repository type with all needed metadata
   - Ensure proper optional/required property definitions
   - Consider how to handle starred_at timestamp

3. **Client Method Implementation**
   - Implement fetch method in `src/core/api/github_client.ts`
   - Add robust pagination handling for large collections
   - Implement proper error handling for network and API errors
   - Add rate limit awareness and backoff strategies

4. **Testing Implementation**
   - Create mock responses for starred repositories
   - Write unit tests for pagination handling
   - Test error scenarios and recovery
   - Verify proper data transformation

5. **Service Integration**
   - Connect API client to appropriate service class
   - Implement caching for performance optimization
   - Add logging for debugging and monitoring
   - Ensure type safety throughout the implementation

## Example Implementation

```typescript
// src/core/api/github_client.ts
async getStarredRepositories(options: {
  per_page?: number;
  sort?: 'created' | 'updated';
  direction?: 'asc' | 'desc';
}): Promise<Repository[]> {
  const perPage = options.per_page || 100;
  const sort = options.sort || 'created';
  const direction = options.direction || 'desc';
  let page = 1;
  let hasMore = true;
  const allRepos: Repository[] = [];
  
  while (hasMore) {
    try {
      const response = await this.request<Repository[]>(
        `/user/starred?page=${page}&per_page=${perPage}&sort=${sort}&direction=${direction}`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      
      if (response.length === 0) {
        hasMore = false;
      } else {
        allRepos.push(...response);
        page++;
      }
      
      // Check rate limit headers and pause if needed
      const rateLimit = parseInt(response.headers.get('x-ratelimit-remaining') || '1000');
      if (rateLimit < 10) {
        const resetTime = parseInt(response.headers.get('x-ratelimit-reset') || '0');
        const waitTime = (resetTime * 1000) - Date.now() + 1000; // Add 1s buffer
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        // Handle rate limiting with exponential backoff
        const waitTime = Math.pow(2, page) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error; // Re-throw other errors
      }
    }
  }
  
  return allRepos;
}
```
