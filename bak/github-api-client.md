# GitHub API Client Implementation Guide

## Overview

This document provides detailed implementation guidance for the GitHub API
client used in the Deno migration. The client handles authentication, rate
limiting, error handling, and response processing for all GitHub API
interactions.

## Architecture

The GitHub API client follows a layered design:

```
GitHubClient (high-level, user-facing methods)
  │
  ├─ RESTClient (handles HTTP operations, rate limiting, retries)
  │    │
  │    └─ RateLimiter (token bucket implementation)
  │
  └─ ResponseProcessor (transforms API responses to domain models)
```

## Core Components

### 1. GitHubClient Class

The main class exposing user-facing methods for GitHub operations.

```typescript
// src/core/api/github.ts
export class GitHubClient {
  private restClient: RESTClient;
  private processor: ResponseProcessor;

  constructor(options: GitHubClientOptions = {}) {
    this.restClient = new RESTClient({
      baseUrl: options.baseUrl || "https://api.github.com",
      token: options.token || Deno.env.get("GITHUB_TOKEN"),
      rateLimit: options.rateLimit || 10,
      maxRetries: options.maxRetries || 3,
    });

    this.processor = new ResponseProcessor();
  }

  // Star operations
  async getStarredRepos(options?: StarredRepoOptions): Promise<Repository[]>;
  async getAllStarredRepos(options?: PaginationOptions): Promise<Repository[]>;
  async starRepo(owner: string, repo: string): Promise<void>;
  async unstarRepo(owner: string, repo: string): Promise<void>;
  async isRepoStarred(owner: string, repo: string): Promise<boolean>;

  // Search operations
  async searchRepos(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult<Repository>>;

  // User operations
  async getCurrentUser(): Promise<User>;

  // Repository operations
  async getRepo(owner: string, repo: string): Promise<Repository>;
}
```

### 2. RESTClient Class

Handles HTTP interactions, authentication, and rate limiting.

```typescript
// src/core/api/rest_client.ts
export class RESTClient {
  private baseUrl: string;
  private token: string;
  private rateLimiter?: RateLimiter;
  private maxRetries: number;

  constructor(options: RESTClientOptions) {
    this.baseUrl = options.baseUrl;
    this.token = options.token || "";
    this.maxRetries = options.maxRetries || 3;

    if (options.rateLimit) {
      this.rateLimiter = new RateLimiter(options.rateLimit);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    // Prepare URL (handle absolute vs. relative endpoints)
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${
        endpoint.startsWith("/") ? endpoint : `/${endpoint}`
      }`;

    // Prepare headers
    const headers = new Headers(options.headers);
    if (this.token && !headers.has("Authorization")) {
      headers.set("Authorization", `token ${this.token}`);
    }
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/vnd.github.v3+json");
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: options.method || "GET",
      headers,
      body: options.body,
      signal: options.signal,
    };

    // Process with retries and rate limiting
    return await this.processRequest<T>(url, requestOptions);
  }

  private async processRequest<T>(
    url: string,
    options: RequestInit,
    retryCount = 0,
  ): Promise<T> {
    try {
      // Wait for rate limit token if needed
      if (this.rateLimiter) {
        await this.rateLimiter.acquire();
      }

      // Execute the request
      const response = await fetch(url, options);

      // Handle rate limiting headers from GitHub
      this.updateRateLimitFromResponse(response);

      // Handle response
      if (response.ok) {
        // No content - return empty object
        if (response.status === 204) {
          return {} as T;
        }

        // Check content type
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return await response.json() as T;
        }

        // Return text response as is
        return await response.text() as unknown as T;
      }

      // Handle specific error cases
      if (response.status === 403 && this.isRateLimited(response)) {
        if (retryCount < this.maxRetries) {
          const resetTime = this.getRateLimitReset(response);
          const waitTime = resetTime * 1000 - Date.now() + 1000; // Add 1s buffer

          if (waitTime > 0 && waitTime < 3600000) { // Don't wait more than an hour
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            return this.processRequest<T>(url, options, retryCount + 1);
          }
        }
      }

      // Handle retriable errors
      if (
        this.isRetriableError(response.status) && retryCount < this.maxRetries
      ) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.processRequest<T>(url, options, retryCount + 1);
      }

      // Throw error for non-retriable responses
      throw new GitHubAPIError(
        `GitHub API error: ${response.status} ${response.statusText}`,
        response.status,
        response,
      );
    } catch (error) {
      // Handle fetch errors (network issues)
      if (error instanceof TypeError && retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.processRequest<T>(url, options, retryCount + 1);
      }

      // Re-throw other errors
      throw error;
    }
  }

  private isRateLimited(response: Response): boolean {
    return response.headers.get("x-ratelimit-remaining") === "0";
  }

  private getRateLimitReset(response: Response): number {
    const resetHeader = response.headers.get("x-ratelimit-reset");
    return resetHeader ? parseInt(resetHeader, 10) : 0;
  }

  private isRetriableError(status: number): boolean {
    return status >= 500 || status === 429;
  }

  private updateRateLimitFromResponse(response: Response): void {
    // Update internal rate limiter based on GitHub's rate limit headers
    const remaining = response.headers.get("x-ratelimit-remaining");
    const limit = response.headers.get("x-ratelimit-limit");
    const reset = response.headers.get("x-ratelimit-reset");

    if (remaining && limit && reset && this.rateLimiter) {
      this.rateLimiter.updateFromHeaders(
        parseInt(remaining, 10),
        parseInt(limit, 10),
        parseInt(reset, 10),
      );
    }
  }
}
```

### 3. Rate Limiter Implementation

Advanced rate limiter that adapts to GitHub's rate limit headers.

```typescript
// src/core/api/rate_limiter.ts
export class RateLimiter {
  private tokens: number;
  private capacity: number;
  private lastRefill: number;
  private resetTime: number = 0;

