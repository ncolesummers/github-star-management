/**
 * Temporary file and directory helpers for tests
 * Makes it easy to create and clean up temporary files during testing
 */

export async function withTempFile(
  fn: (path: string) => Promise<void>,
  options: { suffix?: string; prefix?: string; dir?: string } = {}
): Promise<void> {
  const filePath = await Deno.makeTempFile(options);
  try {
    await fn(filePath);
  } finally {
    try {
      await Deno.remove(filePath);
    } catch (e) {
      // Ignore errors when removing temp files
    }
  }
}

export async function withTempDir(
  fn: (path: string) => Promise<void>,
  options: { suffix?: string; prefix?: string; dir?: string } = {}
): Promise<void> {
  const dirPath = await Deno.makeTempDir(options);
  try {
    await fn(dirPath);
  } finally {
    try {
      await Deno.remove(dirPath, { recursive: true });
    } catch (e) {
      // Ignore errors when removing temp dirs
    }
  }
}