/**
 * String writer implementation for capturing text output in tests
 * This helper lets us capture stdout/stderr during CLI testing
 */

/**
 * StringWriter for capturing text output
 */
export class StringWriter {
  private chunks: Uint8Array[] = [];

  // Implement the standard write method for Deno writers
  write(p: Uint8Array): Promise<number> {
    const copy = new Uint8Array(p.length);
    copy.set(p);
    this.chunks.push(copy);
    return Promise.resolve(p.length);
  }

  toString(): string {
    const decoder = new TextDecoder();
    return this.chunks.map((chunk) => decoder.decode(chunk)).join("");
  }

  clear(): void {
    this.chunks = [];
  }
}
