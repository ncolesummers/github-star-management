/**
 * Integration tests for backup CLI commands
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std/testing/asserts.ts";
import { StringWriter } from "../../helpers/string_writer.ts";
// Using Cliffy until std/cli has a stable command API
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { GitHubClient } from "../../../src/core/api/github_client.ts";
import { BackupMeta } from "../../../src/core/models/backup.ts";
import { registerBackupCommands } from "../../../src/cli/commands/index.ts";
import { mockRepos } from "../../fixtures/repositories.ts";
import { MockKv, openMockKv } from "../../helpers/mock_kv.ts";

// Mock GitHubClient for testing
class MockGitHubClient {
  getAllStarredRepos() {
    return Promise.resolve(mockRepos);
  }

  getCurrentUser() {
    return Promise.resolve({ login: "testuser" });
  }
}

/**
 * Setup test CLI
 */
async function setupTestCli(): Promise<{
  program: Command;
  stdout: StringWriter;
  stderr: StringWriter;
  kv: MockKv;
  cleanup(): void;
}> {
  // Capture stdout/stderr
  const stdout = new StringWriter();
  const stderr = new StringWriter();

  // Redirect console output
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  console.log = (...args: unknown[]) => {
    stdout.write(new TextEncoder().encode(args.join(" ") + "\n"));
  };
  console.error = (...args: unknown[]) => {
    stderr.write(new TextEncoder().encode(args.join(" ") + "\n"));
  };

  // Setup KV
  const kv = await openMockKv();

  // Create command program
  const program = new Command()
    .name("star-management")
    .version("test")
    .description("GitHub Star Management");

  // Register commands with mock client
  const githubClient = new MockGitHubClient() as unknown as GitHubClient;
  registerBackupCommands(program, githubClient);

  // Override Deno.openKv to use our mock
  const originalOpenKv = Deno.openKv;
  Deno.openKv = () => Promise.resolve(kv as unknown as Deno.Kv);

  // Create cleanup function
  const cleanup = () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    Deno.openKv = originalOpenKv;
  };

  // Return test object
  return {
    program,
    stdout,
    stderr,
    kv,
    cleanup,
  };
}

// Clean up test environment
function cleanupTestCli(test: {
  program: Command;
  stdout: StringWriter;
  stderr: StringWriter;
  kv: MockKv;
  cleanup(): void;
}): void {
  test.cleanup();
  test.kv.close();
}

// Run before executing the tests
Deno.test("backup command - create", async () => {
  const test = await setupTestCli();

  try {
    // Execute command
    await test.program.parse([
      "backup",
      "create",
      "--description",
      "Test backup",
      "--tags",
      "test,integration",
    ]);

    // Verify output
    const output = test.stdout.toString();
    assertStringIncludes(output, "Creating backup of starred repositories");
    assertStringIncludes(output, "Backup created successfully");
    assertStringIncludes(output, "Description: Test backup");
    assertStringIncludes(output, "Tags: test, integration");

    // Verify backup was created in KV
    const backups = [];
    for await (const entry of test.kv.list({ prefix: ["backups"] })) {
      if (entry.key.length === 3 && entry.key[2] === "meta") {
        backups.push(entry.value);
      }
    }

    assertEquals(backups.length, 1);
    assertEquals((backups[0] as BackupMeta).description, "Test backup");
    assertEquals((backups[0] as BackupMeta).tags, ["test", "integration"]);
  } finally {
    cleanupTestCli(test);
  }
});

Deno.test("backup command - list", async () => {
  const test = await setupTestCli();

  try {
    // Create a backup first
    await test.program.parse([
      "backup",
      "create",
      "--description",
      "Test backup for list",
    ]);

    // Clear output
    test.stdout.clear();

    // Execute list command
    await test.program.parse(["backup", "list"]);

    // Verify output
    const output = test.stdout.toString();
    assertStringIncludes(output, "Test backup for list");
    assertStringIncludes(output, "Total: 1 backup(s)");
  } finally {
    cleanupTestCli(test);
  }
});

