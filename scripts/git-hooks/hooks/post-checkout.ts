#!/usr/bin/env -S deno run --allow-run --allow-read
/**
 * post-checkout hook
 *
 * This hook runs after checking out a branch and detects changes to deno.lock.
 * If deno.lock has changed, it notifies the developer.
 */
import { logHookExecution } from "../utils/git.ts";

async function postCheckoutHook(): Promise<void> {
  logHookExecution("post-checkout");

  // Check if deno.lock changed in the last checkout
  const process = new Deno.Command("git", {
    args: ["diff", "HEAD@{1}", "HEAD", "--name-only"],
    stdout: "piped",
  });
  const { stdout } = await process.output();
  const changedFiles = new TextDecoder().decode(stdout).split("\n");
  if (changedFiles.includes("deno.lock")) {
    console.log("\u26A0\uFE0F deno.lock has changed. Consider running 'deno cache' or 'deno task check' to update dependencies.");
  }
}

if (import.meta.main) {
  postCheckoutHook().catch((error) => {
    console.error(`Error in post-checkout hook: ${error.message}`);
    Deno.exit(1);
  });
}
