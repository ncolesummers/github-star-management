/**
 * Token bucket implementation for rate limiting API requests
 *
 * This implementation helps prevent hitting GitHub API rate limits
 * by controlling the rate at which requests are made.
 */

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  /**
   * Create a new token bucket rate limiter
   *
   * @param capacity Maximum number of tokens the bucket can hold
   * @param refillRate Number of tokens added per second
   * @param refillInterval Milliseconds between token refills
   */
  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private refillInterval: number = 1000, // milliseconds
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on time elapsed since last refill
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(
      (timePassed / this.refillInterval) * this.refillRate,
    );

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Consume tokens from the bucket, waiting if necessary
   *
   * @param tokens Number of tokens to consume
   * @returns Promise that resolves when tokens are available and consumed
   */
  async consume(tokens = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Calculate how long to wait for enough tokens
    const tokensNeeded = tokens - this.tokens;
    const timeToWait = (tokensNeeded / this.refillRate) * this.refillInterval;

    // Wait for tokens to become available
    await new Promise((resolve) => setTimeout(resolve, timeToWait));

    this.refill(); // Refill after waiting
    this.tokens -= tokens;
  }
}
