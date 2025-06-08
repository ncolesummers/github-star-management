#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * Git hooks uninstallation script
 *
 * This script:
 * 1. Removes the hook scripts from .git/hooks
 * 2. Restores any original hooks that were backed up during installation
 */

import { getGitRoot } from "./utils/git.ts";
import * as path from "https://deno.land/std/path/mod.ts";

// Define the hooks to uninstall
const HOOKS = [
  "pre-commit",
  "commit-msg",
  "pre-push",
];

async function uninstallHooks(): Promise<void> {
  console.log("🔄 Uninstalling git hooks...");

  try {
    // Get the git root directory
    const gitRoot = await getGitRoot();

    // Path to the git hooks directory
    const gitHooksDir = path.join(gitRoot, ".git", "hooks");

    // Uninstall each hook
    for (const hook of HOOKS) {
      const gitHookPath = path.join(gitHooksDir, hook);

      try {
        // Check if the hook exists
        const hookStat = await Deno.stat(gitHookPath);

        if (hookStat.isFile) {
          // Remove the hook
          await Deno.remove(gitHookPath);
          console.log(`✅ Uninstalled ${hook} hook`);
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          console.log(`ℹ️ ${hook} hook not found, skipping`);
        } else {
          throw error;
        }
      }
    }

    console.log("✨ All git hooks uninstalled successfully");
  } catch (error) {
    console.error(`❌ Error uninstalling git hooks: ${error.message}`);
    Deno.exit(1);
  }
}

// Run the uninstallation
if (import.meta.main) {
  uninstallHooks();
}
