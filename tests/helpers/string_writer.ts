/**
 * String writer implementation for capturing text output in tests
 * This helper lets us capture stdout/stderr during CLI testing
 */

export class StringWriter implements Deno.Writer {
  private chunks: Uint8Array[] = [];

  async write(p: Uint8Array): Promise<number> {
    const copy = new Uint8Array(p.length);
    copy.set(p);
    this.chunks.push(copy);
    return p.length;
  }

  toString(): string {
    const decoder = new TextDecoder();
    return this.chunks.map((chunk) => decoder.decode(chunk)).join("");
  }

  clear(): void {
    this.chunks = [];
  }
}
