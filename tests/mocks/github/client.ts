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

  /**
   * Record a method call for later inspection
   */
  private recordCall(method: string, args: any[]): void {
    const calls = this.calls.get(method) || [];
    calls.push(args);
    this.calls.set(method, calls);
  }

  /**
   * Add a mock response for a specific method
   */
  addMockResponse(method: string, response: any): void {
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
  getCallArgs(method: string, index = 0): any[] | undefined {
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
  async getStarredRepos(options?: RequestOptions): Promise<Repository[]> {
    return this.responses.get("getStarredRepos") || [];
  }

  /**
   * Get all starred repositories (handling pagination)
   */
  async getAllStarredRepos(options?: RequestOptions): Promise<Repository[]> {
    return this.responses.get("getAllStarredRepos") || [];
  }

  /**
   * Star a repository
   */
  async starRepo(owner: string, repo: string): Promise<void> {
    // Implementation not needed, just recording the call
  }

  /**
   * Unstar a repository
   */
  async unstarRepo(owner: string, repo: string): Promise<void> {
    // Implementation not needed, just recording the call
  }

  /**
   * Check if a repository is starred
   */
  async isRepoStarred(owner: string, repo: string): Promise<boolean> {
    return this.responses.get("isRepoStarred") || false;
  }

  /**
   * Get repository details
   */
  async getRepo(owner: string, repo: string): Promise<Repository | null> {
    return this.responses.get("getRepo") || null;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    return this.responses.get("getCurrentUser") || null;
  }
}