Deno.test("backup command - get existing backup", async () => {
  const test = await setupTestCli();

  try {
    // Create a backup first
    await test.program.parse([
      "backup",
      "create",
      "--description",
      "Test backup for get",
    ]);

    // Extract ID from output
    const createOutput = test.stdout.toString();
    const idMatch = createOutput.match(/ID: ([a-zA-Z0-9-]+)/);
    assertExists(idMatch);
    const backupId = idMatch[1];

    // Clear output
    test.stdout.clear();

    // Execute get command
    await test.program.parse([
      "backup",
      "get",
      "--id",
      backupId,
    ]);

    // Verify output
    const output = test.stdout.toString();
    assertStringIncludes(output, `Backup: ${backupId}`);
    assertStringIncludes(output, "Test backup for get");
    assertStringIncludes(output, "Repositories:");
  } finally {
    cleanupTestCli(test);
  }
});

Deno.test("backup command - get non-existent backup", async () => {
  const test = await setupTestCli();

  try {
    // Execute get command with non-existent ID
    await test.program.parse([
      "backup",
      "get",
      "--id",
      "non-existent-id",
    ]);

    // Verify error output
    const errorOutput = test.stderr.toString();
    assertStringIncludes(
      errorOutput,
      "Backup with ID 'non-existent-id' not found",
    );
  } finally {
    cleanupTestCli(test);
  }
});

Deno.test("backup command - delete", async () => {
  const test = await setupTestCli();

  try {
    // Create a backup first
    await test.program.parse([
      "backup",
      "create",
      "--description",
      "Test backup for delete",
    ]);

    // Extract ID from output
    const createOutput = test.stdout.toString();
    const idMatch = createOutput.match(/ID: ([a-zA-Z0-9-]+)/);
    assertExists(idMatch);
    const backupId = idMatch[1];

    // Clear output
    test.stdout.clear();

    // Execute delete command with force to skip confirmation
    await test.program.parse([
      "backup",
      "delete",
      "--id",
      backupId,
      "--force",
    ]);

    // Verify output
    const output = test.stdout.toString();
    assertStringIncludes(output, `Backup '${backupId}' deleted successfully`);

    // Verify backup was deleted
    const backups = [];
    for await (const entry of test.kv.list({ prefix: ["backups"] })) {
      if (entry.key.length === 3 && entry.key[2] === "meta") {
        backups.push(entry.value);
      }
    }

    assertEquals(backups.length, 0);
  } finally {
    cleanupTestCli(test);
  }
});

Deno.test("backup command - export and import", async () => {
  const test = await setupTestCli();
  const tmpFile = await Deno.makeTempFile({ suffix: ".json" });

  try {
    // Create a backup first
    await test.program.parse([
      "backup",
      "create",
      "--description",
      "Test backup for export",
      "--tags",
      "export,test",
    ]);

    // Extract ID from output
    const createOutput = test.stdout.toString();
    const idMatch = createOutput.match(/ID: ([a-zA-Z0-9-]+)/);
    assertExists(idMatch);
    const backupId = idMatch[1];

    // Clear output
    test.stdout.clear();

    // Execute export command
    await test.program.parse([
      "backup",
      "export",
      "--id",
      backupId,
      "--output",
      tmpFile,
    ]);

    // Verify export output
    const exportOutput = test.stdout.toString();
    assertStringIncludes(exportOutput, "Backup exported successfully");

    // Clear output
    test.stdout.clear();

    // Delete the original backup
    await test.program.parse([
      "backup",
      "delete",
      "--id",
      backupId,
      "--force",
    ]);

    // Clear output
    test.stdout.clear();

    // Execute import command
    await test.program.parse([
      "backup",
      "import",
      "--input",
      tmpFile,
      "--description",
      "Re-imported backup",
    ]);

    // Verify import output
    const importOutput = test.stdout.toString();
    assertStringIncludes(importOutput, "Backup imported successfully");
    assertStringIncludes(importOutput, "Description: Re-imported backup");

    // Verify new backup exists with updated description
    const backups: Array<{ description?: string }> = [];
    for await (const entry of test.kv.list({ prefix: ["backups"] })) {
      if (entry.key.length === 3 && entry.key[2] === "meta") {
        backups.push(entry.value as { description?: string });
      }
    }

    assertEquals(backups.length, 1);
    assertEquals(backups[0].description, "Re-imported backup");
  } finally {
    cleanupTestCli(test);
    await Deno.remove(tmpFile);
  }
});
