/**
 * Git utility functions for hook scripts
 */

/**
 * Get the git root directory
 * @returns The absolute path to the git repository root
 */
export async function getGitRoot(): Promise<string> {
  const process = new Deno.Command("git", {
    args: ["rev-parse", "--show-toplevel"],
    stdout: "piped",
  });

  const { stdout } = await process.output();
  const decoder = new TextDecoder();
  return decoder.decode(stdout).trim();
}

/**
 * Get the list of staged files
 * @returns Array of staged file paths relative to git root
 */
export async function getStagedFiles(): Promise<string[]> {
  const process = new Deno.Command("git", {
    args: ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    stdout: "piped",
  });

  const { stdout } = await process.output();
  const decoder = new TextDecoder();
  return decoder.decode(stdout)
    .trim()
    .split("\n")
    .filter(Boolean);
}

/**
 * Get the list of staged TypeScript files
 * @returns Array of staged TypeScript file paths
 */
export async function getStagedTypeScriptFiles(): Promise<string[]> {
  const allFiles = await getStagedFiles();
  return allFiles.filter((file) =>
    file.endsWith(".ts") || file.endsWith(".tsx")
  );
}

/**
 * Get the commit message from the provided file path
 * @param filePath Path to the commit message file
 * @returns The commit message as a string
 */
export async function readCommitMessage(filePath: string): Promise<string> {
  try {
    return await Deno.readTextFile(filePath);
  } catch (error) {
    console.error(`Error reading commit message: ${error.message}`);
    Deno.exit(1);
  }
}

/**
 * Log hook execution
 * @param hookName Name of the hook
 */
export function logHookExecution(hookName: string): void {
  console.log(`Running ${hookName} hook...`);
}
