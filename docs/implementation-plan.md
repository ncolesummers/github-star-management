# Step-by-Step Implementation Plan

This document outlines the detailed implementation steps for migrating GitHub
Stars Management from shell scripts to Deno TypeScript. Each phase has specific
deliverables and checkpoints to ensure a smooth transition.

## Phase 1: Project Setup and Core API Client

**Duration**: 1-2 weeks

### Week 1: Project Structure & GitHub API Client

#### Day 1-2: Initial Setup

1. Create Deno project structure:
   ```bash
   mkdir -p github-star-management/src/{cli,core/{api,models,services},utils}
   mkdir -p github-star-management/tests/{unit,integration,mocks}
   ```

2. Create deno.json configuration:
   ```json
   {
     "name": "github-star-management",
     "version": "1.0.0",
     "description": "Manage GitHub stars with Deno",
     "tasks": {
       "start": "deno run --allow-net --allow-env --allow-read --allow-write mod.ts",
       "dev": "deno run --allow-net --allow-env --allow-read --allow-write --watch mod.ts",
       "test": "deno test --allow-net --allow-env --allow-read",
       "lint": "deno lint",
       "fmt": "deno fmt"
     },
     "imports": {
       "@std/": "jsr:@std/",
       "@std/assert": "jsr:@std/assert@^1.0.0",
       "@std/cli": "jsr:@std/cli@^1.0.0",
       "@std/fs": "jsr:@std/fs@^1.0.0",
       "@std/datetime": "jsr:@std/datetime@^1.0.0",
       "chalk": "npm:chalk@^5.3.0",
       "zod": "npm:zod@^3.22.0"
     }
   }
   ```

3. Create mod.ts entry point:
   ```typescript
   // mod.ts - Entry point for the application

   import { parse } from "@std/cli";
   import { version } from "./src/version.ts";

   if (import.meta.main) {
     console.log(`GitHub Star Management v${version}`);
     console.log("Setup in progress - check back soon!");
   }

   // For imports
   export * from "./src/core/api/mod.ts";
   ```

#### Day 3-5: GitHub API Client Core

1. Create the token bucket rate limiter in `src/utils/rate_limit.ts`:
   ```typescript
   // src/utils/rate_limit.ts

   /**
    * Token bucket implementation for rate limiting API requests
    */
   export class TokenBucket {
     private tokens: number;
     private lastRefill: number;

     constructor(
       private capacity: number,
       private refillRate: number, // tokens per second
       private refillInterval: number = 1000, // milliseconds
     ) {
       this.tokens = capacity;
       this.lastRefill = Date.now();
     }

     private refill(): void {
       const now = Date.now();
       const timePassed = now - this.lastRefill;
       const tokensToAdd = Math.floor(
         (timePassed / this.refillInterval) * this.refillRate,
       );

       if (tokensToAdd > 0) {
         this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
         this.lastRefill = now;
       }
     }

     async consume(tokens = 1): Promise<void> {
       this.refill();

       if (this.tokens >= tokens) {
         this.tokens -= tokens;
         return;
       }

       // Calculate how long to wait for enough tokens
       const tokensNeeded = tokens - this.tokens;
       const timeToWait = (tokensNeeded / this.refillRate) *
         this.refillInterval;

       // Wait for tokens to become available
       await new Promise((resolve) => setTimeout(resolve, timeToWait));

       this.refill(); // Refill after waiting
       this.tokens -= tokens;
     }
   }
   ```

2. Create GitHub API error class in `src/core/api/errors.ts`:
   ```typescript
   // src/core/api/errors.ts

   /**
    * Custom error class for GitHub API errors
    */
   export class GitHubAPIError extends Error {
     constructor(
       message: string,
       public status: number,
       public response?: Response,
     ) {
       super(message);
       this.name = "GitHubAPIError";
     }

     isNotFound(): boolean {
       return this.status === 404;
     }

     isRateLimited(): boolean {
       return this.status === 403 &&
         this.response?.headers.get("x-ratelimit-remaining") === "0";
     }
   }
   ```

3. Create base REST client in `src/core/api/rest_client.ts`:
   ```typescript
   // src/core/api/rest_client.ts

   import { TokenBucket } from "../../utils/rate_limit.ts";
   import { GitHubAPIError } from "./errors.ts";

   export interface RESTClientOptions {
     baseUrl: string;
     token?: string;
     rateLimit?: number;
     maxRetries?: number;
   }

   export interface RequestOptions extends RequestInit {
     query?: Record<string, string>;
   }

   /**
    * Base REST client with rate limiting and retries
    */
   export class RESTClient {
     private baseUrl: string;
     private token: string;
     private rateLimiter?: TokenBucket;
     private maxRetries: number;

     constructor(options: RESTClientOptions) {
       this.baseUrl = options.baseUrl;
       this.token = options.token || "";
       this.maxRetries = options.maxRetries || 3;

       if (options.rateLimit) {
         this.rateLimiter = new TokenBucket(
           options.rateLimit * 2, // Burst capacity
           options.rateLimit,
         );
       }
     }

     /**
      * Make an HTTP request with rate limiting and retries
      */
     async request<T>(
       endpoint: string,
       options: RequestOptions = {},
     ): Promise<T> {
       // Wait for rate limit token if needed
       if (this.rateLimiter) {
         await this.rateLimiter.consume();
       }

       // Build URL
       let url = endpoint.startsWith("http")
         ? endpoint
         : `${this.baseUrl}${endpoint}`;

       // Add query parameters if provided
       if (options.query) {
         const params = new URLSearchParams();
         Object.entries(options.query).forEach(([key, value]) => {
           params.append(key, value);
         });

         url += url.includes("?")
           ? `&${params.toString()}`
           : `?${params.toString()}`;
       }

       // Set headers
       const headers = new Headers(options.headers);
       if (this.token && !headers.has("Authorization")) {
         headers.set("Authorization", `token ${this.token}`);
       }
       if (!headers.has("Accept") && !url.includes("api.github.com/graphql")) {
         headers.set("Accept", "application/vnd.github.v3+json");
       }

       const init = { ...options, headers };

       // Handle request with retries
       return this.executeRequest<T>(url, init);
     }

     /**
      * Execute request with retry logic
      */
     private async executeRequest<T>(
       url: string,
       init: RequestInit,
       attempt = 0,
     ): Promise<T> {
       try {
         const response = await fetch(url, init);

         // Handle successful response
         if (response.ok) {
           // Handle 204 No Content
           if (response.status === 204) {
             return {} as T;
           }

           // Parse JSON response
           return await response.json() as T;
         }

         // Handle rate limiting
         if (
           response.status === 403 &&
           response.headers.get("x-ratelimit-remaining") === "0"
         ) {
           if (attempt < this.maxRetries) {
             const resetHeader = response.headers.get("x-ratelimit-reset");
             if (resetHeader) {
               const resetTime = parseInt(resetHeader, 10) * 1000;
               const now = Date.now();
               const waitTime = resetTime - now + 1000; // Add 1s buffer

               if (waitTime > 0 && waitTime < 60 * 60 * 1000) { // Max 1 hour wait
                 console.warn(
                   `Rate limited, waiting ${waitTime}ms until reset`,
                 );
                 await new Promise((resolve) => setTimeout(resolve, waitTime));
                 return this.executeRequest<T>(url, init, attempt + 1);
               }
             }
           }
         }

         // Handle server errors with retries
         if (response.status >= 500 && attempt < this.maxRetries) {
           const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
           console.warn(
             `Server error ${response.status}, retrying in ${delay}ms`,
           );
           await new Promise((resolve) => setTimeout(resolve, delay));
           return this.executeRequest<T>(url, init, attempt + 1);
         }

         // Handle other errors
         throw new GitHubAPIError(
           `GitHub API error: ${response.status} ${response.statusText}`,
           response.status,
           response,
         );
       } catch (error) {
         // Handle network errors with retries
         if (error instanceof TypeError && attempt < this.maxRetries) {
           const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
           console.warn(`Network error, retrying in ${delay}ms`);
           await new Promise((resolve) => setTimeout(resolve, delay));
           return this.executeRequest<T>(url, init, attempt + 1);
         }

         // Re-throw other errors
         throw error;
       }
     }
   }
   ```

