/**
 * Utilities for performing file checks in git hooks
 */
import { getStagedTypeScriptFiles } from "./git.ts";

/**
 * Run Deno formatter on staged TypeScript files
 * @returns Promise resolving to boolean indicating success
 */
export async function checkFormatting(): Promise<boolean> {
  const files = await getStagedTypeScriptFiles();
  if (files.length === 0) {
    console.log("No TypeScript files to format");
    return true;
  }

  console.log(`Checking formatting for ${files.length} TypeScript files...`);

  try {
    const process = new Deno.Command("deno", {
      args: ["fmt", "--check", ...files],
      stderr: "piped",
    });

    const { code, stderr } = await process.output();

    if (code !== 0) {
      const decoder = new TextDecoder();
      console.error("Formatting issues found:");
      console.error(decoder.decode(stderr));
      console.error("Please run 'deno fmt' to fix formatting issues");
      return false;
    }

    console.log("All files are properly formatted");
    return true;
  } catch (error) {
    console.error(`Error checking formatting: ${error.message}`);
    return false;
  }
}

/**
 * Run Deno linter on staged TypeScript files
 * @returns Promise resolving to boolean indicating success
 */
export async function checkLinting(): Promise<boolean> {
  const files = await getStagedTypeScriptFiles();
  if (files.length === 0) {
    console.log("No TypeScript files to lint");
    return true;
  }

  console.log(`Linting ${files.length} TypeScript files...`);

  try {
    const process = new Deno.Command("deno", {
      args: ["lint", ...files],
      stderr: "piped",
    });

    const { code, stderr } = await process.output();

    if (code !== 0) {
      const decoder = new TextDecoder();
      console.error("Linting issues found:");
      console.error(decoder.decode(stderr));
      console.error("Please fix linting issues before committing");
      return false;
    }

    console.log("All files pass linting checks");
    return true;
  } catch (error) {
    console.error(`Error linting files: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests in the repository
 * @returns Promise resolving to boolean indicating success
 */
export async function runTests(): Promise<boolean> {
  console.log("Running tests...");

  try {
    const process = new Deno.Command("deno", {
      args: ["task", "test"],
      stderr: "piped",
      stdout: "piped",
    });

    const { code, stderr } = await process.output();

    if (code !== 0) {
      const decoder = new TextDecoder();
      console.error("Tests failed:");
      console.error(decoder.decode(stderr));
      return false;
    }

    console.log("All tests passed");
    return true;
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
    return false;
  }
}
