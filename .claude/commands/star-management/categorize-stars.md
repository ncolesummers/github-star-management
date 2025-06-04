# Implement Star Categorization Algorithm: $ARGUMENTS

You're implementing an algorithm to automatically categorize GitHub starred
repositories. The $ARGUMENTS parameter specifies the categorization approach or
specific requirements.

Follow these steps:

1. **Categorization Strategy Analysis**
   - Understand the categorization approach specified in $ARGUMENTS
   - Identify available metadata for categorization (topics, description,
     language)
   - Consider how to handle repositories with ambiguous signals
   - Think deeply about category hierarchy and relationships

2. **Category Definition**
   - Define clear category criteria
   - Create scoring mechanisms for category assignment
   - Consider confidence thresholds for categorization
   - Plan for handling repositories that match multiple categories

3. **Algorithm Implementation**
   - Create the categorization service in `src/core/services/`
   - Implement scoring and matching logic
   - Add confidence scoring for category assignments
   - Create mechanisms for manual category overrides

4. **Persistence Layer**
   - Design storage format for category assignments
   - Implement loading and saving of categorizations
   - Add versioning for category definitions
   - Create export/import capabilities

5. **Testing**
   - Create test fixtures with diverse repository types
   - Write unit tests for categorization logic
   - Test edge cases (no clear category, multiple categories)
   - Verify persistence functionality

## Example Implementation

```typescript
// src/core/services/categorization_service.ts
export class CategorizationService {
  private categories: Category[] = [
    {
      name: "Development Tools",
      patterns: [
        { type: "topic", value: "developer-tools", weight: 10 },
        { type: "topic", value: "cli", weight: 8 },
        { type: "topic", value: "ide", weight: 9 },
        { type: "topic", value: "debugging", weight: 7 },
        { type: "language", value: "shell", weight: 3 },
        {
          type: "description",
          pattern: /\b(developer|development)\s+tool\b/i,
          weight: 5,
        },
      ],
    },
    {
      name: "Libraries & Frameworks",
      patterns: [
        { type: "topic", value: "library", weight: 10 },
        { type: "topic", value: "framework", weight: 10 },
        { type: "topic", value: "sdk", weight: 8 },
        { type: "description", pattern: /\b(library|framework)\b/i, weight: 5 },
      ],
    },
    // Additional categories defined here
  ];

  categorizeRepository(repo: Repository): RepositoryCategory[] {
    const scores = new Map<string, number>();

    // Calculate score for each category
    for (const category of this.categories) {
      let score = 0;

      for (const pattern of category.patterns) {
        switch (pattern.type) {
          case "topic":
            if (repo.topics?.includes(pattern.value)) {
              score += pattern.weight;
            }
            break;
          case "language":
            if (repo.language === pattern.value) {
              score += pattern.weight;
            }
            break;
          case "description":
            if (repo.description && pattern.pattern.test(repo.description)) {
              score += pattern.weight;
            }
            break;
        }
      }

      if (score > 0) {
        scores.set(category.name, score);
      }
    }

    // Convert scores to categories with confidence
    const maxScore = Math.max(...Array.from(scores.values(), 0));
    const results: RepositoryCategory[] = [];

    for (const [name, score] of scores.entries()) {
      const confidence = score / maxScore;
      if (confidence >= 0.3) { // Minimum confidence threshold
        results.push({
          name,
          confidence,
          score,
        });
      }
    }

    // Sort by confidence descending
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}
```
