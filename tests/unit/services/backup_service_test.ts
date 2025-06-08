/**
 * Tests for BackupService
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from "@std/assert";
import { openMockKv } from "../../helpers/mock_kv.ts";
import { BackupService } from "../../../src/core/services/backup_service.ts";
import { Backup } from "../../../src/core/models/backup.ts";
import { mockRepos } from "../../fixtures/repositories.ts";
import { GitHubClient } from "../../../src/core/api/github_client.ts";

// Mock GitHubClient for testing
class MockGitHubClient {
  getAllStarredRepos() {
    return Promise.resolve(mockRepos);
  }

  getCurrentUser() {
    return Promise.resolve({ login: "testuser" });
  }
}

Deno.test("BackupService - createBackup - should create a new backup", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);

  // Act
  const meta = await service.createBackup({
    description: "Test backup",
    tags: ["test", "initial"],
  });

  // Assert
  assertExists(meta.id);
  assertEquals(meta.username, "testuser");
  assertEquals(meta.count, mockRepos.length);
  assertEquals(meta.description, "Test backup");
  assertEquals(meta.tags, ["test", "initial"]);

  // Verify backup is retrievable
  const backup = await service.getBackup(meta.id);
  assertExists(backup);
  assertEquals(backup!.meta.id, meta.id);
  assertEquals(backup!.repositories.length, mockRepos.length);
});

Deno.test("BackupService - createBackup - should overwrite existing backup when specified", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);

  // Create initial backup
  const initialMeta = await service.createBackup({
    description: "Initial backup",
  });

  // Act - create with same ID but overwrite
  const updatedMeta = await service.createBackup({
    description: "Updated backup",
    overwrite: true,
    tags: ["updated"],
  });

  // Assert
  assertEquals(updatedMeta.id, initialMeta.id);
  assertEquals(updatedMeta.description, "Updated backup");

  // Verify backup was updated
  const backup = await service.getBackup(updatedMeta.id);
  assertEquals(backup!.meta.description, "Updated backup");
  assertEquals(backup!.meta.tags, ["updated"]);
});

Deno.test("BackupService - listBackups - should return all backups", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);

  // Create a few backups
  const meta1 = await service.createBackup({ description: "Backup 1" });
  const meta2 = await service.createBackup({ description: "Backup 2" });
  const meta3 = await service.createBackup({ description: "Backup 3" });

  console.log("Created backups with IDs:", meta1.id, meta2.id, meta3.id);

  // Manually check KV store
  let count = 0;
  for await (const entry of kv.list({ prefix: ["backups"] })) {
    console.log("KV entry:", entry.key);
    count++;
  }
  console.log("Total KV entries:", count);

  // Act
  const backups = await service.listBackups();
  console.log(
    "Returned backups:",
    backups.length,
    backups.map((b) => b.description),
  );

  // Assert
  assertEquals(backups.length, 3);
  // We can only test length since order might vary due to async operations
});

Deno.test("BackupService - getBackup - should return null for non-existent backup", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);

  // Act
  const backup = await service.getBackup("non-existent-id");

  // Assert
  assertEquals(backup, null);
});

Deno.test("BackupService - deleteBackup - should delete an existing backup", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);

  // Create a backup to delete
  const meta = await service.createBackup();

  // Act
  const result = await service.deleteBackup(meta.id);

  // Assert
  assertEquals(result, true);

  // Verify backup is deleted
  const backup = await service.getBackup(meta.id);
  assertEquals(backup, null);
});

Deno.test("BackupService - deleteBackup - should return false for non-existent backup", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);

  // Act
  const result = await service.deleteBackup("non-existent-id");

  // Assert
  assertEquals(result, false);
});

Deno.test("BackupService - exportBackup - should export backup to a file", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);
  const tmpFile = await Deno.makeTempFile({ suffix: ".json" });

  // Create a backup to export
  const meta = await service.createBackup({
    description: "Backup to export",
  });

  try {
    // Act
    await service.exportBackup(meta.id, tmpFile);

    // Assert
    const fileContent = await Deno.readTextFile(tmpFile);
    const exported = JSON.parse(fileContent) as Backup;

    assertEquals(exported.meta.id, meta.id);
    assertEquals(exported.meta.description, "Backup to export");
    assertEquals(exported.repositories.length, mockRepos.length);
  } finally {
    // Cleanup
    await Deno.remove(tmpFile);
  }
});

Deno.test("BackupService - exportBackup - should throw for non-existent backup", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);
  const tmpFile = await Deno.makeTempFile();

  try {
    // Act & Assert
    await assertRejects(
      async () => {
        await service.exportBackup("non-existent-id", tmpFile);
      },
      Error,
      "Backup not found",
    );
  } finally {
    // Cleanup
    await Deno.remove(tmpFile);
  }
});

Deno.test("BackupService - importBackup - should import backup from a file", async () => {
  // Arrange
  const kv = await openMockKv();
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  const service = new BackupService(kv, githubClient);
  const tmpFile = await Deno.makeTempFile({ suffix: ".json" });

  // Create a file with backup data
  const backup = {
    meta: {
      id: "imported-backup",
      createdAt: new Date().toISOString(),
      username: "importuser",
      count: mockRepos.length,
      description: "Imported backup",
      tags: ["imported"],
    },
    repositories: mockRepos,
  };

  await Deno.writeTextFile(tmpFile, JSON.stringify(backup));

  try {
    // Act
    const meta = await service.importBackup(tmpFile, { overwrite: true });

    // Assert
    assertEquals(meta.id, "imported-backup");
    assertEquals(meta.description, "Imported backup");

    // Verify backup was imported
    const imported = await service.getBackup(meta.id);
    assertExists(imported);
    assertEquals(imported!.meta.id, meta.id);
    assertEquals(imported!.repositories.length, mockRepos.length);
  } finally {
    // Cleanup
    await Deno.remove(tmpFile);
  }
});
