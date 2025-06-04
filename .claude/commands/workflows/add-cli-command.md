# Add New CLI Command

This workflow guides you through adding a new command to the GitHub Stars
Management CLI.

## Workflow Steps

1. **Define Command Requirements**
   - Identify the command's purpose and functionality
   - Determine required arguments and options
   - Define command output format
   - Consider error cases and handling

2. **Create Command Handler**
   - Create a new file in `src/cli/commands/` for the command
   - Implement the CommandHandler interface
   - Add argument parsing using `@std/cli`
   - Implement help text display

3. **Implement Core Functionality**
   - Use the appropriate service layer methods
   - Format output consistently using utils
   - Handle errors properly
   - Return appropriate exit codes

4. **Register Command**
   - Add the command to `src/cli/commands/mod.ts`
   - Define command metadata (description, usage, examples)
   - Add any command aliases

5. **Add Tests**
   - Create unit tests for the command handler
   - Test argument parsing
   - Test help display
   - Test error handling

6. **Update Documentation**
   - Add command to README.md
   - Update usage examples

## Example: Adding a 'trending' Command

```typescript
// 1. Create command handler
// src/cli/commands/trending.ts
import { parse } from "@std/cli";
import { StarService } from "../../core/services/star_service.ts";
import { CommandHandler } from "../types.ts";
import { formatOutput, formatError, formatSuccess } from "../utils/format.ts";

export const trending: CommandHandler = async (ctx) => {
  // Parse flags
  const flags = parse(ctx.args, {
    boolean: ["help", "verbose"],
    string: ["language", "limit", "output"],
    alias: {
      h: "help",
      l: "language",
      n: "limit",
      o: "output",
      v: "verbose"
    },
    default: {
      "language": "typescript",
      "limit": "10",
      "verbose": false
    }
  });

  if (flags.help) {
    formatOutput(ctx, `
GitHub Trending Repositories

USAGE:
  star-management trending [options]

OPTIONS:
  --language, -l      Language to filter by (default: typescript)
  --limit, -n         Number of repositories to display (default: 10)
  --output, -o        Output file path (optional)
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

EXAMPLES:
  star-management trending
  star-management trending --language python --limit 20
  star-management trending --output trending.md
`);
    return 0;
  }

  try {
    const language = flags.language as string;
    const limit = parseInt(flags.limit as string, 10);
    const outputPath = flags.output as string | undefined;
    
    formatOutput(ctx, `🔍 Fetching trending ${language} repositories...`);
    
    const token = ctx.env.GITHUB_TOKEN || ctx.env.STAR_MANAGEMENT_TOKEN;
    const service = new StarService({ token });
    
    // Fetch trending repos
    const repos = await service.getTrendingRepos(language, { limit });
    
    // Display results
    formatSuccess(ctx, `Found ${repos.length} trending ${language} repositories:`);
    
    for (const [index, repo] of repos.entries()) {
      formatOutput(ctx, `${index + 1}. ${repo.full_name} - ⭐ ${repo.stargazers_count}`);
      if (repo.description) {
        formatOutput(ctx, `   ${repo.description}`, { indent: 3 });
      }
    }
    
    // Save to file if requested
    if (outputPath) {
      await service.saveTrendingToFile(repos, outputPath);
      formatSuccess(ctx, `Results saved to ${outputPath}`);
    }
    
    return 0;
  } catch (error) {
    formatError(ctx, `Error fetching trending repositories: ${error.message}`);
    return 1;
  }
};

// 2. Register command in src/cli/commands/mod.ts
// Add to COMMANDS object
"trending": {
  handler: trending,
  description: "Fetch trending GitHub repositories",
  usage: "trending [options]",
  examples: [
    "trending",
    "trending --language python --limit 20",
    "trending --output trending.md"
  ]
}
```
