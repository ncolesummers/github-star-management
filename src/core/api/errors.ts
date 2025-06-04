/**
 * Custom error classes for GitHub API
 */

/**
 * GitHub API Error
 * Represents an error response from the GitHub API
 */
export class GitHubAPIError extends Error {
  /**
   * Create a new GitHub API error
   *
   * @param message Error message
   * @param status HTTP status code
   * @param response Original response object
   */
  constructor(
    message: string,
    public status: number,
    public response?: Response,
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }

  /**
   * Check if this is a not found error (404)
   */
  isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimited(): boolean {
    return this.status === 403 &&
      this.response?.headers.get("x-ratelimit-remaining") === "0";
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Get the rate limit reset time if available
   *
   * @returns Date when rate limit resets, or null if not available
   */
  getRateLimitReset(): Date | null {
    const resetHeader = this.response?.headers.get("x-ratelimit-reset");
    if (resetHeader) {
      // Convert Unix timestamp to Date
      return new Date(parseInt(resetHeader, 10) * 1000);
    }
    return null;
  }
}

/**
 * Network Error
 * Represents a network-level error (not an API response error)
 */
export class NetworkError extends Error {
  constructor(message: string, public override cause?: unknown) {
    super(message);
    this.name = "NetworkError";
  }
}
