/**
 * CLI module entry point
 */

import { parse } from "@std/cli";
import chalk from "chalk";
import { VERSION } from "../../mod.ts";

/**
 * Main CLI entry point
 */
export async function main(args: string[]): Promise<void> {
  // Parse command line arguments
  const parsedArgs = parse(args, {
    boolean: ["help", "version", "verbose"],
    alias: {
      h: "help",
      v: "version",
      V: "verbose",
    },
  });

  // Handle --help flag
  if (parsedArgs.help) {
    showHelp();
    Deno.exit(0);
  }

  // Handle --version flag
  if (parsedArgs.version) {
    console.log(`GitHub Star Management v${VERSION}`);
    Deno.exit(0);
  }
  
  // Get command name (first argument)
  const command = parsedArgs._.length > 0 ? String(parsedArgs._[0]) : "";
  
  if (!command) {
    showHelp();
    Deno.exit(0);
  }
  
  // This is a placeholder for command handling
  // In the future, we'll implement a command registry and handlers
  console.log(chalk.yellow(`Command '${command}' not yet implemented.`));
  console.log("Coming soon! Check back for updates.");
  
  Deno.exit(0);
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
${chalk.bold("GitHub Star Management")} v${VERSION}

${chalk.bold("USAGE")}
  star-management <command> [options]

${chalk.bold("COMMANDS")}
  cleanup     Remove stars from archived or outdated repositories
  backup      Backup all starred repositories to a file
  restore     Restore stars from a backup file
  categorize  Categorize stars into topical lists
  report      Generate a star report with statistics
  digest      Generate a digest of trending repositories

${chalk.bold("GLOBAL OPTIONS")}
  --help, -h        Show help information
  --version, -v     Show version information
  --verbose, -V     Enable verbose output

${chalk.bold("EXAMPLES")}
  star-management backup
  star-management cleanup --dry-run
  star-management report

Run ${chalk.cyan("star-management <command> --help")} for command-specific help.
`);
}