/**
 * Example of using the backup service
 *
 * This is a simple example to demonstrate how to use the backup service
 * in a real-world application.
 */

import { BackupService } from "../../core/services/backup_service.ts";
import { GitHubClient } from "../../core/api/github_client.ts";

async function main() {
  // Get GitHub token from environment
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) {
    console.error("GITHUB_TOKEN environment variable is required");
    Deno.exit(1);
  }

  // Initialize GitHubClient and KV store
  const githubClient = new GitHubClient({ token });
  const kv = await Deno.openKv();

  try {
    // Create backup service
    const backupService = new BackupService(kv, githubClient);

    // Create a new backup
    console.log("Creating backup...");
    const meta = await backupService.createBackup({
      description: "Example backup",
      tags: ["example", "test"],
    });
    console.log("Backup created:", meta);

    // List all backups
    console.log("\nListing backups...");
    const backups = await backupService.listBackups();
    console.log(`Found ${backups.length} backups:`);
    for (const backup of backups) {
      console.log(`- ${backup.id} (${backup.count} repositories)`);
    }

    // Get the backup we just created
    console.log("\nGetting backup details...");
    const backup = await backupService.getBackup(meta.id);
    if (backup) {
      console.log(
        `Backup ${backup.meta.id} has ${backup.repositories.length} repositories`,
      );
      console.log(
        `First repository: ${backup.repositories[0]?.full_name || "none"}`,
      );
    } else {
      console.log("Backup not found");
    }

    // Export the backup to a file
    const tmpFile = await Deno.makeTempFile({ suffix: ".json" });
    console.log(`\nExporting backup to ${tmpFile}...`);
    await backupService.exportBackup(meta.id, tmpFile);
    console.log("Backup exported successfully");

    // Delete the backup
    console.log("\nDeleting backup...");
    const deleted = await backupService.deleteBackup(meta.id);
    console.log(deleted ? "Backup deleted successfully" : "Backup not found");

    // Import the backup
    console.log("\nImporting backup from file...");
    const importedMeta = await backupService.importBackup(tmpFile, {
      description: "Imported backup",
      tags: ["imported"],
    });
    console.log("Backup imported with ID:", importedMeta.id);

    // Clean up
    await Deno.remove(tmpFile);
  } finally {
    // Close the KV store
    kv.close();
  }
}

// Run the example if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error("Error:", error);
    Deno.exit(1);
  });
}