4. Create GitHub API client in `src/core/api/github.ts`:
   ```typescript
   // src/core/api/github.ts

   import { RESTClient } from "./rest_client.ts";

   export interface GitHubClientOptions {
     token?: string;
     baseUrl?: string;
     rateLimit?: number;
     maxRetries?: number;
   }

   export interface StarredRepoOptions {
     page?: number;
     perPage?: number;
     sort?: "created" | "updated";
     direction?: "asc" | "desc";
   }

   /**
    * GitHub API client with rate limiting
    */
   export class GitHubClient {
     private client: RESTClient;

     constructor(options: GitHubClientOptions = {}) {
       this.client = new RESTClient({
         baseUrl: options.baseUrl || "https://api.github.com",
         token: options.token || Deno.env.get("GITHUB_TOKEN") || "",
         rateLimit: options.rateLimit || 10,
         maxRetries: options.maxRetries || 3,
       });
     }

     /**
      * Get starred repositories with pagination
      */
     async getStarredRepos(options: StarredRepoOptions = {}): Promise<any[]> {
       const { page = 1, perPage = 100, sort, direction } = options;

       const query: Record<string, string> = {
         page: page.toString(),
         per_page: perPage.toString(),
       };

       if (sort) query.sort = sort;
       if (direction) query.direction = direction;

       return await this.client.request<any[]>("/user/starred", { query });
     }

     /**
      * Get all starred repositories (handles pagination automatically)
      */
     async getAllStarredRepos(): Promise<any[]> {
       const allRepos: any[] = [];
       let page = 1;
       let hasMore = true;

       while (hasMore) {
         const repos = await this.getStarredRepos({ page });
         allRepos.push(...repos);

         hasMore = repos.length > 0;
         page++;
       }

       return allRepos;
     }

     /**
      * Star a repository
      */
     async starRepo(owner: string, repo: string): Promise<void> {
       await this.client.request(`/user/starred/${owner}/${repo}`, {
         method: "PUT",
       });
     }

     /**
      * Unstar a repository
      */
     async unstarRepo(owner: string, repo: string): Promise<void> {
       await this.client.request(`/user/starred/${owner}/${repo}`, {
         method: "DELETE",
       });
     }

     /**
      * Check if a repository is starred
      */
     async isRepoStarred(owner: string, repo: string): Promise<boolean> {
       try {
         await this.client.request(`/user/starred/${owner}/${repo}`);
         return true;
       } catch (error) {
         if (error.status === 404) {
           return false;
         }
         throw error;
       }
     }
   }
   ```

#### Day 6-7: API Client Testing

1. Create test helper in `tests/helpers/mock_fetch.ts`:
   ```typescript
   // tests/helpers/mock_fetch.ts

   export interface MockResponse {
     status: number;
     body?: unknown;
     headers?: Record<string, string>;
   }

   export class MockFetch {
     private mocks = new Map<string, MockResponse | MockResponse[]>();
     private _calls: Array<{ url: string; request: Request }> = [];

     constructor() {
       this.fetch = this.fetch.bind(this);
     }

     mock(
       url: string,
       response: MockResponse,
       options: { method?: string } = {},
     ): void {
       const key = `${options.method || "GET"}:${url}`;
       this.mocks.set(key, response);
     }

     mockSequence(
       url: string,
       responses: MockResponse[],
       options: { method?: string } = {},
     ): void {
       const key = `${options.method || "GET"}:${url}`;
       this.mocks.set(key, responses);
     }

     async fetch(
       input: RequestInfo | URL,
       init?: RequestInit,
     ): Promise<Response> {
       const request = new Request(input, init);
       const url = request.url;
       const method = request.method;

       // Record this call
       this._calls.push({ url, request });

       // Look for a matching mock
       const key = `${method}:${url}`;
       let mockResponse = this.mocks.get(key);

       // If no exact match, try just the URL
       if (!mockResponse) {
         mockResponse = this.mocks.get(url);
       }

       if (!mockResponse) {
         throw new Error(`No mock response for ${method} ${url}`);
       }

       // Handle response sequence
       let response: MockResponse;
       if (Array.isArray(mockResponse)) {
         if (mockResponse.length === 0) {
           throw new Error(`Empty mock sequence for ${method} ${url}`);
         }

         response = mockResponse[0];

         // Update the sequence
         if (mockResponse.length > 1) {
           this.mocks.set(key, mockResponse.slice(1));
         } else {
           this.mocks.delete(key);
         }
       } else {
         response = mockResponse;
       }

       // Create the response
       const { status, body, headers = {} } = response;

       const responseInit: ResponseInit = {
         status,
         headers,
       };

       if (body === undefined) {
         return new Response(null, responseInit);
       }

       if (typeof body === "string") {
         return new Response(body, responseInit);
       }

       // JSON body
       return new Response(
         JSON.stringify(body),
         {
           ...responseInit,
           headers: {
             "Content-Type": "application/json",
             ...headers,
           },
         },
       );
     }

     get calls(): Array<{ url: string; request: Request }> {
       return [...this._calls];
     }

     reset(): void {
       this.mocks.clear();
       this._calls = [];
     }
   }
   ```

2. Create API client test in `tests/unit/api/github_test.ts`:
   ```typescript
   // tests/unit/api/github_test.ts

   import { assertEquals, assertRejects } from "@std/assert";
   import {
     GitHubAPIError,
     GitHubClient,
   } from "../../../src/core/api/github.ts";
   import { MockFetch } from "../../helpers/mock_fetch.ts";

   Deno.test("GitHubClient.getStarredRepos - fetches starred repositories", async () => {
     // Arrange
     const mockFetch = new MockFetch();

     // Mock the starred repos response
     mockFetch.mock("https://api.github.com/user/starred?page=1&per_page=100", {
       status: 200,
       body: [
         {
           id: 1,
           name: "repo1",
           full_name: "owner/repo1",
           description: "Test repo",
           stargazers_count: 100,
         },
       ],
     });

     // Replace global fetch with our mock
     const originalFetch = globalThis.fetch;
     globalThis.fetch = mockFetch.fetch;

     try {
       // Create client with test token
       const client = new GitHubClient({
         token: "test_token",
       });

       // Act
       const repos = await client.getStarredRepos();

       // Assert
       assertEquals(repos.length, 1);
       assertEquals(repos[0].name, "repo1");
       assertEquals(repos[0].full_name, "owner/repo1");

       // Check headers were set correctly
       const calls = mockFetch.calls;
       assertEquals(calls.length, 1);
       assertEquals(
         calls[0].request.headers.get("Authorization"),
         "token test_token",
       );
     } finally {
       // Restore original fetch
       globalThis.fetch = originalFetch;
     }
   });

   Deno.test("GitHubClient.getAllStarredRepos - handles pagination", async () => {
     // Arrange
     const mockFetch = new MockFetch();

     // Mock first page with content
     mockFetch.mock("https://api.github.com/user/starred?page=1&per_page=100", {
       status: 200,
       body: [{ id: 1, name: "repo1" }],
     });

     // Mock second page with content
     mockFetch.mock("https://api.github.com/user/starred?page=2&per_page=100", {
       status: 200,
       body: [{ id: 2, name: "repo2" }],
     });

     // Mock third page with empty response (end of pagination)
     mockFetch.mock("https://api.github.com/user/starred?page=3&per_page=100", {
       status: 200,
       body: [],
     });

     // Replace global fetch
     const originalFetch = globalThis.fetch;
     globalThis.fetch = mockFetch.fetch;

     try {
       const client = new GitHubClient({
         token: "test_token",
       });

       // Act
       const repos = await client.getAllStarredRepos();

       // Assert
       assertEquals(repos.length, 2);
       assertEquals(repos[0].name, "repo1");
       assertEquals(repos[1].name, "repo2");

       // Verify three API calls were made (for the three pages)
       assertEquals(mockFetch.calls.length, 3);
     } finally {
       globalThis.fetch = originalFetch;
     }
   });
   ```

### Week 2: Core Repository Models and Basic Operations

#### Day 8-9: TypeScript Models

1. Create repository model in `src/core/models/repository.ts`:
   ```typescript
   // src/core/models/repository.ts

   export interface Repository {
     id: number;
     name: string;
     full_name: string;
     owner: {
       login: string;
       id: number;
       avatar_url: string;
       url: string;
       html_url: string;
     };
     private: boolean;
     html_url: string;
     description: string | null;
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
     license: {
       key: string;
       name: string;
       url: string;
     } | null;
     topics: string[];
   }
   ```

2. Create basic models in `src/core/models/mod.ts`:
   ```typescript
   // src/core/models/mod.ts

   export type { Repository } from "./repository.ts";

   export interface Category {
     name: string;
     pattern: string;
     displayName?: string;
   }

   export interface User {
     id: number;
     login: string;
     avatar_url: string;
     name: string | null;
     bio: string | null;
     url: string;
     html_url: string;
     created_at: string;
   }

   export interface CleanupOptions {
     cutoffMonths?: number;
     dryRun?: boolean;
     excludeList?: string[];
     verbose?: boolean;
   }

   export interface CleanupResult {
     totalReviewed: number;
     removed: number;
     archived: number;
     outdated: number;
   }
   ```

#### Day 10-12: Base Star Service

