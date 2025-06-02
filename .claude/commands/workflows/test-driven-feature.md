# Test-Driven Feature Implementation

This workflow guides you through implementing a new feature for the GitHub Stars Management project using test-driven development (TDD) principles.

## Workflow Steps

1. **Requirement Analysis**
   - Clearly define the feature requirements
   - Identify inputs, outputs, and behavior
   - List edge cases and error scenarios
   - Consider performance requirements
   - Think about how to test the feature

2. **Test Design**
   - Create test fixtures with sample data
   - Write unit tests for the core functionality
   - Include tests for edge cases and error handling
   - Add integration tests if necessary
   - Start with the simplest test case

3. **Initial Implementation**
   - Write the minimal code needed to pass the first test
   - Focus on correctness before optimization
   - Use explicit types for all parameters and returns
   - Implement only what the tests require
   - Run tests to verify they pass

4. **Iterative Refinement**
   - Add more test cases for additional behavior
   - Extend implementation to pass new tests
   - Refactor while ensuring tests still pass
   - Address edge cases and error handling
   - Improve performance if needed

5. **Documentation**
   - Add JSDoc comments to all public methods
   - Create examples for common use cases
   - Document any limitations or edge cases
   - Update CLI help text if applicable
   - Ensure tests serve as usage documentation

## Example Implementation

### 1. Test Implementation

First, create a test file for the new feature:

```typescript
// tests/unit/services/star_categorization_test.ts
import { assertEquals, assertArrayIncludes } from "../../deps.ts";
import { CategorizationService } from "../../../src/core/services/categorization_service.ts";
import { createMockRepository } from "../../fixtures/repositories.ts";

Deno.test("CategorizationService - categorizeRepository - should categorize by topics", () => {
  // Arrange
  const service = new CategorizationService();
  const repo = createMockRepository({
    name: "awesome-tool",
    topics: ["developer-tools", "cli"],
    language: "TypeScript",
    description: "A command-line tool for developers"
  });
  
  // Act
  const categories = service.categorizeRepository(repo);
  
  // Assert
  assertEquals(categories.length, 1);
  assertEquals(categories[0].name, "Development Tools");
  assertEquals(categories[0].confidence >= 0.8, true);
});

Deno.test("CategorizationService - categorizeRepository - should handle repositories with no topics", () => {
  // Arrange
  const service = new CategorizationService();
  const repo = createMockRepository({
    name: "some-library",
    topics: [],
    language: "JavaScript",
    description: "A useful library for something"
  });
  
  // Act
  const categories = service.categorizeRepository(repo);
  
  // Assert
  assertEquals(categories.length > 0, true, "Should assign at least one category");
});

Deno.test("CategorizationService - categorizeRepository - should handle repositories with multiple matching categories", () => {
  // Arrange
  const service = new CategorizationService();
  const repo = createMockRepository({
    name: "dev-framework",
    topics: ["framework", "developer-tools"],
    language: "TypeScript",
    description: "A framework for building developer tools"
  });
  
  // Act
  const categories = service.categorizeRepository(repo);
  
  // Assert
  assertEquals(categories.length >= 2, true, "Should match multiple categories");
  const categoryNames = categories.map(c => c.name);
  assertArrayIncludes(categoryNames, ["Development Tools", "Libraries & Frameworks"]);
  
  // First category should have highest confidence
  assertEquals(categories[0].confidence >= categories[1].confidence, true);
});
```

### 2. Feature Implementation

After writing the tests, implement the feature to make them pass:

```typescript
// src/core/services/categorization_service.ts
import { Repository } from "../models/repository.ts";

export interface Category {
  name: string;
  patterns: Array<
    | { type: "topic"; value: string; weight: number }
    | { type: "language"; value: string; weight: number }
    | { type: "description"; pattern: RegExp; weight: number }
  >;
}

export interface RepositoryCategory {
  name: string;
  confidence: number;
  score: number;
}

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
        { type: "description", pattern: /\b(developer|development)\s+tool\b/i, weight: 5 },
      ]
    },
    {
      name: "Libraries & Frameworks",
      patterns: [
        { type: "topic", value: "library", weight: 10 },
        { type: "topic", value: "framework", weight: 10 },
        { type: "topic", value: "sdk", weight: 8 },
        { type: "description", pattern: /\b(library|framework)\b/i, weight: 5 },
      ]
    },
    // Additional categories would be defined here
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
    
    // If no categories matched, try to infer from other metadata
    if (scores.size === 0) {
      this.inferCategoriesFromMetadata(repo, scores);
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
          score
        });
      }
    }
    
    // Sort by confidence descending
    return results.sort((a, b) => b.confidence - a.confidence);
  }
  
  private inferCategoriesFromMetadata(repo: Repository, scores: Map<string, number>): void {
    // Fallback categorization logic when no direct matches
    if (repo.language) {
      // Infer category from language
      if (["JavaScript", "TypeScript", "HTML", "CSS"].includes(repo.language)) {
        scores.set("Web Development", 5);
      } else if (["Python", "R", "Jupyter Notebook"].includes(repo.language)) {
        scores.set("Data Science", 5);
      }
      // Add more language-based inferences as needed
    }
    
    // Infer from name patterns
    if (repo.name.toLowerCase().includes("awesome")) {
      scores.set("Collections & Lists", 5);
    }
    
    // Infer from description
    if (repo.description) {
      const desc = repo.description.toLowerCase();
      if (desc.includes("learning") || desc.includes("tutorial") || desc.includes("course")) {
        scores.set("Learning Resources", 5);
      }
    }
    
    // If still no categories, add a generic one
    if (scores.size === 0) {
      scores.set("Uncategorized", 1);
    }
  }
}
```

### 3. Integration and Usage

After implementing and testing the feature, integrate it with the CLI:

```typescript
// src/cli/commands/stars_command.ts
program
  .command("stars:categorize")
  .description("Categorize your starred repositories")
  .option("-o, --output <format:string>", "Output format: 'table', 'json', 'md'", "table")
  .option("-m, --min-confidence <confidence:number>", "Minimum confidence threshold", 0.5)
  .action(async (options) => {
    try {
      const starService = new StarService();
      const categorizationService = new CategorizationService();
      const allStars = await starService.getStars();
      
      const categorized = allStars.map(repo => {
        const categories = categorizationService.categorizeRepository(repo);
        return {
          repo,
          categories: categories.filter(c => c.confidence >= options.minConfidence)
        };
      });
      
      // Format and display results based on output format
      // Implementation details would go here
    } catch (error) {
      console.error("Error categorizing stars:", error.message);
    }
  });
```