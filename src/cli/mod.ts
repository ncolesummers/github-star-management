/**
 * CLI module entry point
 */

// Using Cliffy until std/cli has a stable command API
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import chalk from "chalk";
import { VERSION } from "../../mod.ts";
import { GitHubClient } from "../core/api/github_client.ts";
import { registerBackupCommands } from "./commands/index.ts";

/**
 * Main CLI entry point
 */
export async function main(args: string[]): Promise<void> {
  // Create command program
  const program = new Command()
    .name("star-management")
    .version(VERSION)
    .description("GitHub Star Management")
    .option("--token <token:string>", "GitHub API token", {
      default: Deno.env.get("GITHUB_TOKEN"),
    })
    .option("--verbose, -V", "Enable verbose output");

  try {
    // Setup GitHub client
    const token = Deno.env.get("GITHUB_TOKEN") || "";
    if (!token) {
      console.warn(chalk.yellow(
        "Warning: No GitHub token provided. API rate limits will be restricted.\n" +
          "Set GITHUB_TOKEN environment variable or use --token option.",
      ));
    }

    const githubClient = new GitHubClient({ token });

    // Register commands
    // @ts-ignore - Type compatibility is handled within the function
    registerBackupCommands(program, githubClient);

    // Show help if no commands
    if (args.length === 0) {
      program.showHelp();
      return;
    }

    // Parse args and execute command
    await program.parse(args);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Error: ${errorMessage}`));
    Deno.exit(1);
  }
}