1. Create Star Service in `src/core/services/star_service.ts`:
   ```typescript
   // src/core/services/star_service.ts

   import { GitHubClient } from "../api/github.ts";
   import {
     Category,
     CleanupOptions,
     CleanupResult,
     Repository,
   } from "../models/mod.ts";

   export class StarService {
     private client: GitHubClient;

     constructor(
       options: { token?: string; rateLimit?: number; client?: GitHubClient } =
         {},
     ) {
       this.client = options.client || new GitHubClient({
         token: options.token,
         rateLimit: options.rateLimit || 10,
       });
     }

     /**
      * Get all starred repositories
      */
     async getAllStars(): Promise<Repository[]> {
       return await this.client.getAllStarredRepos() as Repository[];
     }

     /**
      * Backup starred repositories to JSON file
      */
     async backupStars(outputPath: string): Promise<void> {
       const stars = await this.getAllStars();
       const jsonData = JSON.stringify(stars, null, 2);

       await Deno.writeTextFile(outputPath, jsonData);
     }

     /**
      * Cleanup starred repositories (archived and outdated)
      */
     async cleanupStars(options: CleanupOptions = {}): Promise<CleanupResult> {
       const {
         cutoffMonths = 24,
         dryRun = false,
         excludeList = [],
         verbose = false,
       } = options;

       const stars = await this.getAllStars();
       const cutoffDate = new Date();
       cutoffDate.setMonth(cutoffDate.getMonth() - cutoffMonths);

       let removed = 0;
       let archived = 0;
       let outdated = 0;

       for (const repo of stars) {
         // Skip excluded repositories
         if (excludeList.includes(repo.full_name)) {
           if (verbose) {
             console.log(`Skipping excluded repo: ${repo.full_name}`);
           }
           continue;
         }

         let shouldRemove = false;
         let reason = "";

         // Check if archived
         if (repo.archived) {
           shouldRemove = true;
           reason = "archived";
           archived++;
         } // Check if outdated
         else if (new Date(repo.pushed_at) < cutoffDate) {
           shouldRemove = true;
           reason = `no activity since ${repo.pushed_at}`;
           outdated++;
         }

         if (shouldRemove) {
           console.log(
             `${
               dryRun ? "[DRY RUN] Would unstar" : "Unstarring"
             }: ${repo.full_name} (${reason})`,
           );

           if (!dryRun) {
             const [owner, name] = repo.full_name.split("/");
             await this.client.unstarRepo(owner, name);
           }

           removed++;
         }
       }

       return {
         totalReviewed: stars.length,
         removed,
         archived,
         outdated,
       };
     }
   }
   ```

#### Day 13-14: Initial CLI Framework

1. Create CLI types in `src/cli/types.ts`:
   ```typescript
   // src/cli/types.ts

   export interface CommandContext {
     flags: Record<string, unknown>;
     args: string[];
     stdout: Deno.Writer;
     stderr: Deno.Writer;
     env: Record<string, string>;
   }

   export type CommandHandler = (
     ctx: CommandContext,
   ) => Promise<number> | number;
   ```

2. Create the CLI cleanup command in `src/cli/commands/cleanup.ts`:
   ```typescript
   // src/cli/commands/cleanup.ts

   import { parse } from "@std/cli";
   import { StarService } from "../../core/services/star_service.ts";
   import { CommandHandler } from "../types.ts";

   export const clean: CommandHandler = async (ctx) => {
     // Parse command-specific flags
     const flags = parse(ctx.args, {
       boolean: ["dry-run", "help", "verbose"],
       string: ["cutoff-months", "exclude"],
       alias: {
         h: "help",
         d: "dry-run",
         c: "cutoff-months",
         e: "exclude",
         v: "verbose",
       },
       default: {
         "dry-run": false,
         "cutoff-months": "24",
         "verbose": false,
       },
     });

     // Show help if requested
     if (flags.help) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`
   GitHub Star Cleanup

   USAGE:
     star-management cleanup [options]

   OPTIONS:
     --dry-run, -d          Run without making changes
     --cutoff-months, -c    Months of inactivity before removal (default: 24)
     --exclude, -e          Comma-separated list of repos to exclude (owner/name format)
     --verbose, -v          Show detailed output
     --help, -h             Show this help message

   EXAMPLES:
     star-management cleanup --dry-run
     star-management cleanup --cutoff-months 12
     star-management cleanup --exclude owner/repo1,owner/repo2
   `),
       );
       return 0;
     }

     try {
       const cutoffMonths = parseInt(flags["cutoff-months"] as string, 10);
       const dryRun = flags["dry-run"] as boolean;
       const verbose = flags["verbose"] as boolean;
       const excludeList = flags.exclude
         ? (flags.exclude as string).split(",")
         : [];

       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`🧹 Starting GitHub stars cleanup...\n`),
       );
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`Cutoff date: ${cutoffMonths} months of inactivity\n`),
       );

       if (dryRun) {
         Deno.writeAllSync(
           ctx.stdout,
           encoder.encode(`DRY RUN: No stars will be removed\n`),
         );
       }

       if (excludeList.length > 0) {
         Deno.writeAllSync(
           ctx.stdout,
           encoder.encode(`Excluding: ${excludeList.join(", ")}\n`),
         );
       }

       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`=========================================\n`),
       );

       // Create service and run cleanup
       const token = ctx.env.GITHUB_TOKEN || ctx.env.STAR_MANAGEMENT_TOKEN;
       const service = new StarService({ token });

       const result = await service.cleanupStars({
         cutoffMonths,
         dryRun,
         excludeList,
         verbose,
       });

       // Show results
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`\n=========================================\n`),
       );
       Deno.writeAllSync(ctx.stdout, encoder.encode(`✅ Cleanup complete!\n`));
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`   - Total stars reviewed: ${result.totalReviewed}\n`),
       );
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`   - Stars removed: ${result.removed}\n`),
       );
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`   - Archived repositories: ${result.archived}\n`),
       );
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`   - Outdated repositories: ${result.outdated}\n`),
       );

       return 0;
     } catch (error) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stderr,
         encoder.encode(`Error during cleanup: ${error.message}\n`),
       );
       return 1;
     }
   };
   ```

3. Create main CLI entry point in `src/cli/mod.ts`:
   ```typescript
   // src/cli/mod.ts

   import { parse } from "@std/cli";
   import { clean } from "./commands/cleanup.ts";

   const COMMANDS: Record<string, { fn: Function; desc: string }> = {
     "cleanup": {
       fn: clean,
       desc: "Remove stars from archived or outdated repositories",
     },
   };

   export async function main(args: string[]): Promise<void> {
     const parsedArgs = parse(args, {
       string: ["_"],
     });

     const command = parsedArgs._.length > 0 ? String(parsedArgs._[0]) : "help";

     if (command === "help" || command === "--help" || command === "-h") {
       showHelp();
       return;
     }

     const commandHandler = COMMANDS[command];

     if (!commandHandler) {
       console.error(`Unknown command: ${command}`);
       showHelp();
       Deno.exit(1);
     }

     try {
       await commandHandler.fn({
         flags: parsedArgs,
         args: parsedArgs._.slice(1).map(String),
         stdout: Deno.stdout,
         stderr: Deno.stderr,
         env: Deno.env.toObject(),
       });
     } catch (error) {
       console.error(`Error executing command: ${error.message}`);
       Deno.exit(1);
     }
   }

   function showHelp(): void {
     console.log(`
   GitHub Star Management

   USAGE
     star-management <command> [options]

   COMMANDS
   ${
       Object.entries(COMMANDS).map(([name, { desc }]) =>
         `  ${name.padEnd(15)}${desc}`
       ).join("\n")
     }

   GLOBAL OPTIONS
     --help, -h        Show this help message
     --version, -v     Show version

   EXAMPLES
     star-management cleanup --dry-run
     star-management backup --output stars.json
   `);
   }
   ```

4. Update mod.ts to use the CLI:
   ```typescript
   // mod.ts

   import { main } from "./src/cli/mod.ts";

   // Run if this module is executed directly
   if (import.meta.main) {
     await main(Deno.args);
   }

   // Export public API
   export * from "./src/core/api/mod.ts";
   export * from "./src/core/models/mod.ts";
   export * from "./src/core/services/mod.ts";
   ```

## Phase 2: Core Service Implementation

**Duration**: 2-3 weeks

### Week 3: Star Management Services

#### Day 1-2: Backup Service

