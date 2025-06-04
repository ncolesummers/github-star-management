/**
 * Mock GitHub client for service testing
 *
 * This implementation allows us to simulate GitHub API behavior
 * without making actual network requests.
 */

import type {
  Repository,
  RequestOptions,
  User,
} from "../../../src/core/models/mod.ts";

/**
 * Mock GitHub client implementation for testing
 */
export class MockGitHubClient {
  private responses: Map<string, unknown> = new Map();
  private calls: Map<string, unknown[][]> = new Map();

  constructor() {
    // Auto-bind all methods to track calls
    for (
      const key of Object.getOwnPropertyNames(
        MockGitHubClient.prototype,
      )
    ) {
      if (
        key !== "constructor" &&
        typeof (this as Record<string, unknown>)[key] === "function"
      ) {
        const method = (this as Record<string, unknown>)[key] as (
          ...args: unknown[]
        ) => unknown;
        (this as Record<string, unknown>)[key] = (...args: unknown[]) => {
          this.recordCall(key, args);
          return method.apply(this, args);
        };
      }
    }
  }

  /**
   * Record a method call for later inspection
   */
  private recordCall(method: string, args: unknown[]): void {
    const calls = this.calls.get(method) || [];
    calls.push(args);
    this.calls.set(method, calls);
  }

  /**
   * Add a mock response for a specific method
   */
  addMockResponse(method: string, response: unknown): void {
    this.responses.set(method, response);
  }

  /**
   * Get the number of calls for a specific method
   */
  getCallCount(method: string): number {
    return this.calls.get(method)?.length || 0;
  }

  /**
   * Get the arguments for a specific call
   */
  getCallArgs(method: string, index = 0): unknown[] | undefined {
    return this.calls.get(method)?.[index];
  }

  /**
   * Reset all mock responses and call history
   */
  reset(): void {
    this.responses.clear();
    this.calls.clear();
  }

  // Mock API methods

  /**
   * Get starred repositories for the current user
   */
  getStarredRepos(_options?: RequestOptions): Promise<Repository[]> {
    return Promise.resolve(
      this.responses.get("getStarredRepos") as Repository[] || [],
    );
  }

  /**
   * Get all starred repositories (handling pagination)
   */
  getAllStarredRepos(_options?: RequestOptions): Promise<Repository[]> {
    return Promise.resolve(
      this.responses.get("getAllStarredRepos") as Repository[] || [],
    );
  }

  /**
   * Star a repository
   */
  starRepo(_owner: string, _repo: string): Promise<void> {
    // Implementation not needed, just recording the call
    return Promise.resolve();
  }

  /**
   * Unstar a repository
   */
  unstarRepo(_owner: string, _repo: string): Promise<void> {
    // Implementation not needed, just recording the call
    return Promise.resolve();
  }

  /**
   * Check if a repository is starred
   */
  isRepoStarred(_owner: string, _repo: string): Promise<boolean> {
    return Promise.resolve(
      this.responses.get("isRepoStarred") as boolean || false,
    );
  }

  /**
   * Get repository details
   */
  getRepo(_owner: string, _repo: string): Promise<Repository | null> {
    return Promise.resolve(
      this.responses.get("getRepo") as Repository | null || null,
    );
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Promise<User | null> {
    return Promise.resolve(
      this.responses.get("getCurrentUser") as User | null || null,
    );
  }
}
