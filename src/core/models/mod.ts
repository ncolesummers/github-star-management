/**
 * Type definitions and models
 * 
 * This module exports TypeScript interfaces and types for GitHub entities
 * and application-specific models.
 */

/**
 * GitHub User entity
 */
export interface User {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  html_url: string;
  name?: string;
  email?: string;
  bio?: string;
}

/**
 * GitHub Repository License
 */
export interface License {
  key: string;
  name: string;
  url: string;
  spdx_id?: string;
}

/**
 * GitHub Repository entity
 */
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: User;
  description: string | null;
  html_url: string;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  license: License | null;
  topics: string[];
}

/**
 * GitHub API request options
 */
export interface RequestOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  direction?: "asc" | "desc";
  owner?: string;
  repo?: string;
}

/**
 * GitHub client configuration
 */
export interface GitHubClientConfig {
  token: string;
  baseUrl?: string;
  rateLimit?: number;
  retryDelay?: number;
}

/**
 * Star cleanup options
 */
export interface CleanupOptions {
  cutoffMonths: number;
  dryRun: boolean;
  skipArchived?: boolean;
  skipOutdated?: boolean;
}

/**
 * Star cleanup results
 */
export interface CleanupResults {
  totalReviewed: number;
  removed: number;
  archived: number;
  outdated: number;
  skipped: number;
}

/**
 * Star category definition
 */
export interface StarCategory {
  name: string;
  pattern: string;
}

/**
 * Categorized stars result
 */
export interface CategorizedStars {
  [category: string]: Repository[];
}