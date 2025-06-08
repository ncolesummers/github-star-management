#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * pre-commit hook
 *
 * This hook runs before the commit is created and checks:
 * - Formatting of staged TypeScript files
 * - Linting of staged TypeScript files
 */

import { checkFormatting, checkLinting } from "../utils/file_checks.ts";
import { logHookExecution } from "../utils/git.ts";

async function preCommitHook(): Promise<void> {
  logHookExecution("pre-commit");

  // Check formatting
  const formattingPassed = await checkFormatting();
  if (!formattingPassed) {
    console.error("❌ Formatting check failed");
    Deno.exit(1);
  }

  // Check linting
  const lintingPassed = await checkLinting();
  if (!lintingPassed) {
    console.error("❌ Linting check failed");
    Deno.exit(1);
  }

  console.log("✅ All pre-commit checks passed");
}

// Run the hook
if (import.meta.main) {
  preCommitHook().catch((error) => {
    console.error(`Error in pre-commit hook: ${error.message}`);
    Deno.exit(1);
  });
}
