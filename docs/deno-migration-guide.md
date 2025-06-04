# GitHub Stars Management: Shell Scripts to Deno Migration Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Getting Started](#getting-started)
4. [Implementation Plan](#implementation-plan)
5. [Test Plan](#test-plan)
6. [Risks and Mitigations](#risks-and-mitigations)
7. [Supporting Documentation](#supporting-documentation)

## Introduction

This guide outlines the migration of the GitHub Stars Management project from
shell scripts to a modern Deno TypeScript implementation. The migration aims to
improve:

- **Type safety** with TypeScript
- **Cross-platform compatibility** through Deno's platform-agnostic design
- **Rate limit handling** with robust API client architecture
- **Error handling** with proper TypeScript error boundaries
- **Data processing efficiency** through modern JavaScript features
- **Testing capabilities** with Deno's built-in testing framework
- **Maintainability** with modern software design patterns

## Architecture Overview

The new Deno-based architecture follows a modular design with clean separation
of concerns:

```
github-star-management/
├── deno.json           # Deno configuration
├── CLAUDE.md           # Existing documentation
├── README.md           # Project overview and usage instructions
├── mod.ts              # Main module entry point
├── src/
│   ├── cli/            # Command-line interface modules
│   │   ├── mod.ts      # CLI entry point
│   │   ├── commands/   # Command implementations
│   │   └── utils/      # CLI utilities
│   ├── core/           # Core functionality
│   │   ├── api/        # GitHub API client
│   │   ├── models/     # TypeScript interfaces and types
│   │   └── services/   # Business logic services
│   └── utils/          # Shared utilities
├── tests/              # Test files
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
└── examples/           # Example usage scripts
```

### Key Components

1. **GitHub API Client**
   - TypeScript-based API wrapper for GitHub
   - Built-in rate limiting with token bucket algorithm
   - Comprehensive error handling
   - Automatic pagination support
   - Response caching for repeated queries

2. **Star Management Service**
   - Core business logic for star operations
   - Implementations for all existing shell script functionalities
   - Extended features enabled by TypeScript

3. **Command-Line Interface**
   - Modern CLI experience with argument parsing
   - Interactive prompts when needed
   - Colorful, formatted output
   - Progress indicators for long-running operations

4. **Data Processing Utilities**
   - Efficient filtering and transformation using streams
   - Parallel processing where appropriate
   - Caching for improved performance

## Getting Started

### Prerequisites

1. Install Deno:
   ```bash
   # macOS (Homebrew)
   brew install deno

   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex

   # Linux/macOS (Shell)
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. GitHub CLI (optional, but recommended for certain operations):
   ```bash
   # Already documented in your CLAUDE.md
   ```

3. GitHub Personal Access Token:
   - Create at https://github.com/settings/tokens
   - Required scopes: `repo`, `user`, `read:user`
   - Store in environment: `export GITHUB_TOKEN=your_token_here`
   - Or in `.env` file (will be loaded by the Deno app)

### Project Setup

1. Clone the repository (if needed):
   ```bash
   git clone https://github.com/your-username/github-star-management.git
   cd github-star-management
   ```

2. Create Deno configuration:
   ```bash
   # Create basic deno.json file
   cat > deno.json << EOF
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
     },
     "fmt": {
       "indentWidth": 2,
       "semiColons": true,
       "singleQuote": false
     },
     "lint": {
       "rules": {
         "tags": ["recommended"]
       }
     },
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   EOF
   ```

3. Create the initial project structure:
   ```bash
   mkdir -p src/{cli,core/{api,models,services},utils} tests/{unit,integration} examples
   ```

4. Create a mod.ts entry point:
   ```bash
   cat > mod.ts << EOF
   #!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

   // GitHub Stars Management CLI
   import { parse } from "@std/cli";
   import { main } from "./src/cli/mod.ts";

   // Run the CLI
   if (import.meta.main) {
     await main(Deno.args);
   }

   // Export public API
   export * from "./src/core/api/mod.ts";
   export * from "./src/core/models/mod.ts";
   export * from "./src/core/services/mod.ts";
   EOF
   ```

## Implementation Plan

The migration will be implemented in phases to ensure continuous functionality:

### Phase 1: Core API Client (Weeks 1-2)

1. Create GitHub API client with:
   - Authentication handling
   - Rate limiting
   - Pagination support
   - Error handling
   - Typed responses

2. Develop base models for GitHub entities:
   - Repository
   - User
   - Star
   - Language
   - Topic

3. Implement basic star operations:
   - List stars
   - Star repository
   - Unstar repository
   - Check if repository is starred

### Phase 2: Core Services (Weeks 3-4)

1. Implement star backup service:
   - Export stars to JSON
   - Import stars from JSON
   - Compression support

2. Implement star cleanup service:
   - Find archived repositories
   - Find outdated repositories
   - Batch unstar operations
   - Filtering capabilities

3. Implement categorization service:
   - Define category patterns
   - Filter stars by categories
   - Generate markdown reports

### Phase 3: CLI Interface (Weeks 5-6)

1. Develop command structure:
   - Command parsing with help text
   - Subcommand support
   - Configuration management

2. Implement CLI commands:
   - `star-backup`: Backup stars to file
   - `star-restore`: Restore stars from backup
   - `star-cleanup`: Remove old/archived stars
   - `star-categorize`: Generate category reports
   - `star-digest`: Generate trending digests
   - `star-report`: Generate activity reports

3. Add output formatting:
   - Pretty console output
   - Progress indicators
   - JSON/Markdown export options

### Phase 4: Testing & Documentation (Weeks 7-8)

1. Unit tests for all components
2. Integration tests for full workflows
3. User documentation
4. GitHub Actions workflow updates

### Step-by-Step Implementation Instructions

#### Step 1: GitHub API Client

Create the GitHub API client in `src/core/api/github.ts`:

```typescript
// src/core/api/github.ts
import { TokenBucket } from "../../utils/rate_limit.ts";

export interface GitHubClientOptions {
  token?: string;
  baseUrl?: string;
  rateLimit?: number; // Requests per second
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }
}

export class GitHubClient {
  private token: string;
  private baseUrl: string;
  private rateLimiter?: TokenBucket;

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token || Deno.env.get("GITHUB_TOKEN") || "";
    this.baseUrl = options.baseUrl || "https://api.github.com";

    if (options.rateLimit) {
      this.rateLimiter = new TokenBucket(
        options.rateLimit * 2,
        options.rateLimit,
      );
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    // Wait for rate limit token if needed
    if (this.rateLimiter) {
      await this.rateLimiter.consume();
    }

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set("Authorization", `token ${this.token}`);
    }
    headers.set("Accept", "application/vnd.github.v3+json");

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new GitHubAPIError(
        `GitHub API error: ${response.status} ${response.statusText}`,
        response.status,
        response,
      );
    }

    return await response.json() as T;
  }

  async getStarredRepos(options: {
    page?: number;
    perPage?: number;
    sort?: "created" | "updated";
    direction?: "asc" | "desc";
  } = {}): Promise<any[]> {
    const { page = 1, perPage = 100, sort, direction } = options;

    let url = `/user/starred?page=${page}&per_page=${perPage}`;
    if (sort) url += `&sort=${sort}`;
    if (direction) url += `&direction=${direction}`;

    return this.request<any[]>(url);
  }

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

  async starRepo(owner: string, repo: string): Promise<void> {
    await this.request(`/user/starred/${owner}/${repo}`, { method: "PUT" });
  }

  async unstarRepo(owner: string, repo: string): Promise<void> {
    await this.request(`/user/starred/${owner}/${repo}`, { method: "DELETE" });
  }

  async isRepoStarred(owner: string, repo: string): Promise<boolean> {
    try {
      await this.request(`/user/starred/${owner}/${repo}`);
      return true;
    } catch (error) {
      if (error instanceof GitHubAPIError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
```

Create a rate limiter utility in `src/utils/rate_limit.ts`:

```typescript
// src/utils/rate_limit.ts
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
    const timeToWait = (tokensNeeded / this.refillRate) * this.refillInterval;

    // Wait for tokens to become available
    await new Promise((resolve) => setTimeout(resolve, timeToWait));

    this.refill(); // Refill after waiting
    this.tokens -= tokens;
  }
}
```

#### Step 2: Define Models

Create models in `src/core/models/`:

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

// src/core/models/category.ts
export interface Category {
  name: string;
  pattern: string;
  displayName?: string;
}

// src/core/models/star_report.ts
export interface LanguageDistribution {
  language: string;
  count: number;
  percentage: number;
}

export interface ActivityReport {
  updatedThisYear: number;
  updatedLastYear: number;
  older: number;
}

export interface StarReport {
  totalStars: number;
  archivedCount: number;
  languageDistribution: LanguageDistribution[];
  activityReport: ActivityReport;
  mostPopular: Repository[];
}
```

#### Step 3: Implement Core Services

Create the star service in `src/core/services/star_service.ts`:

```typescript
// src/core/services/star_service.ts
import { GitHubClient } from "../api/github.ts";
import type {
  ActivityReport,
  Category,
  LanguageDistribution,
  Repository,
  StarReport,
} from "../models/mod.ts";

export class StarService {
  private client: GitHubClient;

  constructor(options: { token?: string; rateLimit?: number } = {}) {
    this.client = new GitHubClient({
      token: options.token,
      rateLimit: options.rateLimit || 10,
    });
  }

  async getAllStars(): Promise<Repository[]> {
    return await this.client.getAllStarredRepos() as Repository[];
  }

  async backupStars(outputPath: string): Promise<void> {
    const stars = await this.getAllStars();
    const jsonData = JSON.stringify(stars, null, 2);

    await Deno.writeTextFile(outputPath, jsonData);

    // Optional: Compress the file
    const gzipCommand = new Deno.Command("gzip", {
      args: ["-f", outputPath],
    });
    await gzipCommand.output();
  }

  async restoreStars(backupFile: string): Promise<void> {
    let data: string;

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

    const stars = JSON.parse(data) as Repository[];

    // Star each repository
    for (const repo of stars) {
      const [owner, name] = repo.full_name.split("/");
      try {
        await this.client.starRepo(owner, name);
        // Simple rate limiting between operations
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to star ${repo.full_name}:`, error);
      }
    }
  }

  async cleanupStars(options: {
    cutoffMonths?: number;
    dryRun?: boolean;
  } = {}): Promise<{
    totalReviewed: number;
    removed: number;
    archived: number;
    outdated: number;
  }> {
    const { cutoffMonths = 24, dryRun = false } = options;

    const stars = await this.getAllStars();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - cutoffMonths);

    let removed = 0;
    let archived = 0;
    let outdated = 0;

    for (const repo of stars) {
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
        if (!dryRun) {
          const [owner, name] = repo.full_name.split("/");
          await this.client.unstarRepo(owner, name);
        }
        removed++;
        console.log(
          `${
            dryRun ? "[DRY RUN] Would unstar" : "Unstarring"
          }: ${repo.full_name} (${reason})`,
        );
      }
    }

    return {
      totalReviewed: stars.length,
      removed,
      archived,
      outdated,
    };
  }

  async categorizeStars(
    categories: Category[],
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
          repo.topics.some((topic) => pattern.test(topic))
        ) {
          result[category.name].push(repo);
        }
      }
    }

    return result;
  }

  async generateReport(): Promise<StarReport> {
    const stars = await this.getAllStars();

    // Count archived repositories
    const archived = stars.filter((repo) => repo.archived).length;

    // Language distribution
    const languageMap = new Map<string, number>();
    for (const repo of stars) {
      const language = repo.language || "Unknown";
      languageMap.set(language, (languageMap.get(language) || 0) + 1);
    }

    const languageDistribution: LanguageDistribution[] = Array.from(
      languageMap.entries(),
    )
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

    const updatedThisYear =
      stars.filter((repo) =>
        new Date(repo.pushed_at).getFullYear() === currentYear
      ).length;

    const updatedLastYear =
      stars.filter((repo) =>
        new Date(repo.pushed_at).getFullYear() === lastYear
      ).length;

    const older = stars.length - updatedThisYear - updatedLastYear;

    const activityReport: ActivityReport = {
      updatedThisYear,
      updatedLastYear,
      older,
    };

    // Most popular repositories
    const mostPopular = [...stars]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10);

    return {
      totalStars: stars.length,
      archivedCount: archived,
      languageDistribution,
      activityReport,
      mostPopular,
    };
  }
}
```

#### Step 4: CLI Implementation

Create the CLI structure in `src/cli/mod.ts`:

```typescript
// src/cli/mod.ts
import { parse } from "@std/cli";
import { clean } from "./commands/cleanup.ts";
import { backup, restore } from "./commands/backup.ts";
import { categorize } from "./commands/categorize.ts";
import { report } from "./commands/report.ts";
import { digest } from "./commands/digest.ts";
import chalk from "chalk";

