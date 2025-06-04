# Implement Star Cleanup Strategy: $ARGUMENTS

You're implementing a cleanup strategy to identify GitHub starred repositories
that may be candidates for unstarring. The $ARGUMENTS parameter specifies the
cleanup criteria or approach.

Follow these steps:

1. **Cleanup Criteria Analysis**
   - Understand the cleanup criteria specified in $ARGUMENTS
   - Identify metadata needed for cleanup decisions
   - Consider appropriate thresholds for each criterion
   - Think deeply about balancing cleanup with preservation

2. **Scoring Algorithm Design**
   - Design a scoring system for cleanup candidates
   - Weight different criteria appropriately
   - Create confidence thresholds for recommendations
   - Plan for presenting results to users

3. **Implementation**
   - Create the cleanup service in `src/core/services/`
   - Implement scoring and filtering logic
   - Add sorting for prioritizing cleanup candidates
   - Implement preview and confirmation workflows

4. **Safety Mechanisms**
   - Add backup functionality before cleanup
   - Implement undo capability for accidental unstarring
   - Create clear warnings for potentially valuable repositories
   - Add rate limiting for API operations

5. **Testing**
   - Create test fixtures with diverse repositories
   - Write unit tests for scoring logic
   - Test safety mechanisms
   - Verify backup and restore functionality

## Example Implementation

```typescript
// src/core/services/cleanup_service.ts
export class CleanupService {
  scoreRepository(
    repo: Repository,
    options: CleanupOptions,
  ): CleanupCandidate | null {
    let score = 0;
    const reasons: string[] = [];

    // Check for archived repositories
    if (options.includeArchived && repo.archived) {
      score += 10;
      reasons.push("Repository is archived");
    }

    // Check last update time
    if (options.inactiveMonths > 0) {
      const lastUpdateTime = new Date(repo.updated_at).getTime();
      const inactiveThreshold = Date.now() -
        (options.inactiveMonths * 30 * 24 * 60 * 60 * 1000);

      if (lastUpdateTime < inactiveThreshold) {
        const monthsInactive = Math.floor(
          (Date.now() - lastUpdateTime) / (30 * 24 * 60 * 60 * 1000),
        );
        score += Math.min(monthsInactive, 10);
        reasons.push(`Inactive for ${monthsInactive} months`);
      }
    }

    // Check for forks with low activity
    if (options.includeLowActivityForks && repo.fork) {
      const forksCount = repo.forks_count || 0;
      const starsCount = repo.stargazers_count || 0;

      if (forksCount < 5 && starsCount < 10) {
        score += 5;
        reasons.push("Fork with low community activity");
      }
    }

    // Check for deprecated or abandoned projects
    if (
      options.includeDeprecated &&
      (repo.description?.toLowerCase().includes("deprecated") ||
        repo.description?.toLowerCase().includes("abandoned") ||
        repo.description?.toLowerCase().includes("no longer maintained"))
    ) {
      score += 15;
      reasons.push("Repository is explicitly deprecated or abandoned");
    }

    // Return cleanup candidate if score exceeds threshold
    if (score >= options.threshold) {
      return {
        repo,
        score,
        reasons,
        confidence: Math.min(score / 30, 1), // Normalize to 0-1
      };
    }

    return null;
  }

  async findCleanupCandidates(
    options: CleanupOptions,
  ): Promise<CleanupCandidate[]> {
    const starService = new StarService();
    const allStars = await starService.getStars();
    const candidates: CleanupCandidate[] = [];

    for (const repo of allStars) {
      const candidate = this.scoreRepository(repo, options);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    // Sort by score descending
    return candidates.sort((a, b) => b.score - a.score);
  }

  async backupBeforeCleanup(): Promise<string> {
    const starService = new StarService();
    const allStars = await starService.getStars();
    const backupFile = `star-backup-${
      new Date().toISOString().replace(/:/g, "-")
    }.json`;

    await Deno.writeTextFile(backupFile, JSON.stringify(allStars, null, 2));
    return backupFile;
  }
}
```
