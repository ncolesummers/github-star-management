#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * GitHub Star Management CLI
 * A tool for managing GitHub stars with Deno
 */

// Import CLI functionality
import { main } from "./src/cli/mod.ts";

// Export version information
export const VERSION = "0.1.0";

// Run the CLI if this is the main module
if (import.meta.main) {
  try {
    await main(Deno.args);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

// Export public API for programmatic use
export * from "./src/core/api/mod.ts";
export * from "./src/core/models/mod.ts";
export * from "./src/core/services/mod.ts";