1. Implement backup service in `src/core/services/star_service.ts`:
   ```typescript
   // Add to src/core/services/star_service.ts

   /**
    * Backup stars to a file
    */
   async backupStars(outputPath: string, options: { compress?: boolean } = {}): Promise<void> {
     const stars = await this.getAllStars();
     const jsonData = JSON.stringify(stars, null, 2);
     
     await Deno.writeTextFile(outputPath, jsonData);
     
     // Compress if requested
     if (options.compress) {
       try {
         const gzipCommand = new Deno.Command("gzip", {
           args: ["-f", outputPath],
         });
         await gzipCommand.output();
       } catch (error) {
         throw new Error(`Failed to compress backup: ${error.message}`);
       }
     }
   }

   /**
    * Restore stars from a backup file
    */
   async restoreStars(
     backupFile: string, 
     options: { dryRun?: boolean; delay?: number } = {}
   ): Promise<{ total: number; success: number; failed: number }> {
     const { dryRun = false, delay = 500 } = options;
     
     // Read backup file
     let data: string;
     
     try {
       if (backupFile.endsWith(".gz")) {
         // Uncompress first
         const gunzipCommand = new Deno.Command("gunzip", {
           args: ["-c", backupFile],
           stdout: "piped",
         });
         const output = await gunzipCommand.output();
         data = new TextDecoder().decode(output.stdout);
       } else {
         data = await Deno.readTextFile(backupFile);
       }
     } catch (error) {
       throw new Error(`Failed to read backup file: ${error.message}`);
     }
     
     // Parse backup data
     const stars = JSON.parse(data) as Repository[];
     
     let success = 0;
     let failed = 0;
     
     // Star each repository
     for (const repo of stars) {
       const [owner, name] = repo.full_name.split("/");
       try {
         if (!dryRun) {
           await this.client.starRepo(owner, name);
         }
         console.log(`${dryRun ? "[DRY RUN] Would star" : "Starred"}: ${repo.full_name}`);
         success++;
       } catch (error) {
         console.error(`Failed to star ${repo.full_name}:`, error.message);
         failed++;
       }
       
       // Add delay to avoid rate limits
       if (delay > 0 && stars.length > 1) {
         await new Promise(resolve => setTimeout(resolve, delay));
       }
     }
     
     return {
       total: stars.length,
       success,
       failed
     };
   }
   ```

2. Create backup CLI command in `src/cli/commands/backup.ts`:
   ```typescript
   // src/cli/commands/backup.ts

   import { parse } from "@std/cli";
   import { StarService } from "../../core/services/star_service.ts";
   import { CommandHandler } from "../types.ts";

   export const backup: CommandHandler = async (ctx) => {
     // Parse flags
     const flags = parse(ctx.args, {
       boolean: ["help", "compress", "verbose"],
       string: ["output"],
       alias: {
         h: "help",
         o: "output",
         c: "compress",
         v: "verbose",
       },
       default: {
         compress: false,
         verbose: false,
       },
     });

     if (flags.help) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`
   GitHub Star Backup

   USAGE:
     star-management backup [options]

   OPTIONS:
     --output, -o         Output file path (default: star-backup-YYYY-MM-DD.json)
     --compress, -c       Compress output with gzip
     --verbose, -v        Show detailed output
     --help, -h           Show this help message

   EXAMPLES:
     star-management backup
     star-management backup --output stars.json
     star-management backup --compress
   `),
       );
       return 0;
     }

     try {
       const encoder = new TextEncoder();
       // Generate default filename if not provided
       const defaultFilename = `star-backup-${
         new Date().toISOString().split("T")[0]
       }.json`;
       const outputPath = flags.output as string || defaultFilename;
       const compress = flags.compress as boolean;

       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`📦 Backing up GitHub stars...\n`),
       );

       const token = ctx.env.GITHUB_TOKEN || ctx.env.STAR_MANAGEMENT_TOKEN;
       const service = new StarService({ token });

       await service.backupStars(outputPath, { compress });

       const finalPath = compress ? `${outputPath}.gz` : outputPath;
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`✅ Backup completed: ${finalPath}\n`),
       );

       return 0;
     } catch (error) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stderr,
         encoder.encode(`Error during backup: ${error.message}\n`),
       );
       return 1;
     }
   };

   export const restore: CommandHandler = async (ctx) => {
     // Parse flags
     const flags = parse(ctx.args, {
       boolean: ["help", "dry-run", "verbose"],
       string: ["input", "delay"],
       alias: {
         h: "help",
         i: "input",
         d: "dry-run",
         l: "delay",
         v: "verbose",
       },
       default: {
         "dry-run": false,
         "delay": "500",
         "verbose": false,
       },
     });

     if (flags.help || !flags.input) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`
   GitHub Star Restore

   USAGE:
     star-management restore --input <file> [options]

   OPTIONS:
     --input, -i          Input backup file path (required)
     --dry-run, -d        Preview restoration without making changes
     --delay, -l          Milliseconds to wait between operations (default: 500)
     --verbose, -v        Show detailed output
     --help, -h           Show this help message

   EXAMPLES:
     star-management restore --input star-backup.json
     star-management restore --input backup.json.gz --dry-run
     star-management restore --input backup.json --delay 1000
   `),
       );
       return flags.input ? 0 : 1;
     }

     try {
       const encoder = new TextEncoder();
       const inputFile = flags.input as string;
       const dryRun = flags["dry-run"] as boolean;
       const delay = parseInt(flags.delay as string, 10);

       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`📦 Restoring GitHub stars from ${inputFile}...\n`),
       );
       if (dryRun) {
         Deno.writeAllSync(
           ctx.stdout,
           encoder.encode(`DRY RUN: No stars will be added\n`),
         );
       }

       const token = ctx.env.GITHUB_TOKEN || ctx.env.STAR_MANAGEMENT_TOKEN;
       const service = new StarService({ token });

       const result = await service.restoreStars(inputFile, { dryRun, delay });

       Deno.writeAllSync(ctx.stdout, encoder.encode(`✅ Restore completed!\n`));
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`   - Total repos: ${result.total}\n`),
       );
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`   - Successfully processed: ${result.success}\n`),
       );
       if (result.failed > 0) {
         Deno.writeAllSync(
           ctx.stdout,
           encoder.encode(`   - Failed: ${result.failed}\n`),
         );
       }

       return 0;
     } catch (error) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stderr,
         encoder.encode(`Error during restore: ${error.message}\n`),
       );
       return 1;
     }
   };
   ```

3. Update the CLI commands registry in `src/cli/mod.ts`:
   ```typescript
   // Update in src/cli/mod.ts

   import { clean } from "./commands/cleanup.ts";
   import { backup, restore } from "./commands/backup.ts";

   const COMMANDS: Record<string, { fn: Function; desc: string }> = {
     "cleanup": {
       fn: clean,
       desc: "Remove stars from archived or outdated repositories",
     },
     "backup": {
       fn: backup,
       desc: "Backup all starred repositories to a file",
     },
     "restore": {
       fn: restore,
       desc: "Restore stars from a backup file",
     },
   };
   ```

#### Day 3-5: Star Categorization Service

