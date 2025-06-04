# CLI Command Structure Documentation

## Overview

This document details the command-line interface (CLI) implementation for the
GitHub Star Management tool. The CLI provides a user-friendly interface to
interact with all star management functionality.

## Command Architecture

The CLI follows a command-subcommand pattern with consistent argument handling:

```
star-management <command> [subcommand] [options]
```

### Core Components

1. **Command Parser**: Uses Deno's `@std/cli` module to parse command-line
   arguments
2. **Command Registry**: Central registry of all available commands and their
   handlers
3. **Command Handlers**: Individual implementations of each command's
   functionality
4. **Output Formatter**: Handles consistent, styled console output
5. **Error Handler**: Standardized error handling and reporting

## Command Implementation

### Command Registry

The command registry maintains metadata about all available commands:

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
  // ...other commands
};

// Map aliases to main command names
export const COMMAND_ALIASES: Record<string, string> = Object.entries(COMMANDS)
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

### Command Handler Interface

Each command follows a standard handler interface:

```typescript
// src/cli/types.ts
import { Args } from "@std/cli";

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

### Command Implementation Example

A typical command implementation:

```typescript
// src/cli/commands/cleanup.ts
import { parse } from "@std/cli";
import { StarService } from "../../core/services/star_service.ts";
import { formatError, formatOutput } from "../utils/format.ts";
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
    showHelp(ctx);
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
      formatOutput(ctx, `DRY RUN: No stars will be removed`);
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
    formatOutput(ctx, `✅ Cleanup complete!`);
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

function showHelp(ctx: CommandContext): void {
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
}
```

## Complete Command Catalog

Below is the complete list of commands implemented in the CLI:

### 1. `cleanup`

Remove stars from archived or outdated repositories.

**Options:**

- `--dry-run, -d`: Run without making changes
- `--cutoff-months, -c`: Months of inactivity before removal (default: 24)
- `--exclude, -e`: Comma-separated list of repos to exclude (owner/name format)
- `--verbose, -v`: Show detailed output

**Examples:**

```bash
star-management cleanup --dry-run
star-management cleanup --cutoff-months 12
star-management cleanup --exclude owner/repo1,owner/repo2
```

### 2. `backup`

Backup all starred repositories to a file.

**Options:**

- `--output, -o`: Output file path (default: star-backup-YYYY-MM-DD.json)
- `--compress, -c`: Compress output file with gzip
- `--format, -f`: Output format (json, csv, md) (default: json)
- `--verbose, -v`: Show detailed output

**Examples:**

```bash
star-management backup
star-management backup --output stars.json
star-management backup --compress
star-management backup --format md
```

### 3. `restore`

Restore stars from a backup file.

**Options:**

- `--input, -i`: Input file path
- `--dry-run, -d`: Preview what would be restored without making changes
- `--delay, -l`: Milliseconds to wait between operations (default: 500)
- `--verbose, -v`: Show detailed output

**Examples:**

```bash
star-management restore --input star-backup-2023-01-01.json
star-management restore --input star-backup.json.gz --dry-run
star-management restore --input backup.json --delay 1000
```

### 4. `categorize`

Categorize stars into topical lists.

**Options:**

- `--output-dir, -o`: Output directory (default: star-lists)
- `--format, -f`: Output format (md, json) (default: md)
- `--config, -c`: Path to category configuration file
- `--verbose, -v`: Show detailed output

**Examples:**

```bash
star-management categorize
star-management categorize --output-dir my-stars
star-management categorize --format json
star-management categorize --config categories.json
```

### 5. `report`

Generate a star report with statistics.

**Options:**

- `--output, -o`: Output file path (default: star-report-YYYY-MM-DD.md)
- `--format, -f`: Output format (md, json, html) (default: md)
- `--include-chart, -c`: Include charts in the report (html or md format only)
- `--verbose, -v`: Show detailed output

**Examples:**

```bash
star-management report
star-management report --output report.html --format html
star-management report --include-chart
```

### 6. `digest`

Generate a digest of trending repositories.

**Options:**

- `--interests, -i`: Comma-separated list of interests (default from config)
- `--output, -o`: Output file path (default: star-digest-YYYY-MM-DD.md)
- `--limit, -l`: Number of repos per interest (default: 5)
- `--format, -f`: Output format (md, json) (default: md)
- `--verbose, -v`: Show detailed output

**Examples:**

```bash
star-management digest
star-management digest --interests typescript,python,golang
star-management digest --limit 10
star-management digest --format json
```

## CLI Output Formatting

The CLI uses consistent, colorful output formatting:

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
  Deno.writeAllSync(ctx.stdout as Deno.Writer, text);
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
  Deno.writeAllSync(ctx.stderr as Deno.Writer, text);
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

export function formatInfo(
  ctx: CommandContext,
  message: string,
  options: FormatOptions = {},
): void {
  formatOutput(ctx, chalk.blue(message), {
    prefix: options.prefix || "ℹ️",
    indent: options.indent,
  });
}

export function formatTable(
  ctx: CommandContext,
  headers: string[],
  rows: string[][],
  options: FormatOptions = {},
): void {
  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const values = [h, ...rows.map((r) => r[i] || "")];
    return Math.max(...values.map((v) => v.length)) + 2;
  });

  // Format header
  let header = "";
  headers.forEach((h, i) => {
    header += chalk.bold(h.padEnd(colWidths[i]));
  });

  // Format rows
  const formattedRows = rows.map((row) => {
    let formattedRow = "";
    row.forEach((cell, i) => {
      formattedRow += cell.padEnd(colWidths[i]);
    });
    return formattedRow;
  });

  // Output
  formatOutput(ctx, header, options);
  formatOutput(ctx, "─".repeat(header.length), options);
  formattedRows.forEach((row) => {
    formatOutput(ctx, row, options);
  });
}

export function formatProgressBar(
  ctx: CommandContext,
  current: number,
  total: number,
  width = 40,
  options: FormatOptions = {},
): void {
  const percent = total > 0 ? Math.floor((current / total) * 100) : 0;
  const filled = Math.floor((width * current) / total);
  const empty = width - filled;

  const bar = `[${"█".repeat(filled)}${
    " ".repeat(empty)
  }] ${current}/${total} (${percent}%)`;
  formatOutput(ctx, bar, options);
}
```

