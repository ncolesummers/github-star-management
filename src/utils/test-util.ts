/**
 * Utility functions for testing pre-push hooks
 */

/**
 * Test function that should trigger the pre-push hook
 * since we're modifying code without updating documentation
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString();
}

/**
 * Another test function
 */
export function parseTimestamp(isoString: string): number {
  return new Date(isoString).getTime();
}