/**
 * Utilities for validating conventional commits format
 * https://www.conventionalcommits.org/
 */

// Define allowed types and scopes as per the implementation plan
const ALLOWED_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
];

const ALLOWED_SCOPES = [
  "cli",
  "api",
  "models",
  "services",
  "utils",
  "docs",
  "test",
  "deps",
  "release",
  "workflow",
  "config",
];

// Regular expression for conventional commits format
// <type>(<scope>): <description>
const COMMIT_PATTERN =
  /^(?<type>\w+)(?:\((?<scope>[\w-]+)\))?(?<breaking>!)?: (?<description>.+)$/;

/**
 * Validates a commit message against conventional commits format
 * @param message The commit message to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateCommitMessage(
  message: string,
): { isValid: boolean; error?: string } {
  // Get the first line (subject) of the commit message
  const subject = message.split("\n")[0].trim();

  // Check if the commit message follows the pattern
  const match = subject.match(COMMIT_PATTERN);
  if (!match) {
    return {
      isValid: false,
      error:
        `Commit message does not follow conventional commits format: "${subject}"\nExpected format: "type(scope): description"`,
    };
  }

  const { type, scope, breaking, description } = match.groups as {
    type: string;
    scope?: string;
    breaking?: string;
    description: string;
  };

  // Note: The breaking change flag is captured for future use
  // but not currently used in validation
  const _isBreakingChange = !!breaking;

  // Validate commit type
  if (!ALLOWED_TYPES.includes(type)) {
    return {
      isValid: false,
      error: `Invalid commit type: "${type}"\nAllowed types: ${
        ALLOWED_TYPES.join(", ")
      }`,
    };
  }

  // Validate scope if provided
  if (scope && !ALLOWED_SCOPES.includes(scope)) {
    return {
      isValid: false,
      error: `Invalid commit scope: "${scope}"\nAllowed scopes: ${
        ALLOWED_SCOPES.join(", ")
      }`,
    };
  }

  // Validate description
  if (description.length < 3) {
    return {
      isValid: false,
      error: "Commit description is too short (minimum 3 characters)",
    };
  }

  if (description.length > 100) {
    return {
      isValid: false,
      error:
        `Commit description is too long (${description.length} characters, maximum 100)`,
    };
  }

  // All validations passed
  return { isValid: true };
}
