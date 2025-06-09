/**
 * Security and debug statement scans for git hooks
 */
import { getStagedFiles } from "./git.ts";

// Regex patterns for secrets/tokens (configurable)
const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9]{36}/, // GitHub personal access token
  /AIza[0-9A-Za-z\-_]{35}/, // Google API key
  /AWS[0-9A-Z]{16,}/, // AWS key (simple)
  /secret[_-]?key\s*[:=]\s*['\"][A-Za-z0-9\-\/_+=]{16,}/i, // generic secret key
  /api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9\-\/_+=]{16,}/i, // generic API key
  /token\s*[:=]\s*['\"][A-Za-z0-9\-\/_+=]{16,}/i, // generic token
];

export async function scanForSecrets(): Promise<boolean> {
  const files = await getStagedFiles();
  let found = false;
  for (const file of files) {
    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
    try {
      const content = await Deno.readTextFile(file);
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          console.error(`Potential secret detected in ${file}: ${pattern}`);
          found = true;
        }
      }
    } catch (_) {
      // Silently continue if file cannot be read
    }
  }
  return !found;
}

export async function scanForDebugStatements(): Promise<boolean> {
  const files = await getStagedFiles();
  let found = false;
  for (const file of files) {
    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
    try {
      const content = await Deno.readTextFile(file);
      if (/console\.log\s*\(/.test(content)) {
        console.error(`console.log found in ${file}`);
        found = true;
      }
      if (/debugger;/.test(content)) {
        console.error(`debugger statement found in ${file}`);
        found = true;
      }
    } catch (_) {
      // Silently continue if file cannot be read
    }
  }
  return !found;
}
