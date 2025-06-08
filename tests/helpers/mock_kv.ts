/**
 * Mock implementation of Deno.Kv for testing
 *
 * This module provides a mock implementation of the Deno.Kv API
 * that can be used in tests without requiring actual KV storage.
 */

// Define KV types for our mock implementation
type KvKey = Deno.KvKey;

// Define our own versions of the KV types to avoid compatibility issues
interface KvEntry<T> {
  key: KvKey;
  value: T;
  versionstamp: string;
}

// Entry that might have null values for not found entries
interface KvEntryMaybe<T> {
  key: KvKey;
  value: T | null;
  versionstamp: string | null;
}

interface KvListSelector {
  prefix: KvKey;
  start?: KvKey;
  end?: KvKey;
  limit?: number;
  reverse?: boolean;
  cursor?: string;
}

interface KvListOptions {
  consistency?: "strong" | "eventual";
  batchSize?: number;
}

interface KvListIterator<T> extends AsyncIterableIterator<KvEntry<T>> {
  cursor: string;
}

interface KvCommitResult {
  ok: true;
  versionstamp: string;
}

interface KvCommitError {
  ok: false;
  versionstamp: null;
}

type KvCommitResponse = KvCommitResult | KvCommitError;

type AtomicOperation = {
  check: { key: KvKey; versionstamp: string | null };
} | {
  set: { key: KvKey; value: unknown; expireIn?: number };
} | {
  delete: { key: KvKey };
};

/**
 * Type declaration for our mock implementation
 * Implementing the necessary parts of Deno.Kv
 */
interface PartialKv {
  get<T = unknown>(key: KvKey, options?: unknown): Promise<KvEntryMaybe<T>>;
  getMany<T extends unknown[]>(
    keys: KvKey[],
    options?: unknown,
  ): Promise<{ [K in keyof T]: KvEntryMaybe<T[K]> }>;
  set(
    key: KvKey,
    value: unknown,
    options?: unknown,
  ): Promise<{ ok: true; versionstamp: string }>;
  delete(key: KvKey, options?: unknown): Promise<void>;
  list<T = unknown>(
    selector: KvListSelector,
    options?: KvListOptions,
  ): KvListIterator<T>;
  atomic(): {
    commit(): Promise<KvCommitResponse>;
    check(key: KvKey, versionstamp: string | null): unknown;
    set(key: KvKey, value: unknown, options?: unknown): unknown;
    delete(key: KvKey): unknown;
  };
  close(): void;
}

/**
 * Mock implementation of Deno.Kv
 * Only implements the functionality we need for testing
 */
export class MockKv implements PartialKv {
  private data = new Map<string, { value: unknown; versionstamp: string }>();
  private versionCounter = 0;

  /**
   * Generate a new versionstamp
   */
  private generateVersionstamp(): string {
    this.versionCounter++;
    const timestamp = Date.now().toString().padStart(16, "0");
    const counter = this.versionCounter.toString().padStart(4, "0");
    return `00${timestamp}${counter}`;
  }

  /**
   * Convert a key array to a string for internal storage
   */
  private keyToString(key: KvKey): string {
    return JSON.stringify(key);
  }

