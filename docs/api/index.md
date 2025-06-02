# API Reference

This section documents the APIs provided by GitHub Star Management for programmatic usage.

## Core APIs

GitHub Star Management exposes several APIs that you can use in your own Deno scripts:

- [GitHub API Client](github-client.md) - A rate-limited client for GitHub's REST API
- [Star Service](star-service.md) - Service for managing GitHub stars
- [Models](models.md) - TypeScript type definitions for GitHub entities

## Usage Example

```typescript
import { StarService } from "github-star-management/mod.ts";

// Create a service with your GitHub token
const service = new StarService({ 
  token: Deno.env.get("GITHUB_TOKEN") 
});

// Get all your starred repositories
const stars = await service.getAllStars();
console.log(`You have ${stars.length} starred repositories!`);

// Back up your stars to a file
await service.backupStars("my-stars-backup.json");
console.log("Stars backed up successfully!");

// Clean up old stars (dry run)
const result = await service.cleanupStars({ 
  cutoffMonths: 24,
  dryRun: true 
});
console.log(`Found ${result.outdated} outdated stars and ${result.archived} archived repositories.`);
```

## Core Classes and Interfaces

These pages contain detailed API documentation for each component:

- [`GitHubClient`](github-client.md) - The main API client class
- [`StarService`](star-service.md) - The star management service
- [`Repository`](models.md#repository) - TypeScript interface for GitHub repositories
- [`Category`](models.md#category) - Interface for star categories

## Advanced Usage

For advanced usage and customization, see:

- [Rate Limiting](rate-limiting.md) - How to customize rate limiting behavior
- [Error Handling](error-handling.md) - Working with API errors
- [Extending the API](extending.md) - Creating custom API extensions