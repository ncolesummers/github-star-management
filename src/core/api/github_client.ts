/**
 * GitHub API Client
 * 
 * Provides methods for interacting with the GitHub REST API,
 * with built-in handling for authentication, rate limiting, and pagination.
 */

import { TokenBucket } from "../../utils/rate_limit.ts";
import { GitHubAPIError, NetworkError } from "./errors.ts";
import { Repository, User, GitHubClientConfig, RequestOptions } from "../models/mod.ts";

/**
 * GitHub API client implementation
 */
export class GitHubClient {
  private baseUrl: string;
  private token: string;
  private rateLimiter: TokenBucket;
  private retryDelay: number;

  /**
   * Create a new GitHub API client
   * 
   * @param config Client configuration
   */
  constructor(config: GitHubClientConfig) {
    this.baseUrl = config.baseUrl || "https://api.github.com";
    this.token = config.token;
    
    // Set up rate limiter (default: 5 requests per second)
    const rateLimit = config.rateLimit || 5;
    this.rateLimiter = new TokenBucket(rateLimit, rateLimit / 10);
    
    // Set retry delay for rate limit errors (default: 5 seconds)
    this.retryDelay = config.retryDelay || 5000;
  }

  /**
   * Make an authenticated request to the GitHub API
   * 
   * @param path API endpoint path
   * @param options Request options
   * @returns Response data
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure path starts with a slash
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    const url = this.baseUrl + path;
    
    // Set up request headers
    const headers = new Headers({
      "Accept": "application/vnd.github.v3+json",
      "Authorization": `token ${this.token}`,
      "User-Agent": "github-stars-management",
      ...options.headers,
    });

    // Wait for rate limit token
    await this.rateLimiter.consume();

    try {
      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle successful response
      if (response.ok) {
        // Handle 204 No Content
        if (response.status === 204) {
          return {} as T;
        }
        
        // Parse JSON response
        return await response.json() as T;
      }

      // Handle error response
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `HTTP error ${response.status}`;
      
      throw new GitHubAPIError(
        `GitHub API error: ${response.status} ${errorMessage}`,
        response.status,
        response
      );
    } catch (error) {
      // Handle rate limiting
      if (error instanceof GitHubAPIError && error.isRateLimited()) {
        const resetDate = error.getRateLimitReset();
        const waitTime = resetDate 
          ? Math.max(0, resetDate.getTime() - Date.now())
          : this.retryDelay;
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Retry the request after waiting
        return this.request<T>(path, options);
      }
      
      // Re-throw GitHub API errors
      if (error instanceof GitHubAPIError) {
        throw error;
      }
      
      // Convert other errors to NetworkError
      throw new NetworkError(
        `Network error while accessing ${url}: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get starred repositories for the current user
   * 
   * @param options Request options
   * @returns Array of repositories
   */
  async getStarredRepos(options: RequestOptions = {}): Promise<Repository[]> {
    const { page = 1, perPage = 30 } = options;
    
    const query = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    
    return this.request<Repository[]>(`/user/starred?${query}`);
  }

  /**
   * Get all starred repositories (handling pagination)
   * 
   * @param options Request options
   * @returns Array of all repositories across all pages
   */
  async getAllStarredRepos(options: RequestOptions = {}): Promise<Repository[]> {
    const { perPage = 30 } = options;
    let page = 1;
    const allRepos: Repository[] = [];
    
    // Keep fetching pages until we get an empty response
    while (true) {
      const repos = await this.getStarredRepos({
        ...options,
        page,
        perPage,
      });
      
      if (repos.length === 0) {
        break;
      }
      
      allRepos.push(...repos);
      page++;
    }
    
    return allRepos;
  }

  /**
   * Star a repository
   * 
   * @param owner Repository owner
   * @param repo Repository name
   */
  async starRepo(owner: string, repo: string): Promise<void> {
    await this.request<void>(`/user/starred/${owner}/${repo}`, {
      method: "PUT",
    });
  }

  /**
   * Unstar a repository
   * 
   * @param owner Repository owner
   * @param repo Repository name
   */
  async unstarRepo(owner: string, repo: string): Promise<void> {
    await this.request<void>(`/user/starred/${owner}/${repo}`, {
      method: "DELETE",
    });
  }

  /**
   * Check if a repository is starred
   * 
   * @param owner Repository owner
   * @param repo Repository name
   * @returns True if starred, false otherwise
   */
  async isRepoStarred(owner: string, repo: string): Promise<boolean> {
    try {
      await this.request<void>(`/user/starred/${owner}/${repo}`);
      return true;
    } catch (error) {
      if (error instanceof GitHubAPIError && error.isNotFound()) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get repository details
   * 
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Repository details or null if not found
   */
  async getRepo(owner: string, repo: string): Promise<Repository | null> {
    try {
      return await this.request<Repository>(`/repos/${owner}/${repo}`);
    } catch (error) {
      if (error instanceof GitHubAPIError && error.isNotFound()) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * 
   * @returns User details
   */
  async getCurrentUser(): Promise<User> {
    return this.request<User>("/user");
  }
}