#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * pre-commit hook
 *
 * This hook runs before the commit is created and checks:
 * - Formatting of staged TypeScript files
 * - Linting of staged TypeScript files
 */

import { checkFormatting, checkLinting } from "../utils/file_checks.ts";
import {
  scanForDebugStatements,
  scanForSecrets,
} from "../utils/security_scans.ts";
import { logHookExecution } from "../utils/git.ts";

async function preCommitHook(): Promise<void> {
  logHookExecution("pre-commit");

  // Security scan for secrets/tokens
  const secretsScanPassed = await scanForSecrets();
  if (!secretsScanPassed) {
    console.error(
      "\u274c Potential secrets or API tokens detected in staged files",
    );
    Deno.exit(1);
  }

  // Prevent debug statements
  const debugScanPassed = await scanForDebugStatements();
  if (!debugScanPassed) {
    console.error(
      "\u274c Debug statements (console.log/debugger) found in staged files",
    );
    Deno.exit(1);
  }

  // Check formatting
  const formattingPassed = await checkFormatting();
  if (!formattingPassed) {
    console.error("\u274c Formatting check failed");
    Deno.exit(1);
  }

  // Check linting
  const lintingPassed = await checkLinting();
  if (!lintingPassed) {
    console.error("\u274c Linting check failed");
    Deno.exit(1);
  }

  console.log("\u2705 All pre-commit checks passed");
}

// Run the hook
if (import.meta && (import.meta as { main?: boolean }).main) {
  preCommitHook().catch((error) => {
    console.error(`Error in pre-commit hook: ${error.message}`);
    // Deno global is always available in Deno runtime
    // @ts-ignore: Optional chaining used for compatibility with environments where Deno might not be available
    Deno.exit?.(1);
  });
}
