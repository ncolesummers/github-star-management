/**
 * GitHub API Client
 * 
 * This module exports the GitHub API client and related utilities.
 * It provides functionality for interacting with GitHub's REST API,
 * handling authentication, rate limiting, and pagination.
 */

export { GitHubClient } from "./github_client.ts";
export { GitHubAPIError, NetworkError } from "./errors.ts";
export const API_VERSION = "v3";