  constructor(
    capacity: number,
    private refillRate: number = capacity / 60, // Default: refill full capacity over an hour
    private refillInterval: number = 1000, // 1 second intervals
  ) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();

    // If we have a GitHub reset time and it's in the future, use that
    if (this.resetTime > 0 && this.resetTime * 1000 > now) {
      const timeTillReset = this.resetTime * 1000 - now;
      this.refillRate = this.capacity / (timeTillReset / 1000);
    }

    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.min(
      this.capacity - this.tokens,
      Math.floor((timePassed / this.refillInterval) * this.refillRate),
    );

    if (tokensToAdd > 0) {
      this.tokens += tokensToAdd;
      this.lastRefill = now;
    }
  }

  async acquire(tokens = 1): Promise<void> {
    while (true) {
      this.refill();

      if (this.tokens >= tokens) {
        this.tokens -= tokens;
        return;
      }

      // Calculate wait time to get enough tokens
      const tokensNeeded = tokens - this.tokens;
      const timeToWait = (tokensNeeded / this.refillRate) * this.refillInterval;

      // Don't wait more than a reasonable time (30 seconds)
      const waitTime = Math.min(timeToWait, 30000);

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // Update from GitHub API rate limit headers
  updateFromHeaders(remaining: number, limit: number, reset: number): void {
    // Update capacity if it's changed
    if (limit !== this.capacity) {
      this.capacity = limit;
    }

    // Use GitHub's remaining count
    this.tokens = remaining;

    // Update reset time
    this.resetTime = reset;
  }
}
```

### 4. Response Processor

Transforms GitHub API responses into domain objects.

```typescript
// src/core/api/response_processor.ts
import type { Repository, SearchResult, User } from "../models/mod.ts";

export class ResponseProcessor {
  processRepository(data: any): Repository {
    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      owner: {
        login: data.owner.login,
        id: data.owner.id,
        avatar_url: data.owner.avatar_url,
        url: data.owner.url,
        html_url: data.owner.html_url,
      },
      private: data.private,
      html_url: data.html_url,
      description: data.description,
      fork: data.fork,
      url: data.url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
      stargazers_count: data.stargazers_count,
      watchers_count: data.watchers_count,
      language: data.language,
      forks_count: data.forks_count,
      archived: data.archived,
      disabled: data.disabled,
      license: data.license
        ? {
          key: data.license.key,
          name: data.license.name,
          url: data.license.url,
        }
        : null,
      topics: data.topics || [],
    };
  }

  processRepositories(data: any[]): Repository[] {
    return data.map((repo) => this.processRepository(repo));
  }

  processUser(data: any): User {
    return {
      id: data.id,
      login: data.login,
      avatar_url: data.avatar_url,
      name: data.name,
      bio: data.bio,
      url: data.url,
      html_url: data.html_url,
      created_at: data.created_at,
    };
  }

  processSearchResults<T>(
    data: any,
    processor: (item: any) => T,
  ): SearchResult<T> {
    return {
      total_count: data.total_count,
      incomplete_results: data.incomplete_results,
      items: data.items.map((item: any) => processor(item)),
    };
  }
}
```

## Advanced Features

### Pagination Handling

```typescript
// Extension to GitHubClient
async getAllItemsPaginated<T>(
  endpoint: string,
  options: PaginationOptions = {}
): Promise<T[]> {
  const { perPage = 100 } = options;
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;
  
  const separator = endpoint.includes("?") ? "&" : "?";
  
  while (hasMore) {
    const url = `${endpoint}${separator}page=${page}&per_page=${perPage}`;
    const response = await this.restClient.request<T[]>(url);
    
    if (response.length > 0) {
      allItems.push(...response);
      page++;
    } else {
      hasMore = false;
    }
  }
  
  return allItems;
}
```

### Caching Layer

```typescript
// src/core/api/cache.ts
export interface CacheOptions {
  ttl?: number; // Time to live in ms, default: 5 minutes
  maxSize?: number; // Max number of cached items, default: 100
}

export class APICache {
  private cache = new Map<string, { data: any; expires: number }>();
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes
    this.maxSize = options.maxSize || 100;
  }

  set(key: string, data: any): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.expires - b.expires)[0][0];
      this.cache.delete(oldest);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl,
    });
  }

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // Check if expired
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### Conditional Requests

