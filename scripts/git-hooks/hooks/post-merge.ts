#!/usr/bin/env -S deno run --allow-run --allow-read
/**
 * post-merge hook
 *
 * This hook runs after a merge and notifies developers about dependency changes (deno.lock).
 */
import { logHookExecution } from "../utils/git.ts";

async function postMergeHook(): Promise<void> {
  logHookExecution("post-merge");

  // Check if deno.lock changed in the merge commit
  const process = new Deno.Command("git", {
    args: ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"],
    stdout: "piped",
  });
  const { stdout } = await process.output();
  const changedFiles = new TextDecoder().decode(stdout).split("\n");
  if (changedFiles.includes("deno.lock")) {
    console.log(
      "\u26A0\uFE0F deno.lock has changed in this merge. Please review dependency updates and run 'deno cache' or 'deno task check'.",
    );
  }
}

if (import.meta.main) {
  postMergeHook().catch((error) => {
    console.error(`Error in post-merge hook: ${error.message}`);
    Deno.exit(1);
  });
}
