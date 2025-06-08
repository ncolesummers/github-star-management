#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * pre-push hook
 *
 * This hook runs before pushing to a remote repository and:
 * - Runs the full test suite to ensure all tests pass
 */

import { runTests } from "../utils/file_checks.ts";

async function prePushHook(): Promise<void> {
  console.log("🧪 Running tests before push...");

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

  console.log("✅ All tests passed. Proceeding with push.");
}

// Run the hook
if (import.meta.main) {
  prePushHook().catch((error) => {
    console.error(`Error in pre-push hook: ${error.message}`);
    Deno.exit(1);
  });
}