## Configuration Management

The CLI supports configuration from multiple sources:

```typescript
// src/cli/config.ts
import { parse as parseYaml } from "jsr:@std/yaml";
import { exists } from "jsr:@std/fs/exists";
import { dirname, join } from "jsr:@std/path";
import { z } from "npm:zod";

// Define configuration schema
const ConfigSchema = z.object({
  token: z.string().optional(),
  rateLimit: z.number().optional(),
  categories: z.array(
    z.object({
      name: z.string(),
      pattern: z.string(),
      displayName: z.string().optional(),
    }),
  ).optional(),
  interests: z.array(z.string()).optional(),
  cleanup: z.object({
    cutoffMonths: z.number().optional(),
    excludeList: z.array(z.string()).optional(),
  }).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function loadConfig(): Promise<Config> {
  // Priority order:
  // 1. Environment variables
  // 2. Config file in current directory
  // 3. Config file in home directory
  // 4. Default values

  const config: Config = {
    categories: DEFAULT_CATEGORIES,
    interests: DEFAULT_INTERESTS,
  };

  // Try loading from config file
  const configPaths = [
    "./.star-management.json",
    "./.star-management.yaml",
    "./.star-management.yml",
    join(Deno.env.get("HOME") || "~", ".star-management.json"),
    join(Deno.env.get("HOME") || "~", ".star-management.yaml"),
    join(Deno.env.get("HOME") || "~", ".star-management.yml"),
  ];

  for (const path of configPaths) {
    if (await exists(path)) {
      try {
        const content = await Deno.readTextFile(path);
        let fileConfig: unknown;

        if (path.endsWith(".json")) {
          fileConfig = JSON.parse(content);
        } else {
          fileConfig = parseYaml(content);
        }

        // Validate and merge config
        const parsed = ConfigSchema.parse(fileConfig);
        Object.assign(config, parsed);
        break;
      } catch (error) {
        console.error(`Error loading config from ${path}:`, error.message);
      }
    }
  }

  // Override with environment variables
  if (Deno.env.get("GITHUB_TOKEN")) {
    config.token = Deno.env.get("GITHUB_TOKEN");
  } else if (Deno.env.get("STAR_MANAGEMENT_TOKEN")) {
    config.token = Deno.env.get("STAR_MANAGEMENT_TOKEN");
  }

  if (Deno.env.get("STAR_RATE_LIMIT")) {
    config.rateLimit = parseInt(Deno.env.get("STAR_RATE_LIMIT") || "10", 10);
  }

  return config;
}

// Default categories (same as shell script)
const DEFAULT_CATEGORIES = [
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

const DEFAULT_INTERESTS = [
  "typescript",
  "python",
  "golang",
  "ai",
  "devops",
];
```