  /**
   * Check if a key matches a prefix
   */
  private keyMatchesPrefix(key: KvKey, prefix: KvKey): boolean {
    if (key.length < prefix.length) {
      return false;
    }

    for (let i = 0; i < prefix.length; i++) {
      if (JSON.stringify(key[i]) !== JSON.stringify(prefix[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compare two keys for sorting
   */
  private compareKeys(a: KvKey, b: KvKey): number {
    const minLength = Math.min(a.length, b.length);

    for (let i = 0; i < minLength; i++) {
      const aStr = JSON.stringify(a[i]);
      const bStr = JSON.stringify(b[i]);

      if (aStr < bStr) return -1;
      if (aStr > bStr) return 1;
    }

    return a.length - b.length;
  }

  /**
   * Get a value from the KV store
   */
  get<T = unknown>(key: KvKey, _options?: unknown): Promise<KvEntryMaybe<T>> {
    const keyStr = this.keyToString(key);
    const entry = this.data.get(keyStr);

    if (!entry) {
      return Promise.resolve({
        key,
        value: null,
        versionstamp: null,
      });
    }

    return Promise.resolve({
      key,
      value: entry.value as T,
      versionstamp: entry.versionstamp,
    });
  }

  /**
   * Get multiple values from the KV store
   */
  async getMany<T extends unknown[]>(
    keys: KvKey[],
    options?: unknown,
  ): Promise<{ [K in keyof T]: KvEntryMaybe<T[K]> }> {
    const results = await Promise.all(
      keys.map((key) => this.get(key, options)),
    );
    return results as { [K in keyof T]: KvEntryMaybe<T[K]> };
  }

  /**
   * Set a value in the KV store
   */
  set(
    key: KvKey,
    value: unknown,
    _options?: unknown,
  ): Promise<{ ok: true; versionstamp: string }> {
    const keyStr = this.keyToString(key);
    const versionstamp = this.generateVersionstamp();

    this.data.set(keyStr, { value, versionstamp });

    return Promise.resolve({ ok: true, versionstamp });
  }

  /**
   * Delete a value from the KV store
   */
  delete(key: KvKey, _options?: unknown): Promise<void> {
    const keyStr = this.keyToString(key);
    this.data.delete(keyStr);
    return Promise.resolve();
  }

  /**
   * List values in the KV store
   */
  list<T = unknown>(
    selector: KvListSelector,
    _options?: KvListOptions,
  ): KvListIterator<T> {
    const { prefix, limit = Number.MAX_SAFE_INTEGER, reverse = false } =
      selector;

    // Find all matching keys
    const matchingEntries: KvEntry<T>[] = [];

    for (const [keyStr, entry] of this.data.entries()) {
      const key = JSON.parse(keyStr) as KvKey;

      if (this.keyMatchesPrefix(key, prefix)) {
        matchingEntries.push({
          key,
          value: entry.value as T,
          versionstamp: entry.versionstamp,
        });
      }
    }

    // Sort entries
    matchingEntries.sort((a, b) => {
      const comparison = this.compareKeys(a.key, b.key);
      return reverse ? -comparison : comparison;
    });

    // Create a copy of the entries for the iterator to use
    // This prevents modifications to the original array during iteration
    const entries = [...matchingEntries].slice(0, limit);

    // Create iterator
    const iterator: KvListIterator<T> = {
      cursor: "", // Mock implementation doesn't need real cursors

      async *[Symbol.asyncIterator]() {
        for (const entry of entries) {
          yield entry;
        }
      },

      next(): Promise<IteratorResult<KvEntry<T>>> {
        if (entries.length === 0) {
          return Promise.resolve({ done: true, value: undefined });
        }

        const value = entries.shift()!;
        return Promise.resolve({ done: false, value });
      },
    };

    return iterator;
  }

  /**
   * Create an atomic operation
   */
  atomic() {
    const operations: AtomicOperation[] = [];

    const atomic = {
      check: (key: KvKey, versionstamp: string | null) => {
        operations.push({ check: { key, versionstamp } });
        return atomic;
      },

      set: (key: KvKey, value: unknown, _options?: unknown) => {
        operations.push({ set: { key, value } });
        return atomic;
      },

      delete: (key: KvKey) => {
        operations.push({ delete: { key } });
        return atomic;
      },

      commit: async (): Promise<KvCommitResponse> => {
        // Check operations
        for (const op of operations) {
          if ("check" in op) {
            const { key, versionstamp } = op.check;
            const entry = await this.get(key);

            if (entry.versionstamp !== versionstamp) {
              return { ok: false, versionstamp: null };
            }
          }
        }

        // Apply operations
        let finalVersionstamp: string | null = null;

        for (const op of operations) {
          if ("set" in op) {
            const { key, value } = op.set;
            const result = await this.set(key, value);
            finalVersionstamp = result.versionstamp;
          } else if ("delete" in op) {
            const { key } = op.delete;
            await this.delete(key);
          }
        }

        return { ok: true, versionstamp: finalVersionstamp || "" };
      },
    };

    return atomic;
  }

  /**
   * Close the KV store
   */
  close(): void {
    // Nothing to close in the mock implementation
  }
}

/**
 * Open a mock KV store
 */
export function openMockKv(): Promise<MockKv> {
  return Promise.resolve(new MockKv());
}