const COMMANDS = {
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

export async function main(args: string[]): Promise<void> {
  const parsedArgs = parse(args, {
    string: ["_"],
  });

  const command = parsedArgs._.length > 0 ? String(parsedArgs._[0]) : "help";

  if (command === "help" || command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  const commandHandler = COMMANDS[command as keyof typeof COMMANDS];

  if (!commandHandler) {
    console.error(chalk.red(`Unknown command: ${command}`));
    showHelp();
    Deno.exit(1);
  }

  try {
    await commandHandler.fn(parsedArgs._.slice(1), parsedArgs);
  } catch (error) {
    console.error(chalk.red(`Error executing command: ${error.message}`));
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
    Object.entries(COMMANDS).map(([name, { desc }]) =>
      `  ${chalk.green(name.padEnd(15))}${desc}`
    ).join("\n")
  }

${chalk.bold("GLOBAL OPTIONS")}
  --help, -h        Show this help message
  --token <token>   GitHub API token (or use GITHUB_TOKEN env var)
  --dry-run         Run without making changes (for cleanup)

${chalk.bold("EXAMPLES")}
  star-management backup --output stars.json
  star-management cleanup --cutoff-months 12 --dry-run
  star-management categorize --output-dir star-lists
  
For command-specific help, run:
  star-management <command> --help
`);
}
```

## Test Plan

The test plan ensures the migration maintains functionality while improving
reliability:

### Test Categories

1. **Unit Tests**
   - API client functionality
   - Service logic
   - Data transformations
   - Utilities and helpers

2. **Integration Tests**
   - End-to-end workflows
   - GitHub API interactions
   - CLI command execution

3. **Mock Tests**
   - GitHub API responses
   - Error conditions
   - Rate limiting scenarios

### Test Implementation Strategy

1. Create the test structure:
   ```
   tests/
   ├── unit/
   │   ├── api/
   │   │   └── github_test.ts
   │   └── services/
   │       └── star_service_test.ts
   └── integration/
       ├── backup_restore_test.ts
       ├── cleanup_test.ts
       └── categorize_test.ts
   ```

2. Example unit test:
   ```typescript
   // tests/unit/services/star_service_test.ts
   import { assertEquals, assertExists } from "@std/assert";
   import { StarService } from "../../../src/core/services/star_service.ts";
   import { MockGitHubClient } from "../../mocks/github_client.ts";

   Deno.test("StarService.categorizeStars should categorize repositories correctly", async () => {
     // Arrange
     const mockClient = new MockGitHubClient();
     const service = new StarService({ client: mockClient });
     const categories = [
       { name: "typescript", pattern: "typescript|ts" },
       { name: "python", pattern: "python|py" },
     ];

     // Mock repositories
     mockClient.addMockResponse("getAllStarredRepos", [
       {
         name: "typescript-project",
         description: "A TS project",
         topics: ["typescript"],
       },
       {
         name: "python-utils",
         description: "Python utilities",
         topics: ["python"],
       },
       { name: "other-repo", description: "Something else", topics: [] },
     ]);

     // Act
     const result = await service.categorizeStars(categories);

     // Assert
     assertEquals(result.typescript.length, 1);
     assertEquals(result.typescript[0].name, "typescript-project");
     assertEquals(result.python.length, 1);
     assertEquals(result.python[0].name, "python-utils");
   });
   ```

3. Example integration test:
   ```typescript
   // tests/integration/cleanup_test.ts
   import { assertEquals, assertExists } from "@std/assert";
   import { StarService } from "../../src/core/services/star_service.ts";

   // Only run in CI with proper credentials
   const runIntegration = Deno.env.get("RUN_INTEGRATION_TESTS") === "true";

   Deno.test({
     name: "Cleanup should identify archived repositories",
     ignore: !runIntegration,
     async fn() {
       const token = Deno.env.get("GITHUB_TOKEN");
       if (!token) {
         throw new Error(
           "GITHUB_TOKEN environment variable is required for integration tests",
         );
       }

       const service = new StarService({ token, rateLimit: 5 });

       // Run cleanup in dry-run mode
       const result = await service.cleanupStars({ dryRun: true });

       // Just verify we get results, don't actually unstar anything
       assertExists(result.totalReviewed);
       assertExists(result.archived);
       assertExists(result.outdated);

       console.log(
         `Found ${result.archived} archived and ${result.outdated} outdated repositories`,
       );
     },
   });
   ```

### Test Automation

1. Add test tasks to deno.json:
   ```json
   "tasks": {
     "test": "deno test --allow-net --allow-env tests/unit/",
     "test:integration": "deno test --allow-net --allow-env --allow-read --allow-write tests/integration/",
     "test:all": "deno test --allow-net --allow-env --allow-read --allow-write"
   }
   ```

2. Set up GitHub Actions workflow:
   ```yaml
   name: Tests
   on: [push, pull_request]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: denoland/setup-deno@v1
           with:
             deno-version: v1.x
         - run: deno task lint
         - run: deno task test
         - name: Integration Tests
           if: github.event_name == 'push' && github.ref == 'refs/heads/main'
           run: deno task test:integration
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             RUN_INTEGRATION_TESTS: true
   ```

## Risks and Mitigations

| Risk                     | Impact | Likelihood | Mitigation                                                                   |
| ------------------------ | ------ | ---------- | ---------------------------------------------------------------------------- |
| GitHub API Rate Limiting | High   | High       | Implement token bucket rate limiter, caching, and conditional requests       |
| Token Security           | High   | Medium     | Use environment variables or .env files, never hardcode tokens               |
| Cross-Platform Issues    | Medium | Medium     | Use Deno's standard library for filesystem operations, test on all platforms |
| Migration Complexity     | Medium | Medium     | Phased approach with parallel systems until fully tested                     |
| Breaking Changes         | High   | Low        | Maintain CLI compatibility, thorough testing                                 |
| Performance Regression   | Medium | Low        | Benchmark comparison, optimize critical paths                                |
| Dependency Management    | Low    | Low        | Use JSR and explicit versioning in imports                                   |

### Detailed Risk Analysis

1. **GitHub API Rate Limiting**
   - **Risk**: GitHub enforces rate limits that can cause script failures
   - **Mitigation**:
     - Implement sophisticated rate limiter with exponential backoff
     - Cache API responses when appropriate
     - Use conditional requests with ETags
     - Process batches with controlled concurrency

2. **Breaking Changes**
   - **Risk**: Users may have workflows dependent on current behavior
   - **Mitigation**:
     - Maintain backward compatible CLI interface
     - Provide clear migration path documentation
     - Version commands and mark deprecated features
     - Allow configurable strict/legacy modes

## Supporting Documentation

For detailed implementation specifics, refer to these supporting documents:

1. [GitHub API Client Implementation Guide](/docs/github-api-client.md)
2. [CLI Command Structure Documentation](/docs/cli-commands.md)
3. [Testing Strategy and Mocking Guide](/docs/testing.md)

## Next Steps

1. Set up project structure according to architecture
2. Implement core API client
3. Migrate scripts one-by-one, maintaining backward compatibility
4. Add comprehensive tests
5. Create user documentation and examples

---

This migration guide provides a structured approach to convert the existing
shell scripts to a robust Deno TypeScript implementation while maintaining
functionality and adding new features enabled by the Deno runtime.