## CLI Entry Point

The main entry point that ties everything together:

```typescript
// src/cli/mod.ts
import { parse } from "@std/cli";
import { COMMAND_ALIASES, COMMANDS, resolveCommand } from "./commands/mod.ts";
import { formatError, formatOutput } from "./utils/format.ts";
import { loadConfig } from "./config.ts";
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

  // Load config
  const config = await loadConfig();

  // Prepare context
  const commandDef = COMMANDS[resolvedCommand];
  const ctx = {
    flags: parsedArgs,
    args: parsedArgs._.slice(1).map(String),
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    env: {
      ...Deno.env.toObject(),
      GITHUB_TOKEN: config.token || Deno.env.get("GITHUB_TOKEN") || "",
    },
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

Run ${chalk.cyan("star-management <command> --help")} for command-specific help.
`);
}

function showVersion(): void {
  console.log("GitHub Star Management v1.0.0");
}

// Run if this module is executed directly
if (import.meta.main) {
  await main(Deno.args);
}
```

## Command Alias Support

The CLI supports command aliases for better usability:

```typescript
// Example command aliases
{
  "cleanup": {
    // ...
    aliases: ["clean", "purge"]
  },
  "backup": {
    // ...
    aliases: ["export", "save"]
  },
  "restore": {
    // ...
    aliases: ["import", "load"]
  }
}
```

## Command Documentation Generation

To generate command documentation from the code:

````typescript
// scripts/generate-docs.ts
import { COMMANDS } from "../src/cli/commands/mod.ts";

async function generateCommandDocs() {
  let markdown = "# Star Management CLI Reference\n\n";

  markdown += "## Overview\n\n";
  markdown +=
    "The Star Management CLI provides tools for managing your GitHub stars.\n\n";
  markdown += "## Commands\n\n";

  for (const [name, def] of Object.entries(COMMANDS)) {
    markdown += `### \`${name}\`\n\n`;
    markdown += `${def.description}\n\n`;

    if (def.aliases && def.aliases.length > 0) {
      markdown += `**Aliases:** ${def.aliases.join(", ")}\n\n`;
    }

    markdown += "**Usage:**\n";
    markdown += `\`\`\`bash\nstar-management ${def.usage}\n\`\`\`\n\n`;

    if (def.examples && def.examples.length > 0) {
      markdown += "**Examples:**\n";
      markdown += "```bash\n";
      for (const example of def.examples) {
        markdown += `star-management ${example}\n`;
      }
      markdown += "```\n\n";
    }
  }

  await Deno.writeTextFile("docs/command-reference.md", markdown);
  console.log("Command reference documentation generated");
}

if (import.meta.main) {
  await generateCommandDocs();
}
````

## Interactive Mode

The CLI can also support an interactive mode for better usability:

```typescript
// src/cli/utils/interactive.ts
import { Confirm, Input, Select } from "jsr:@cliffy/prompt";
import chalk from "chalk";

export async function promptToken(): Promise<string> {
  return await Input.prompt({
    message: "Enter your GitHub token:",
    type: "password",
    validate: (value) => value ? true : "Token is required",
  });
}

export async function promptCategories(
  defaults: { name: string; pattern: string; displayName?: string }[],
): Promise<{ name: string; pattern: string; displayName?: string }[]> {
  console.log(chalk.bold("Configure star categories:"));

  const categories = [...defaults];
  let editing = true;

  while (editing) {
    const action = await Select.prompt({
      message: "Category actions:",
      options: [
        { name: "Add new category", value: "add" },
        { name: "Edit existing category", value: "edit" },
        { name: "Remove category", value: "remove" },
        { name: "Done", value: "done" },
      ],
    });

    switch (action) {
      case "add":
        const name = await Input.prompt("Category name:");
        const pattern = await Input.prompt("Search pattern (regex):");
        const displayName = await Input.prompt({
          message: "Display name (optional):",
          default: name.charAt(0).toUpperCase() + name.slice(1),
        });

        categories.push({ name, pattern, displayName });
        break;

      case "edit":
        if (categories.length === 0) {
          console.log(chalk.yellow("No categories to edit"));
          break;
        }

        const editIndex = await Select.prompt({
          message: "Select category to edit:",
          options: categories.map((cat, i) => ({
            name: `${cat.name} (${cat.pattern})`,
            value: i.toString(),
          })),
        });

        const catIndex = parseInt(editIndex, 10);
        const cat = categories[catIndex];

        categories[catIndex] = {
          name: await Input.prompt({
            message: "Category name:",
            default: cat.name,
          }),
          pattern: await Input.prompt({
            message: "Search pattern:",
            default: cat.pattern,
          }),
          displayName: await Input.prompt({
            message: "Display name (optional):",
            default: cat.displayName,
          }),
        };
        break;

      case "remove":
        if (categories.length === 0) {
          console.log(chalk.yellow("No categories to remove"));
          break;
        }

        const removeIndex = await Select.prompt({
          message: "Select category to remove:",
          options: categories.map((cat, i) => ({
            name: cat.name,
            value: i.toString(),
          })),
        });

        categories.splice(parseInt(removeIndex, 10), 1);
        break;

      case "done":
        editing = false;
        break;
    }
  }

  return categories;
}

// Example usage in a command
async function setupConfig(ctx: CommandContext): Promise<number> {
  console.log(chalk.bold("GitHub Star Management Configuration"));

  // Load existing config or use defaults
  const config = await loadConfig();

  // Prompt for GitHub token
  const token = await promptToken();

  // Prompt for categories
  const categories = await promptCategories(
    config.categories || DEFAULT_CATEGORIES,
  );

  // Save configuration
  const newConfig = {
    token,
    categories,
  };

  await Deno.writeTextFile(
    ".star-management.json",
    JSON.stringify(newConfig, null, 2),
  );

  formatSuccess(ctx, "Configuration saved to .star-management.json");
  return 0;
}
```

## Best Practices

1. **Consistent Interface**
   - Follow the same pattern for all commands
   - Use similar flag names across commands
   - Provide helpful error messages

2. **Comprehensive Help**
   - Include detailed help for each command
   - Show examples in help text
   - Support `--help` flag at all levels

3. **Error Handling**
   - Use exit codes appropriately
   - Provide verbose error details when requested
   - Format errors consistently

4. **Configuration**
   - Support multiple config sources
   - Validate configuration before use
   - Allow overrides via environment variables

5. **Progress Feedback**
   - Show progress for long-running operations
   - Use colors and formatting for better readability
   - Support both verbose and quiet modes

6. **Testing**
   - Mock stdout/stderr for testing CLI output
   - Test all command options
   - Verify exit codes for error conditions
