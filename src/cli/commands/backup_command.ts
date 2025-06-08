/**
 * Backup command implementation
 *
 * CLI commands for managing GitHub star backups
 */

// Using Cliffy until std/cli has a stable command API
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v1.0.0-rc.3/table/mod.ts";
import chalk from "chalk";
import { BackupService } from "../../core/services/backup_service.ts";
import { GitHubClient } from "../../core/api/github_client.ts";

/**
 * Format a date string for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString();
}

/**
 * Register backup commands
 *
 * @param program Command program instance
 * @param githubClient GitHub client
 */
export function registerBackupCommands(
  program: Command,
  githubClient: GitHubClient,
): void {
  const backupCommand = new Command()
    .name("backup")
    .description("Manage GitHub star backups")
    .action(() => {
      console.log(chalk.bold("GitHub Star Backup Commands\n"));
      console.log("Available subcommands:");
      console.log("  create    Create a new backup of starred repositories");
      console.log("  list      List available backups");
      console.log("  get       Get details of a specific backup");
      console.log("  delete    Delete a backup");
      console.log("  export    Export a backup to a file");
      console.log("  import    Import a backup from a file");
      console.log("\nRun backup <subcommand> --help for more information.");
    });

  // Create a new backup
  backupCommand
    .command("create")
    .description("Create a new backup of starred repositories")
    .option("--description <text:string>", "Description for the backup")
    .option("--tags <tags:string>", "Comma-separated list of tags")
    .option(
      "--overwrite",
      "Overwrite most recent backup instead of creating new one",
    )
    .action(async (options) => {
      try {
        // Initialize KV and service
        const kv = await Deno.openKv();
        const backupService = new BackupService(kv, githubClient);

        console.log(chalk.cyan("Creating backup of starred repositories..."));

        // Process tags if provided
        const tags = options.tags
          ? options.tags.split(",").map((tag: string) => tag.trim())
          : undefined;

        // Create backup
        const meta = await backupService.createBackup({
          description: options.description,
          tags,
          overwrite: options.overwrite,
        });

        console.log(
          chalk.green(`✅ Backup created successfully with ID: ${meta.id}`),
        );
        console.log(
          `Backed up ${meta.count} repositories for user ${meta.username}`,
        );

        if (meta.description) {
          console.log(`Description: ${meta.description}`);
        }

        if (meta.tags && meta.tags.length > 0) {
          console.log(`Tags: ${meta.tags.join(", ")}`);
        }

        // Close KV
        kv.close();
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error(chalk.red(`Error creating backup: ${errorMessage}`));
        Deno.exit(1);
      }
    });

  // List available backups
  backupCommand
    .command("list")
    .description("List available backups")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      try {
        // Initialize KV and service
        const kv = await Deno.openKv();
        const backupService = new BackupService(kv, githubClient);

        // Get all backups
        const backups = await backupService.listBackups();

        if (backups.length === 0) {
          console.log(chalk.yellow("No backups found."));
          kv.close();
          return;
        }

        // Output in requested format
        if (options.json) {
          console.log(JSON.stringify(backups, null, 2));
        } else {
          // Create a table
          const table = new Table();
          table.push(["ID", "Created", "User", "Count", "Description", "Tags"]);

          for (const backup of backups) {
            table.push([
              backup.id,
              formatDate(backup.createdAt),
              backup.username,
              backup.count.toString(),
              backup.description || "",
              backup.tags?.join(", ") || "",
            ]);
          }

          console.log(table.toString());
          console.log(`\nTotal: ${backups.length} backup(s)`);
        }

        // Close KV
        kv.close();
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error(chalk.red(`Error listing backups: ${errorMessage}`));
        Deno.exit(1);
      }
    });

  // Get details of a specific backup
  backupCommand
    .command("get")
    .description("Get details of a specific backup")
    .option("--id <id:string>", "Backup ID", { required: true })
    .option("--json", "Output as JSON")
    .action(async (options) => {
      try {
        // Initialize KV and service
        const kv = await Deno.openKv();
        const backupService = new BackupService(kv, githubClient);

        // Get the backup
        const backup = await backupService.getBackup(options.id);

        if (!backup) {
          console.error(chalk.red(`Backup with ID '${options.id}' not found.`));
          kv.close();
          Deno.exit(1);
        }

        // Output in requested format
        if (options.json) {
          console.log(JSON.stringify(backup, null, 2));
        } else {
          console.log(chalk.bold(`Backup: ${backup.meta.id}`));
          console.log(`Created: ${formatDate(backup.meta.createdAt)}`);
          console.log(`User: ${backup.meta.username}`);
          console.log(`Repositories: ${backup.meta.count}`);

          if (backup.meta.description) {
            console.log(`Description: ${backup.meta.description}`);
          }

          if (backup.meta.tags && backup.meta.tags.length > 0) {
            console.log(`Tags: ${backup.meta.tags.join(", ")}`);
          }

          console.log("\nRepositories:");
          const table = new Table();
          table.push(["Name", "Owner", "Language", "Stars", "Updated"]);

          for (const repo of backup.repositories) {
            table.push([
              repo.name,
              repo.owner.login,
              repo.language || "N/A",
              repo.stargazers_count.toString(),
              new Date(repo.updated_at).toLocaleDateString(),
            ]);
          }

          console.log(table.toString());
        }

        // Close KV
        kv.close();
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error(chalk.red(`Error getting backup: ${errorMessage}`));
        Deno.exit(1);
      }
    });

  // Delete a backup
  backupCommand
    .command("delete")
    .description("Delete a backup")
    .option("--id <id:string>", "Backup ID", { required: true })
    .option("--force", "Skip confirmation prompt")
    .action(async (options) => {
      try {
        // Initialize KV and service
        const kv = await Deno.openKv();
        const backupService = new BackupService(kv, githubClient);

        // Check if backup exists
        const backup = await backupService.getBackup(options.id);
        if (!backup) {
          console.error(chalk.red(`Backup with ID '${options.id}' not found.`));
          kv.close();
          Deno.exit(1);
        }

        // Confirm deletion unless --force is used
        if (!options.force) {
          const confirmation = prompt(
            `Are you sure you want to delete backup '${options.id}'? (y/N) `,
          );

          if (confirmation?.toLowerCase() !== "y") {
            console.log("Deletion cancelled.");
            kv.close();
            return;
          }
        }

        // Delete the backup
        await backupService.deleteBackup(options.id);
        console.log(
          chalk.green(`✅ Backup '${options.id}' deleted successfully.`),
        );

        // Close KV
        kv.close();
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error(chalk.red(`Error deleting backup: ${errorMessage}`));
        Deno.exit(1);
      }
    });

  // Export a backup to a file
  backupCommand
    .command("export")
    .description("Export a backup to a file")
    .option("--id <id:string>", "Backup ID", { required: true })
    .option("--output <file:string>", "Output file path", { required: true })
    .action(async (options) => {
      try {
        // Initialize KV and service
        const kv = await Deno.openKv();
        const backupService = new BackupService(kv, githubClient);

        // Check if backup exists
        const backup = await backupService.getBackup(options.id);
        if (!backup) {
          console.error(chalk.red(`Backup with ID '${options.id}' not found.`));
          kv.close();
          Deno.exit(1);
        }

        // Check if output file already exists
        try {
          const stat = await Deno.stat(options.output);
          if (stat.isFile) {
            const confirmation = prompt(
              `File '${options.output}' already exists. Overwrite? (y/N) `,
            );

            if (confirmation?.toLowerCase() !== "y") {
              console.log("Export cancelled.");
              kv.close();
              return;
            }
          }
        } catch (_error) {
          // File doesn't exist, we can proceed
        }

        // Export the backup
        await backupService.exportBackup(options.id, options.output);
        console.log(
          chalk.green(
            `✅ Backup exported successfully to '${options.output}'.`,
          ),
        );

        // Close KV
        kv.close();
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error(chalk.red(`Error exporting backup: ${errorMessage}`));
        Deno.exit(1);
      }
    });

  // Import a backup from a file
  backupCommand
    .command("import")
    .description("Import a backup from a file")
    .option("--input <file:string>", "Input file path", { required: true })
    .option(
      "--description <text:string>",
      "New description for the imported backup",
    )
    .option("--tags <tags:string>", "Comma-separated list of tags")
    .option("--overwrite", "Overwrite if backup with same ID exists")
    .action(async (options) => {
      try {
        // Initialize KV and service
        const kv = await Deno.openKv();
        const backupService = new BackupService(kv, githubClient);

        // Process tags if provided
        const tags = options.tags
          ? options.tags.split(",").map((tag: string) => tag.trim())
          : undefined;

        // Import the backup
        console.log(chalk.cyan(`Importing backup from '${options.input}'...`));

        const meta = await backupService.importBackup(options.input, {
          description: options.description,
          tags,
          overwrite: options.overwrite,
        });

        console.log(
          chalk.green(`✅ Backup imported successfully with ID: ${meta.id}`),
        );
        console.log(
          `Imported ${meta.count} repositories for user ${meta.username}`,
        );

        if (meta.description) {
          console.log(`Description: ${meta.description}`);
        }

        if (meta.tags && meta.tags.length > 0) {
          console.log(`Tags: ${meta.tags.join(", ")}`);
        }

        // Close KV
        kv.close();
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error(chalk.red(`Error importing backup: ${errorMessage}`));
        Deno.exit(1);
      }
    });

  // Add the backup command to the program
  program.command(backupCommand as unknown as string);
}
