#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * Git hooks installation script
 *
 * This script:
 * 1. Creates the git hooks directory if it doesn't exist
 * 2. Installs all hooks by creating symlinks from .git/hooks to our hook scripts
 * 3. Makes the hook scripts executable
 */

import { getGitRoot } from "./utils/git.ts";
import * as path from "https://deno.land/std@0.203.0/path/mod.ts";

// Define the hooks to install
const HOOKS = [
  "pre-commit",
  "commit-msg",
  "pre-push",
];

async function installHooks(): Promise<void> {
  console.log("🔄 Installing git hooks...");

  try {
    // Get the git root directory
    const gitRoot = await getGitRoot();

    // Path to the git hooks directory
    const gitHooksDir = path.join(gitRoot, ".git", "hooks");

    // Path to our hooks directory
    const ourHooksDir = path.join(gitRoot, "scripts", "git-hooks", "hooks");

    // Create the git hooks directory if it doesn't exist
    try {
      await Deno.mkdir(gitHooksDir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }

    // Install each hook
    for (const hook of HOOKS) {
      const hookScript = path.join(ourHooksDir, `${hook}.ts`);
      const gitHookPath = path.join(gitHooksDir, hook);

      // Create the git hook file
      const hookContent = `#!/bin/sh
# This hook is managed by scripts/git-hooks
# To bypass, use --no-verify (e.g., git commit --no-verify)

deno run --allow-run --allow-read --allow-env ${hookScript} "$@"
exit $?
`;

      await Deno.writeTextFile(gitHookPath, hookContent);

      // Make the hook executable
      await Deno.chmod(gitHookPath, 0o755);

      console.log(`✅ Installed ${hook} hook`);
    }

    console.log("✨ All git hooks installed successfully");
    console.log(
      "To bypass hooks, use --no-verify (e.g., git commit --no-verify)",
    );
  } catch (error) {
    console.error(`❌ Error installing git hooks: ${error.message}`);
    Deno.exit(1);
  }
}

// Run the installation
if (import.meta.main) {
  installHooks();
}