1. Add categorization methods to `src/core/services/star_service.ts`:
   ```typescript
   // Add to src/core/services/star_service.ts

   /**
    * Categorize stars into topical groups
    */
   async categorizeStars(
     categories: Category[]
   ): Promise<Record<string, Repository[]>> {
     const stars = await this.getAllStars();
     const result: Record<string, Repository[]> = {};
     
     // Initialize empty arrays for each category
     for (const category of categories) {
       result[category.name] = [];
     }
     
     // Categorize each repository
     for (const repo of stars) {
       for (const category of categories) {
         const pattern = new RegExp(category.pattern, "i");
         
         if (
           (repo.name && pattern.test(repo.name)) ||
           (repo.description && pattern.test(repo.description)) ||
           repo.topics.some(topic => pattern.test(topic))
         ) {
           result[category.name].push(repo);
         }
       }
     }
     
     return result;
   }

   /**
    * Generate markdown files for categorized stars
    */
   async generateCategoryMarkdown(
     categories: Category[],
     outputDir: string
   ): Promise<Record<string, number>> {
     const encoder = new TextEncoder();
     const categorized = await this.categorizeStars(categories);
     const counts: Record<string, number> = {};
     
     // Create output directory if it doesn't exist
     try {
       await Deno.mkdir(outputDir, { recursive: true });
     } catch (error) {
       if (!(error instanceof Deno.errors.AlreadyExists)) {
         throw error;
       }
     }
     
     // Generate a markdown file for each category
     for (const category of categories) {
       const repos = categorized[category.name];
       counts[category.name] = repos.length;
       
       if (repos.length === 0) {
         continue; // Skip empty categories
       }
       
       const outputFile = `${outputDir}/${category.name}-stars.md`;
       const displayName = category.displayName || 
         category.name.charAt(0).toUpperCase() + category.name.slice(1);
       
       let content = `# ${displayName} Stars Collection\n\n`;
       content += `*Curated list of ${category.name} repositories I've found valuable*\n\n`;
       
       // Add each repository
       for (const repo of repos) {
         content += `## [${repo.full_name}](${repo.html_url})\n`;
         content += `${repo.description || "No description"}\n\n`;
         content += `⭐ ${repo.stargazers_count} | 🔄 Updated: ${repo.pushed_at.split("T")[0]}\n\n`;
         
         if (repo.language) {
           content += `Language: ${repo.language} | `;
         }
         
         if (repo.topics && repo.topics.length > 0) {
           content += `Topics: ${repo.topics.join(", ")}`;
         }
         
         content += `\n\n---\n\n`;
       }
       
       await Deno.writeTextFile(outputFile, content);
     }
     
     return counts;
   }
   ```

2. Create categorize CLI command in `src/cli/commands/categorize.ts`:
   ```typescript
   // src/cli/commands/categorize.ts

   import { parse } from "@std/cli";
   import { StarService } from "../../core/services/star_service.ts";
   import { CommandHandler } from "../types.ts";
   import { Category } from "../../core/models/mod.ts";

   // Default categories (same as shell script)
   const DEFAULT_CATEGORIES: Category[] = [
     {
       name: "ai",
       pattern:
         "ai|machine-learning|ml|deep-learning|neural|llm|gpt|transformer|nlp",
     },
     {
       name: "web-servers",
       pattern: "server|http|nginx|apache|caddy|express|fastapi|flask",
     },
     { name: "standards", pattern: "rfc|spec|standard|protocol|w3c|ecma" },
     { name: "awesome-lists", pattern: "awesome-|awesome |curated|list" },
     { name: "typescript", pattern: "typescript|ts|deno|tsx" },
     { name: "python", pattern: "python|py|django|flask|fastapi|pandas|numpy" },
     { name: "golang", pattern: "golang|go-|go |gin|echo|fiber" },
     { name: "testing", pattern: "test|testing|jest|pytest|mocha|cypress" },
     {
       name: "devops",
       pattern: "docker|kubernetes|k8s|ci-cd|jenkins|github-actions",
     },
     {
       name: "databases",
       pattern: "database|db|sql|postgres|mysql|mongodb|redis",
     },
   ];

   export const categorize: CommandHandler = async (ctx) => {
     // Parse flags
     const flags = parse(ctx.args, {
       boolean: ["help", "verbose"],
       string: ["output-dir", "config"],
       alias: {
         h: "help",
         o: "output-dir",
         c: "config",
         v: "verbose",
       },
       default: {
         "output-dir": "star-lists",
         "verbose": false,
       },
     });

     if (flags.help) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`
   GitHub Star Categorization

   USAGE:
     star-management categorize [options]

   OPTIONS:
     --output-dir, -o     Output directory (default: star-lists)
     --config, -c         Path to category configuration file
     --verbose, -v        Show detailed output
     --help, -h           Show this help message

   EXAMPLES:
     star-management categorize
     star-management categorize --output-dir my-lists
     star-management categorize --config categories.json
   `),
       );
       return 0;
     }

     try {
       const encoder = new TextEncoder();
       const outputDir = flags["output-dir"] as string;
       const configFile = flags.config as string;

       // Load categories from config file if provided
       let categories = DEFAULT_CATEGORIES;
       if (configFile) {
         try {
           const configData = await Deno.readTextFile(configFile);
           categories = JSON.parse(configData);
         } catch (error) {
           Deno.writeAllSync(
             ctx.stderr,
             encoder.encode(
               `Error loading config file: ${error.message}\nFalling back to default categories\n`,
             ),
           );
         }
       }

       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`📚 Categorizing GitHub stars...\n`),
       );
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`=========================================\n`),
       );

       const token = ctx.env.GITHUB_TOKEN || ctx.env.STAR_MANAGEMENT_TOKEN;
       const service = new StarService({ token });

       // Generate markdown files
       const results = await service.generateCategoryMarkdown(
         categories,
         outputDir,
       );

       // Show results
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`\n=========================================\n`),
       );
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(
           `✅ Categorization complete! Check the ${outputDir} directory.\n`,
         ),
       );

       // Show category counts
       Object.entries(results).forEach(([category, count]) => {
         Deno.writeAllSync(
           ctx.stdout,
           encoder.encode(`  - ${category}: ${count} repositories\n`),
         );
       });

       return 0;
     } catch (error) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stderr,
         encoder.encode(`Error during categorization: ${error.message}\n`),
       );
       return 1;
     }
   };
   ```

3. Update the CLI commands registry in `src/cli/mod.ts`:
   ```typescript
   // Update in src/cli/mod.ts

   import { clean } from "./commands/cleanup.ts";
   import { backup, restore } from "./commands/backup.ts";
   import { categorize } from "./commands/categorize.ts";

   const COMMANDS: Record<string, { fn: Function; desc: string }> = {
     "cleanup": {
       fn: clean,
       desc: "Remove stars from archived or outdated repositories",
     },
     "backup": {
       fn: backup,
       desc: "Backup all starred repositories to a file",
     },
     "restore": {
       fn: restore,
       desc: "Restore stars from a backup file",
     },
     "categorize": {
       fn: categorize,
       desc: "Categorize stars into topical lists",
     },
   };
   ```

#### Day 6-7: Star Reporting Service

1. Add report methods to `src/core/services/star_service.ts`:
   ```typescript
   // Add to src/core/services/star_service.ts

   /**
    * Generate star report with statistics
    */
   async generateReport(): Promise<{
     totalStars: number;
     archivedCount: number;
     languageDistribution: Array<{ language: string; count: number; percentage: number }>;
     activityReport: {
       updatedThisYear: number;
       updatedLastYear: number;
       older: number;
     };
     mostPopular: Repository[];
   }> {
     const stars = await this.getAllStars();
     
     // Count archived repositories
     const archived = stars.filter(repo => repo.archived).length;
     
     // Language distribution
     const languageMap = new Map<string, number>();
     for (const repo of stars) {
       const language = repo.language || "Unknown";
       languageMap.set(language, (languageMap.get(language) || 0) + 1);
     }
     
     const languageDistribution = Array.from(languageMap.entries())
       .map(([language, count]) => ({
         language,
         count,
         percentage: (count / stars.length) * 100,
       }))
       .sort((a, b) => b.count - a.count);
     
     // Activity analysis
     const now = new Date();
     const currentYear = now.getFullYear();
     const lastYear = currentYear - 1;
     
     const updatedThisYear = stars.filter(repo => 
       new Date(repo.pushed_at).getFullYear() === currentYear
     ).length;
     
     const updatedLastYear = stars.filter(repo => 
       new Date(repo.pushed_at).getFullYear() === lastYear
     ).length;
     
     const older = stars.length - updatedThisYear - updatedLastYear;
     
     // Most popular repositories
     const mostPopular = [...stars]
       .sort((a, b) => b.stargazers_count - a.stargazers_count)
       .slice(0, 10);
     
     return {
       totalStars: stars.length,
       archivedCount: archived,
       languageDistribution,
       activityReport: {
         updatedThisYear,
         updatedLastYear,
         older,
       },
       mostPopular,
     };
   }

   /**
    * Generate report as markdown
    */
   async generateReportMarkdown(outputPath: string): Promise<void> {
     const report = await this.generateReport();
     
     let content = `# GitHub Stars Report - ${new Date().toISOString().split("T")[0]}\n\n`;
     
     // Summary section
     content += `## Summary Statistics\n\n`;
     content += `- Total stars: ${report.totalStars}\n`;
     content += `- Archived repositories: ${report.archivedCount}\n\n`;
     
     // Language distribution
     content += `## Language Distribution\n\n`;
     for (const lang of report.languageDistribution.slice(0, 15)) {
       content += `- ${lang.language}: ${lang.count} (${lang.percentage.toFixed(1)}%)\n`;
     }
     content += `\n`;
     
     // Activity analysis
     content += `## Activity Analysis\n\n`;
     content += `- Updated this year: ${report.activityReport.updatedThisYear}\n`;
     content += `- Updated last year: ${report.activityReport.updatedLastYear}\n`;
     content += `- Not updated in 2+ years: ${report.activityReport.older}\n\n`;
     
     // Most popular starred repos
     content += `## Most Popular Starred Repositories\n\n`;
     for (const repo of report.mostPopular) {
       content += `- [${repo.full_name}](${repo.html_url}) - ${repo.stargazers_count} ⭐\n`;
       if (repo.description) {
         content += `  ${repo.description}\n`;
       }
       content += `\n`;
     }
     
     await Deno.writeTextFile(outputPath, content);
   }
   ```

2. Create report CLI command in `src/cli/commands/report.ts`:
   ```typescript
   // src/cli/commands/report.ts

   import { parse } from "@std/cli";
   import { StarService } from "../../core/services/star_service.ts";
   import { CommandHandler } from "../types.ts";

   export const report: CommandHandler = async (ctx) => {
     // Parse flags
     const flags = parse(ctx.args, {
       boolean: ["help", "verbose"],
       string: ["output"],
       alias: {
         h: "help",
         o: "output",
         v: "verbose",
       },
       default: {
         "verbose": false,
       },
     });

     if (flags.help) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`
   GitHub Star Report

   USAGE:
     star-management report [options]

   OPTIONS:
     --output, -o        Output file path (default: star-report-YYYY-MM-DD.md)
     --verbose, -v       Show detailed output
     --help, -h          Show this help message

   EXAMPLES:
     star-management report
     star-management report --output my-report.md
   `),
       );
       return 0;
     }

     try {
       const encoder = new TextEncoder();
       // Generate default filename if not provided
       const defaultFilename = `star-report-${
         new Date().toISOString().split("T")[0]
       }.md`;
       const outputPath = flags.output as string || defaultFilename;

       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`📊 Generating GitHub stars report...\n`),
       );

       const token = ctx.env.GITHUB_TOKEN || ctx.env.STAR_MANAGEMENT_TOKEN;
       const service = new StarService({ token });

       // Generate full report
       await service.generateReportMarkdown(outputPath);

       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`✅ Report generated: ${outputPath}\n`),
       );

       return 0;
     } catch (error) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stderr,
         encoder.encode(`Error generating report: ${error.message}\n`),
       );
       return 1;
     }
   };
   ```

3. Update the CLI commands registry in `src/cli/mod.ts`:
   ```typescript
   // Update in src/cli/mod.ts

   import { clean } from "./commands/cleanup.ts";
   import { backup, restore } from "./commands/backup.ts";
   import { categorize } from "./commands/categorize.ts";
   import { report } from "./commands/report.ts";

   const COMMANDS: Record<string, { fn: Function; desc: string }> = {
     "cleanup": {
       fn: clean,
       desc: "Remove stars from archived or outdated repositories",
     },
     "backup": {
       fn: backup,
       desc: "Backup all starred repositories to a file",
     },
     "restore": {
       fn: restore,
       desc: "Restore stars from a backup file",
     },
     "categorize": {
       fn: categorize,
       desc: "Categorize stars into topical lists",
     },
     "report": {
       fn: report,
       desc: "Generate a star report with statistics",
     },
   };
   ```

### Week 4: Star Digest and Output Formatting

#### Day 1-3: Star Digest Service

1. Add digest methods to `src/core/services/star_service.ts`:
   ```typescript
   // Add to src/core/services/star_service.ts

   /**
    * Search for trending repositories by topic
    */
   async searchTrendingRepos(
     topic: string,
     options: { limit?: number } = {}
   ): Promise<Repository[]> {
     const { limit = 5 } = options;
     
     // Use GitHub's search API to find trending repos
     const endpoint = `/search/repositories?q=${encodeURIComponent(topic)}&sort=stars&order=desc&per_page=${limit}`;
     const data = await this.client.request(endpoint);
     
     // Process and return items
     return data.items;
   }

   /**
    * Generate digest of trending repositories
    */
   async generateDigest(
     interests: string[],
     options: { limit?: number } = {}
   ): Promise<Record<string, Repository[]>> {
     const { limit = 5 } = options;
     const result: Record<string, Repository[]> = {};
     
     for (const interest of interests) {
       result[interest] = await this.searchTrendingRepos(interest, { limit });
     }
     
     return result;
   }

   /**
    * Generate digest as markdown
    */
   async generateDigestMarkdown(
     interests: string[],
     outputPath: string,
     options: { limit?: number } = {}
   ): Promise<void> {
     const digest = await this.generateDigest(interests, options);
     
     let content = `# GitHub Star Digest - ${new Date().toISOString().split("T")[0]}\n\n`;
     
     for (const interest of interests) {
       content += `## Trending in ${interest}\n\n`;
       
       const repos = digest[interest] || [];
       if (repos.length === 0) {
         content += `No trending repositories found for "${interest}".\n\n`;
         continue;
       }
       
       for (const repo of repos) {
         content += `- [${repo.full_name}](${repo.html_url}) - ${repo.description || "No description"} ⭐${repo.stargazers_count}\n`;
       }
       
       content += `\n`;
     }
     
     await Deno.writeTextFile(outputPath, content);
   }
   ```

2. Create digest CLI command in `src/cli/commands/digest.ts`:
   ```typescript
   // src/cli/commands/digest.ts

   import { parse } from "@std/cli";
   import { StarService } from "../../core/services/star_service.ts";
   import { CommandHandler } from "../types.ts";

   // Default interests
   const DEFAULT_INTERESTS = [
     "typescript",
     "python",
     "golang",
     "ai",
     "devops",
   ];

   export const digest: CommandHandler = async (ctx) => {
     // Parse flags
     const flags = parse(ctx.args, {
       boolean: ["help", "verbose"],
       string: ["output", "interests", "limit"],
       alias: {
         h: "help",
         o: "output",
         i: "interests",
         l: "limit",
         v: "verbose",
       },
       default: {
         "limit": "5",
         "verbose": false,
       },
     });

     if (flags.help) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`
   GitHub Star Digest

   USAGE:
     star-management digest [options]

   OPTIONS:
     --interests, -i     Comma-separated list of interests
     --output, -o        Output file path (default: star-digest-YYYY-MM-DD.md)
     --limit, -l         Number of repos per interest (default: 5)
     --verbose, -v       Show detailed output
     --help, -h          Show this help message

   EXAMPLES:
     star-management digest
     star-management digest --interests typescript,python,golang
     star-management digest --limit 10
   `),
       );
       return 0;
     }

     try {
       const encoder = new TextEncoder();

       // Generate default filename if not provided
       const defaultFilename = `star-digest-${
         new Date().toISOString().split("T")[0]
       }.md`;
       const outputPath = flags.output as string || defaultFilename;

       // Parse interests and limit
       const interests = flags.interests
         ? (flags.interests as string).split(",")
         : DEFAULT_INTERESTS;

       const limit = parseInt(flags.limit as string, 10);

       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`📰 Generating GitHub stars digest...\n`),
       );
       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`Interests: ${interests.join(", ")}\n`),
       );

       const token = ctx.env.GITHUB_TOKEN || ctx.env.STAR_MANAGEMENT_TOKEN;
       const service = new StarService({ token });

       // Generate digest
       await service.generateDigestMarkdown(interests, outputPath, { limit });

       Deno.writeAllSync(
         ctx.stdout,
         encoder.encode(`✅ Digest generated: ${outputPath}\n`),
       );

       return 0;
     } catch (error) {
       const encoder = new TextEncoder();
       Deno.writeAllSync(
         ctx.stderr,
         encoder.encode(`Error generating digest: ${error.message}\n`),
       );
       return 1;
     }
   };
   ```

3. Update the CLI commands registry in `src/cli/mod.ts`:
   ```typescript
   // Update in src/cli/mod.ts

   import { clean } from "./commands/cleanup.ts";
   import { backup, restore } from "./commands/backup.ts";
   import { categorize } from "./commands/categorize.ts";
   import { report } from "./commands/report.ts";
   import { digest } from "./commands/digest.ts";

   const COMMANDS: Record<string, { fn: Function; desc: string }> = {
     "cleanup": {
       fn: clean,
       desc: "Remove stars from archived or outdated repositories",
     },
     "backup": {
       fn: backup,
       desc: "Backup all starred repositories to a file",
     },
     "restore": {
       fn: restore,
       desc: "Restore stars from a backup file",
     },
     "categorize": {
       fn: categorize,
       desc: "Categorize stars into topical lists",
     },
     "report": {
       fn: report,
       desc: "Generate a star report with statistics",
     },
     "digest": {
       fn: digest,
       desc: "Generate a digest of trending repositories",
     },
   };
   ```

#### Day 4-7: Improved Output Formatting

1. Create output formatting utilities in `src/cli/utils/format.ts`:
   ```typescript
   // src/cli/utils/format.ts

   import { CommandContext } from "../types.ts";
   import chalk from "chalk";

   export interface FormatOptions {
     prefix?: string;
     indent?: number;
   }

   export function formatOutput(
     ctx: CommandContext,
     message: string,
     options: FormatOptions = {},
   ): void {
     const { prefix = "", indent = 0 } = options;
     const indentStr = " ".repeat(indent);
     const prefixStr = prefix ? `${prefix} ` : "";

     const encoder = new TextEncoder();
     const text = encoder.encode(`${indentStr}${prefixStr}${message}\n`);
     Deno.writeAllSync(ctx.stdout, text);
   }

   export function formatError(
     ctx: CommandContext,
     message: string,
     options: FormatOptions = {},
   ): void {
     const { prefix = "❌", indent = 0 } = options;

     const encoder = new TextEncoder();
     const text = encoder.encode(
       `${" ".repeat(indent)}${prefix} ${chalk.red(message)}\n`,
     );
     Deno.writeAllSync(ctx.stderr, text);
   }

   export function formatSuccess(
     ctx: CommandContext,
     message: string,
     options: FormatOptions = {},
   ): void {
     formatOutput(ctx, chalk.green(message), {
       prefix: options.prefix || "✅",
       indent: options.indent,
     });
   }

   export function formatWarning(
     ctx: CommandContext,
     message: string,
     options: FormatOptions = {},
   ): void {
     formatOutput(ctx, chalk.yellow(message), {
       prefix: options.prefix || "⚠️",
       indent: options.indent,
     });
   }
   ```

2. Update cleanup command to use the new formatting in
   `src/cli/commands/cleanup.ts`:
   ```typescript
   // Update src/cli/commands/cleanup.ts

   import { parse } from "@std/cli";
   import { StarService } from "../../core/services/star_service.ts";
   import { CommandHandler } from "../types.ts";
   import {
     formatError,
     formatOutput,
     formatSuccess,
     formatWarning,
   } from "../utils/format.ts";

   export const clean: CommandHandler = async (ctx) => {
     // Parse command-specific flags
     const flags = parse(ctx.args, {
       boolean: ["dry-run", "help", "verbose"],
       string: ["cutoff-months", "exclude"],
       alias: {
         h: "help",
         d: "dry-run",
         c: "cutoff-months",
         e: "exclude",
         v: "verbose",
       },
       default: {
         "dry-run": false,
         "cutoff-months": "24",
         "verbose": false,
       },
     });

     // Show help if requested
     if (flags.help) {
       formatOutput(
         ctx,
         `
   GitHub Star Cleanup

   USAGE:
     star-management cleanup [options]

   OPTIONS:
     --dry-run, -d          Run without making changes
     --cutoff-months, -c    Months of inactivity before removal (default: 24)
     --exclude, -e          Comma-separated list of repos to exclude (owner/name format)
     --verbose, -v          Show detailed output
     --help, -h             Show this help message

   EXAMPLES:
     star-management cleanup --dry-run
     star-management cleanup --cutoff-months 12
     star-management cleanup --exclude owner/repo1,owner/repo2
   `,
       );
       return 0;
     }

     try {
       const cutoffMonths = parseInt(flags["cutoff-months"] as string, 10);
       const dryRun = flags["dry-run"] as boolean;
       const verbose = flags["verbose"] as boolean;
       const excludeList = flags.exclude
         ? (flags.exclude as string).split(",")
         : [];

       formatOutput(ctx, `🧹 Starting GitHub stars cleanup...`);
       formatOutput(ctx, `Cutoff date: ${cutoffMonths} months of inactivity`);

       if (dryRun) {
         formatWarning(ctx, `DRY RUN: No stars will be removed`);
       }

       if (excludeList.length > 0) {
         formatOutput(ctx, `Excluding: ${excludeList.join(", ")}`);
       }

       formatOutput(ctx, `========================================`);

       // Create service and run cleanup
       const token = ctx.env.GITHUB_TOKEN || ctx.env.STAR_MANAGEMENT_TOKEN;
       const service = new StarService({ token });

       const result = await service.cleanupStars({
         cutoffMonths,
         dryRun,
         excludeList,
         verbose,
       });

       // Show results
       formatOutput(ctx, `\n========================================`);
       formatSuccess(ctx, `Cleanup complete!`);
       formatOutput(ctx, `   - Total stars reviewed: ${result.totalReviewed}`);
       formatOutput(ctx, `   - Stars removed: ${result.removed}`);
       formatOutput(ctx, `   - Archived repositories: ${result.archived}`);
       formatOutput(ctx, `   - Outdated repositories: ${result.outdated}`);
       formatOutput(
         ctx,
         `   - Stars remaining: ${result.totalReviewed - result.removed}`,
       );

       return 0;
     } catch (error) {
       formatError(ctx, `Error during cleanup: ${error.message}`);
       return 1;
     }
   };
   ```

3. Update the other commands to use the formatting utilities.

## Phase 3: CLI Polish and GitHub Actions Integration

**Duration**: 2-3 weeks

### Week 5-6: CLI Enhancements and GitHub Actions

#### Day 1-2: Command Registry Improvements

1. Update the command registry for better organization in
   `src/cli/commands/mod.ts`:
   ```typescript
   // src/cli/commands/mod.ts

   import { clean } from "./cleanup.ts";
   import { backup, restore } from "./backup.ts";
   import { categorize } from "./categorize.ts";
   import { report } from "./report.ts";
   import { digest } from "./digest.ts";
   import { CommandHandler } from "../types.ts";

   export interface CommandDefinition {
     handler: CommandHandler;
     description: string;
     usage: string;
     examples: string[];
     aliases?: string[];
   }

   export const COMMANDS: Record<string, CommandDefinition> = {
     "cleanup": {
       handler: clean,
       description: "Remove stars from archived or outdated repositories",
       usage: "cleanup [options]",
       examples: [
         "cleanup --dry-run",
         "cleanup --cutoff-months 12",
         "cleanup --exclude owner/repo1,owner/repo2",
       ],
       aliases: ["clean"],
     },
     "backup": {
       handler: backup,
       description: "Backup all starred repositories to a file",
       usage: "backup [options]",
       examples: [
         "backup",
         "backup --output stars-backup.json",
         "backup --compress",
       ],
     },
     "restore": {
       handler: restore,
       description: "Restore stars from a backup file",
       usage: "restore --input <file> [options]",
       examples: [
         "restore --input star-backup-2023-01-01.json",
         "restore --input star-backup.json.gz --dry-run",
         "restore --input backup.json --delay 1000",
       ],
     },
     "categorize": {
       handler: categorize,
       description: "Categorize stars into topical lists",
       usage: "categorize [options]",
       examples: [
         "categorize",
         "categorize --output-dir my-stars",
         "categorize --config categories.json",
       ],
     },
     "report": {
       handler: report,
       description: "Generate a star report with statistics",
       usage: "report [options]",
       examples: [
         "report",
         "report --output my-report.md",
       ],
     },
     "digest": {
       handler: digest,
       description: "Generate a digest of trending repositories",
       usage: "digest [options]",
       examples: [
         "digest",
         "digest --interests typescript,python,golang",
         "digest --limit 10",
       ],
     },
   };

   // Map aliases to main command names
   export const COMMAND_ALIASES: Record<string, string> = Object.entries(
     COMMANDS,
   )
     .reduce((acc, [name, def]) => {
       if (def.aliases) {
         for (const alias of def.aliases) {
           acc[alias] = name;
         }
       }
       return acc;
     }, {} as Record<string, string>);

   export function resolveCommand(input: string): string | undefined {
     if (COMMANDS[input]) {
       return input;
     }
     return COMMAND_ALIASES[input];
   }
   ```

2. Update the CLI entry point in `src/cli/mod.ts`:
   ```typescript
   // Update src/cli/mod.ts

   import { parse } from "@std/cli";
   import {
     COMMAND_ALIASES,
     COMMANDS,
     resolveCommand,
   } from "./commands/mod.ts";
   import { formatError, formatOutput } from "./utils/format.ts";
   import chalk from "chalk";

   export async function main(args: string[]): Promise<void> {
     // Basic argument parsing for the command
     const parsedArgs = parse(args, {
       boolean: ["help", "version"],
       alias: {
         h: "help",
         v: "version",
       },
       "--": true,
     });

     // Handle --help and --version flags
     if (parsedArgs.help) {
       showHelp();
       Deno.exit(0);
     }

     if (parsedArgs.version) {
       showVersion();
       Deno.exit(0);
     }

     // Get command name
     const commandName = parsedArgs._[0] ? String(parsedArgs._[0]) : "";
     const resolvedCommand = resolveCommand(commandName);

     if (!commandName || !resolvedCommand) {
       if (commandName) {
         console.error(chalk.red(`Unknown command: ${commandName}`));
       }
       showHelp();
       Deno.exit(1);
     }

     // Prepare context
     const commandDef = COMMANDS[resolvedCommand];
     const ctx = {
       flags: parsedArgs,
       args: parsedArgs._.slice(1).map(String),
       stdout: Deno.stdout,
       stderr: Deno.stderr,
       env: Deno.env.toObject(),
     };

     try {
       // Run the command
       const exitCode = await commandDef.handler(ctx);
       Deno.exit(exitCode);
     } catch (error) {
       formatError(ctx, `Command failed: ${error.message}`);
       if (parsedArgs.verbose) {
         console.error(error.stack);
       }
       Deno.exit(1);
     }
   }

   function showHelp(): void {
     console.log(`
   ${chalk.bold("GitHub Star Management")}

   ${chalk.bold("USAGE")}
     star-management <command> [options]

   ${chalk.bold("COMMANDS")}
   ${
       Object.entries(COMMANDS)
         .map(([name, def]) =>
           `  ${chalk.green(name.padEnd(15))}${def.description}`
         )
         .join("\n")
     }

   ${chalk.bold("GLOBAL OPTIONS")}
     --help, -h        Show help information
     --version, -v     Show version information
     --verbose         Enable verbose output

   ${chalk.bold("EXAMPLES")}
     star-management backup
     star-management cleanup --dry-run
     star-management report

   Run ${
       chalk.cyan("star-management <command> --help")
     } for command-specific help.
   `);
   }

   function showVersion(): void {
     console.log("GitHub Star Management v1.0.0");
   }
   ```

#### Day 3-5: GitHub Actions Workflow

1. Create GitHub Actions workflow file in `.github/workflows/star-cleanup.yml`:
   ```yaml
   name: Quarterly Star Cleanup

   on:
     # Run quarterly on the 1st day of Jan, Apr, Jul, Oct at 9 AM UTC
     schedule:
       - cron: "0 9 1 1,4,7,10 *"

     # Allow manual trigger
     workflow_dispatch:
       inputs:
         dry_run:
           description: "Dry run (no actual changes)"
           required: false
           default: "false"
           type: choice
           options:
             - "true"
             - "false"
         cutoff_months:
           description: "Months of inactivity before removal"
           required: false
           default: "24"
           type: string

   jobs:
     cleanup-stars:
       runs-on: ubuntu-latest
       name: Clean up old GitHub stars

       steps:
         - name: Checkout repository
           uses: actions/checkout@v4

         - name: Setup Deno
           uses: denoland/setup-deno@v2
           with:
             deno-version: v1.x

         - name: Set up environment
           run: |
             echo "GITHUB_TOKEN=${{ secrets.STAR_MANAGEMENT_TOKEN }}" >> $GITHUB_ENV
             echo "DRY_RUN=${{ github.event.inputs.dry_run || 'false' }}" >> $GITHUB_ENV
             echo "CUTOFF_MONTHS=${{ github.event.inputs.cutoff_months || '24' }}" >> $GITHUB_ENV

         - name: Run star cleanup
           run: |
             deno run --allow-net --allow-env mod.ts cleanup \
               --cutoff-months ${{ env.CUTOFF_MONTHS }} \
               ${{ env.DRY_RUN == 'true' && '--dry-run' || '' }}

         - name: Create issue if stars were removed
           if: success() && env.DRY_RUN == 'false'
           uses: actions/github-script@v7
           with:
             github-token: ${{ secrets.GITHUB_TOKEN }}
             script: |
               const date = new Date().toISOString().split('T')[0];
               const issue = await github.rest.issues.create({
                 owner: context.repo.owner,
                 repo: context.repo.repo,
                 title: `Star Cleanup Report - ${date}`,
                 body: `## Quarterly Star Cleanup Completed\n\nThe automated star cleanup has run. Check the [workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}) for details.`,
                 labels: ['automation', 'star-cleanup']
               });
               console.log(`Created issue #${issue.data.number}`);
   ```

2. Create multi-function workflow in `.github/workflows/star-management.yml`:
   ```yaml
   name: Star Management Tools

   on:
     workflow_dispatch:
       inputs:
         action:
           description: "Action to perform"
           required: true
           type: choice
           options:
             - "cleanup"
             - "report"
             - "backup"
             - "categorize"
             - "digest"
         dry_run:
           description: "Dry run mode"
           required: false
           default: "true"
           type: choice
           options:
             - "true"
             - "false"

   jobs:
     star-management:
       runs-on: ubuntu-latest
       name: Star Management - ${{ github.event.inputs.action }}

       steps:
         - name: Checkout repository
           uses: actions/checkout@v4

         - name: Setup Deno
           uses: denoland/setup-deno@v2
           with:
             deno-version: v1.x

         - name: Set up environment
           run: |
             echo "GITHUB_TOKEN=${{ secrets.STAR_MANAGEMENT_TOKEN }}" >> $GITHUB_ENV
             echo "ACTION=${{ github.event.inputs.action }}" >> $GITHUB_ENV
             echo "DRY_RUN=${{ github.event.inputs.dry_run }}" >> $GITHUB_ENV

         - name: Run selected action
           run: |
             TIMESTAMP=$(date +%Y-%m-%d)
             case "$ACTION" in
               cleanup)
                 deno run --allow-net --allow-env mod.ts cleanup \
                   ${{ env.DRY_RUN == 'true' && '--dry-run' || '' }}
                 ;;
               report)
                 deno run --allow-net --allow-env --allow-write mod.ts report \
                   --output "star-report-${TIMESTAMP}.md"
                 ;;
               backup)
                 deno run --allow-net --allow-env --allow-write mod.ts backup \
                   --output "star-backup-${TIMESTAMP}.json" --compress
                 ;;
               categorize)
                 deno run --allow-net --allow-env --allow-write mod.ts categorize \
                   --output-dir "star-lists-${TIMESTAMP}"
                 ;;
               digest)
                 deno run --allow-net --allow-env --allow-write mod.ts digest \
                   --output "star-digest-${TIMESTAMP}.md"
                 ;;
             esac

         - name: Upload artifacts
           if: success() && github.event.inputs.action != 'cleanup'
           uses: actions/upload-artifact@v3
           with:
             name: star-management-${{ github.event.inputs.action }}-${{ github.run_id }}
             path: |
               star-*.md
               star-*.json*
               star-lists*/**/*
   ```

#### Day 6-7: Documentation Update and Script Compatibility

1. Create usage documentation in `README.md`:
   ````markdown
   # GitHub Star Management with Deno

   Manage your GitHub stars with a modern Deno TypeScript implementation. This tool
   provides commands for:

   - Cleaning up outdated or archived stars
   - Backing up and restoring starred repositories
   - Categorizing stars into topical lists
   - Generating reports and digests

   ## Installation

   ### Requirements

   - [Deno](https://deno.land/) v1.28 or higher
   - A GitHub Personal Access Token with `repo` and `user` scopes

   ### Quick Install

   ```bash
   # Install directly from GitHub
   deno install --allow-net --allow-env --allow-read --allow-write -n star-management \
     https://raw.githubusercontent.com/username/github-star-management/main/mod.ts
   ```
   ````

   Or clone the repository:

   ```bash
   git clone https://github.com/username/github-star-management.git
   cd github-star-management
   # Run locally
   deno task start
   ```

   ## Usage

   First, set your GitHub token:

   ```bash
   # Set as environment variable
   export GITHUB_TOKEN=your_github_token
   ```

   ### Commands

   ```bash
   # View all available commands
   star-management --help

   # Clean up old stars
   star-management cleanup --dry-run

   # Backup all stars
   star-management backup

   # Restore from backup
   star-management restore --input stars.json

   # Categorize stars
   star-management categorize

   # Generate report
   star-management report

   # Generate digest of trending repos
   star-management digest
   ```

   ## Configuration

   Create a `.star-management.json` file in your home directory or project
   directory:

   ```json
   {
     "categories": [
       { "name": "ai", "pattern": "ai|machine-learning|ml" },
       { "name": "typescript", "pattern": "typescript|ts|deno" }
     ],
     "interests": ["typescript", "python", "golang", "ai", "devops"],
     "cleanup": {
       "cutoffMonths": 24,
       "excludeList": ["important/repo1", "important/repo2"]
     }
   }
   ```

   ## GitHub Actions Integration

   This tool can be used with GitHub Actions for automated star management. See
   the `.github/workflows` directory for examples.
   ```
   ```

2. Create shell compatibility wrapper scripts:

   ```bash
   # scripts/compatibility/cleanup-stars.sh
   #!/bin/bash

   # Compatibility wrapper for cleanup-stars.sh

   # Forward to Deno implementation
   CUTOFF_MONTHS=${CUTOFF_MONTHS:-24}
   DRY_RUN=${DRY_RUN:-false}

   # Build command
   CMD="deno run --allow-net --allow-env mod.ts cleanup --cutoff-months $CUTOFF_MONTHS"

   if [ "$DRY_RUN" = "true" ]; then
     CMD="$CMD --dry-run"
   fi

   # Execute
   $CMD
   ```

## Phase 4: Testing and Final Documentation

**Duration**: 1-2 weeks

### Week 7-8: Test Implementation and Documentation

#### Day 1-3: Unit Tests

1. Implement unit tests for the GitHub API client
2. Implement unit tests for the star service
3. Implement mock helpers and fixtures

#### Day 4-5: Integration Tests

1. Implement integration tests for API interactions
2. Implement CLI command tests

#### Day 6-7: Final Documentation and Release

1. Complete README and documentation
2. Create release notes
3. Publish final version

## Migration Steps for Users

### For Shell Script Users

1. Install Deno following the instructions in the Getting Started section
2. Install the GitHub star management CLI:
   ```bash
   deno install --allow-net --allow-env --allow-read --allow-write -n star-management \
     https://raw.githubusercontent.com/username/github-star-management/main/mod.ts
   ```

3. Set your GitHub token:
   ```bash
   export GITHUB_TOKEN=your_github_token
   ```

4. Convert your existing scripts:
   - `cleanup-stars.sh` → `star-management cleanup`
   - `categorize-stars.sh` → `star-management categorize`
   - `generate-awesome-list.sh` →
     `star-management categorize --config awesome-list.json`
   - `star-digest.sh` → `star-management digest`
   - `star-report.sh` → `star-management report`

5. Update your GitHub Actions workflows to use the new Deno implementation

### Backward Compatibility

To ensure backward compatibility during migration:

1. Shell scripts in `scripts/compatibility/` directory that forward to Deno
   commands
2. Accept the same environment variables as the original shell scripts
3. Generate output in the same format

## Conclusion

This implementation plan provides a detailed roadmap for migrating from shell
scripts to a modern Deno TypeScript implementation. The phased approach allows
for gradual migration while maintaining backward compatibility. Each phase
builds upon the previous, ensuring a complete and robust solution.
