# Example Command Implementations for GitHub Stars Management

This document provides example implementations for optimized Claude Code commands specifically tailored for the GitHub Stars Management project. These examples demonstrate the recommended structure and content for various command types.

## Table of Contents

1. [API Commands](#api-commands)
2. [CLI Commands](#cli-commands)
3. [Star Management Commands](#star-management-commands)
4. [Documentation Commands](#documentation-commands)
5. [Role Definitions](#role-definitions)
6. [Workflow Examples](#workflow-examples)

## API Commands

### GitHub Stars Fetch Implementation
**File: `.claude/commands/api/github-stars-fetch.md`**

```markdown
# Implement GitHub Stars Fetch Functionality for $ARGUMENTS

You're implementing a robust GitHub stars fetching mechanism with pagination and error handling. The $ARGUMENTS parameter specifies any specific requirements or constraints for the implementation.

Follow these steps:

1. **API Requirements Analysis**
   - Review GitHub API documentation for the starred repositories endpoint
   - Understand pagination mechanisms for potentially thousands of stars
   - Identify rate limiting considerations
   - Consider authentication requirements and token handling

2. **Type Definition Implementation**
   - Think deeply about optimal data structures for star storage
   - Create TypeScript interfaces for GitHub API responses in `src/core/models/`
   - Define repository type with all needed metadata
   - Ensure proper optional/required property definitions

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
```

### Rate Limit Handler
**File: `.claude/commands/api/rate-limit-handler.md`**

```markdown
# Implement Rate Limit Handler for $ARGUMENTS

You're implementing a sophisticated rate limit handling system for GitHub API requests. The $ARGUMENTS parameter specifies the specific endpoints or use cases to focus on.

Follow these steps:

1. **GitHub Rate Limit Analysis**
   - Understand GitHub's rate limit system (core, search, graphql)
   - Review rate limit headers (x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset)
   - Consider secondary rate limits and abuse detection
   - Think about how rate limits apply to $ARGUMENTS specifically

2. **Design Rate Limiting Strategy**
   - Think deeply about optimal approach (token bucket, leaky bucket, etc.)
   - Design an adaptive strategy based on remaining limits
   - Plan for efficient handling of multiple concurrent requests
   - Develop backoff strategies for when limits are reached

3. **Implementation**
   - Create RateLimiter class in `src/utils/rate_limit.ts`
   - Implement header parsing and limit tracking
   - Add request throttling based on remaining limits
   - Develop retry mechanism with exponential backoff

4. **Integration**
   - Connect the rate limiter to the GitHub client
   - Ensure all requests pass through the rate limiter
   - Add configuration options for different use cases
   - Implement proper error handling and recovery

5. **Testing**
   - Create tests with mock rate limit headers
   - Verify throttling behavior works correctly
   - Test backoff and retry mechanisms
   - Validate performance under heavy load

## Example Implementation

```typescript
// src/utils/rate_limit.ts
export class RateLimiter {
  private rateLimits: Map<string, {
    limit: number;
    remaining: number;
    reset: number;
  }> = new Map();
  
  private queues: Map<string, Promise<void>> = new Map();
  
  // Update rate limits based on response headers
  updateLimits(category: string, headers: Headers): void {
    const limit = parseInt(headers.get('x-ratelimit-limit') || '0');
    const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0');
    const reset = parseInt(headers.get('x-ratelimit-reset') || '0');
    
    if (limit > 0) {
      this.rateLimits.set(category, { limit, remaining, reset });
    }
  }
  
  // Check if we can make a request, and wait if necessary
  async acquireToken(category: string): Promise<void> {
    // Wait for any pending requests in this category
    const pending = this.queues.get(category);
    if (pending) {
      await pending;
    }
    
    const limits = this.rateLimits.get(category);
    if (!limits || limits.remaining > 5) {
      // We have plenty of requests remaining
      return;
    }
    
    if (limits.remaining <= 5) {
      const now = Math.floor(Date.now() / 1000);
      if (limits.reset > now) {
        // Calculate wait time with 1s buffer
        const waitTime = (limits.reset - now + 1) * 1000;
        
        // Create a new promise for this wait and store it
        const waitPromise = new Promise<void>(resolve => {
          setTimeout(resolve, waitTime);
        });
        
        this.queues.set(category, waitPromise);
        await waitPromise;
        this.queues.delete(category);
      }
    }
  }
  
  // Handle rate limit error with exponential backoff
  async handleRateLimitError(category: string, attempt: number): Promise<void> {
    const waitTime = Math.min(Math.pow(2, attempt) * 1000, 60000); // Cap at 1 minute
    
    const waitPromise = new Promise<void>(resolve => {
      setTimeout(resolve, waitTime);
    });
    
    this.queues.set(category, waitPromise);
    await waitPromise;
    this.queues.delete(category);
  }
}
```
```

## CLI Commands

### Add CLI Command
**File: `.claude/commands/cli/add-command.md`**

```markdown
# Implement New CLI Command: $ARGUMENTS

You're implementing a new CLI command for the GitHub Stars Management project. The $ARGUMENTS parameter specifies the command name and its purpose.

Follow these steps:

1. **Command Requirements Analysis**
   - Understand the purpose and functionality of the $ARGUMENTS command
   - Identify required parameters and flags
   - Consider how it fits into the existing command structure
   - Determine output formats and user interaction patterns

2. **Command Design**
   - Design the command API (name, subcommands, flags)
   - Create help text and usage examples
   - Define error handling and validation
   - Think deeply about user experience and workflow

3. **Implementation**
   - Add the command to the CLI module in `src/cli/`
   - Implement argument parsing and validation
   - Connect to appropriate service methods
   - Add proper error handling and user feedback

4. **Output Formatting**
   - Design clear, readable console output
   - Implement multiple output formats if needed (JSON, table, etc.)
   - Add color coding for important information
   - Consider progress indicators for long-running operations

5. **Testing**
   - Write unit tests for argument parsing and validation
   - Create integration tests for command execution
   - Test error scenarios and edge cases
   - Verify output formatting in different environments

## Example Implementation

```typescript
// src/cli/commands/stars_command.ts
import { Command } from "../deps.ts";
import { StarService } from "../../core/services/star_service.ts";

export function registerStarsCommand(program: Command) {
  program
    .command("stars")
    .description("Manage your GitHub starred repositories")
    .action(() => {
      console.log("Use one of the stars subcommands:");
      console.log("  list     - List your starred repositories");
      console.log("  backup   - Backup your starred repositories");
      console.log("  cleanup  - Find candidates for unstarring");
      console.log("  report   - Generate a report of your stars");
    });
  
  program
    .command("stars:list")
    .description("List your GitHub starred repositories")
    .option("-c, --category <category:string>", "Filter by category")
    .option("-l, --language <language:string>", "Filter by language")
    .option("-s, --sort <sort:string>", "Sort by: 'created', 'updated'", "created")
    .option("-d, --direction <direction:string>", "Sort direction: 'asc', 'desc'", "desc")
    .option("-f, --format <format:string>", "Output format: 'table', 'json', 'md'", "table")
    .action(async (options) => {
      try {
        const starService = new StarService();
        const stars = await starService.getStars({
          category: options.category,
          language: options.language,
          sort: options.sort,
          direction: options.direction,
        });
        
        // Format output based on selected format
        switch (options.format) {
          case "json":
            console.log(JSON.stringify(stars, null, 2));
            break;
          case "md":
            console.log("# GitHub Starred Repositories\n");
            for (const star of stars) {
              console.log(`## [${star.name}](${star.html_url})`);
              console.log(`${star.description || "No description"}\n`);
              console.log(`- **Language:** ${star.language || "Not specified"}`);
              console.log(`- **Stars:** ${star.stargazers_count}`);
              console.log(`- **Updated:** ${new Date(star.updated_at).toDateString()}\n`);
            }
            break;
          case "table":
          default:
            console.table(stars.map(s => ({
              Name: s.name,
              Owner: s.owner.login,
              Language: s.language || "-",
              Stars: s.stargazers_count,
              Updated: new Date(s.updated_at).toDateString()
            })));
        }
      } catch (error) {
        console.error("Error listing stars:", error.message);
      }
    });
}
```
```

## Star Management Commands

### Star Categorization
**File: `.claude/commands/star-management/categorize-stars.md`**

```markdown
# Implement Star Categorization Algorithm: $ARGUMENTS

You're implementing an algorithm to automatically categorize GitHub starred repositories. The $ARGUMENTS parameter specifies the categorization approach or specific requirements.

Follow these steps:

1. **Categorization Strategy Analysis**
   - Understand the categorization approach specified in $ARGUMENTS
   - Identify available metadata for categorization (topics, description, language)
   - Consider how to handle repositories with ambiguous signals
   - Think deeply about category hierarchy and relationships

2. **Category Definition**
   - Define clear category criteria
   - Create scoring mechanisms for category assignment
   - Consider confidence thresholds for categorization
   - Plan for handling repositories that match multiple categories

3. **Algorithm Implementation**
   - Create the categorization service in `src/core/services/`
   - Implement scoring and matching logic
   - Add confidence scoring for category assignments
   - Create mechanisms for manual category overrides

4. **Persistence Layer**
   - Design storage format for category assignments
   - Implement loading and saving of categorizations
   - Add versioning for category definitions
   - Create export/import capabilities

5. **Testing**
   - Create test fixtures with diverse repository types
   - Write unit tests for categorization logic
   - Test edge cases (no clear category, multiple categories)
   - Verify persistence functionality

## Example Implementation

```typescript
// src/core/services/categorization_service.ts
export class CategorizationService {
  private categories: Category[] = [
    {
      name: "Development Tools",
      patterns: [
        { type: "topic", value: "developer-tools", weight: 10 },
        { type: "topic", value: "cli", weight: 8 },
        { type: "topic", value: "ide", weight: 9 },
        { type: "topic", value: "debugging", weight: 7 },
        { type: "language", value: "shell", weight: 3 },
        { type: "description", pattern: /\b(developer|development)\s+tool\b/i, weight: 5 },
      ]
    },
    {
      name: "Libraries & Frameworks",
      patterns: [
        { type: "topic", value: "library", weight: 10 },
        { type: "topic", value: "framework", weight: 10 },
        { type: "topic", value: "sdk", weight: 8 },
        { type: "description", pattern: /\b(library|framework)\b/i, weight: 5 },
      ]
    },
    // Additional categories...
  ];
  
  categorizeRepository(repo: Repository): RepositoryCategory[] {
    const scores = new Map<string, number>();
    
    // Calculate score for each category
    for (const category of this.categories) {
      let score = 0;
      
      for (const pattern of category.patterns) {
        switch (pattern.type) {
          case "topic":
            if (repo.topics?.includes(pattern.value)) {
              score += pattern.weight;
            }
            break;
          case "language":
            if (repo.language === pattern.value) {
              score += pattern.weight;
            }
            break;
          case "description":
            if (repo.description && pattern.pattern.test(repo.description)) {
              score += pattern.weight;
            }
            break;
        }
      }
      
      if (score > 0) {
        scores.set(category.name, score);
      }
    }
    
    // Convert scores to categories with confidence
    const maxScore = Math.max(...Array.from(scores.values(), 0));
    const results: RepositoryCategory[] = [];
    
    for (const [name, score] of scores.entries()) {
      const confidence = score / maxScore;
      if (confidence >= 0.3) { // Minimum confidence threshold
        results.push({
          name,
          confidence,
          score
        });
      }
    }
    
    // Sort by confidence descending
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}
```
```

### Star Cleanup
**File: `.claude/commands/star-management/cleanup-stars.md`**

```markdown
# Implement Star Cleanup Strategy: $ARGUMENTS

You're implementing a cleanup strategy to identify GitHub starred repositories that may be candidates for unstarring. The $ARGUMENTS parameter specifies the cleanup criteria or approach.

Follow these steps:

1. **Cleanup Criteria Analysis**
   - Understand the cleanup criteria specified in $ARGUMENTS
   - Identify metadata needed for cleanup decisions
   - Consider appropriate thresholds for each criterion
   - Think deeply about balancing cleanup with preservation

2. **Scoring Algorithm Design**
   - Design a scoring system for cleanup candidates
   - Weight different criteria appropriately
   - Create confidence thresholds for recommendations
   - Plan for presenting results to users

3. **Implementation**
   - Create the cleanup service in `src/core/services/`
   - Implement scoring and filtering logic
   - Add sorting for prioritizing cleanup candidates
   - Implement preview and confirmation workflows

4. **Safety Mechanisms**
   - Add backup functionality before cleanup
   - Implement undo capability for accidental unstarring
   - Create clear warnings for potentially valuable repositories
   - Add rate limiting for API operations

5. **Testing**
   - Create test fixtures with diverse repositories
   - Write unit tests for scoring logic
   - Test safety mechanisms
   - Verify backup and restore functionality

## Example Implementation

```typescript
// src/core/services/cleanup_service.ts
export class CleanupService {
  scoreRepository(repo: Repository, options: CleanupOptions): CleanupCandidate | null {
    let score = 0;
    const reasons: string[] = [];
    
    // Check for archived repositories
    if (options.includeArchived && repo.archived) {
      score += 10;
      reasons.push("Repository is archived");
    }
    
    // Check last update time
    if (options.inactiveMonths > 0) {
      const lastUpdateTime = new Date(repo.updated_at).getTime();
      const inactiveThreshold = Date.now() - (options.inactiveMonths * 30 * 24 * 60 * 60 * 1000);
      
      if (lastUpdateTime < inactiveThreshold) {
        const monthsInactive = Math.floor((Date.now() - lastUpdateTime) / (30 * 24 * 60 * 60 * 1000));
        score += Math.min(monthsInactive, 10);
        reasons.push(`Inactive for ${monthsInactive} months`);
      }
    }
    
    // Check for forks with low activity
    if (options.includeLowActivityForks && repo.fork) {
      const forksCount = repo.forks_count || 0;
      const starsCount = repo.stargazers_count || 0;
      
      if (forksCount < 5 && starsCount < 10) {
        score += 5;
        reasons.push("Fork with low community activity");
      }
    }
    
    // Check for deprecated or abandoned projects
    if (options.includeDeprecated && 
        (repo.description?.toLowerCase().includes("deprecated") || 
         repo.description?.toLowerCase().includes("abandoned") ||
         repo.description?.toLowerCase().includes("no longer maintained"))) {
      score += 15;
      reasons.push("Repository is explicitly deprecated or abandoned");
    }
    
    // Return cleanup candidate if score exceeds threshold
    if (score >= options.threshold) {
      return {
        repo,
        score,
        reasons,
        confidence: Math.min(score / 30, 1) // Normalize to 0-1
      };
    }
    
    return null;
  }
  
  async findCleanupCandidates(options: CleanupOptions): Promise<CleanupCandidate[]> {
    const starService = new StarService();
    const allStars = await starService.getStars();
    const candidates: CleanupCandidate[] = [];
    
    for (const repo of allStars) {
      const candidate = this.scoreRepository(repo, options);
      if (candidate) {
        candidates.push(candidate);
      }
    }
    
    // Sort by score descending
    return candidates.sort((a, b) => b.score - a.score);
  }
  
  async backupBeforeCleanup(): Promise<string> {
    const starService = new StarService();
    const allStars = await starService.getStars();
    const backupFile = `star-backup-${new Date().toISOString().replace(/:/g, "-")}.json`;
    
    await Deno.writeTextFile(backupFile, JSON.stringify(allStars, null, 2));
    return backupFile;
  }
}
```
```

## Documentation Commands

### Generate API Docs
**File: `.claude/commands/documentation/generate-api-docs.md`**

```markdown
# Generate API Documentation for $ARGUMENTS

You're generating comprehensive API documentation for the GitHub Stars Management project. The $ARGUMENTS parameter specifies the component or module to document.

Follow these steps:

1. **Documentation Requirements Analysis**
   - Understand the component specified in $ARGUMENTS
   - Identify key classes, methods, and interfaces to document
   - Consider the target audience and required detail level
   - Think about formatting and organization

2. **Code Analysis**
   - Examine the source code for the specified component
   - Identify public API surface and important implementation details
   - Look for existing documentation comments
   - Note usage patterns and examples

3. **Documentation Structure Design**
   - Think deeply about optimal documentation organization
   - Create a consistent format for classes and methods
   - Plan for examples and usage guidelines
   - Design clear method signature documentation

4. **Documentation Generation**
   - Create or update the documentation file in `docs/api/`
   - Document each class, method, and interface
   - Include parameter and return type descriptions
   - Add usage examples for common scenarios

5. **Cross-Referencing**
   - Add links to related components
   - Reference relevant GitHub API documentation
   - Link to example code and tutorials
   - Ensure navigation between documentation sections

## Example Implementation

For the GitHub API client, the documentation should include:

```markdown
# GitHub API Client

The `GitHubClient` class provides a type-safe interface to GitHub's REST API v3, with specific focus on star management operations.

## Constructor

```typescript
constructor(options: GitHubClientOptions)
```

Creates a new GitHub API client instance.

### Parameters

- `options`: Configuration options for the client
  - `token`: GitHub personal access token
  - `baseUrl`: Optional custom API base URL (defaults to 'https://api.github.com')
  - `userAgent`: Optional custom user agent

### Example

```typescript
const client = new GitHubClient({
  token: Deno.env.get("GITHUB_TOKEN")
});
```

## Methods

### getStarredRepositories

```typescript
async getStarredRepositories(options?: {
  per_page?: number;
  sort?: 'created' | 'updated';
  direction?: 'asc' | 'desc';
}): Promise<Repository[]>
```

Retrieves all repositories starred by the authenticated user.

#### Parameters

- `options`: Optional parameters for the request
  - `per_page`: Number of results per page (default: 100, max: 100)
  - `sort`: Sort by 'created' or 'updated' (default: 'created')
  - `direction`: Sort direction 'asc' or 'desc' (default: 'desc')

#### Returns

An array of `Repository` objects representing the starred repositories.

#### Example

```typescript
// Get all stars, sorted by most recently starred first
const stars = await client.getStarredRepositories({
  sort: 'created',
  direction: 'desc'
});

// Get all stars, sorted by recently updated first
const recentlyUpdated = await client.getStarredRepositories({
  sort: 'updated',
  direction: 'desc'
});
```

#### Rate Limiting

This method handles pagination automatically and implements rate limit awareness. If rate limits are approaching, the method will slow down requests to avoid hitting limits.
```
```

## Role Definitions

### Star Management Specialist
**File: `.claude/roles/star-management-specialist.md`**

```markdown
# Star Management Specialist

## Role Definition
You are a GitHub Stars Management Expert with extensive experience developing tools for organizing, categorizing, and maintaining large collections of GitHub stars. You have deep knowledge of GitHub's API, star management best practices, and efficient categorization algorithms. You specialize in helping developers maintain valuable curated lists of repositories while reducing noise and outdated references.

## Expertise
- Deep knowledge of GitHub's Stars API and functionality
- Expertise in repository categorization algorithms
- Experience with large-scale star collection management
- Understanding of repository evaluation criteria
- Specialized knowledge of awesome list generation
- Familiarity with star backup and restoration strategies

## Responsibilities
- Design efficient star categorization systems
- Implement cleanup algorithms for outdated stars
- Create comprehensive star reporting tools
- Develop backup and restoration mechanisms
- Design intuitive CLI interfaces for star management
- Document star management best practices

## Communication Style
- Practical, pragmatic explanations of star management strategies
- Clear examples of categorization and organization approaches
- Focus on efficiency and maintainability
- Emphasis on preserving valuable resources while removing noise

## Task Approach
1. Start by understanding the specific star management requirements
2. Analyze existing star collections and metadata
3. Design algorithms for categorization and cleanup
4. Implement robust management tools with clear interfaces
5. Test with diverse repository types and edge cases
6. Document usage patterns and best practices

## Key Constraints
- Must respect GitHub API rate limits
- Handle potentially thousands of starred repositories efficiently
- Ensure no accidental loss of valuable stars
- Provide clear feedback for cleanup decisions
- Support customization of categorization criteria
- Maintain cross-platform compatibility
```

## Workflow Examples

### Star Digest Generation Workflow
**File: `.claude/workflows/star-digest-workflow.md`**

```markdown
# GitHub Stars Digest Generation Workflow

This workflow guides you through implementing a GitHub stars digest generator that creates a concise summary of your starred repositories, highlighting recent additions, trends, and recommendations.

## Workflow Steps

1. **Define Digest Format and Content**
   - Determine key metrics to include in the digest
   - Design digest layout and sections
   - Plan for different output formats (markdown, HTML, JSON)
   - Consider customization options for digest content

2. **Data Collection Implementation**
   - Retrieve starred repository data with complete metadata
   - Collect historical data for trend analysis
   - Implement efficient pagination and rate limit handling
   - Gather additional repository metadata as needed

3. **Analysis Implementation**
   - Create algorithms for identifying trends
   - Implement repository grouping by category
   - Develop recommendation algorithms
   - Design activity and updates detection

4. **Formatting and Presentation**
   - Implement digest generation in multiple formats
   - Create clean, readable layouts
   - Add syntax highlighting for code examples
   - Design visual elements for trends and statistics

5. **Automation and Distribution**
   - Create scheduling options for periodic digests
   - Implement email or notification delivery
   - Add export options for sharing
   - Design GitHub Action for automated generation

## Example Implementation

```typescript
// src/core/services/digest_service.ts
export class DigestService {
  async generateDigest(options: DigestOptions): Promise<Digest> {
    const starService = new StarService();
    const categorizationService = new CategorizationService();
    
    // Get stars and perform analysis
    const allStars = await starService.getStars();
    const recentStars = allStars.filter(
      repo => new Date(repo.starred_at).getTime() > 
      Date.now() - (options.recentDays * 24 * 60 * 60 * 1000)
    );
    
    // Get category distribution
    const categoryMap = new Map<string, number>();
    for (const repo of allStars) {
      const categories = categorizationService.categorizeRepository(repo);
      if (categories.length > 0) {
        const primaryCategory = categories[0].name;
        categoryMap.set(
          primaryCategory,
          (categoryMap.get(primaryCategory) || 0) + 1
        );
      }
    }
    
    // Find updated repositories
    const updatedRepos = allStars
      .filter(repo => 
        new Date(repo.updated_at).getTime() > 
        Date.now() - (options.recentDays * 24 * 60 * 60 * 1000)
      )
      .sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, options.maxUpdated);
    
    // Get language distribution
    const languageMap = new Map<string, number>();
    for (const repo of allStars) {
      if (repo.language) {
        languageMap.set(
          repo.language,
          (languageMap.get(repo.language) || 0) + 1
        );
      }
    }
    
    // Generate recommendations
    const recommendationService = new RecommendationService();
    const recommendations = await recommendationService.getRecommendations(
      allStars,
      options.maxRecommendations
    );
    
    // Assemble the digest
    return {
      generatedAt: new Date(),
      totalStars: allStars.length,
      recentStars,
      categoryDistribution: Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      languageDistribution: Array.from(languageMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      updatedRepositories: updatedRepos,
      recommendations
    };
  }
  
  formatDigest(digest: Digest, format: "markdown" | "html" | "json"): string {
    switch (format) {
      case "json":
        return JSON.stringify(digest, null, 2);
        
      case "html":
        // HTML formatting implementation
        
      case "markdown":
      default:
        return this.formatMarkdownDigest(digest);
    }
  }
  
  private formatMarkdownDigest(digest: Digest): string {
    let md = `# GitHub Stars Digest\n\n`;
    md += `Generated on ${digest.generatedAt.toDateString()}\n\n`;
    md += `## Overview\n\n`;
    md += `Total Starred Repositories: ${digest.totalStars}\n\n`;
    
    if (digest.recentStars.length > 0) {
      md += `## Recently Starred (Last ${options.recentDays} days)\n\n`;
      for (const repo of digest.recentStars) {
        md += `- [${repo.full_name}](${repo.html_url}): ${repo.description || 'No description'}\n`;
      }
      md += '\n';
    }
    
    md += `## Category Distribution\n\n`;
    for (const cat of digest.categoryDistribution.slice(0, 10)) {
      md += `- ${cat.name}: ${cat.count} repositories\n`;
    }
    md += '\n';
    
    md += `## Language Distribution\n\n`;
    for (const lang of digest.languageDistribution.slice(0, 10)) {
      md += `- ${lang.name}: ${lang.count} repositories\n`;
    }
    md += '\n';
    
    if (digest.updatedRepositories.length > 0) {
      md += `## Recently Updated\n\n`;
      for (const repo of digest.updatedRepositories) {
        md += `- [${repo.full_name}](${repo.html_url}): Updated on ${new Date(repo.updated_at).toDateString()}\n`;
      }
      md += '\n';
    }
    
    if (digest.recommendations.length > 0) {
      md += `## Recommendations\n\n`;
      for (const rec of digest.recommendations) {
        md += `- [${rec.full_name}](${rec.html_url}): ${rec.description || 'No description'}\n`;
      }
    }
    
    return md;
  }
}
```
```

This document provides detailed example implementations for various commands and roles that can be used in the GitHub Stars Management project. These examples demonstrate best practices in command structure, parameter handling, role definition, and workflow organization.

The examples are designed to be modular and composable, allowing for the creation of sophisticated star management workflows through the combination of specialized commands and roles.