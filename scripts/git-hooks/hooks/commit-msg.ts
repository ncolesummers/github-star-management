#!/usr/bin/env -S deno run --allow-read

/**
 * commit-msg hook
 *
 * This hook validates the commit message against the Conventional Commits format:
 * - Checks for correct format: <type>(<scope>): <description>
 * - Validates type against allowed list
 * - Validates scope against allowed list (if provided)
 * - Checks description length and formatting
 */

import { validateCommitMessage } from "../utils/conventional_commits.ts";
import { logHookExecution, readCommitMessage } from "../utils/git.ts";

async function commitMsgHook(): Promise<void> {
  logHookExecution("commit-msg");

  // Get the commit message file path from args
  const commitMsgFile = Deno.args[0];
  if (!commitMsgFile) {
    console.error("❌ No commit message file provided");
    Deno.exit(1);
  }

  // Read the commit message
  const commitMsg = await readCommitMessage(commitMsgFile);

  // Validate the commit message
  const result = validateCommitMessage(commitMsg);

  if (!result.isValid) {
    console.error(`❌ Invalid commit message: ${result.error}`);
    console.error("\nPlease follow the conventional commits format:");
    console.error("  <type>(<scope>): <description>");
    console.error("\nExamples:");
    console.error("  feat(cli): add support for custom output formats");
    console.error("  fix(api): handle rate limiting errors properly");
    console.error("  docs(README): update installation instructions");
    Deno.exit(1);
  }

  console.log("✅ Commit message format is valid");
}

// Run the hook
if (import.meta.main) {
  commitMsgHook().catch((error) => {
    console.error(`Error in commit-msg hook: ${error.message}`);
    Deno.exit(1);
  });
}
