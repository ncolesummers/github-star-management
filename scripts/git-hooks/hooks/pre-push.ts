#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * pre-push hook
 *
 * This hook runs before pushing to a remote repository and:
 * - Runs the full test suite to ensure all tests pass
 * - Verifies documentation is updated for changed files
 */

import { runTests } from "../utils/file_checks.ts";
import { logHookExecution, getStagedFiles } from "../utils/git.ts";

async function verifyDocsUpdated(): Promise<boolean> {
  // Simple heuristic: if code files are changed, check if docs/ or README.md is staged
  const changed = await getStagedFiles();
  const codeChanged = changed.some((f) => f.endsWith(".ts") || f.endsWith(".js"));
  const docsChanged = changed.some(
    (f) => f.startsWith("docs/") || f === "README.md",
  );
  if (codeChanged && !docsChanged) {
    console.error(
      "\u26A0\uFE0F Code changes detected but no documentation updates staged.",
    );
    return false;
  }
  return true;
}

async function prePushHook(): Promise<void> {
  logHookExecution("pre-push");

  // Run the test suite
  const testsPass = await runTests();

  if (!testsPass) {
    console.error(
      "❌ Tests failed. Please fix the failing tests before pushing.",
    );
    console.error(
      "You can bypass this check with git push --no-verify, but this is not recommended.",
    );
    Deno.exit(1);
  }

  // Verify documentation is updated for changed files
  const docsOk = await verifyDocsUpdated();
  if (!docsOk) {
    console.error(
      "❌ Please update documentation for your code changes (docs/ or README.md)",
    );
    Deno.exit(1);
  }

  console.log("✅ All pre-push checks passed. Proceeding with push.");
}

// Run the hook
if (import.meta && (import.meta as any).main) {
  prePushHook().catch((error) => {
    console.error(`Error in pre-push hook: ${error.message}`);
    // Deno global is always available in Deno runtime
    // @ts-ignore
    Deno.exit?.(1);
  });
}