```typescript
// Add to RESTClient
private etagCache = new Map<string, string>();

async conditionalRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T | null> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${this.baseUrl}${endpoint}`;
  
  // Add If-None-Match header if we have an ETag
  const headers = new Headers(options.headers);
  const etag = this.etagCache.get(url);
  
  if (etag) {
    headers.set("If-None-Match", etag);
  }
  
  options.headers = headers;
  
  // Make the request
  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body,
    signal: options.signal,
  });
  
  // Update ETag cache
  const newEtag = response.headers.get("etag");
  if (newEtag) {
    this.etagCache.set(url, newEtag);
  }
  
  // If 304 Not Modified, return null
  if (response.status === 304) {
    return null;
  }
  
  // Process normal response
  if (response.ok) {
    return await response.json() as T;
  }
  
  throw new GitHubAPIError(
    `GitHub API error: ${response.status} ${response.statusText}`,
    response.status,
    response
  );
}
```

## Implementation Examples

### Using the GitHub Client

```typescript
// Example: List all starred repositories
import { GitHubClient } from "./src/core/api/github.ts";

async function listStars() {
  const client = new GitHubClient({
    token: Deno.env.get("GITHUB_TOKEN"),
    rateLimit: 10,
  });

  try {
    const stars = await client.getAllStarredRepos();
    console.log(`Found ${stars.length} starred repositories`);

    // Show top 5 by star count
    const topStars = stars
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5);

    for (const repo of topStars) {
      console.log(`${repo.full_name}: ${repo.stargazers_count} stars`);
    }
  } catch (error) {
    console.error("Error fetching stars:", error.message);
  }
}

// Run if this module is executed directly
if (import.meta.main) {
  await listStars();
}
```

### Implementing a New API Feature

```typescript
// Adding repository topic operations to GitHubClient

async getRepoTopics(owner: string, repo: string): Promise<string[]> {
  const response = await this.restClient.request<{ names: string[] }>(
    `/repos/${owner}/${repo}/topics`,
    {
      headers: {
        "Accept": "application/vnd.github.mercy-preview+json"
      }
    }
  );
  
  return response.names;
}

async updateRepoTopics(
  owner: string, 
  repo: string, 
  topics: string[]
): Promise<void> {
  await this.restClient.request(
    `/repos/${owner}/${repo}/topics`,
    {
      method: "PUT",
      headers: {
        "Accept": "application/vnd.github.mercy-preview+json"
      },
      body: JSON.stringify({ names: topics })
    }
  );
}
```

## Error Handling

```typescript
// src/core/api/errors.ts
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }

  // Helper methods for specific error conditions
  isNotFound(): boolean {
    return this.status === 404;
  }

  isRateLimited(): boolean {
    return this.status === 403 &&
      this.response?.headers.get("x-ratelimit-remaining") === "0";
  }

  isAuthenticationError(): boolean {
    return this.status === 401;
  }

  isPermissionError(): boolean {
    return this.status === 403 && !this.isRateLimited();
  }

  getResetTime(): number | null {
    if (!this.response) return null;

    const resetHeader = this.response.headers.get("x-ratelimit-reset");
    return resetHeader ? parseInt(resetHeader, 10) : null;
  }

  // Format for easier debugging
  toString(): string {
    let result = `${this.name}: ${this.message} (HTTP ${this.status})`;

    if (this.isRateLimited()) {
      const reset = this.getResetTime();
      if (reset) {
        const resetDate = new Date(reset * 1000);
        result += `\nRate limit will reset at ${resetDate.toISOString()}`;
      }
    }

    if (this.context) {
      result += `\nContext: ${JSON.stringify(this.context, null, 2)}`;
    }

    return result;
  }
}
```

## Best Practices

1. **Modular Design**
   - Keep classes focused on a single responsibility
   - Use composition over inheritance
   - Inject dependencies for better testability

2. **Error Handling**
   - Create specific error subclasses for different error conditions
   - Include context information in errors
   - Implement proper logging and debugging

3. **Performance**
   - Use pagination efficiently
   - Implement proper caching
   - Minimize API calls with batch operations

4. **Testing**
   - Mock API responses for unit tests
   - Use interface segregation for easier mocking
   - Test error handling and edge cases

## Security Considerations

1. **Token Management**
   - Never hardcode tokens
   - Use environment variables or secure vaults
   - Support token rotation

2. **Rate Limit Handling**
   - Respect GitHub's rate limits
   - Implement exponential backoff
   - Consider using multiple tokens for high-volume operations

3. **Error Messages**
   - Don't expose sensitive information in error messages
   - Sanitize user inputs in request URLs

## Future Enhancements

1. **GraphQL Support**
   - Implement GitHub's GraphQL API for more efficient queries
   - Add schema validation for queries

2. **Webhooks Integration**
   - Support GitHub webhook verification
   - Process webhook payloads

3. **Advanced Authentication**
   - Support GitHub App authentication
   - Implement OAuth flow for user authentication

4. **Metrics Collection**
   - Track API usage and rate limit consumption
   - Implement circuit breaking for API protection
